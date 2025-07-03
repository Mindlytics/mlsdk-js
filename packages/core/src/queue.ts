import { Client } from './fetch.ts'
import type { EventPaths } from './schema.ts'
import { Queue } from 'async-await-queue'

export interface QueueOptions {
  /**
   * Interval in milliseconds between sending batches
   * @default 1000
   */
  baseDelayMS?: number

  /**
   * Maximum number of retries for failed requests
   * @default 3
   */
  maxRetries?: number

  /**
   * Whether to enable debug logging
   * @default false
   */
  debug?: boolean
}

export interface QueueItem {
  /**
   * The idempotency key
   */
  idempotencyKey?: string

  /**
   * Timestamp of the event
   * @default Date.now()
   */
  timestamp?: number

  /**
   * The API method path
   */
  path: keyof EventPaths

  /**
   * The request body
   */
  body?: any

  /**
   * Additional request parameters
   */
  params?: any

  /**
   * Number of retry attempts made
   */
  retries?: number
}

export type EventQueueError = {
  item: QueueItem
  error: Error
  code: number
}

export class EventQueue {
  private queue = new Queue(1, 100) // Limit concurrency to 1 to ensure sequential processing
  private options: Required<QueueOptions>
  private errors: EventQueueError[] = []

  constructor(private client: Client, options: QueueOptions = {}) {
    this.options = {
      baseDelayMS: options.baseDelayMS ?? 1000,
      maxRetries: options.maxRetries ?? 3,
      debug: options.debug ?? false,
    }
  }

  /**
   * Add an item to the queue
   */
  public async enqueue(item: QueueItem): Promise<void> {
    const me = Symbol()
    await this.queue.wait(me, -1)
    try {
      await this.processItem(item)
    } finally {
      this.queue.end(me)
    }
  }

  /**
   * Process and send all items in the queue
   */
  public async flush(): Promise<EventQueueError[]> {
    await this.queue.flush()
    return this.errors
  }

  /**
   * Process a single item in the queue
   */
  private async processItem(item: QueueItem): Promise<void> {
    this.debug(`Processing request to ${item.path}`, item.body, item.params)
    let attempt = 1
    const baseDelayMs = this.options.baseDelayMS
    const retryableCodes = [408, 429, 502, 503, 504] // Common retryable HTTP status codes
    const execute = async (): Promise<void> => {
      try {
        const { data, error, response } = await this.client.POST(item.path, {
          body: item.body,
          params: item.params,
        })
        if (!error) {
          return
        }
        const res = response as Response
        const code = res.status
        if (attempt >= this.options.maxRetries) {
          this.debug(
            `Max retries reached for request to ${item.path}. Dropping request.`,
          )
          this.errors.push({
            item,
            error: new Error(
              `Max retries reached for request to ${item.path}: ${code} ${res.statusText}`,
            ),
            code,
          })
          return
        }
        if (!retryableCodes.includes(code)) {
          this.debug(
            `Non-retryable error processing request to ${item.path}: ${code} ${res.statusText}`,
          )
          this.errors.push({
            item,
            error: new Error(
              `Non-retryable error processing request to ${item.path}: ${code} ${res.statusText}`,
            ),
            code,
          })
          return
        }
        const message = res.statusText || 'Unknown error'
        const retryAfter =
          res.headers.get('Retry-After') ||
          res.headers.get('retry-after') ||
          null
        const delayMS =
          retryAfter !== null
            ? parseInt(retryAfter, 10) * 1000
            : baseDelayMs * 2 ** attempt
        this.debug(
          `Retryprocessing request to ${item.path}: ${code} ${message}. Retrying in ${delayMS}ms (attempt ${attempt}/${this.options.maxRetries})`,
        )
        await new Promise((resolve) => setTimeout(resolve, delayMS))
        attempt++
        return execute()
      } catch (err) {
        this.debug(`Error thrown processing request to ${item.path}: ${err}`)
        this.errors.push({
          item,
          error: new Error(
            `Error thrown processing request to ${item.path}: ${err}`,
          ),
          code: 500, // Generic error code
        })
      }
    }
    return execute()
  }

  /**
   * Debug logging
   */
  private debug(...messages: any[]) {
    if (this.options.debug) {
      console.log('[MLSDK:DEBUG:EventQueue]', ...messages)
    }
  }
}
