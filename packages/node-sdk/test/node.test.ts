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
import { Client, useSession } from '../src/index.ts'
import { Session } from '../src/session.ts'

// Mock server setup
const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Session', () => {
  const defaultOptions = {
    apiKey: 'test-api-key',
    projectId: 'test-project-id',
    baseUrl: 'http://localhost:3000',
    debug: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('constructor and creation', () => {
    it('should create session with default options', async () => {
      const client = new Client({
        apiKey: 'test-key',
        projectId: 'test-project',
      })

      expect(client).toBeInstanceOf(Client)

      const session = client.createSession({
        sessionId: 'test-session',
        userId: 'user-123',
      })
      expect(session).toBeInstanceOf(Session)
      expect(session.sessionId).toBe('test-session')
      expect(session.userId).toBe('user-123')
    })

  })

  describe('session management', () => {
    let session: Session

    beforeEach(async () => {
      const client = new Client(defaultOptions)
      session = client.createSession({
        sessionId: 'test-session',
        userId: 'user-123',
        deviceId: 'device-123',
      })
      // Mock the session endpoints
      server.use(
        http.post('http://localhost:3000/bc/v1/events/event/start-session', () => {
          return HttpResponse.json({ success: true })
        }),
        http.post('http://localhost:3000/bc/v1/events/event/end-session', () => {
          return HttpResponse.json({ success: true })
        }),
        http.post('http://localhost:3000/bc/v1/events/event/identify', () => {
          return HttpResponse.json({ success: true })
        }),
      )
    })

    describe('start', () => {
      it('should start session with device ID', async () => {
        let requestBody: any

        server.use(
          http.post(
            'http://localhost:3000/bc/v1/events/event/start-session',
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
          device_id: 'device-123',
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
            'http://localhost:3000/bc/v1/events/event/start-session',
            async ({ request }) => {
              startSessionBody = await request.json()
              return HttpResponse.json({ success: true })
            },
          ),
          http.post(
            'http://localhost:3000/bc/v1/events/event/identify',
            async ({ request }) => {
              identifyBody = await request.json()
              return HttpResponse.json({ success: true })
            },
          ),
        )

        await session.start({
          attributes: {
            platform: 'node',
          },
        })

        await session.identify({
          id: 'user-1234',
        })

        expect(session.userId).toBe('user-123')

        await session.flush()

        expect(identifyBody).toMatchObject({
          type: 'identify',
          id: 'user-1234',
          session_id: session.sessionId,
        })

        expect(startSessionBody).toMatchObject({
          type: 'start_session',
          session_id: session.sessionId,
          id: 'user-123',
        })
      })
    })
  })

  describe('event tracking', () => {
    let session: Session

    beforeEach(async () => {
        const client = new Client(defaultOptions)
        session = client.createSession({
          sessionId: 'test-session',
          deviceId: 'device-321',
        })
      server.use(
        http.post(
          'http://localhost:3000/bc/v1/events/event/start-session',
          async () => {
            return HttpResponse.json({ success: true })
          },
        ),
      )
      await session.start()
    })

    describe('end', () => {
      it('should end session', async () => {
        let requestBody: any

        server.use(
          http.post(
            'http://localhost:3000/bc/v1/events/event/end-session',
            async ({ request }) => {
              requestBody = await request.json()
              return HttpResponse.json({ success: true })
            },
          ),
        )

        const sessionId = session.sessionId

        await session.end()
        await session.flush()

        expect(requestBody).toMatchObject({
          type: 'end_session',
          session_id: sessionId,
        })
      })
    })

    describe('track', () => {
      it('should track event with session ID', async () => {
        let requestBody: any

        server.use(
          http.post(
            'http://localhost:3000/bc/v1/events/event/track',
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
            'http://localhost:3000/bc/v1/events/event/identify',
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
            'http://localhost:3000/bc/v1/events/event/alias',
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
        const client = new Client(defaultOptions)
      session = await client.createSession({
        sessionId: 'test-session',
        deviceId: 'device-321',
      })
      server.use(
        http.post(
          'http://localhost:3000/bc/v1/events/event/start-session',
          () => {
            return HttpResponse.json({ success: true })
          },
        ),
        http.post(
          'http://localhost:3000/bc/v1/events/event/start-conversation',
          () => {
            return HttpResponse.json({ success: true })
          },
        ),
        http.post(
          'http://localhost:3000/bc/v1/events/event/end-conversation',
          () => {
            return HttpResponse.json({ success: true })
          },
        ),
        http.post(
          'http://localhost:3000/bc/v1/events/event/conversation-turn',
          () => {
            return HttpResponse.json({ success: true })
          },
        ),
        http.post('http://localhost:3000/bc/v1/events/batch', () => {
          return HttpResponse.json({ success: true })
        }),
      )
      await session.start()
    })

    describe('startConversation', () => {
      it('should start conversation with session ID', async () => {
        let requestBody: any

        server.use(
          http.post(
            'http://localhost:3000/bc/v1/events/event/start-conversation',
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
  })

  describe('conversation management', () => {
    let session: Session
    beforeEach(async () => {
        const client = new Client(defaultOptions)
      session = client.createSession({
        sessionId: 'test-session',
        deviceId: 'device-321',
      })
      server.use(
        http.post(
          'http://localhost:3000/bc/v1/events/event/start-session',
          () => {
            return HttpResponse.json({ success: true })
          },
        ),
        http.post(
          'http://localhost:3000/bc/v1/events/event/start-conversation',
          () => {
            return HttpResponse.json({ success: true })
          },
        ),
        http.post(
          'http://localhost:3000/bc/v1/events/event/end-conversation',
          () => {
            return HttpResponse.json({ success: true })
          },
        ),
        http.post(
          'http://localhost:3000/bc/v1/events/event/conversation-turn',
          () => {
            return HttpResponse.json({ success: true })
          },
        ),
        http.post('http://localhost:3000/bc/v1/events/batch', () => {
          return HttpResponse.json({ success: true })
        }),
      )
      await session.start()
      await session.startConversation({
        conversation_id: 'conv-123',
      })
    })

    describe('endConversation', () => {
      it('should end conversation with session ID', async () => {
        let requestBody: any

        server.use(
          http.post(
            'http://localhost:3000/bc/v1/events/event/end-conversation',
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
            'http://localhost:3000/bc/v1/events/event/conversation-turn',
            async ({ request }) => {
              requestBody = await request.json()
              return HttpResponse.json({ success: true })
            },
          ),
        )

        await session.trackConversationTurn({
          conversation_id: 'conv-123',
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
        })
      })
    })
  })

  describe('AsyncLocalStorage context', () => {
    let client: Client
    let session: Session
    beforeEach(async () => {
      client = new Client(defaultOptions)
      session = client.createSession({
        sessionId: 'test-session',
        userId: 'user-123',
        deviceId: 'device-123',
      })

      server.use(
        http.post('http://localhost:3000/bc/v1/events/event/track', () => {
          return HttpResponse.json({ success: true })
        }),
        http.post('http://localhost:3000/bc/v1/events/batch', () => {
          return HttpResponse.json({ success: true })
        }),
      )
    })

    describe('withContext', () => {
      it('should provide session context within callback', async () => {
        let sessionInCallback: Session | null = null

        await client.withContext(async () => {
          sessionInCallback = useSession()

          expect(sessionInCallback.sessionId).toBe('test-session')
          expect(sessionInCallback.userId).toBe('user-123')
        })

        expect(sessionInCallback).not.toBeNull()
        expect(sessionInCallback!.sessionId).toBe('test-session')
      })

      it('should maintain context across async operations', async () => {
        await client.withContext(async () => {
          // Simulate async operation
          await new Promise((resolve) => setTimeout(resolve, 10))

          const contextSession = useSession()
          expect(contextSession.sessionId).toBe('test-session')

          // Another async operation
          await Promise.resolve()

          const contextSession2 = useSession()
          expect(contextSession2.sessionId).toBe('test-session')
        })
      })

      it('should isolate contexts in concurrent operations', async () => {
        const client1 = new Client({
          ...defaultOptions,
        })
        const session1 = client1.createSession({
          sessionId: 'session-1',
          userId: 'user-1',
          deviceId: 'device-1',
        })
        const client2 = new Client({
          ...defaultOptions,
        })
        const session2 = client2.createSession({
          sessionId: 'session-2',
          userId: 'user-2',
          deviceId: 'device-2',
        })

        const results = await Promise.all([
          client1.withContext(async () => {
            await new Promise((resolve) => setTimeout(resolve, 20))
            return useSession().sessionId
          }),
          client2.withContext(async () => {
            await new Promise((resolve) => setTimeout(resolve, 10))
            return useSession().sessionId
          }),
        ])

        expect(results[0]).toBe('session-1')
        expect(results[1]).toBe('session-2')
      })

      it('should work with nested contexts', async () => {
        const outerClient = new Client({
          ...defaultOptions,
        })
        const outerSession = outerClient.createSession({
          sessionId: 'outer-session',
            userId: 'outer-user',
        })

        const innerClient = new Client({
          ...defaultOptions,
        })
        const innerSession = innerClient.createSession({
          sessionId: 'inner-session',
          userId: 'inner-user',
        })

        let outerSessionId: string | undefined = undefined
        let innerSessionId: string | undefined = undefined

        await outerClient.withContext(async () => {
          outerSessionId = useSession().sessionId

          await innerClient.withContext(async () => {
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
          client.withContext(async () => {
            throw new Error('Test error')
          }),
        ).rejects.toThrow('Test error')

        // Context should be cleaned up even after error
        expect(() => useSession()).toThrow('Mindlytics Session context missing')
      })

      it('should work with Express-like middleware pattern', async () => {
        // Simulate Express middleware
        const simulateRequest = async (sessionId: string) => {
          const requestClient = new Client({
            ...defaultOptions,
          })
          const requestSession = requestClient.createSession({
            sessionId,
            userId: 'req-user',
          })

          return requestClient.withContext(async () => {
            // Simulate controller logic
            await useSession().track({
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
        await client.withContext(async () => {
          const contextSession = useSession()
          expect(contextSession).toBe(session)
          expect(contextSession.sessionId).toBe(session.sessionId)
        })
      })
    })

    describe('Session.use', () => {
      it('should be alias for useSession', async () => {
        await client.withContext(async () => {
          const contextSession1 = useSession()
          const contextSession2 = Client.use()

          expect(contextSession1).toBe(contextSession2)
          expect(contextSession1.sessionId).toBe(session.sessionId)
        })
      })
    })
  })

  describe('integration with tracking methods', () => {
    let client: Client
    let session: Session

    beforeEach(async () => {
      client = new Client({
        ...defaultOptions,
      })
      session = await client.createSession({
        sessionId: 'test-session',
        userId: 'user-123',
        deviceId: 'device-123',
      })
      server.use(
        http.post('http://localhost:3000/bc/v1/events/event/start-session', () => {
          return HttpResponse.json({ success: true })
        }),
        http.post('http://localhost:3000/bc/v1/events/event/track', () => {
          return HttpResponse.json({ success: true })
        }),
        http.post('http://localhost:3000/bc/v1/events/batch', () => {
          return HttpResponse.json({ success: true })
        }),
      )
    })

    it('should track events using session context', async () => {
      let requestBody: any

      server.use(
        http.post(
          'http://localhost:3000/bc/v1/events/event/track',
          async ({ request }) => {
            requestBody = await request.json()
            return HttpResponse.json({ success: true })
          },
        ),
      )

      await client.withContext(async () => {
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
