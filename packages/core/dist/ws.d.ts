import { Client } from './fetch.ts';
export type MLEvent = {
    organization_id: string;
    app_id: string;
    session_id: string;
    user_id: string;
    event_id: string;
    origin_event_id?: string;
    conversation_id?: string;
    timestamp: string;
    event: string;
    properties?: Record<string, any>;
    user_traits?: Record<string, any>;
};
export type MLEventHandler = {
    callback: (event: MLEvent, data?: any) => Promise<void>;
    data?: any;
};
export type MLErrorHandler = {
    callback: (error: Error, data?: any) => Promise<void>;
    data?: any;
};
export declare class WebSocketClient {
    private httpClient;
    private wsEndpoint;
    private onError;
    private onEvent;
    private wsClient;
    constructor(httpClient: Client, wsEndpoint: string, onError: MLErrorHandler, onEvent: MLEventHandler);
    startListening(): Promise<void>;
}
