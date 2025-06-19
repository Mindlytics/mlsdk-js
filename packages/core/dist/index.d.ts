import type { paths } from './schema.gen.ts';
import { QueueOptions } from './queue.ts';
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
    startSession(params: StartSessionParams): Promise<void>;
    endSession(params: EndSessionParams): Promise<void>;
    trackEvent(params: TrackEventParams): Promise<void>;
    identify(params: UserIdentifyParams): Promise<void>;
    alias(params: UserAliasParams): Promise<void>;
    startConversation(params: StartConversationParams): Promise<void>;
    endConversation(params: EndConversationParams): Promise<void>;
    trackConversationTurn(params: TrackConversationTurnParams): Promise<void>;
    trackConversationUsage(params: TrackConversationUsageParams): Promise<void>;
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
