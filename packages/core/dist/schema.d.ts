import { paths } from './schema.gen.ts';
type EventPaths = {
    [K in keyof paths as K extends `/events/${string}` ? K : never]: paths[K];
};
export type { EventPaths };
export type EventPathKeys = keyof EventPaths;
