import { Client } from './fetch.ts';
import type { EventPaths } from './schema.ts';
export interface QueueOptions {
    /**
     * Interval in milliseconds between sending batches
     * @default 1000
     */
    baseDelayMS?: number;
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
export type EventQueueError = {
    item: QueueItem;
    error: Error;
    code: number;
};
export declare class EventQueue {
    private client;
    private queue;
    private options;
    private errors;
    constructor(client: Client, options?: QueueOptions);
    /**
     * Add an item to the queue
     */
    enqueue(item: QueueItem): Promise<void>;
    /**
     * Process and send all items in the queue
     */
    flush(): Promise<EventQueueError[]>;
    /**
     * Process a single item in the queue
     */
    private processItem;
    /**
     * Debug logging
     */
    private debug;
}
