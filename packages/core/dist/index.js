import { createClient } from "./fetch.js";
import { EventQueue } from "./queue.js";
import { WebSocketClient } from "./ws.js";
export class MindlyticsClient {
    options;
    baseUrl = 'https://app-staging.mindlytics.ai/bc/v1';
    client;
    eventQueue;
    wsClient = null;
    constructor(options) {
        this.options = options;
        if (options.baseUrl) {
            this.baseUrl = options.baseUrl;
        }
        this.client = createClient({
            baseUrl: this.baseUrl,
            headers: this.headers,
        });
        if (options.debug) {
            this.client.use({
                onRequest: (options) => {
                    this.debug('Request:', options.schemaPath, options.params);
                },
                onResponse: (response) => {
                    this.debug('Response:', response.schemaPath, response.response.status, response.response.body);
                },
                onError: (options) => {
                    this.debug('Error:', options.schemaPath, options.params, options.error);
                },
            });
        }
        this.eventQueue = new EventQueue(this.client, {
            ...options.queue,
            debug: options.debug,
        });
    }
    get headers() {
        return {
            Authorization: this.options.apiKey,
            'x-app-id': this.options.projectId,
        };
    }
    debug(...messages) {
        if (this.options.debug) {
            console.log('[MLSDK:DEBUG]', ...messages);
        }
    }
    /**
     * Flush all queued events immediately
     * Useful before serverless function shutdown
     */
    async flush() {
        await this.eventQueue.flush();
    }
    /**
     * Make a direct API call or queue it based on configuration
     */
    makeRequest(path, body) {
        this.eventQueue.enqueue({
            path,
            body,
            params: {
                header: this.headers,
            },
        });
    }
    async startListening(onEvent, onError) {
        if (!onError) {
            onError = { callback: async (error) => { }, data: undefined };
        }
        if (!onEvent) {
            onEvent = { callback: async (event) => { }, data: undefined };
        }
        // derive the ws endpoint from the base URL
        let wsEndpoint = this.baseUrl.replace(/^http/, 'ws');
        wsEndpoint = wsEndpoint.replace('//app/', '//wss/');
        // To handle localhost
        wsEndpoint = wsEndpoint.replace(':300', ':400');
        wsEndpoint = wsEndpoint.replace('/bc/v1', '');
        this.wsClient = new WebSocketClient(this.client, wsEndpoint, onError, onEvent);
        return this.wsClient.startListening();
    }
    async startSession(params) {
        return this.makeRequest('/events/event/start-session', {
            type: 'start_session',
            ...params,
        });
    }
    async endSession(params) {
        return this.makeRequest('/events/event/end-session', {
            type: 'end_session',
            ...params,
        });
    }
    async trackEvent(params) {
        return this.makeRequest('/events/event/track', {
            type: 'track',
            ...params,
        });
    }
    async identify(params) {
        return this.makeRequest('/events/event/identify', {
            type: 'identify',
            ...params,
        });
    }
    async alias(params) {
        return this.makeRequest('/events/event/alias', {
            type: 'alias',
            ...params,
        });
    }
    async startConversation(params) {
        return this.makeRequest('/events/event/start-conversation', {
            type: 'track',
            event: 'Conversation Started',
            ...params,
        });
    }
    async endConversation(params) {
        return this.makeRequest('/events/event/end-conversation', {
            type: 'track',
            event: 'Conversation Ended',
            ...params,
        });
    }
    async trackConversationTurn(params) {
        return this.makeRequest('/events/event/conversation-turn', {
            type: 'track',
            event: 'Conversation Turn',
            ...params,
        });
    }
    async trackConversationUsage(params) {
        return this.makeRequest('/events/event/conversation-usage', {
            type: 'track',
            event: 'Conversation Usage',
            ...params,
        });
    }
}
