# Mindlytics Node SDK

## Installation

```bash
npm install @mindlytics/node-sdk
```

## Usage

```ts
import { Session } from '@mindlytics/node-sdk'

const session = Session.create({
  projectId: 'your-project-id',
  apiKey: 'your-api-key',
  deviceId: 'your-device-id',
})

const sessionId = session.start({
  userId: '123',
})

session.track({
  event: 'File Uploaded',
})
```

### Continue an existing session

In case a session exists over multiple requests you can pass an existing session id, without calling `session.start`.

```ts
import { Session } from '@mindlytics/node-sdk'

const session = Session.create({
  projectId: 'your-project-id',
  apiKey: 'your-api-key',
  deviceId: 'your-device-id',
  sessionId: 'session-id',
})

session.track({
  event: 'File Uploaded',
})
```

### Ending a session

To end a session call `session.end()`, this will end any active conversation and flush any pending requests in the internal queue.

## Context

The SDK provides a context system using `AsyncLocalStorage` that allows you to access the session throughout your application code. This is particularly useful for tracking LLM interactions and tool calls.

```ts
import { openai } from '@ai-sdk/openai'
import { serve } from '@hono/node-server'
import { streamText, createTool } from 'ai'
import { z } from 'zod'
import { Hono } from 'hono'
import { stream } from 'hono/streaming'
import { Session, useSession } from '@mindlytics/node-sdk'
import { authMiddleware } from './auth.middleware.ts'

const app = new Hono()

app.use(authMiddleware)

app.post('/chat', async (c) => {
  const session = Session.create({
    projectId: 'your-project-id',
    apiKey: 'your-api-key',
    userId: c.get('userId'),
  })

  await session.start()

  return session.withContext(async () => {
    const result = streamText({
      model: openai('gpt-4o'),
      prompt: 'How is the weather in Tokyo?',
      tools: [weatherTool],
    })

    return stream(c, (stream) => stream.pipe(result.toDataStream()))
  })
})

const weatherTool = createTool({
  name: 'weather',
  description: 'A tool that returns the weather for a given city',
  parameters: z.object({
    city: z.string(),
  }),
  execute: async ({ city }) => {
    const session = useSession()

    session.trackEvent({
      name: 'CheckWeather',
      params: { city },
    })

    return `The weather in ${city} is sunny`
  },
})
```

## Serverless

On serverless platforms like Vercel or Cloudflare, you can use the `session.end()` or `session.flush()` method to ensure all events are sent to the Mindlytics platform before the function execution ends.

```ts
import { waitUntil } from '@vercel/functions'

waitUntil(session.end()) // End the entire session.

// or

waitUntil(session.flush()) // Only flush the pending events and continue the session in another request.
```

## Examples

### Jupyter Notebook Examples

If you haven't already, you must

```sh
yarn
yarn build
```

To run the Jupyter notebook examples, you need to have Jupyter Labs installed natively on your computer.  One way of doing this is

```sh
pip install notebook
```

And you need to install the typescript kernel

```sh
npx tslab install
```

Most of the Jupyter notebook examples expect to find your Mindlytics apikey and project id in environment variables.  You can create a `.env` file at the top of the repo here that looks like

```sh
API_KEY=xxxxx
PROJECT_ID=yyyy
```

with the values from your account of course!

Then you can:

```sh
cd examples/jupyter
eval `cat ../../.env` jupyter lab
```

That should open a new tab in your browser and take you to the lab console.  In the left panel, double click on "notebooks" and then open one of the examples.
