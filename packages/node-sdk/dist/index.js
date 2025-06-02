import { AsyncLocalStorage } from 'node:async_hooks';
import crypto from 'node:crypto';
import { MindlyticsClient } from '@mindlytics/core';
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
export class Session {
    options;
    session_id;
    user_id = undefined;
    device_id = undefined;
    client;
    constructor(options) {
        this.options = options;
        const { sessionId, ...clientOptions } = options;
        this.session_id = sessionId || crypto.randomUUID();
        this.client = new MindlyticsClient(clientOptions);
    }
    static async create(params) {
        const { userId, deviceId, ...sessionOptions } = params;
        const session = new Session(sessionOptions);
        if (userId || deviceId) {
            await session.start({
                user_id: userId,
                device_id: deviceId,
            });
        }
        return session;
    }
    static use() {
        return useSession();
    }
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
    withContext(fn) {
        return sessionContext.run(this, fn);
    }
    get sessionId() {
        return this.session_id;
    }
    get userId() {
        return this.user_id;
    }
    get deviceId() {
        return this.device_id;
    }
    async start(params) {
        const { user_id, device_id, ...rest } = params;
        if (!this.session_id) {
            this.session_id = crypto.randomUUID();
        }
        if (params.user_id) {
            this.user_id = params.user_id;
        }
        if (params.device_id) {
            this.device_id = params.device_id;
        }
        if (!this.user_id && !this.device_id) {
            throw new Error('User ID or device ID is required');
        }
        const response = await this.client.startSession({
            ...rest,
            id: this.user_id,
            device_id: this.device_id,
            session_id: this.session_id,
        });
        return response;
    }
    async end() {
        await this.client.endSession({
            session_id: this.session_id,
        });
    }
    async flush() {
        await this.client.flush();
    }
    async track(params) {
        await this.client.trackEvent({
            session_id: this.session_id,
            ...params,
        });
    }
    async identify(params) {
        await this.client.identify({
            session_id: this.session_id,
            ...params,
        });
    }
    async alias(params) {
        await this.client.alias({
            session_id: this.session_id,
            ...params,
        });
    }
    async startConversation(params) {
        await this.client.startConversation({
            session_id: this.session_id,
            ...params,
        });
    }
    async endConversation(params) {
        await this.client.endConversation({
            session_id: this.session_id,
            ...params,
        });
    }
    async trackConversationTurn(params) {
        await this.client.trackConversationTurn({
            session_id: this.session_id,
            ...params,
        });
    }
}
const sessionContext = new AsyncLocalStorage();
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
export function useSession() {
    const session = sessionContext.getStore();
    if (!session) {
        throw new Error('Mindlytics Session context missing');
    }
    return session;
}
