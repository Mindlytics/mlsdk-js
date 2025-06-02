import { paths } from './schema.gen.ts'

// Utility type to extract keys that start with "/events/"
type EventPaths = {
  [K in keyof paths as K extends `/events/${string}` ? K : never]: paths[K]
}

// Type-only export for the EventPaths type
export type { EventPaths }

// Helper type to get just the path keys
export type EventPathKeys = keyof EventPaths
