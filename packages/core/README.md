# @mindlytics/core

The core package for the Mindlytics TypeScript SDK.

## Installation

```bash
npm install @mindlytics/core
```

## Usage

```ts
import { MindlyticsClient } from '@mindlytics/core';

const client = new MindlyticsClient({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
});

const { data, error } = await client.startSession({
  session_id: 'your-session-id',
});

const { data, error } = await client.endSession({
  session_id: 'your-session-id',
});

const { data, error } = await client.trackEvent({
  session_id: 'your-session-id',
  event: 'your-event',
  properties: {
    user: 'your-user',
  },
});
```

## Context Manager

```ts
import { MindlyticsClient } from '@mindlytics/core';

const client = new MindlyticsClient({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
});

const session = await client.startSession({
  session_id: 'your-session-id',
});

await session.end();
```

