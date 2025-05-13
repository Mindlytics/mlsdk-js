import { createClient, type Client } from './fetch.ts';
import type { paths } from './schema.ts';

export interface MindlyticsOptions {
  apiKey: string;
  projectId: string;
  baseUrl?: string;
  debug?: boolean
}

export class MindlyticsClient {
  private baseUrl: string = 'https://api.mindlytics.io/v1';

  private client: Client

  constructor(private options: MindlyticsOptions) {
    if (options.baseUrl) {
      this.baseUrl = options.baseUrl;
    }

    this.client = createClient({
      baseUrl: this.baseUrl,
      headers: this.headers
    })

    if (options.debug) {
      this.client.use({
        onRequest: (options) => {
          this.debug('Request:', options.schemaPath, options.params)
        },
        onResponse: (response)  => {
          this.debug('Response:', response.schemaPath, response.response.status, response.response.body)
        },
        onError: (options) =>  {
          this.debug('Error:', options.schemaPath, options.params, options.error)
        },
      })
    }
  }

  private get headers() {
    return {
      Authorization: this.options.apiKey,
      'x-app-id': this.options.projectId
    }
  }

  private debug(...messages: any[]) {
    if (this.options.debug) {
      console.log('[MLSDK:DEBUG]', ...messages)
    }
  }

  async startSession(params: StartSessionParams) {
    return this.client.POST('/events/event/start-session', {
      body: params,
      params: {
        header: this.headers
      }
    })
  }

  async endSession(params: EndSessionParams) {
    return this.client.POST('/events/event/end-session', {
      body: params,
      params: {
        header: this.headers
      }
    })
  } 
  
  async trackEvent(params: TrackEventParams) {
    return this.client.POST('/events/event/track', {
      body: params,
      params: {
        header: this.headers
      }
    })
  }

  async identify(params: UserIdentifyParams) {
    return this.client.POST('/events/event/identify', {
      body: params,
      params: {
        header: this.headers
      }
    })
  }

  async alias(params: UserAliasParams) {
    return this.client.POST('/events/event/alias', {
      body: params,
      params: {
        header: this.headers
      }
    })
  }

  async startConversation(params: StartConversationParams) {
    return this.client.POST('/events/event/start-conversation', {
      body: params,
      params: {
        header: this.headers
      }
    })
  }

  async endConversation(params: EndConversationParams) {
    return this.client.POST('/events/event/end-conversation', {
      body: params,
      params: {
        header: this.headers
      }
    })
  }

  async trackConversationTurn(params: TrackConversationTurnParams) {
    return this.client.POST('/events/event/conversation-turn', {
      body: params,
      params: {
        header: this.headers
      }
    })
  }

  async trackConversationUsage(params: TrackConversationUsageParams) {
    return this.client.POST('/events/event/conversation-usage', {
      body: params,
      params: {
        header: this.headers
      }
    })
  }
}

export type StartSessionParams = paths['/events/event/start-session']['post']['requestBody']['content']['application/json']
export type EndSessionParams = paths['/events/event/end-session']['post']['requestBody']['content']['application/json']
export type TrackEventParams = paths['/events/event/track']['post']['requestBody']['content']['application/json']
export type UserIdentifyParams = paths['/events/event/identify']['post']['requestBody']['content']['application/json']
export type UserAliasParams = paths['/events/event/alias']['post']['requestBody']['content']['application/json']
export type StartConversationParams = paths['/events/event/start-conversation']['post']['requestBody']['content']['application/json']
export type EndConversationParams = paths['/events/event/end-conversation']['post']['requestBody']['content']['application/json']
export type TrackConversationTurnParams = paths['/events/event/conversation-turn']['post']['requestBody']['content']['application/json']
export type TrackConversationUsageParams = paths['/events/event/conversation-usage']['post']['requestBody']['content']['application/json']