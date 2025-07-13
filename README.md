# Mindlytics Node SDK

This is the [Mindlytics](https://mindlytics.ai) client-side SDK for Javascript clients. It is used to authenticate and send telemetry events to the Mindlytics analytics backend server.

This SDK uses an async queue to decouple your existing client code from the communication overhead of sending data to Mindlytics. When you send events with this SDK you are simply pushing data into a queue. In the background, the SDK will pop the queue and handle the actual communication with Mindlytics, handling errors, timeouts, rate limits, etc with zero impact to your main application.

## Installation

```bash
npm install @mindlytics/node-sdk
```

## Simple Usage

```ts
import { Client } from '@mindlytics/node-sdk'

const client = new Client({
  projectId: 'your-project-id',
  apiKey: 'your-api-key',
  deviceId: 'your-device-id',
})

const session = client.createSession({
  sessionId: crypto.randomUUID(), // or an existing session id
  userId: '123',
})

await session.track({
  event: 'File Uploaded',
})

await session.end()
const errors = await session.flush()
```

## Context

The SDK provides a context system using `AsyncLocalStorage` that allows you to access the session throughout your application code. This is particularly useful for tracking LLM interactions and tool calls.

```ts
import { openai } from '@ai-sdk/openai'
import { serve } from '@hono/node-server'
import { streamText, createTool } from 'ai'
import { z } from 'zod'
import { Hono } from 'hono'
import { stream } from 'hono/streaming'
import { Client, useSession } from '@mindlytics/node-sdk'
import { authMiddleware } from './auth.middleware.ts'

const app = new Hono()

app.use(authMiddleware)

app.post('/chat', async (c) => {
  const client = new Client({
    projectId: 'your-project-id',
    apiKey: 'your-api-key',
    userId: c.get('userId'),
  })
  const session = client.createSession({
    sessionId: req.headers['x-session-id']
    conversationId: req.headers['x-conversation-id']
    userId = req.user.id
  })

  return client.withContext(async () => {
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

    const start = new Date()
    const result = await getTheWeatherFor(city)

    await session.trackConversationFunction({
      properties: {
        name: 'CheckWeather',
        args: JSON.stringify([city]),
        result,
        runtime: new Date() - start,
      }
    })

    return result
  },
})
```

## Serverless

On serverless platforms like Vercel or Cloudflare, you can use the `session.flush()` method to ensure all events are sent to the Mindlytics platform before the function execution ends.

## Receiving Events and Errors from Mindlytics

While your application code is decoupled from the Mindlytics service in terms of sending events, it is possible to receive the events you send as well as the analytics events that Mindlytics generates over a web socket connection. You can do this by registering callback handlers when you create a new session.

```js
import {MLEvent} from '@mindlytics/core'

session.startListening(
    onError: {
        callback: (error: Error, data: any) => {...},
        data: yourData
    },
    onEvent: {
        callback: (event: MLEvent, data: any) => {...},
        data: yourData
    }
)
```

Any `yourData` that you supply will be sent to your handlers as a second argument.  You can use this to gain access to contextual information if needed.  

## Concepts

Except for client-level user identify and alias, all other communication with Mindlytics is contained within a "session".  In a session you may send your own "user defined" events; that is, events that are not specific to Mindlytics but are meaningful to you.  In a session you may also send special Mindlytics events related to conversations.  Events happen at a point in time, but sessions and conversations they belong to have a start and an end and thus a specific duration.

While you can explicitly start and end sessions and conversations, some of this work can be done implicitly.  This is particularly useful if you are using the SDK in a stateless, serverless context and handling an ongoing conversation.

### User ID and Device ID

User IDs are something you can decide to use or not use.  If you decide to use them, user ids should be unique for a organization/project pair.  You can use anything you like as long as it is a string, and is unique for each user in a project.  Device IDs should represent unique devices, like a browser instance or a mobile device uuid.  Device IDs are considered globally unique.  If you do not use user ids, then you must use device ids.  You can use both.

For example, when a session begins you may not know the id of the user who starts it.  If this is the case, you must supply a "device_id" that is globally unique and represents the device the user is communicating on.  This might be a mobile device uuid.  This is harder on a browser, but you might use a uuid stored in a local cookie.  Sometime during the session/conversation you might discover who the user is and then you can issue a "session_user_identify" event with the user id, who will then be associated with the device_id and the session.

## Client API

```ts
import { Client } from '@mindlytics/node-sdk'
const client = new Client({})
```

Create a client instance.  An api key and a project id are required.  If not specified then the environment variables `MLSDK_API_KEY` and `MLSDK_PROJECT_ID` are checked.  You can obtain these values from your account on the Mindlytics SaaS portal.  The full set of options for the `Client` constructor are:

```ts
{
  apiKey?: string
  projectId?: string
  baseUrl?: string
  debug?: boolean
  queue?: QueueOptions
}
```

The `baseUrl` points to the Mindlytics production server address.  This can be changed by specifying `baseUrl` or by setting the environment variable `MLSDK_SERVER_BASE`.

**Returns:**

An instance of the Mindlytics client object.  This is used primarily to create sessions, but has two other methods for identifying users and managing aliasing outside of normal sessions.

```ts
const user = await client.identifyUser({
  id: 'customer-123',
  traits: {
    email: 'c123@mail.com',
  }
})
```

Used to identify a new user.  If called on an existing id, will merge the traits.  Traits are optional.  A trait can be a string, a number or a boolean.  More complex data types are not supported.  You may also supply a `deviceId` if you know it.  If the device id has been used to create sessions (see below) then all sessions and associated events with this device id now belong to this user.

**Returns:**

A Mindlytics user object.

```ts
const user = await client.aliasUser({
  id: 'c123@mail.com',
  previous_id: 'customer-123'
})
```

Used to change the id of a user.  Both `id` and all previous ids become aliases for this user and can be used to refer to this user in the future.

**Returns:**

A Mindlytics user object.

```ts
const session = client.createSession({
  sessionId: crypto.randomUUID(),
  userId: 'c123@mail.com'
})
```

**Returns:**

A new `Session` object.  The `sessionId` is required and can be a new session id or an existing session id.  Session ids should be globally unique with respect to your api key and project id.  You need a session to send events.  To create a session you must supply either a `userId` or a `deviceId`.  If you do not know the user id at the time a session is started, then you must at least supply a device id which should represent the unique device (eg. mobile phone, browser, etc) the user is coming from.  You may also supply a `conversationId` which will be attached to events sent using this session instance.  This is optional, since you can attach it to individual events.

## Session API

```ts
await session.start({
  attributes: {
    origin: "shopping cart"
  }
})
```

Start the session.  You do not need to call this directly, as all other event-related methods will auto-create a session if they need to, but you can call it if you'd like.  The `attributes` is optional and if specified, the user-defined attributes are associated with the session.

```ts
await session.end({
  attributes: {
    origin: "shopping cart"
  }
})
```

End the session.  You must call this method to end a session.  This gives the Mindlytics service the opportunity to perform session-wide analysis.  This method will also automatically end any associated conversations.  The optional attributes if specified will be merged into any existing session attributes.

```ts
await session.flush()
```

This method will return only after all queued messages are sent to the Mindlytics service.  

```ts
await session.identify({
  id: 'customer-123',
  traits: {
    email: 'c123@mail.com',
  }
})
```

Used to identify a user within a session.  Immediately binds this user to the current session.  

```ts
await session.alias({
  id: 'c123@mail.com',
  previous_id: 'customer-123'
})
```

Create a new primary id for a user, turning the previous id into an alias.

```ts
await session.track({
    event: 'MyCustomEventName',
    properties: {
        stringProp: "a string",
        numProp: 123,
        boolProp: true,
    }
})
```

Track a custom event.  `properties` are optional.  Supported property types are string, number and boolean.  Complex data types are not supported.

```ts
await session.startConversation({
  conversation_id: 'conv-id-1',
  attributes: {
    startingPoint: 'support'
  }
})
```

Start a new conversation.  You do not need to call this directly, as all other conversation-event-related methods will auto-create a conversation if they need to, but you can call it if you like.  The `attributes` is optional and if specified, the user-defined attributes are associated with the conversation.
  
```ts
await session.endConversation({
  conversation_id: 'conv-id-1',
  attributes: {
    startingPoint: 'support'
  }
})
```

End a conversation.  You do not need to call this directly, as an `session.end()` will automatically close any open conversations, but you can call it if you like.  The `attributes` is optional and if specified, the user-defined attributes are merged with any existing conversation attributes.

> A note on conversation ids.  When you call `client.createSession()` you can pass an optional `conversationId` and if you do, this value will be automatically applied as the "conversation_id" to all methods that accept a "conversation_id".  If you do not supply a `conversationId` to `client.createSession()` then you must supply it to the events that are related to conversations.  Supplying to individual events could allow you to support multiple conversations within a single session.  

```ts
await session.trackConversationTurn({
  conversation_id: 'conv-id-1',
  properties: {
    user: 'Why is the sky blue?',
    assistant: 'You know, I get asked this a lot!'
  }
})
```

This sends a conversation turn to the Mindlytics service for analysis.  There are some additional, optional properties you can add to this:

```ts
await session.trackConversationTurn({
  properties: {
    user: 'Why is the sky blue?',
    assistant: 'You know, I get asked this a lot!',
    assistant_id: 'agent-123',
    model: 'gpt-4o-mini', prompt_tokens: 6, completion_tokens: 15,
    cost: 0.0000351,
    my_own_custom_prop: 'custom',
  }
})
```

`assistant_id` might be useful in a multi-agent system to keep track agent participation.  `model`/`prompt_tokens`/`completion_tokens` if specified will cause the Mindlytics service to calculate the cost of this turn, and accumulate the total cost of a conversation.  It uses an online database of popular models to retrieve the most current cost data.  Alternatively you can specify `cost` directly if you know it or the model you are using is not a common LLM.  And you can add your own custom properties.

```ts
await session.trackConversationUsage({
  properties: {
    model: 'gpt-4o-mini', prompt_tokens: 6, completion_tokens: 15,
    cost: 0.0000351,
  }
})
```

You can track costs independently of individual turns.  

```ts
await session.trackConversationFunction({
  properties: {
    name: 'getWeather',
    args: '["New York, New York"]',
    result: "Probably either really cold or really hot.",
    runtime: 340,
  }
})
```

Track a tool call.  
