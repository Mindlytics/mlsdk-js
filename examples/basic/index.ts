import { Session } from '@mindlytics/node-sdk'

async function main() {
  const session = await Session.create({
    projectId: process.env.PROJECT_ID!,
    apiKey: process.env.API_KEY!,
    ...(process.env.BASE_URL && { baseUrl: process.env.BASE_URL }),
    debug: false,
  })

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

  const errors = await session.flush()
  if (errors.length > 0) {
    console.error('Errors occurred during flush:', errors)
  }
}

main().then(() => {
  console.log('Done')
})
