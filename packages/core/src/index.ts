import { createClient, type Client } from './fetch.ts'
import type { paths } from './schema.gen.ts'
import { EventQueue, QueueOptions, EventQueueError } from './queue.ts'
import type { EventPaths } from './schema.ts'
import { WebSocketClient, MLEventHandler, MLErrorHandler, MLEvent } from './ws.ts'

// Utility type to extract path strings with a given HTTP method from OpenAPI paths
type PathsWithMethod<TPaths, TMethod extends string> = {
  [K in keyof TPaths]: TMethod extends keyof TPaths[K] ? K : never
}[keyof TPaths] & string;

export type { MLErrorHandler } from './ws.ts'
export type { MLEventHandler } from './ws.ts'
export type { MLEvent } from './ws.ts'
export type { EventQueueError } from './queue.ts'

export interface CoreOptions {
  apiKey: string
  projectId: string
  baseUrl?: string
  debug?: boolean
  queue?: QueueOptions
}

export class Core<
  TOptions extends CoreOptions = CoreOptions,
> {
  private baseUrl: string = 'https://app.mindlytics.ai'
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

  async dbGET(params: {
    collection: "users" | "events" | "sessions" | "conversations" | "messages" | "orgkeys" | "organizations" | "apps",
    op: "find" | "findOne",
    query: any
  }): Promise<any> {
    if (!params.collection || !params.op) {
      throw new Error('Collection and operation must be specified')
    }
    return this.client.GET(
      `/bc/v1/db/{collection}/{op}`,
      {
        params: {
          query: params.query,
          path: {
            collection: params.collection,
            op: params.op,
          }
        },
      }
    )
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
    // To handle localhost, matching ws servers are on 400x
    wsEndpoint = wsEndpoint.replace(':300', ':400')

    this.wsClient = new WebSocketClient(
      this.client,
      wsEndpoint,
      onError,
      onEvent,
    )
    return this.wsClient.startListening()
  }

  async startSession(params: StartSessionParams) {
    return this.makeRequest('/bc/v1/events/event/start-session', {
      type: 'start_session',
      ...params,
    })
  }

  async endSession(params: EndSessionParams) {
    return this.makeRequest('/bc/v1/events/event/end-session', {
      type: 'end_session',
      ...params,
    })
  }

  async trackEvent(params: TrackEventParams) {
    return this.makeRequest('/bc/v1/events/event/track', {
      type: 'track',
      ...params,
    })
  }

  async sessionUserIdentify(params: SessionUserIdentifyParams) {
    return this.makeRequest('/bc/v1/events/event/identify', {
      type: 'identify',
      ...params,
    })
  }

  async sessionUserAlias(params: SessionUserAliasParams) {
    return this.makeRequest('/bc/v1/events/event/alias', {
      type: 'alias',
      ...params,
    })
  }

  async startConversation(params: StartConversationParams) {
    return this.makeRequest('/bc/v1/events/event/start-conversation', {
      type: 'track',
      event: 'Conversation Started',
      ...params,
    })
  }

  async endConversation(params: EndConversationParams) {
    return this.makeRequest('/bc/v1/events/event/end-conversation', {
      type: 'track',
      event: 'Conversation Ended',
      ...params,
    })
  }

  async trackConversationTurn(params: TrackConversationTurnParams) {
    return this.makeRequest('/bc/v1/events/event/conversation-turn', {
      type: 'track',
      event: 'Conversation Turn',
      ...params,
    })
  }

  async trackConversationUsage(params: TrackConversationUsageParams) {
    return this.makeRequest('/bc/v1/events/event/conversation-usage', {
      type: 'track',
      event: 'Conversation Usage',
      ...params,
    })
  }

  async trackConversationFunction(params: TrackConversationFunctionParams) {
    return this.makeRequest('/bc/v1/events/event/conversation-function', {
      type: 'track',
      event: 'Conversation Function',
      ...params,
    })
  }

  async identify(params: UserIdentifyParams) {
    return this.client.POST('/bc/v1/user/identify', {
      body: params,
    })
  }

  async alias(params: UserAliasParams) {
    return this.client.POST('/bc/v1/user/alias', {
      body: params,
    })
  }
}

export type StartSessionParams = Omit<
  paths['/bc/v1/events/event/start-session']['post']['requestBody']['content']['application/json'],
  'type'
>
export type EndSessionParams = Omit<
  paths['/bc/v1/events/event/end-session']['post']['requestBody']['content']['application/json'],
  'type'
>
export type TrackEventParams = Omit<
  paths['/bc/v1/events/event/track']['post']['requestBody']['content']['application/json'],
  'type'
>
export type SessionUserIdentifyParams = Omit<
  paths['/bc/v1/events/event/identify']['post']['requestBody']['content']['application/json'],
  'type'
>
export type SessionUserAliasParams = Omit<
  paths['/bc/v1/events/event/alias']['post']['requestBody']['content']['application/json'],
  'type'
>
export type StartConversationParams = Omit<
  paths['/bc/v1/events/event/start-conversation']['post']['requestBody']['content']['application/json'],
  'type' | 'event'
>
export type EndConversationParams = Omit<
  paths['/bc/v1/events/event/end-conversation']['post']['requestBody']['content']['application/json'],
  'type' | 'event'
>
export type TrackConversationTurnParams = Omit<
  paths['/bc/v1/events/event/conversation-turn']['post']['requestBody']['content']['application/json'],
  'type' | 'event'
>
export type TrackConversationUsageParams = Omit<
  paths['/bc/v1/events/event/conversation-usage']['post']['requestBody']['content']['application/json'],
  'type' | 'event'
>
export type TrackConversationFunctionParams = Omit<
  paths['/bc/v1/events/event/conversation-function']['post']['requestBody']['content']['application/json'],
  'type' | 'event'
>
export type UserIdentifyParams = paths['/bc/v1/user/identify']['post']['requestBody']['content']['application/json']
export type UserAliasParams = paths['/bc/v1/user/alias']['post']['requestBody']['content']['application/json']