import type { paths } from './schema.gen.ts';
import { QueueOptions } from './queue.ts';
import { MLEventHandler, MLErrorHandler } from './ws.ts';
export type { MLErrorHandler } from './ws.ts';
export type { MLEventHandler } from './ws.ts';
export type { MLEvent } from './ws.ts';
export interface MindlyticsOptions {
    apiKey: string;
    projectId: string;
    baseUrl?: string;
    debug?: boolean;
    queue?: QueueOptions;
}
export declare class MindlyticsClient<TOptions extends MindlyticsOptions = MindlyticsOptions> {
    private options;
    private baseUrl;
    private client;
    private eventQueue;
    private wsClient;
    constructor(options: TOptions);
    private get headers();
    private debug;
    /**
     * Flush all queued events immediately
     * Useful before serverless function shutdown
     */
    flush(): Promise<void>;
    /**
     * Make a direct API call or queue it based on configuration
     */
    private makeRequest;
    startListening(onEvent?: MLEventHandler, onError?: MLErrorHandler): Promise<void>;
    startSession(params: StartSessionParams): Promise<void>;
    endSession(params: EndSessionParams): Promise<void>;
    trackEvent(params: TrackEventParams): Promise<void>;
    sessionUserIdentify(params: SessionUserIdentifyParams): Promise<void>;
    sessionUserAlias(params: SessionUserAliasParams): Promise<void>;
    startConversation(params: StartConversationParams): Promise<void>;
    endConversation(params: EndConversationParams): Promise<void>;
    trackConversationTurn(params: TrackConversationTurnParams): Promise<void>;
    trackConversationUsage(params: TrackConversationUsageParams): Promise<void>;
    identify(params: UserIdentifyParams): Promise<import("openapi-fetch").FetchResponse<{
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": {
                    id?: string;
                    device_id?: string;
                    traits?: {
                        [key: string]: string | number | boolean;
                    };
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        organization_id: string;
                        app_id: string;
                        user_id: string;
                        id: string;
                        aliases: string[];
                        created_at: string;
                        traits: {
                            [key: string]: string | number | boolean;
                        };
                    };
                };
            };
        };
    }, {
        body: never;
    }, `${string}/${string}`>>;
    alias(params: UserAliasParams): Promise<import("openapi-fetch").FetchResponse<{
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": {
                    id: string;
                    previous_id: string;
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        organization_id: string;
                        app_id: string;
                        user_id: string;
                        id: string;
                        aliases: string[];
                        created_at: string;
                        traits: {
                            [key: string]: string | number | boolean;
                        };
                    };
                };
            };
        };
    }, {
        body: never;
    }, `${string}/${string}`>>;
}
export type StartSessionParams = Omit<paths['/events/event/start-session']['post']['requestBody']['content']['application/json'], 'type'>;
export type EndSessionParams = Omit<paths['/events/event/end-session']['post']['requestBody']['content']['application/json'], 'type'>;
export type TrackEventParams = Omit<paths['/events/event/track']['post']['requestBody']['content']['application/json'], 'type'>;
export type SessionUserIdentifyParams = Omit<paths['/events/event/identify']['post']['requestBody']['content']['application/json'], 'type'>;
export type SessionUserAliasParams = Omit<paths['/events/event/alias']['post']['requestBody']['content']['application/json'], 'type'>;
export type StartConversationParams = Omit<paths['/events/event/start-conversation']['post']['requestBody']['content']['application/json'], 'type' | 'event'>;
export type EndConversationParams = Omit<paths['/events/event/end-conversation']['post']['requestBody']['content']['application/json'], 'type' | 'event'>;
export type TrackConversationTurnParams = Omit<paths['/events/event/conversation-turn']['post']['requestBody']['content']['application/json'], 'type' | 'event'>;
export type TrackConversationUsageParams = Omit<paths['/events/event/conversation-usage']['post']['requestBody']['content']['application/json'], 'type' | 'event'>;
export type UserIdentifyParams = paths['/user/identify']['post']['requestBody'] extends {
    content: {
        'application/json': infer T;
    };
} ? T : never;
export type UserAliasParams = paths['/user/alias']['post']['requestBody'] extends {
    content: {
        'application/json': infer T;
    };
} ? T : never;
