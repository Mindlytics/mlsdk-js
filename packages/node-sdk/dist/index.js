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
    session_id = undefined;
    conversation_id = undefined;
    user_id = undefined;
    device_id = undefined;
    client;
    constructor(options) {
        this.options = options;
        const { sessionId, ...clientOptions } = options;
        if (sessionId) {
            this.session_id = sessionId;
        }
        this.client = new MindlyticsClient(clientOptions);
    }
    static async create(params) {
        const { userId, deviceId, ...sessionOptions } = params;
        const session = new Session(sessionOptions);
        if (userId) {
            session.user_id = userId;
        }
        if (deviceId) {
            session.device_id = deviceId;
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
    async start(params = {}) {
        const { userId, deviceId, ...rest } = params;
        if (this.session_id) {
            console.warn('Session already started, skipping start');
            return this.session_id;
        }
        this.session_id = crypto.randomUUID();
        if (userId) {
            this.user_id = userId;
        }
        if (deviceId) {
            this.device_id = deviceId;
        }
        if (!this.user_id && !this.device_id) {
            throw new Error('User ID or device ID is required');
        }
        await this.client.startSession({
            ...rest,
            id: this.user_id,
            device_id: this.device_id,
            session_id: this.session_id,
        });
        return this.session_id;
    }
    async end(params = {}) {
        if (!this.session_id) {
            throw new Error('Session not started');
        }
        if (this.conversation_id) {
            await this.endConversation({
                attributes: params.attributes,
                timestamp: params.timestamp,
            });
        }
        await this.client.endSession({
            ...params,
            session_id: this.session_id,
        });
        this.session_id = undefined;
        this.conversation_id = undefined;
        await this.client.flush();
    }
    async flush() {
        await this.client.flush();
    }
    async track(params) {
        if (!this.session_id) {
            throw new Error('Session not started');
        }
        await this.client.trackEvent({
            session_id: this.session_id,
            ...params,
        });
    }
    async identify(params) {
        if (!this.session_id) {
            throw new Error('Session not started');
        }
        await this.client.sessionUserIdentify({
            session_id: this.session_id,
            ...params,
        });
    }
    async alias(params) {
        if (!this.session_id) {
            throw new Error('Session not started');
        }
        await this.client.sessionUserAlias({
            session_id: this.session_id,
            ...params,
        });
    }
    async startConversation(params = {}) {
        if (!this.session_id) {
            throw new Error('Session not started');
        }
        if (params.conversation_id) {
            this.conversation_id = params.conversation_id;
        }
        else {
            this.conversation_id = crypto.randomUUID();
        }
        await this.client.startConversation({
            ...params,
            session_id: this.session_id,
            conversation_id: this.conversation_id,
        });
    }
    async endConversation(params) {
        if (!this.session_id) {
            throw new Error('Session not started');
        }
        if (!this.conversation_id) {
            throw new Error('Conversation not started');
        }
        await this.client.endConversation({
            ...params,
            session_id: this.session_id,
            conversation_id: this.conversation_id,
        });
        this.conversation_id = undefined;
    }
    async trackConversationTurn(params) {
        if (!this.session_id) {
            throw new Error('Session not started');
        }
        if (!this.conversation_id) {
            throw new Error('Conversation not started');
        }
        await this.client.trackConversationTurn({
            ...params,
            session_id: this.session_id,
            conversation_id: this.conversation_id,
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
