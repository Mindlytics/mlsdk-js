import crypto from 'node:crypto'
import { Client } from '@mindlytics/node-sdk'

async function main() {
  const client = new Client({
    projectId: process.env.PROJECT_ID!,
    apiKey: process.env.API_KEY!,
    ...(process.env.BASE_URL && { baseUrl: process.env.BASE_URL }),
    debug: false,
  })
  const session = client.createSession({
    sessionId: crypto.randomUUID(),
    conversationId: crypto.randomUUID(),
    userId: '123',
  })

  await client.withContext(async () => {
    await toolCall()
  })
}

async function toolCall() {
  const session = Client.use()

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

  const errors = await session.flush()
  if (errors.length > 0) {
    console.error('Errors occurred during flush:', errors)
  }
}

main().then(() => {
  console.log('Done')
})
