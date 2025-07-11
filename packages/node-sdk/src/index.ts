import { AsyncLocalStorage } from 'node:async_hooks'

import { Core } from '@mindlytics/core'
import type {
  CoreOptions,
  UserIdentifyParams,
  UserAliasParams,
} from '@mindlytics/core'
import type { SessionOptions } from './session.ts'
import { Session } from './session.ts'

export class Client<TOptions extends CoreOptions = CoreOptions> {
  private core: Core<TOptions>
  private session: Session | undefined

  constructor(options: TOptions) {
    this.core = new Core(options)
  }

  static use() {
    return useSession()
  }

  /**
   * Usage:
   *
   * ```ts
   * function GET() {
   *   const client = new Client({
   *     projectId: 'your-project-id',
   *     apiKey: 'your-api-key',
   *   })
   *
   *   client.withContext(() => {
   *     someMethod()
   *   })
   * }
   *
   * function someMethod() {
   *   const session = Client.use()
   *
   *   console.log(session.user_id) // 123
   * }
   */
  withContext<T>(fn: () => Promise<T>) {
    if (this.session) {
      return sessionContext.run(this.session, fn)
    } else {
      throw new Error(
        'Mindlytics Session context is not set. Use `createSession` to create a session before using `withContext`.',
      )
    }
  }

  createSession(options: SessionOptions) {
    this.session = new Session(options, this.core)
    return this.session
  }

  async identifyUser(params: UserIdentifyParams) {
    return this.core.identify(params)
  }

  async aliasUser(params: UserAliasParams) {
    return this.core.alias(params)
  }

  async dbGET(params: {
    collection:
      | 'users'
      | 'events'
      | 'sessions'
      | 'conversations'
      | 'messages'
      | 'orgkeys'
      | 'organizations'
      | 'apps'
    op: 'find' | 'findOne'
    query?: {
      filter?: Record<string, any>
      projection?: Record<string, any>
      sort?: Record<string, any>
      skip?: number
      limit?: number
      include?: string | Record<string, any> | Array<string | Record<string, any>>
    }
  }): Promise<any> {
    let coreParams = {
      collection: params.collection,
      op: params.op,
      query: {} as Record<string, any>,
    }
    try {
      if (params.query) {
        if (params.query.filter) {
          coreParams.query.filter = JSON.stringify(params.query.filter)
        }
        if (params.query.projection) {
          coreParams.query.projection = JSON.stringify(params.query.projection)
        }
        if (params.query.sort) {
          coreParams.query.sort = JSON.stringify(params.query.sort)
        }
        if (params.query.include) {
          if (Array.isArray(params.query.include)) {
            coreParams.query.include = JSON.stringify(params.query.include)
          } else {
            coreParams.query.include = JSON.stringify([params.query.include])
          }
        }
      }
    } catch (error) {
      throw new Error(`Invalid query parameters: ${error}`)
    }
    return this.core.dbGET(coreParams)
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
