# Mindlytics Node SDK

## Installation

```bash
npm install @mindlytics/node-sdk
```

## Usage

```ts
import { Session } from '@mindlytics/node-sdk'

const session = Session.create({ projectId: 'your-project-id', apiKey: 'your-api-key' })

session.start({
  user_id: '123',
})
```

## Context

The SDK provides a context system using `AsyncLocalStorage` that allows you to access the session throughout your application code. This is particularly useful for tracking LLM interactions and tool calls.

```ts
import { openai } from '@ai-sdk/openai';
import { serve } from '@hono/node-server';
import { streamText, createTool } from 'ai';
import { z } from 'zod';
import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { Session, useSession } from '@mindlytics/node-sdk';

const app = new Hono()

app.post('/chat', async (c) => {
  const session = Session.create({ projectId: 'your-project-id', apiKey: 'your-api-key', userId: c.get('userId') })

  session.start()

  return session.withContext(async () => {
    const result = streamText({
      model: openai('gpt-4o'),
      prompt: 'How is the weather in Tokyo?',
      tools: [weatherTool],
    });

    return stream(c, stream => stream.pipe(result.toDataStream()))
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






