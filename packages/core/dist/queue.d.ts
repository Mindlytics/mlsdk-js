import { Client } from './fetch.ts';
import type { EventPaths } from './schema.ts';
export interface QueueOptions {
    /**
     * Maximum number of events to send in a single batch
     * @default 10
     */
    batchSize?: number;
    /**
     * Interval in milliseconds between sending batches
     * @default 1000
     */
    flushInterval?: number;
    /**
     * Maximum number of retries for failed requests
     * @default 3
     */
    maxRetries?: number;
    /**
     * Whether to enable debug logging
     * @default false
     */
    debug?: boolean;
}
export interface QueueItem {
    /**
     * The idempotency key
     */
    idempotencyKey?: string;
    /**
     * Timestamp of the event
     * @default Date.now()
     */
    timestamp?: number;
    /**
     * The API method path
     */
    path: keyof EventPaths;
    /**
     * The request body
     */
    body?: any;
    /**
     * Additional request parameters
     */
    params?: any;
    /**
     * Number of retry attempts made
     */
    retries?: number;
}
export declare class EventQueue {
    private client;
    private queue;
    private timer;
    private isFlushing;
    private options;
    constructor(client: Client, options?: QueueOptions);
    /**
     * Add an item to the queue
     */
    enqueue(item: QueueItem): void;
    /**
     * Start the timer to periodically flush the queue
     */
    private startTimer;
    /**
     * Process and send all items in the queue
     */
    flush(): Promise<void>;
    /**
     * Process a single queue item
     */
    private processItem;
    /**
     * Stop the queue timer
     */
    stop(): void;
    /**
     * Debug logging
     */
    private debug;
}
