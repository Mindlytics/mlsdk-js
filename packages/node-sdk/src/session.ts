import { Core } from '@mindlytics/core'
import type {
  EndConversationParams,
  StartConversationParams,
  EndSessionParams,
  StartSessionParams,
  TrackConversationTurnParams,
  TrackConversationUsageParams,
  TrackConversationFunctionParams,
  TrackEventParams,
  SessionUserAliasParams,
  SessionUserIdentifyParams,
  MLEventHandler,
  MLErrorHandler,
} from '@mindlytics/core'

export interface SessionOptions {
  /**
   * A globally unique session ID.
   */
  sessionId: string

  /**
   * A globally unique conversation ID.  If specified here, it will apply to all events sent using this session.
   * If not specified here, then you will need to supply it to conversation-related events.
   */
  conversationId?: string

  /**
   * User ID, if known.  One of either userId or deviceId must be provided.
   */
  userId?: string

  /**
   * Device ID, if known.  One of either userId or deviceId must be provided.
   */
  deviceId?: string
}

export class Session {
  private session_id: string

  private conversation_id: string | undefined = undefined

  private user_id: string | undefined = undefined

  private device_id: string | undefined = undefined

  private core: Core

  constructor(private options: SessionOptions, core: Core) {
    const { sessionId, conversationId, userId, deviceId } = options

    this.session_id = sessionId
    if (conversationId) {
      this.conversation_id = conversationId
    }
    if (userId) {
      this.user_id = userId
    }
    if (deviceId) {
      this.device_id = deviceId
    }

    if (!(this.user_id || this.device_id)) {
      throw new Error('User ID or device ID is required')
    }

    this.core = core
  }

  public async startListening(
    onEvent?: MLEventHandler,
    onError?: MLErrorHandler,
  ) {
    return this.core.startListening(onEvent, onError)
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

  public get conversationId() {
    return this.conversation_id
  }

  public async start(params: Omit<StartSessionParams, 'session_id'> = {}) {
    await this.core.startSession({
      session_id: this.session_id,
      id: this.user_id,
      device_id: this.device_id,
      ...params,
    })
  }

  public async end(params: Omit<EndSessionParams, 'session_id'> = {}) {
    await this.core.endSession({
      user_id: this.user_id,
      device_id: this.device_id,
      ...params,
      session_id: this.session_id,
    })
  }

  public async flush() {
    return this.core.flush()
  }

  public async track(params: Omit<TrackEventParams, 'session_id' | 'type'>) {
    await this.core.trackEvent({
      session_id: this.session_id,
      conversation_id: this.conversation_id,
      user_id: this.user_id,
      device_id: this.device_id,
      ...params,
    })
  }

  public async identify(
    params: Omit<SessionUserIdentifyParams, 'session_id' | 'type'>,
  ) {
    await this.core.sessionUserIdentify({
      session_id: this.session_id,
      user_id: this.user_id,
      device_id: this.device_id,
      ...params,
    })
  }

  public async alias(
    params: Omit<SessionUserAliasParams, 'session_id' | 'type'>,
  ) {
    await this.core.sessionUserAlias({
      session_id: this.session_id,
      user_id: this.user_id,
      device_id: this.device_id,
      ...params,
    })
  }

  public async startConversation(
    params: Omit<
      StartConversationParams,
      'session_id' | 'type' | 'conversation_id'
    > & { conversation_id?: string },
  ) {
    if (!params.conversation_id) {
      if (this.conversation_id) {
        params.conversation_id = this.conversation_id
      }
    }
    if (!params.conversation_id) {
      throw new Error('Conversation id is required to start a conversation')
    }
    await this.core.startConversation({
      session_id: this.session_id,
      user_id: this.user_id,
      device_id: this.device_id,
      ...params,
      conversation_id: params.conversation_id as string,
    })
  }

  public async endConversation(
    params: Omit<
      EndConversationParams,
      'session_id' | 'type' | 'conversation_id'
    > & { conversation_id?: string },
  ) {
    if (!params.conversation_id) {
      if (this.conversation_id) {
        params.conversation_id = this.conversation_id
      }
    }
    if (!params.conversation_id) {
      throw new Error('Conversation id is required to end a conversation')
    }
    await this.core.endConversation({
      session_id: this.session_id,
      user_id: this.user_id,
      device_id: this.device_id,
      ...params,
      conversation_id: params.conversation_id as string,
    })
  }

  public async trackConversationTurn(
    params: Omit<
      TrackConversationTurnParams,
      'session_id' | 'type' | 'conversation_id'
    > & { conversation_id?: string },
  ) {
    if (!params.conversation_id) {
      if (this.conversation_id) {
        params.conversation_id = this.conversation_id
      }
    }
    if (!params.conversation_id) {
      throw new Error(
        'Conversation id is required to track a conversation turn',
      )
    }
    await this.core.trackConversationTurn({
      session_id: this.session_id,
      user_id: this.user_id,
      device_id: this.device_id,
      ...params,
      conversation_id: params.conversation_id as string,
    })
  }

  public async trackConversationUsage(
    params: Omit<
      TrackConversationUsageParams,
      'session_id' | 'type' | 'conversation_id'
    > & { conversation_id?: string },
  ) {
    if (!params.conversation_id) {
      if (this.conversation_id) {
        params.conversation_id = this.conversation_id
      }
    }
    if (!params.conversation_id) {
      throw new Error(
        'Conversation id is required to track conversation turn usage',
      )
    }
    await this.core.trackConversationUsage({
      session_id: this.session_id,
      user_id: this.user_id,
      device_id: this.device_id,
      ...params,
      conversation_id: params.conversation_id as string,
    })
  }

  public async trackConversationFunction(
    params: Omit<TrackConversationFunctionParams, 'session_id' | 'type'> & {
      conversation_id?: string
    },
  ) {
    if (!params.conversation_id) {
      if (this.conversation_id) {
        params.conversation_id = this.conversation_id
      }
    }
    if (!params.conversation_id) {
      throw new Error(
        'Conversation id is required to track a conversation function',
      )
    }
    await this.core.trackConversationFunction({
      session_id: this.session_id,
      user_id: this.user_id,
      device_id: this.device_id,
      ...params,
      conversation_id: params.conversation_id as string,
    })
  }
}
