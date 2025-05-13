import { AsyncLocalStorage } from 'node:async_hooks';
import crypto from 'node:crypto'

import { MindlyticsClient, type MindlyticsOptions, type StartSessionParams } from '@mindlytics/core';

export interface SessionOptions extends MindlyticsOptions {
  sessionId?: string;
} 

export interface SessionCreateParams {
  projectId: string;
  apiKey: string;
  sessionId?: string;
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
export class Session {
  public session_id: string

  public user_id: string

  private client: MindlyticsClient

  constructor(private options: SessionOptions) {
    const {
      sessionId,
      ...clientOptions
    } = options;

    this.session_id = sessionId || crypto.randomUUID();

    this.client = new MindlyticsClient(clientOptions)
  }

  static async create(params: SessionCreateParams) {
    return new Session(params);
  }

  static use() {
    return useSession()
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
  withContext<T>(fn: () => Promise<T>) {
    return sessionContext.run(this, fn)
  }

  public async start(params: Omit<StartSessionParams, 'type' | 'session_id'>) {
    if (!this.session_id) {
      this.session_id = crypto.randomUUID();
    }

    const response = await this.client.startSession({
      type: 'start_session',
      ...params,
      session_id: this.session_id,
    })

    return response
  }
}

const sessionContext = new AsyncLocalStorage<Session>()

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
  const session = sessionContext.getStore()

  if (!session) {
    throw new Error('Mindlytics Session context missing')
  }

  return session
}

