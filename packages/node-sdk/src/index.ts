import { AsyncLocalStorage } from 'node:async_hooks'
import crypto from 'node:crypto'

import { MindlyticsClient } from '@mindlytics/core'
import type {
  EndConversationParams,
  EndSessionParams,
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
  /**
   * The Mindlytics project ID
   */
  projectId: string

  /**
   * The Mindlytics API key
   */
  apiKey: string

  /**
   * A custom session ID, will be generated if not provided
   */
  sessionId?: string

  /**
   * User ID, can also be set when starting a session
   * Will start a new session if provided
   */
  userId?: string

  /**
   * Device ID, can also be set when starting a session
   * Will start a new session if provided
   */
  deviceId?: string

  /**
   * The base URL of the Mindlytics API
   */
  baseUrl?: string

  /**
   * Whether to enable debug logging
   */
  debug?: boolean
}

export interface StartSessionParams
  extends Omit<
    StartSessionParamsCore,
    'id' | 'type' | 'session_id' | 'device_id'
  > {
  userId?: string
  deviceId?: string
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
  private session_id: string | undefined = undefined

  private conversation_id: string | undefined = undefined

  private user_id: string | undefined = undefined

  private device_id: string | undefined = undefined

  public client: MindlyticsClient

  constructor(private options: SessionOptions) {
    const { sessionId, ...clientOptions } = options

    if (sessionId) {
      this.session_id = sessionId
    }

    this.client = new MindlyticsClient(clientOptions)
  }

  static async create(params: SessionCreateParams) {
    const { userId, deviceId, ...sessionOptions } = params
    const session = new Session(sessionOptions)

    if (userId) {
      session.user_id = userId
    }

    if (deviceId) {
      session.device_id = deviceId
    }

    return session
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

  public get deviceId() {
    return this.device_id
  }

  public async start(params: StartSessionParams = {}) {
    const { userId, deviceId, ...rest } = params

    if (this.session_id) {
      console.warn('Session already started, skipping start')
      return this.session_id
    }

    this.session_id = crypto.randomUUID()

    if (userId) {
      this.user_id = userId
    }

    if (deviceId) {
      this.device_id = deviceId
    }

    if (!this.user_id && !this.device_id) {
      throw new Error('User ID or device ID is required')
    }

    await this.client.startSession({
      ...rest,
      id: this.user_id,
      device_id: this.device_id,
      session_id: this.session_id,
    })

    return this.session_id
  }

  public async end(params: Omit<EndSessionParams, 'session_id'> = {}) {
    if (!this.session_id) {
      throw new Error('Session not started')
    }

    if (this.conversation_id) {
      await this.endConversation({
        attributes: params.attributes,
        timestamp: params.timestamp,
      })
    }

    await this.client.endSession({
      ...params,
      session_id: this.session_id,
    })

    this.session_id = undefined
    this.conversation_id = undefined

    await this.client.flush()
  }

  public async flush() {
    await this.client.flush()
  }

  public async track(params: Omit<TrackEventParams, 'session_id' | 'type'>) {
    if (!this.session_id) {
      throw new Error('Session not started')
    }

    await this.client.trackEvent({
      session_id: this.session_id,
      ...params,
    })
  }

  public async identify(
    params: Omit<UserIdentifyParams, 'session_id' | 'type'>,
  ) {
    if (!this.session_id) {
      throw new Error('Session not started')
    }

    await this.client.identify({
      session_id: this.session_id,
      ...params,
    })
  }

  public async alias(params: Omit<UserAliasParams, 'session_id' | 'type'>) {
    if (!this.session_id) {
      throw new Error('Session not started')
    }

    await this.client.alias({
      session_id: this.session_id,
      ...params,
    })
  }

  public async startConversation(
    params: Omit<StartConversationParams, 'session_id' | 'conversation_id'> & {
      conversationId?: string
    } = {},
  ) {
    if (!this.session_id) {
      throw new Error('Session not started')
    }

    if (params.conversationId) {
      this.conversation_id = params.conversationId
    } else {
      this.conversation_id = crypto.randomUUID()
    }

    await this.client.startConversation({
      ...params,
      session_id: this.session_id,
      conversation_id: this.conversation_id,
    })
  }

  public async endConversation(
    params: Omit<
      EndConversationParams,
      'session_id' | 'type' | 'conversation_id'
    >,
  ) {
    if (!this.session_id) {
      throw new Error('Session not started')
    }

    if (!this.conversation_id) {
      throw new Error('Conversation not started')
    }

    await this.client.endConversation({
      ...params,
      session_id: this.session_id,
      conversation_id: this.conversation_id,
    })

    this.conversation_id = undefined
  }

  public async trackConversationTurn(
    params: Omit<
      TrackConversationTurnParams,
      'session_id' | 'type' | 'conversation_id'
    >,
  ) {
    if (!this.session_id) {
      throw new Error('Session not started')
    }

    if (!this.conversation_id) {
      throw new Error('Conversation not started')
    }

    await this.client.trackConversationTurn({
      ...params,
      session_id: this.session_id,
      conversation_id: this.conversation_id,
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
