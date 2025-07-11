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
import { Core, type CoreOptions } from '../src/index.ts'

// Mock server setup
const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('MindlyticsClient', () => {
  const defaultOptions = {
    apiKey: 'test-api-key',
    projectId: 'test-project-id',
    baseUrl: 'http://localhost:3000',
    debug: false,
  } satisfies CoreOptions

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Errors', () => {
    let client: Core

    beforeEach(() => {
      client = new Core(defaultOptions)
    })

    it('429', async () => {
      let callCounter = 0
      let tmr = null as NodeJS.Timeout | null
      server.use(
        http.post(
          'http://localhost:3000/bc/v1/events/event/start-session',
          async () => {
            if (callCounter === 0) {
              tmr = setTimeout(() => {
                tmr = null
              }, 5 * 1000)
              callCounter += 1
              return new HttpResponse('Too Many Requests', {
                status: 429,
                headers: { 'Retry-After': '5' },
              })
            } else {
              //expect(tmr).toBeNull()
              if (tmr) {
                throw new Error('Retry timer should not be active')
              }
              callCounter += 1
              return HttpResponse.json({ success: true })
            }
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

      const errors = await client.flush()
      expect(errors).toHaveLength(0)
      expect(callCounter).toBe(2)
    })

    it('502', async () => {
        let callCounter = 0
        server.use(
            http.post(
            'http://localhost:3000/bc/v1/events/event/start-session',
            async () => {
                callCounter += 1
                return new HttpResponse('Bad Gateway', { status: 502 })
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
    
        const errors = await client.flush()
        //console.log('Errors:', errors)
        //console.log('Call Counter:', callCounter)
        expect(errors).toHaveLength(1)
        expect(errors[0].error.message).toContain('Bad Gateway')
        expect(errors[0].code).toBe(502)
        expect(callCounter).toBe(3)
    })

    it('500', async () => {
        let callCounter = 0
        server.use(
            http.post(
            'http://localhost:3000/bc/v1/events/event/start-session',
            async () => {
                callCounter += 1
                return new HttpResponse('Internal Server Error', { status: 500 })
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
    
        const errors = await client.flush()
        expect(errors).toHaveLength(1)
        expect(errors[0].error.message).toContain('Internal Server Error')
        expect(errors[0].code).toBe(500)
        expect(callCounter).toBe(1)
    })
  })
})
