import WebSocket from 'ws'
import { Client } from './fetch.ts'

export type MLEvent = {
    organization_id: string,
    app_id: string,
    session_id: string,
    user_id: string,
    event_id: string,
    origin_event_id?: string,
    conversation_id?: string,
    timestamp: string,
    event: string,
    properties?: Record<string, any>,
    user_traits?: Record<string, any>,
}

export type MLEventHandler = {
  callback: (event: MLEvent, data?: any) => Promise<void>;
  data?: any;
};

export type MLErrorHandler = {
  callback: (error: Error, data?: any) => Promise<void>;
  data?: any;
};

export class WebSocketClient {
  private wsClient: WebSocket | null = null

  constructor(
    private httpClient: Client,
    private wsEndpoint: string,
    private onError: MLErrorHandler,
    private onEvent: MLEventHandler,
  ) {}

  public startListening(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const { data, error } = await this.httpClient.GET('/bc/v1/live-events/realtime')
      if (error) {
        return reject(
          new Error(`Failed to obtain websocket authorization key: ${error}`),
        )
      }
      const key = data?.authorization_key
      if (!key) {
        return reject(new Error('No authorization key found in response'))
      }
      this.wsClient = new WebSocket(this.wsEndpoint, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
      })
      this.wsClient.on('open', () => {
        resolve()
      })
      this.wsClient.on('error', async (error) => {
        await this.onError.callback(error, this.onError.data)
      })
      this.wsClient.on('message', async (data) => {
        try {
          const e = JSON.parse(data.toString())
          if (e.event === 'MLError') {
            const msg = e.properties?.error_message || 'Unknown error'
            await this.onError.callback(new Error(msg), this.onError.data)
          } else {
            await this.onEvent.callback(e as MLEvent, this.onEvent.data)
          }
        } catch (error) {
          await this.onError.callback(new Error(`Failed to parse websocket message: ${error}`), this.onError.data)
        }
      })
    })
  }
}
