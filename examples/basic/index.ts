import { Session } from '@mindlytics/node-sdk'

async function main() {
  const session = await Session.create({
    projectId: 'your-project-id',
    apiKey: 'your-api-key',
  })

  await session.start({
    userId: '123',
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

  session.track({
    event: 'tool_call',
    properties: {
      tool_call_id: '123',
    },
  })
}

main().then(() => {
  console.log('Done')
})
