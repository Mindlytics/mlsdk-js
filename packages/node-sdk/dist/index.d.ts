import type { EndConversationParams, MindlyticsOptions, StartConversationParams, StartSessionParams as StartSessionParamsCore, TrackConversationTurnParams, TrackEventParams, UserAliasParams, UserIdentifyParams } from '@mindlytics/core';
export interface SessionOptions extends MindlyticsOptions {
    sessionId?: string;
}
export interface SessionCreateParams {
    /**
     * The Mindlytics project ID
     */
    projectId: string;
    /**
     * The Mindlytics API key
     */
    apiKey: string;
    /**
     * A custom session ID, will be generated if not provided
     */
    sessionId?: string;
    /**
     * User ID, can also be set when starting a session
     * Will start a new session if provided
     */
    userId?: string;
    /**
     * Device ID, can also be set when starting a session
     * Will start a new session if provided
     */
    deviceId?: string;
    /**
     * The base URL of the Mindlytics API
     */
    baseUrl?: string;
    /**
     * Whether to enable debug logging
     */
    debug?: boolean;
}
export interface StartSessionParams extends Omit<StartSessionParamsCore, 'id' | 'type' | 'session_id' | 'device_id'> {
    userId?: string;
    deviceId?: string;
}
/**
 * Usage:
 *
 * ```ts
 * const session = await Session.create({
 *   projectId: 'your-project-id',
 *   apiKey: 'your-api-key',
 * })
 * ```
 */
export declare class Session {
    private options;
    private session_id;
    private user_id;
    private device_id;
    private client;
    constructor(options: SessionOptions);
    static create(params: SessionCreateParams): Promise<Session>;
    static use(): Session;
    /**
     * Usage:
     *
     * ```ts
     * function GET() {
     *   const session = await Session.create({
     *     projectId: 'your-project-id',
     *     apiKey: 'your-api-key',
     *   })
     *
     *   session.start({
     *     user_id: '123',
     *   })
     *
     *   session.withContext(() => {
     *     someMethod()
     *   })
     * }
     *
     * function someMethod() {
     *   const session = Session.use() // or useSession()
     *
     *   console.log(session.user_id) // 123
     * }
     */
    withContext<T>(fn: () => Promise<T>): Promise<T>;
    get sessionId(): string;
    get userId(): string | undefined;
    get deviceId(): string | undefined;
    start(params: StartSessionParams): Promise<void>;
    end(): Promise<void>;
    flush(): Promise<void>;
    track(params: Omit<TrackEventParams, 'session_id' | 'type'>): Promise<void>;
    identify(params: Omit<UserIdentifyParams, 'session_id' | 'type'>): Promise<void>;
    alias(params: Omit<UserAliasParams, 'session_id' | 'type'>): Promise<void>;
    startConversation(params: Omit<StartConversationParams, 'session_id'>): Promise<void>;
    endConversation(params: Omit<EndConversationParams, 'session_id' | 'type'>): Promise<void>;
    trackConversationTurn(params: Omit<TrackConversationTurnParams, 'session_id' | 'type'>): Promise<void>;
}
/**
 * Returns the current session context.
 * Needs to be used within a `withContext` block.
 *
 * Usage:
 *
 * ```ts
 * const session = useSession()
 *
 * session.start({
 *   user_id: '123',
 * })
 * ```
 */
export declare function useSession(): Session;
