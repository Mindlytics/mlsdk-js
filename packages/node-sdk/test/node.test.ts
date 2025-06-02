import {
  describe,
  it,
  expect,
  beforeAll,
  afterEach,
  afterAll,
  vi,
  beforeEach,
} from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { Session, useSession } from '../src/index.ts'

// Mock server setup
const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Session', () => {
  const defaultOptions = {
    apiKey: 'test-api-key',
    projectId: 'test-project-id',
    baseUrl: 'http://localhost:3000/v1',
    debug: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('constructor and creation', () => {
    it('should create session with default options', async () => {
      const session = await Session.create({
        apiKey: 'test-key',
        projectId: 'test-project',
      })
      expect(session).toBeInstanceOf(Session)
      expect(session.sessionId).toMatch(/^[a-f0-9-]{36}$/) // UUID format
      expect(session.userId).toBeNull()
    })

    it('should create session with custom session ID', async () => {
      const customSessionId = 'custom-session-123'
      const session = new Session({
        ...defaultOptions,
        sessionId: customSessionId,
      })
      expect(session.sessionId).toBe(customSessionId)
    })

    it('should initialize with all options', async () => {
      const session = new Session({
        ...defaultOptions,
        sessionId: 'test-session',
      })
      expect(session).toBeInstanceOf(Session)
      expect(session.sessionId).toBe('test-session')
    })
  })

  describe('session management', () => {
    let session: Session

    beforeEach(async () => {
      session = await Session.create(defaultOptions)

      // Mock the session endpoints
      server.use(
        http.post('http://localhost:3000/v1/events/event/start-session', () => {
          return HttpResponse.json({ success: true })
        }),
        http.post('http://localhost:3000/v1/events/event/end-session', () => {
          return HttpResponse.json({ success: true })
        }),
        http.post('http://localhost:3000/v1/events/event/identify', () => {
          return HttpResponse.json({ success: true })
        }),
        http.post('http://localhost:3000/v1/events/batch', () => {
          return HttpResponse.json({ success: true })
        }),
      )
    })

    describe('start', () => {
      it('should start session without user ID', async () => {
        let requestBody: any

        server.use(
          http.post(
            'http://localhost:3000/v1/events/event/start-session',
            async ({ request }) => {
              requestBody = await request.json()
              return HttpResponse.json({ success: true })
            },
          ),
        )

        await session.start({
          attributes: {
            platform: 'node',
            source: 'api',
          },
        })

        await session.flush()

        expect(requestBody).toMatchObject({
          type: 'start_session',
          session_id: session.sessionId,
          attributes: {
            platform: 'node',
            source: 'api',
          },
        })
      })

      it('should start session with user ID and identify user', async () => {
        let startSessionBody: any
        let identifyBody: any

        server.use(
          http.post(
            'http://localhost:3000/v1/events/event/start-session',
            async ({ request }) => {
              startSessionBody = await request.json()
              return HttpResponse.json({ success: true })
            },
          ),
          http.post(
            'http://localhost:3000/v1/events/event/identify',
            async ({ request }) => {
              identifyBody = await request.json()
              return HttpResponse.json({ success: true })
            },
          ),
        )

        await session.start({
          userId: 'user-123',
          attributes: {
            platform: 'node',
          },
        })

        expect(session.userId).toBe('user-123')

        await session.flush()

        expect(identifyBody).toMatchObject({
          type: 'identify',
          id: 'user-123',
          session_id: session.sessionId,
        })

        expect(startSessionBody).toMatchObject({
          type: 'start_session',
          session_id: session.sessionId,
          userId: 'user-123',
        })
      })

      it('should generate session ID if not provided', async () => {
        const sessionWithoutId = new Session({
          ...defaultOptions,
          sessionId: undefined,
        })

        await sessionWithoutId.start({
          attributes: { platform: 'node' },
        })

        expect(sessionWithoutId.sessionId).toMatch(/^[a-f0-9-]{36}$/)
      })
    })

    describe('end', () => {
      it('should end session', async () => {
        let requestBody: any

        server.use(
          http.post(
            'http://localhost:3000/v1/events/event/end-session',
            async ({ request }) => {
              requestBody = await request.json()
              return HttpResponse.json({ success: true })
            },
          ),
        )

        await session.end()

        await session.flush()

        expect(requestBody).toMatchObject({
          type: 'end_session',
          session_id: session.sessionId,
        })
      })
    })

    describe('track', () => {
      it('should track event with session ID', async () => {
        let requestBody: any

        server.use(
          http.post(
            'http://localhost:3000/v1/events/event/track',
            async ({ request }) => {
              requestBody = await request.json()
              return HttpResponse.json({ success: true })
            },
          ),
        )

        await session.track({
          event: 'Button Click',
          properties: {
            button: 'submit',
            page: '/checkout',
          },
        })

        await session.flush()

        expect(requestBody).toMatchObject({
          type: 'track',
          event: 'Button Click',
          session_id: session.sessionId,
          properties: {
            button: 'submit',
            page: '/checkout',
          },
        })
      })
    })

    describe('identify', () => {
      it('should identify user with session ID', async () => {
        let requestBody: any

        server.use(
          http.post(
            'http://localhost:3000/v1/events/event/identify',
            async ({ request }) => {
              requestBody = await request.json()
              return HttpResponse.json({ success: true })
            },
          ),
        )

        await session.identify({
          id: 'user-456',
          traits: {
            email: 'user@example.com',
            name: 'John Doe',
          },
        })

        await session.flush()

        expect(requestBody).toMatchObject({
          type: 'identify',
          id: 'user-456',
          session_id: session.sessionId,
          traits: {
            email: 'user@example.com',
            name: 'John Doe',
          },
        })
      })
    })

    describe('alias', () => {
      it('should alias user with session ID', async () => {
        let requestBody: any

        server.use(
          http.post(
            'http://localhost:3000/v1/events/event/alias',
            async ({ request }) => {
              requestBody = await request.json()
              return HttpResponse.json({ success: true })
            },
          ),
        )

        await session.alias({
          id: 'user-789',
          previous_id: 'anonymous-123',
        })

        await session.flush()

        expect(requestBody).toMatchObject({
          type: 'alias',
          id: 'user-789',
          previous_id: 'anonymous-123',
          session_id: session.sessionId,
        })
      })
    })
  })

  describe('conversation tracking', () => {
    let session: Session

    beforeEach(async () => {
      session = await Session.create(defaultOptions)

      server.use(
        http.post(
          'http://localhost:3000/v1/events/event/start-conversation',
          () => {
            return HttpResponse.json({ success: true })
          },
        ),
        http.post(
          'http://localhost:3000/v1/events/event/end-conversation',
          () => {
            return HttpResponse.json({ success: true })
          },
        ),
        http.post(
          'http://localhost:3000/v1/events/event/conversation-turn',
          () => {
            return HttpResponse.json({ success: true })
          },
        ),
        http.post('http://localhost:3000/v1/events/batch', () => {
          return HttpResponse.json({ success: true })
        }),
      )
    })

    describe('startConversation', () => {
      it('should start conversation with session ID', async () => {
        let requestBody: any

        server.use(
          http.post(
            'http://localhost:3000/v1/events/event/start-conversation',
            async ({ request }) => {
              requestBody = await request.json()
              return HttpResponse.json({ success: true })
            },
          ),
        )

        await session.startConversation({
          conversation_id: 'conv-123',
          attributes: {
            model: 'gpt-4',
            user_id: 'user-123',
          },
        })

        await session.flush()

        expect(requestBody).toMatchObject({
          type: 'track',
          event: 'Conversation Started',
          session_id: session.sessionId,
          conversation_id: 'conv-123',
          attributes: {
            model: 'gpt-4',
            user_id: 'user-123',
          },
        })
      })
    })

    describe('endConversation', () => {
      it('should end conversation with session ID', async () => {
        let requestBody: any

        server.use(
          http.post(
            'http://localhost:3000/v1/events/event/end-conversation',
            async ({ request }) => {
              requestBody = await request.json()
              return HttpResponse.json({ success: true })
            },
          ),
        )

        await session.endConversation({
          conversation_id: 'conv-123',
        })

        await session.flush()

        expect(requestBody).toMatchObject({
          type: 'track',
          event: 'Conversation Ended',
          session_id: session.sessionId,
          conversation_id: 'conv-123',
        })
      })
    })

    describe('trackConversationTurn', () => {
      it('should track conversation turn with session ID', async () => {
        let requestBody: any

        server.use(
          http.post(
            'http://localhost:3000/v1/events/event/conversation-turn',
            async ({ request }) => {
              requestBody = await request.json()
              return HttpResponse.json({ success: true })
            },
          ),
        )

        await session.trackConversationTurn({
          conversation_id: 'conv-123',
          turn_analysis: {
            system: {
              actions: [
                {
                  action: 'Attribute Advised',
                  slot: 'intent',
                  values: ['greeting'],
                },
              ],
            },
            user: {
              state: {
                active_intent: 'greeting',
                requested_slots: [],
                slot_values: {},
              },
              actions: [
                {
                  action: 'Attribute Accepted',
                  slot: 'intent',
                  values: ['greeting'],
                },
              ],
            },
          },
          properties: {
            assistant: 'Hello! How can I help you?',
            user: 'Hi there!',
          },
        })

        await session.flush()

        expect(requestBody).toMatchObject({
          type: 'track',
          event: 'Conversation Turn',
          session_id: session.sessionId,
          conversation_id: 'conv-123',
          turn_analysis: {
            system: {
              actions: [
                {
                  action: 'Attribute Advised',
                  slot: 'intent',
                  values: ['greeting'],
                },
              ],
            },
            user: {
              state: {
                active_intent: 'greeting',
                requested_slots: [],
                slot_values: {},
              },
              actions: [
                {
                  action: 'Attribute Accepted',
                  slot: 'intent',
                  values: ['greeting'],
                },
              ],
            },
          },
        })
      })
    })
  })

  describe('AsyncLocalStorage context', () => {
    let session: Session

    beforeEach(async () => {
      session = await Session.create(defaultOptions)

      server.use(
        http.post('http://localhost:3000/v1/events/event/track', () => {
          return HttpResponse.json({ success: true })
        }),
        http.post('http://localhost:3000/v1/events/batch', () => {
          return HttpResponse.json({ success: true })
        }),
      )
    })

    describe('withContext', () => {
      it('should provide session context within callback', async () => {
        let sessionInCallback: Session | null = null

        await session.withContext(async () => {
          sessionInCallback = useSession()

          expect(sessionInCallback.sessionId).toBe(session.sessionId)
          expect(sessionInCallback.userId).toBe(session.userId)
        })

        expect(sessionInCallback).not.toBeNull()
        expect(sessionInCallback!.sessionId).toBe(session.sessionId)
      })

      it('should maintain context across async operations', async () => {
        await session.withContext(async () => {
          // Simulate async operation
          await new Promise((resolve) => setTimeout(resolve, 10))

          const contextSession = useSession()
          expect(contextSession.sessionId).toBe(session.sessionId)

          // Another async operation
          await Promise.resolve()

          const contextSession2 = useSession()
          expect(contextSession2.sessionId).toBe(session.sessionId)
        })
      })

      it('should isolate contexts in concurrent operations', async () => {
        const session1 = new Session({
          ...defaultOptions,
          sessionId: 'session-1',
        })

        const session2 = new Session({
          ...defaultOptions,
          sessionId: 'session-2',
        })

        const results = await Promise.all([
          session1.withContext(async () => {
            await new Promise((resolve) => setTimeout(resolve, 20))
            return useSession().sessionId
          }),
          session2.withContext(async () => {
            await new Promise((resolve) => setTimeout(resolve, 10))
            return useSession().sessionId
          }),
        ])

        expect(results[0]).toBe('session-1')
        expect(results[1]).toBe('session-2')
      })

      it('should work with nested contexts', async () => {
        const outerSession = new Session({
          ...defaultOptions,
          sessionId: 'outer-session',
        })

        const innerSession = new Session({
          ...defaultOptions,
          sessionId: 'inner-session',
        })

        let outerSessionId: string | null = null
        let innerSessionId: string | null = null

        await outerSession.withContext(async () => {
          outerSessionId = useSession().sessionId

          await innerSession.withContext(async () => {
            innerSessionId = useSession().sessionId
          })

          // Should restore outer session
          expect(useSession().sessionId).toBe('outer-session')
        })

        expect(outerSessionId).toBe('outer-session')
        expect(innerSessionId).toBe('inner-session')
      })

      it('should handle errors in context callback', async () => {
        await expect(
          session.withContext(async () => {
            throw new Error('Test error')
          }),
        ).rejects.toThrow('Test error')

        // Context should be cleaned up even after error
        expect(() => useSession()).toThrow('Mindlytics Session context missing')
      })

      it('should work with Express-like middleware pattern', async () => {
        // Simulate Express middleware
        const simulateRequest = async (sessionId: string) => {
          const requestSession = new Session({
            ...defaultOptions,
            sessionId,
          })

          return requestSession.withContext(async () => {
            // Simulate controller logic
            await requestSession.track({
              event: 'Page View',
              properties: { page: '/dashboard' },
            })

            // Simulate service call
            await simulateService()

            return useSession().sessionId
          })
        }

        const simulateService = async () => {
          // Service should have access to session context
          const contextSession = useSession()
          expect(contextSession).toBeDefined()

          await contextSession.track({
            event: 'Service Call',
            properties: { service: 'user-service' },
          })
        }

        const resultSessionId = await simulateRequest('req-session')
        expect(resultSessionId).toBe('req-session')
      })
    })

    describe('useSession', () => {
      it('should throw error when used outside context', () => {
        expect(() => useSession()).toThrow('Mindlytics Session context missing')
      })

      it('should return session when used within context', async () => {
        await session.withContext(async () => {
          const contextSession = useSession()
          expect(contextSession).toBe(session)
          expect(contextSession.sessionId).toBe(session.sessionId)
        })
      })
    })

    describe('Session.use', () => {
      it('should be alias for useSession', async () => {
        await session.withContext(async () => {
          const contextSession1 = useSession()
          const contextSession2 = Session.use()

          expect(contextSession1).toBe(contextSession2)
          expect(contextSession1.sessionId).toBe(session.sessionId)
        })
      })
    })
  })

  describe('integration with tracking methods', () => {
    let session: Session

    beforeEach(async () => {
      session = await Session.create(defaultOptions)

      server.use(
        http.post('http://localhost:3000/v1/events/event/track', () => {
          return HttpResponse.json({ success: true })
        }),
        http.post('http://localhost:3000/v1/events/batch', () => {
          return HttpResponse.json({ success: true })
        }),
      )
    })

    it('should track events using session context', async () => {
      let requestBody: any

      server.use(
        http.post(
          'http://localhost:3000/v1/events/event/track',
          async ({ request }) => {
            requestBody = await request.json()
            return HttpResponse.json({ success: true })
          },
        ),
      )

      await session.withContext(async () => {
        const contextSession = useSession()

        await contextSession.track({
          event: 'Context Event',
          properties: { source: 'context' },
        })
      })

      await session.flush()

      expect(requestBody).toMatchObject({
        type: 'track',
        event: 'Context Event',
        session_id: session.sessionId,
        properties: { source: 'context' },
      })
    })
  })
})
