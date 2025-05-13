import createFetchClient, {type ClientOptions} from 'openapi-fetch';

export function createClient(options: ClientOptions) {
  return createFetchClient(options)
}

export type Client = ReturnType<typeof createClient>;