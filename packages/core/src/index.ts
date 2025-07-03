import { createClient, type Client } from './fetch.ts'
import type { paths } from './schema.gen.ts'
import { EventQueue, QueueOptions, EventQueueError } from './queue.ts'
import type { EventPaths } from './schema.ts'
import { WebSocketClient, MLEventHandler, MLErrorHandler, MLEvent } from './ws.ts'

export type { MLErrorHandler } from './ws.ts'
export type { MLEventHandler } from './ws.ts'
export type { MLEvent } from './ws.ts'
export type { EventQueueError } from './queue.ts'

export interface MindlyticsOptions {
  apiKey: string
  projectId: string
  baseUrl?: string
  debug?: boolean
  queue?: QueueOptions
}

export class MindlyticsClient<
  TOptions extends MindlyticsOptions = MindlyticsOptions,
> {
  private baseUrl: string = 'https://app-staging.mindlytics.ai/bc/v1'
  private client: Client
  private eventQueue: EventQueue
  private wsClient: WebSocketClient | null = null

  constructor(private options: TOptions) {
    if (options.baseUrl) {
      this.baseUrl = options.baseUrl
    }

    this.client = createClient({
      baseUrl: this.baseUrl,
      headers: this.headers,
    })

    if (options.debug) {
      this.client.use({
        onRequest: (options) => {
          this.debug('Request:', options.schemaPath, options.params)
        },
        onResponse: (response) => {
          this.debug(
            'Response:',
            response.schemaPath,
            response.response.status,
            response.response.body,
          )
        },
        onError: (options) => {
          this.debug(
            'Error:',
            options.schemaPath,
            options.params,
            options.error,
          )
        },
      })
    }

    this.eventQueue = new EventQueue(this.client, {
      ...options.queue,
      debug: options.debug,
    })
  }

  private get headers() {
    return {
      Authorization: this.options.apiKey,
      'x-app-id': this.options.projectId,
    }
  }

  private debug(...messages: any[]) {
    if (this.options.debug) {
      console.log('[MLSDK:DEBUG]', ...messages)
    }
  }

  /**
   * Flush all queued events immediately
   * Useful before serverless function shutdown
   */
  async flush(): Promise<EventQueueError[]> {
    return this.eventQueue.flush()
  }

  /**
   * Make a direct API call or queue it based on configuration
   */
  private makeRequest<
    TPath extends Extract<keyof EventPaths, string>,
    Body extends EventPaths[TPath]['post']['requestBody']['content']['application/json'],
  >(path: TPath, body: Body) {
    this.eventQueue.enqueue({
      path,
      body,
      params: {
        header: this.headers,
      },
    })
  }

  async startListening(
    onEvent?: MLEventHandler,
    onError?: MLErrorHandler,
  ) {
    if (!onError) {
      onError = { callback: async (error: Error) => {}, data: undefined }
    }
    if (!onEvent) {
      onEvent = { callback: async (event: MLEvent) => {}, data: undefined }
    }
    // derive the ws endpoint from the base URL
    let wsEndpoint = this.baseUrl.replace(/^http/, 'ws')
    wsEndpoint = wsEndpoint.replace('//app/', '//wss/')
    // To handle localhost
    wsEndpoint = wsEndpoint.replace(':300', ':400')
    wsEndpoint = wsEndpoint.replace('/bc/v1', '')

    this.wsClient = new WebSocketClient(
      this.client,
      wsEndpoint,
      onError,
      onEvent,
    )
    return this.wsClient.startListening()
  }

  async startSession(params: StartSessionParams) {
    return this.makeRequest('/events/event/start-session', {
      type: 'start_session',
      ...params,
    })
  }

  async endSession(params: EndSessionParams) {
    return this.makeRequest('/events/event/end-session', {
      type: 'end_session',
      ...params,
    })
  }

  async trackEvent(params: TrackEventParams) {
    return this.makeRequest('/events/event/track', {
      type: 'track',
      ...params,
    })
  }

  async identify(params: UserIdentifyParams) {
    return this.makeRequest('/events/event/identify', {
      type: 'identify',
      ...params,
    })
  }

  async alias(params: UserAliasParams) {
    return this.makeRequest('/events/event/alias', {
      type: 'alias',
      ...params,
    })
  }

  async startConversation(params: StartConversationParams) {
    return this.makeRequest('/events/event/start-conversation', {
      type: 'track',
      event: 'Conversation Started',
      ...params,
    })
  }

  async endConversation(params: EndConversationParams) {
    return this.makeRequest('/events/event/end-conversation', {
      type: 'track',
      event: 'Conversation Ended',
      ...params,
    })
  }

  async trackConversationTurn(params: TrackConversationTurnParams) {
    return this.makeRequest('/events/event/conversation-turn', {
      type: 'track',
      event: 'Conversation Turn',
      ...params,
    })
  }

  async trackConversationUsage(params: TrackConversationUsageParams) {
    return this.makeRequest('/events/event/conversation-usage', {
      type: 'track',
      event: 'Conversation Usage',
      ...params,
    })
  }
}

export type StartSessionParams = Omit<
  paths['/events/event/start-session']['post']['requestBody']['content']['application/json'],
  'type'
>
export type EndSessionParams = Omit<
  paths['/events/event/end-session']['post']['requestBody']['content']['application/json'],
  'type'
>
export type TrackEventParams = Omit<
  paths['/events/event/track']['post']['requestBody']['content']['application/json'],
  'type'
>
export type UserIdentifyParams = Omit<
  paths['/events/event/identify']['post']['requestBody']['content']['application/json'],
  'type'
>
export type UserAliasParams = Omit<
  paths['/events/event/alias']['post']['requestBody']['content']['application/json'],
  'type'
>
export type StartConversationParams = Omit<
  paths['/events/event/start-conversation']['post']['requestBody']['content']['application/json'],
  'type' | 'event'
>
export type EndConversationParams = Omit<
  paths['/events/event/end-conversation']['post']['requestBody']['content']['application/json'],
  'type' | 'event'
>
export type TrackConversationTurnParams = Omit<
  paths['/events/event/conversation-turn']['post']['requestBody']['content']['application/json'],
  'type' | 'event'
>
export type TrackConversationUsageParams = Omit<
  paths['/events/event/conversation-usage']['post']['requestBody']['content']['application/json'],
  'type' | 'event'
>
