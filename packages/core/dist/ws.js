import WebSocket from 'ws';
export class WebSocketClient {
    httpClient;
    wsEndpoint;
    onError;
    onEvent;
    wsClient = null;
    constructor(httpClient, wsEndpoint, onError, onEvent) {
        this.httpClient = httpClient;
        this.wsEndpoint = wsEndpoint;
        this.onError = onError;
        this.onEvent = onEvent;
    }
    startListening() {
        return new Promise(async (resolve, reject) => {
            const { data, error } = await this.httpClient.GET('/live-events/realtime');
            if (error) {
                return reject(new Error(`Failed to obtain websocket authorization key: ${error}`));
            }
            const key = data?.authorization_key;
            if (!key) {
                return reject(new Error('No authorization key found in response'));
            }
            this.wsClient = new WebSocket(this.wsEndpoint, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${key}`,
                },
            });
            this.wsClient.on('open', () => {
                resolve();
            });
            this.wsClient.on('error', async (error) => {
                await this.onError.callback(error, this.onError.data);
            });
            this.wsClient.on('message', async (data) => {
                try {
                    const e = JSON.parse(data.toString());
                    if (e.event === 'MLError') {
                        const msg = e.properties?.error_message || 'Unknown error';
                        await this.onError.callback(new Error(msg), this.onError.data);
                    }
                    else {
                        await this.onEvent.callback(e, this.onEvent.data);
                    }
                }
                catch (error) {
                    await this.onError.callback(new Error(`Failed to parse websocket message: ${error}`), this.onError.data);
                }
            });
        });
    }
}
