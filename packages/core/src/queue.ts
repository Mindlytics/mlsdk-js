import { Client } from './fetch.ts'
import type { paths } from './schema.ts'

export interface QueueOptions {
  /**
   * Maximum number of events to send in a single batch
   * @default 10
   */
  batchSize?: number

  /**
   * Interval in milliseconds between sending batches
   * @default 1000
   */
  flushInterval?: number

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
  path: keyof paths

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

export class EventQueue {
  private queue: QueueItem[] = []
  private timer: NodeJS.Timeout | null = null
  private isFlushing = false
  private options: Required<QueueOptions>

  constructor(private client: Client, options: QueueOptions = {}) {
    this.options = {
      batchSize: options.batchSize ?? 10,
      flushInterval: options.flushInterval ?? 1000,
      maxRetries: options.maxRetries ?? 3,
      debug: options.debug ?? false,
    }

    this.startTimer()
  }

  /**
   * Add an item to the queue
   */
  public enqueue(item: QueueItem): void {
    this.queue.push({
      ...item,
      retries: 0,
      timestamp: item.timestamp ?? Date.now(),
    })

    this.debug(`Item added to queue. Queue size: ${this.queue.length}`)

    // If we've reached the batch size, flush immediately
    if (this.queue.length >= this.options.batchSize) {
      this.debug(
        `Queue reached batch size (${this.options.batchSize}). Flushing...`,
      )
      this.flush()
    }
  }

  /**
   * Start the timer to periodically flush the queue
   */
  private startTimer(): void {
    if (this.timer) {
      clearInterval(this.timer)
    }

    this.timer = setInterval(() => {
      if (this.queue.length > 0) {
        this.debug(`Timer triggered. Flushing queue...`)
        this.flush()
      }
    }, this.options.flushInterval)

    // Ensure the timer doesn't prevent the process from exiting
    if (this.timer.unref) {
      this.timer.unref()
    }
  }

  /**
   * Process and send all items in the queue
   */
  public async flush(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) {
      return
    }

    this.isFlushing = true

    try {
      // Take items up to the batch size
      const batch = this.queue.splice(0, this.options.batchSize)
      this.debug(`Processing batch of ${batch.length} items`)

      // Process each item in the batch
      const promises = batch.map((item) => this.processItem(item))

      // Wait for all requests to complete
      await Promise.all(promises)
    } catch (error) {
      this.debug(`Error during flush: ${error}`)
    } finally {
      this.isFlushing = false

      // If there are still items in the queue, flush again
      if (this.queue.length > 0) {
        this.debug(
          `Queue still has ${this.queue.length} items. Continuing flush...`,
        )
        this.flush()
      }
    }
  }

  /**
   * Process a single queue item
   */
  private async processItem(item: QueueItem): Promise<void> {
    try {
      this.debug(`Processing request to ${item.path}`)

      // Make the API request
      await this.client.POST(item.path, {
        body: item.body,
        params: item.params,
      })

      this.debug(`Successfully processed request to ${item.path}`)
    } catch (error) {
      this.debug(`Error processing request to ${item.path}: ${error}`)

      // Retry logic
      const retries = item.retries || 0
      if (retries < this.options.maxRetries) {
        this.debug(
          `Retrying request to ${item.path} (attempt ${retries + 1}/${
            this.options.maxRetries
          })`,
        )

        // Add back to the queue with incremented retry count
        this.queue.push({
          ...item,
          retries: retries + 1,
        })
      } else {
        this.debug(
          `Max retries reached for request to ${item.path}. Dropping request.`,
        )
      }
    }
  }

  /**
   * Stop the queue timer
   */
  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
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
