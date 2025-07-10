import { AsyncLocalStorage } from 'node:async_hooks'

import { Core } from '@mindlytics/core'
import type { CoreOptions, UserIdentifyParams, UserAliasParams } from '@mindlytics/core'
import type { SessionOptions } from './session.ts'
import { Session } from './session.ts'

export class Client<
  TOptions extends CoreOptions = CoreOptions,
> {
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
    if (this.session) {
        return sessionContext.run(this.session, fn)
    } else {
        throw new Error('Mindlytics Session context is not set. Use `createSession` to create a session before using `withContext`.')
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
