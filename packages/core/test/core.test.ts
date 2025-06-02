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
import { MindlyticsClient, type MindlyticsOptions } from '../src/index.ts'

// Mock server setup
const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('MindlyticsClient', () => {
  const defaultOptions = {
    apiKey: 'test-api-key',
    projectId: 'test-project-id',
    baseUrl: 'http://localhost:3000/v1',
    debug: false,
    queue: { enabled: true },
  } satisfies MindlyticsOptions

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with default baseUrl when not provided', () => {
      const client = new MindlyticsClient({
        apiKey: 'test-key',
        projectId: 'test-project',
      })
      expect(client).toBeInstanceOf(MindlyticsClient)
    })

    it('should use custom baseUrl when provided', () => {
      const customBaseUrl = 'https://custom.api.com/v1'
      const client = new MindlyticsClient({
        ...defaultOptions,
        baseUrl: customBaseUrl,
      })
      expect(client).toBeInstanceOf(MindlyticsClient)
    })

    it('should enable debug mode when debug is true', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      server.use(
        http.post('http://localhost:3000/v1/events/event/track', () => {
          return HttpResponse.json({ success: true })
        }),
      )

      const client = new MindlyticsClient({
        ...defaultOptions,
        debug: true,
      })

      expect(client).toBeInstanceOf(MindlyticsClient)
      consoleSpy.mockRestore()
    })

    it('should initialize queue when queue.enabled is not false', () => {
      const client = new MindlyticsClient({
        ...defaultOptions,
        queue: { enabled: true, batchSize: 10 },
      })
      expect(client).toBeInstanceOf(MindlyticsClient)
    })
  })

  describe('API methods', () => {
    let client: MindlyticsClient

    beforeEach(() => {
      client = new MindlyticsClient(defaultOptions)
    })

    describe('startSession', () => {
      it('should make a POST request to start-session endpoint', async () => {
        const mockResponse = { success: true, sessionId: 'session-123' }

        server.use(
          http.post(
            'http://localhost:3000/v1/events/event/start-session',
            async ({ request }) => {
              const body = (await request.json()) as any
              expect(body.type).toBe('start_session')
              expect(body.user_id).toBe('user-123')

              const headers = request.headers
              expect(headers.get('Authorization')).toBe('test-api-key')
              expect(headers.get('x-app-id')).toBe('test-project-id')

              return HttpResponse.json(mockResponse)
            },
          ),
        )
        await expect(
          client.startSession({
            session_id: 'session-123',
            attributes: {
              userId: 'user-123',
            },
          }),
        ).resolves.not.toThrow()

        await client.flush()
      })
    })

    describe('endSession', () => {
      it('should make a POST request to end-session endpoint', async () => {
        const mockResponse = { success: true }

        server.use(
          http.post(
            'http://localhost:3000/v1/events/event/end-session',
            async ({ request }) => {
              const body = (await request.json()) as any
              expect(body.type).toBe('end_session')
              expect(body.session_id).toBe('session-123')

              return HttpResponse.json(mockResponse)
            },
          ),
        )

        await client.endSession({
          session_id: 'session-123',
        })

        await client.flush()
      })
    })

    describe('trackEvent', () => {
      it('should make a POST request to track endpoint', async () => {
        const mockResponse = { success: true }

        server.use(
          http.post(
            'http://localhost:3000/v1/events/event/track',
            async ({ request }) => {
              const body = (await request.json()) as any
              expect(body.type).toBe('track')
              expect(body.event).toBe('Button Clicked')
              expect(body.properties).toEqual({ buttonId: 'submit' })

              expect(body.session_id).toBe('session-123')
              expect(body.conversation_id).toBe('conversation-123')

              return HttpResponse.json(mockResponse)
            },
          ),
        )

        await client.trackEvent({
          event: 'Button Clicked',
          properties: { buttonId: 'submit' },
          session_id: 'session-123',
          conversation_id: 'conversation-123',
        })

        await client.flush()
      })
    })

    describe('identify', () => {
      it('should make a POST request to identify endpoint', async () => {
        const mockResponse = { success: true }

        server.use(
          http.post(
            'http://localhost:3000/v1/events/event/identify',
            async ({ request }) => {
              const body = (await request.json()) as any
              expect(body.type).toBe('identify')
              expect(body.user_id).toBe('user-123')
              expect(body.traits).toEqual({ email: 'test@example.com' })

              return HttpResponse.json(mockResponse)
            },
          ),
        )

        await client.identify({
          id: 'user-123',
          session_id: 'session-123',
          traits: { email: 'test@example.com' },
        })

        await client.flush()
      })
    })

    describe('alias', () => {
      it('should make a POST request to alias endpoint', async () => {
        const mockResponse = { success: true }

        server.use(
          http.post(
            'http://localhost:3000/v1/events/event/alias',
            async ({ request }) => {
              const body = (await request.json()) as any
              expect(body.type).toBe('alias')
              expect(body.user_id).toBe('user-123')
              expect(body.previous_id).toBe('anonymous-456')

              return HttpResponse.json(mockResponse)
            },
          ),
        )

        await client.alias({
          id: 'user-123',
          session_id: 'session-123',
          previous_id: 'anonymous-456',
        })

        await client.flush()
      })
    })

    describe('startConversation', () => {
      it('should make a POST request to start-conversation endpoint', async () => {
        const mockResponse = { success: true }

        server.use(
          http.post(
            'http://localhost:3000/v1/events/event/start-conversation',
            async ({ request }) => {
              const body = (await request.json()) as any
              expect(body.type).toBe('track')
              expect(body.event).toBe('Conversation Started')
              expect(body.conversation_id).toBe('conv-123')
              expect(body.session_id).toBe('session-123')
              expect(body.user_id).toBe('user-123')

              return HttpResponse.json(mockResponse)
            },
          ),
        )

        await client.startConversation({
          conversation_id: 'conv-123',
          session_id: 'user-123',
          attributes: {
            user_id: 'user-123',
          },
        })

        await client.flush()
      })
    })

    describe('endConversation', () => {
      it('should make a POST request to end-conversation endpoint', async () => {
        const mockResponse = { success: true }

        server.use(
          http.post(
            'http://localhost:3000/v1/events/event/end-conversation',
            async ({ request }) => {
              const body = (await request.json()) as any
              expect(body.type).toBe('track')
              expect(body.event).toBe('Conversation Ended')
              expect(body.conversation_id).toBe('conv-123')

              return HttpResponse.json(mockResponse)
            },
          ),
        )

        await client.endConversation({
          session_id: 'session-123',
          conversation_id: 'conv-123',
        })

        await client.flush()
      })
    })

    describe('trackConversationTurn', () => {
      it('should make a POST request to conversation-turn endpoint', async () => {
        const mockResponse = { success: true }

        server.use(
          http.post(
            'http://localhost:3000/v1/events/event/conversation-turn',
            async ({ request }) => {
              const body = (await request.json()) as any
              expect(body.type).toBe('track')
              expect(body.event).toBe('Conversation Turn')
              expect(body.conversation_id).toBe('conv-123')
              expect(body.turn_analysis).toBeDefined()

              return HttpResponse.json(mockResponse)
            },
          ),
        )

        await client.trackConversationTurn({
          conversation_id: 'conv-123',
          session_id: 'session-123',
          properties: {
            assistant: 'assistant',
            user: 'user',
          },
        })

        await client.flush()
      })
    })

    describe('trackConversationUsage', () => {
      it('should make a POST request to conversation-usage endpoint', async () => {
        const mockResponse = { success: true }

        server.use(
          http.post(
            'http://localhost:3000/v1/events/event/conversation-usage',
            async ({ request }) => {
              const body = (await request.json()) as any
              expect(body.type).toBe('track')
              expect(body.event).toBe('Conversation Usage')
              expect(body.conversation_id).toBe('conv-123')
              expect(body.usage).toEqual({
                completion_tokens: 20,
                prompt_tokens: 10,
                model: 'gpt-3.5-turbo',
              })

              return HttpResponse.json(mockResponse)
            },
          ),
        )

        await client.trackConversationUsage({
          conversation_id: 'conv-123',
          session_id: 'session-123',
          properties: {
            completion_tokens: 20,
            prompt_tokens: 10,
            model: 'gpt-3.5-turbo',
          },
        })

        await client.flush()
      })
    })
  })

  describe('debug mode', () => {
    it('should log debug messages when debug is enabled', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      server.use(
        http.post('http://localhost:3000/v1/events/event/track', () => {
          return HttpResponse.json({ success: true })
        }),
      )

      const client = new MindlyticsClient({
        ...defaultOptions,
        debug: true,
      })

      await client.trackEvent({
        event: 'Test Event',
        session_id: 'session-123',
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        '[MLSDK:DEBUG:EventQueue]',
        expect.any(String),
      )

      consoleSpy.mockRestore()
    })

    it('should not log debug messages when debug is disabled', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      server.use(
        http.post('http://localhost:3000/v1/events/event/track', () => {
          return HttpResponse.json({ success: true })
        }),
      )

      const client = new MindlyticsClient({
        ...defaultOptions,
        debug: false,
      })

      await client.trackEvent({
        event: 'Test Event',
        session_id: 'session-123',
      })

      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('[MLSDK:DEBUG:EventQueue]'),
        expect.anything(),
      )

      consoleSpy.mockRestore()
    })
  })

  describe('headers', () => {
    it('should include correct authorization and app-id headers', async () => {
      const client = new MindlyticsClient(defaultOptions)

      server.use(
        http.post(
          'http://localhost:3000/v1/events/event/track',
          ({ request }) => {
            expect(request.headers.get('Authorization')).toBe('test-api-key')
            expect(request.headers.get('x-app-id')).toBe('test-project-id')
            return HttpResponse.json({ success: true })
          },
        ),
      )

      await client.trackEvent({
        event: 'Test Event',
        session_id: 'session-123',
      })
    })
  })
})
