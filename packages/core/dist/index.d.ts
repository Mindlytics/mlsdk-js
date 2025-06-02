import type { paths } from './schema.gen.ts';
import { QueueOptions } from './queue.ts';
import type { FetchResponse } from 'openapi-fetch';
export interface MindlyticsOptions {
    apiKey: string;
    projectId: string;
    baseUrl?: string;
    debug?: boolean;
    queue?: QueueOptions & {
        enabled?: boolean;
    };
}
export declare class MindlyticsClient<TOptions extends MindlyticsOptions = MindlyticsOptions> {
    private options;
    private baseUrl;
    private client;
    private eventQueue;
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
    startSession(params: StartSessionParams): Promise<TOptions["queue"] extends {
        enabled: false;
    } ? FetchResponse<{
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    session_id: string;
                    timestamp?: string;
                    type: "start_session";
                    id?: string;
                    device_id?: string;
                    attributes?: {
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
                    "application/json": ({
                        type: "start_session" | "end_session" | "identify" | "alias" | "track";
                    } & {
                        [key: string]: string | number | boolean;
                    })[];
                };
            };
        };
    }, import("openapi-fetch").FetchOptions<{
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    session_id: string;
                    timestamp?: string;
                    type: "start_session";
                    id?: string;
                    device_id?: string;
                    attributes?: {
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
                    "application/json": ({
                        type: "start_session" | "end_session" | "identify" | "alias" | "track";
                    } & {
                        [key: string]: string | number | boolean;
                    })[];
                };
            };
        };
    }>, "application/json"> : void>;
    endSession(params: EndSessionParams): Promise<TOptions["queue"] extends {
        enabled: false;
    } ? FetchResponse<{
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    session_id: string;
                    timestamp?: string;
                    type: "end_session";
                    attributes?: {
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
                    "application/json": ({
                        type: "start_session" | "end_session" | "identify" | "alias" | "track";
                    } & {
                        [key: string]: string | number | boolean;
                    })[];
                };
            };
        };
    }, import("openapi-fetch").FetchOptions<{
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    session_id: string;
                    timestamp?: string;
                    type: "end_session";
                    attributes?: {
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
                    "application/json": ({
                        type: "start_session" | "end_session" | "identify" | "alias" | "track";
                    } & {
                        [key: string]: string | number | boolean;
                    })[];
                };
            };
        };
    }>, "application/json"> : void>;
    trackEvent(params: TrackEventParams): Promise<TOptions["queue"] extends {
        enabled: false;
    } ? FetchResponse<{
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    session_id: string;
                    timestamp?: string;
                    type: "track";
                    event: string;
                    conversation_id?: string;
                    properties?: {
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
                    "application/json": ({
                        type: "start_session" | "end_session" | "identify" | "alias" | "track";
                    } & {
                        [key: string]: string | number | boolean;
                    })[];
                };
            };
        };
    }, import("openapi-fetch").FetchOptions<{
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    session_id: string;
                    timestamp?: string;
                    type: "track";
                    event: string;
                    conversation_id?: string;
                    properties?: {
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
                    "application/json": ({
                        type: "start_session" | "end_session" | "identify" | "alias" | "track";
                    } & {
                        [key: string]: string | number | boolean;
                    })[];
                };
            };
        };
    }>, "application/json"> : void>;
    identify(params: UserIdentifyParams): Promise<TOptions["queue"] extends {
        enabled: false;
    } ? FetchResponse<{
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    session_id: string;
                    timestamp?: string;
                    type: "identify";
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
                    "application/json": ({
                        type: "start_session" | "end_session" | "identify" | "alias" | "track";
                    } & {
                        [key: string]: string | number | boolean;
                    })[];
                };
            };
        };
    }, import("openapi-fetch").FetchOptions<{
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    session_id: string;
                    timestamp?: string;
                    type: "identify";
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
                    "application/json": ({
                        type: "start_session" | "end_session" | "identify" | "alias" | "track";
                    } & {
                        [key: string]: string | number | boolean;
                    })[];
                };
            };
        };
    }>, "application/json"> : void>;
    alias(params: UserAliasParams): Promise<TOptions["queue"] extends {
        enabled: false;
    } ? FetchResponse<{
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    session_id: string;
                    timestamp?: string;
                    type: "alias";
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
                    "application/json": ({
                        type: "start_session" | "end_session" | "identify" | "alias" | "track";
                    } & {
                        [key: string]: string | number | boolean;
                    })[];
                };
            };
        };
    }, import("openapi-fetch").FetchOptions<{
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    session_id: string;
                    timestamp?: string;
                    type: "alias";
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
                    "application/json": ({
                        type: "start_session" | "end_session" | "identify" | "alias" | "track";
                    } & {
                        [key: string]: string | number | boolean;
                    })[];
                };
            };
        };
    }>, "application/json"> : void>;
    startConversation(params: StartConversationParams): Promise<TOptions["queue"] extends {
        enabled: false;
    } ? FetchResponse<{
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    session_id: string;
                    timestamp?: string;
                    type: "track";
                    event: "Conversation Started";
                    conversation_id: string;
                    properties?: {
                        [key: string]: string | number | boolean;
                    };
                    attributes?: {
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
                    "application/json": ({
                        type: "start_session" | "end_session" | "identify" | "alias" | "track";
                    } & {
                        [key: string]: string | number | boolean;
                    })[];
                };
            };
        };
    }, import("openapi-fetch").FetchOptions<{
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    session_id: string;
                    timestamp?: string;
                    type: "track";
                    event: "Conversation Started";
                    conversation_id: string;
                    properties?: {
                        [key: string]: string | number | boolean;
                    };
                    attributes?: {
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
                    "application/json": ({
                        type: "start_session" | "end_session" | "identify" | "alias" | "track";
                    } & {
                        [key: string]: string | number | boolean;
                    })[];
                };
            };
        };
    }>, "application/json"> : void>;
    endConversation(params: EndConversationParams): Promise<TOptions["queue"] extends {
        enabled: false;
    } ? FetchResponse<{
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    session_id: string;
                    timestamp?: string;
                    type: "track";
                    event: "Conversation Ended";
                    conversation_id: string;
                    properties?: {
                        [key: string]: string | number | boolean;
                    };
                    attributes?: {
                        [key: string]: string | number | boolean;
                    };
                    conversation_analysis?: {
                        summary: string;
                        sentiment: "positive" | "negative" | "neutral";
                        cost: number;
                    };
                    intent_analysis?: {
                        summary: string;
                        sentiment: "positive" | "negative" | "neutral";
                        intent_fulfilled: "yes" | "no";
                        cost: number;
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
                    "application/json": ({
                        type: "start_session" | "end_session" | "identify" | "alias" | "track";
                    } & {
                        [key: string]: string | number | boolean;
                    })[];
                };
            };
        };
    }, import("openapi-fetch").FetchOptions<{
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    session_id: string;
                    timestamp?: string;
                    type: "track";
                    event: "Conversation Ended";
                    conversation_id: string;
                    properties?: {
                        [key: string]: string | number | boolean;
                    };
                    attributes?: {
                        [key: string]: string | number | boolean;
                    };
                    conversation_analysis?: {
                        summary: string;
                        sentiment: "positive" | "negative" | "neutral";
                        cost: number;
                    };
                    intent_analysis?: {
                        summary: string;
                        sentiment: "positive" | "negative" | "neutral";
                        intent_fulfilled: "yes" | "no";
                        cost: number;
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
                    "application/json": ({
                        type: "start_session" | "end_session" | "identify" | "alias" | "track";
                    } & {
                        [key: string]: string | number | boolean;
                    })[];
                };
            };
        };
    }>, "application/json"> : void>;
    trackConversationTurn(params: TrackConversationTurnParams): Promise<TOptions["queue"] extends {
        enabled: false;
    } ? FetchResponse<{
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    session_id: string;
                    timestamp?: string;
                    type: "track";
                    event: "Conversation Turn";
                    conversation_id: string;
                    properties: {
                        user: string;
                        assistant: string;
                        assisant_id?: string;
                        model?: string;
                        prompt_tokens?: number;
                        completion_tokens?: number;
                        cost?: number;
                    } & {
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
                    "application/json": ({
                        type: "start_session" | "end_session" | "identify" | "alias" | "track";
                    } & {
                        [key: string]: string | number | boolean;
                    })[];
                };
            };
        };
    }, import("openapi-fetch").FetchOptions<{
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    session_id: string;
                    timestamp?: string;
                    type: "track";
                    event: "Conversation Turn";
                    conversation_id: string;
                    properties: {
                        user: string;
                        assistant: string;
                        assisant_id?: string;
                        model?: string;
                        prompt_tokens?: number;
                        completion_tokens?: number;
                        cost?: number;
                    } & {
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
                    "application/json": ({
                        type: "start_session" | "end_session" | "identify" | "alias" | "track";
                    } & {
                        [key: string]: string | number | boolean;
                    })[];
                };
            };
        };
    }>, "application/json"> : void>;
    trackConversationUsage(params: TrackConversationUsageParams): Promise<TOptions["queue"] extends {
        enabled: false;
    } ? FetchResponse<{
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    session_id: string;
                    timestamp?: string;
                    type: "track";
                    event: "Conversation Usage";
                    conversation_id: string;
                    properties: {
                        model: string;
                        prompt_tokens: number;
                        completion_tokens: number;
                    } | {
                        cost: number;
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
                    "application/json": ({
                        type: "start_session" | "end_session" | "identify" | "alias" | "track";
                    } & {
                        [key: string]: string | number | boolean;
                    })[];
                };
            };
        };
    }, import("openapi-fetch").FetchOptions<{
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    session_id: string;
                    timestamp?: string;
                    type: "track";
                    event: "Conversation Usage";
                    conversation_id: string;
                    properties: {
                        model: string;
                        prompt_tokens: number;
                        completion_tokens: number;
                    } | {
                        cost: number;
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
                    "application/json": ({
                        type: "start_session" | "end_session" | "identify" | "alias" | "track";
                    } & {
                        [key: string]: string | number | boolean;
                    })[];
                };
            };
        };
    }>, "application/json"> : void>;
}
export type StartSessionParams = Omit<paths['/events/event/start-session']['post']['requestBody']['content']['application/json'], 'type'>;
export type EndSessionParams = Omit<paths['/events/event/end-session']['post']['requestBody']['content']['application/json'], 'type'>;
export type TrackEventParams = Omit<paths['/events/event/track']['post']['requestBody']['content']['application/json'], 'type'>;
export type UserIdentifyParams = Omit<paths['/events/event/identify']['post']['requestBody']['content']['application/json'], 'type'>;
export type UserAliasParams = Omit<paths['/events/event/alias']['post']['requestBody']['content']['application/json'], 'type'>;
export type StartConversationParams = Omit<paths['/events/event/start-conversation']['post']['requestBody']['content']['application/json'], 'type' | 'event'>;
export type EndConversationParams = Omit<paths['/events/event/end-conversation']['post']['requestBody']['content']['application/json'], 'type' | 'event'>;
export type TrackConversationTurnParams = Omit<paths['/events/event/conversation-turn']['post']['requestBody']['content']['application/json'], 'type' | 'event'>;
export type TrackConversationUsageParams = Omit<paths['/events/event/conversation-usage']['post']['requestBody']['content']['application/json'], 'type' | 'event'>;
