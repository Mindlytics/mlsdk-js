import { AsyncLocalStorage } from 'node:async_hooks'
import crypto from 'node:crypto'

import { MindlyticsClient } from '@mindlytics/core'
import type {
  EndConversationParams,
  MindlyticsOptions,
  StartConversationParams,
  StartSessionParams as StartSessionParamsCore,
  TrackConversationTurnParams,
  TrackEventParams,
  UserAliasParams,
  UserIdentifyParams,
} from '@mindlytics/core'

export interface SessionOptions extends MindlyticsOptions {
  sessionId?: string
}

export interface SessionCreateParams {
  projectId: string
  apiKey: string
  sessionId?: string
}

export interface StartSessionParams
  extends Omit<StartSessionParamsCore, 'type' | 'session_id'> {
  userId?: string
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
  private session_id: string

  private user_id: string | null = null

  private client: MindlyticsClient

  constructor(private options: SessionOptions) {
    const { sessionId, ...clientOptions } = options

    this.session_id = sessionId || crypto.randomUUID()

    this.client = new MindlyticsClient(clientOptions)
  }

  static async create(params: SessionCreateParams) {
    return new Session(params)
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

  public get sessionId() {
    return this.session_id
  }

  public get userId() {
    return this.user_id
  }

  public async start(params: StartSessionParams) {
    if (!this.session_id) {
      this.session_id = crypto.randomUUID()
    }

    if (params.userId) {
      await this.client.identify({
        id: params.userId,
        session_id: this.session_id,
      })

      this.user_id = params.userId
    }

    const response = await this.client.startSession({
      ...params,
      session_id: this.session_id,
    })

    return response
  }

  public async end() {
    await this.client.endSession({
      session_id: this.session_id,
    })
  }

  public async flush() {
    await this.client.flush()
  }

  public async track(params: Omit<TrackEventParams, 'session_id' | 'type'>) {
    await this.client.trackEvent({
      session_id: this.session_id,
      ...params,
    })
  }

  public async identify(
    params: Omit<UserIdentifyParams, 'session_id' | 'type'>,
  ) {
    await this.client.identify({
      session_id: this.session_id,
      ...params,
    })
  }

  public async alias(params: Omit<UserAliasParams, 'session_id' | 'type'>) {
    await this.client.alias({
      session_id: this.session_id,
      ...params,
    })
  }

  public async startConversation(
    params: Omit<StartConversationParams, 'session_id'>,
  ) {
    await this.client.startConversation({
      session_id: this.session_id,
      ...params,
    })
  }

  public async endConversation(
    params: Omit<EndConversationParams, 'session_id' | 'type'>,
  ) {
    await this.client.endConversation({
      session_id: this.session_id,
      ...params,
    })
  }

  public async trackConversationTurn(
    params: Omit<TrackConversationTurnParams, 'session_id' | 'type'>,
  ) {
    await this.client.trackConversationTurn({
      session_id: this.session_id,
      ...params,
    })
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
