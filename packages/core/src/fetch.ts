import createFetchClient, {type ClientOptions} from 'openapi-fetch';
import type { paths } from './schema.ts';

export function createClient(options: ClientOptions) {
  return createFetchClient<paths>(options)
}

export type Client = ReturnType<typeof createClient>;