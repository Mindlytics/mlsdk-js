import { Session } from '@mindlytics/node-sdk'

async function main() {
  console.log({
    projectId: process.env.PROJECT_ID,
    apiKey: process.env.API_KEY,
  })

  const session = await Session.create({
    projectId: process.env.PROJECT_ID!,
    apiKey: process.env.API_KEY!,
    debug: true,
  })

  await session.start({
    user_id: '123',
  })

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

main().then(() => {
  console.log('Done')
})
