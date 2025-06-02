import { createClient, type Client } from './fetch.ts'
import type { paths } from './schema.ts'
import { EventQueue, QueueOptions } from './queue.ts'
import type {
  ClientMethod,
  FetchResponse,
  MaybeOptionalInit,
} from 'openapi-fetch'

export interface MindlyticsOptions {
  apiKey: string
  projectId: string
  baseUrl?: string
  debug?: boolean
  queue?: QueueOptions & {
    enabled?: boolean
  }
}

export class MindlyticsClient<
  TOptions extends MindlyticsOptions = MindlyticsOptions,
> {
  private baseUrl: string = 'https://api.mindlytics.io/v1'
  private client: Client
  private eventQueue: EventQueue | null = null

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

    // Initialize queue if enabled
    if (options.queue?.enabled !== false) {
      this.eventQueue = new EventQueue(this.client, {
        ...options.queue,
        debug: options.debug,
      })
    }
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
  async flush(): Promise<void> {
    if (this.eventQueue) {
      await this.eventQueue.flush()
    }
  }

  /**
   * Make a direct API call or queue it based on configuration
   */
  private makeRequest<
    TPath extends Extract<keyof paths, string>,
    Body extends paths[TPath]['post']['requestBody']['content']['application/json'],
  >(
    path: TPath,
    body: Body,
  ): Promise<
    TOptions['queue'] extends { enabled: false }
      ? FetchResponse<
          paths[TPath]['post'],
          MaybeOptionalInit<paths[TPath], 'post'>,
          'application/json'
        >
      : void
  > {
    if (this.eventQueue && this.options.queue?.enabled !== false) {
      this.eventQueue.enqueue({
        path,
        body,
        params: {
          header: this.headers,
        },
      })
      return Promise.resolve() as any
    }

    return this.client.request('post', path, {
      body,
      params: {
        header: this.headers,
      },
    } as any) as any
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
