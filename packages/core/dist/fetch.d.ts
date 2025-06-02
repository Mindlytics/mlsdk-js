import { type ClientOptions } from 'openapi-fetch';
import type { paths } from './schema.gen.ts';
export declare function createClient(options: ClientOptions): import("openapi-fetch").Client<paths, `${string}/${string}`>;
export type Client = ReturnType<typeof createClient>;
