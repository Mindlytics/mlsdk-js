import { Session } from '@mindlytics/node-sdk'
import type { MLEventHandler, MLErrorHandler, MLEvent } from '@mindlytics/core'

// Look for the 'Session Ended' event
let SessionEnded = false

// used to wait for the session to end
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
  const session = await Session.create({
    projectId: process.env.PROJECT_ID!,
    apiKey: process.env.API_KEY!,
    ...(process.env.BASE_URL && { baseUrl: process.env.BASE_URL }),
    debug: false,
  })

  // To listen for websocket events from the Mindlytics service, you will define handlers
  // and call `startListening` on the session client.
  const onEvent: MLEventHandler = {
    callback: async (event: MLEvent, data: any) => {
      console.log('WebSocket event:', event, data)
      if (event.event === 'Session Ended') {
        SessionEnded = true
      }
    },
    data: {
      customData: 'example',
    },
  }
  const onError: MLErrorHandler = {
    callback: async (error: Error, data: any) => {
      console.error('WebSocket error:', error, data)
    },
  }
  // This triggers the websocket behavior of the SDK
  await session.client.startListening(onEvent, onError)

  const sessionId = await session.start({
    userId: '123',
  })

  console.log('Session ID:', sessionId)

  await session.withContext(async () => {
    await toolCall()
  })
}

async function toolCall() {
  const session = Session.use()

  const sessionId = session.sessionId

  const userId = session.userId

  console.log(sessionId, userId)

  await session.track({
    event: 'tool_call',
    properties: {
      tool_call_id: '123',
    },
  })

  await session.end()

  await session.flush()
}

await main()

// wait for the final 'Session Ended' event
while (!SessionEnded) {
  await delay(1000)
}
process.exit(0)
