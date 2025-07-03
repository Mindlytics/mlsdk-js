import { Queue } from 'async-await-queue';
export class EventQueue {
    client;
    queue = new Queue(1, 100); // Limit concurrency to 1 to ensure sequential processing
    options;
    errors = [];
    constructor(client, options = {}) {
        this.client = client;
        this.options = {
            baseDelayMS: options.baseDelayMS ?? 1000,
            maxRetries: options.maxRetries ?? 3,
            debug: options.debug ?? false,
        };
    }
    /**
     * Add an item to the queue
     */
    async enqueue(item) {
        const me = Symbol();
        await this.queue.wait(me, -1);
        try {
            await this.processItem(item);
        }
        finally {
            this.queue.end(me);
        }
    }
    /**
     * Process and send all items in the queue
     */
    async flush() {
        await this.queue.flush();
        return this.errors;
    }
    /**
     * Process a single item in the queue
     */
    async processItem(item) {
        this.debug(`Processing request to ${item.path}`, item.body, item.params);
        let attempt = 1;
        const baseDelayMs = this.options.baseDelayMS;
        const retryableCodes = [408, 429, 502, 503, 504]; // Common retryable HTTP status codes
        const execute = async () => {
            try {
                const { data, error, response } = await this.client.POST(item.path, {
                    body: item.body,
                    params: item.params,
                });
                if (!error) {
                    return;
                }
                const res = response;
                const code = res.status;
                if (attempt >= this.options.maxRetries) {
                    this.debug(`Max retries reached for request to ${item.path}. Dropping request.`);
                    this.errors.push({
                        item,
                        error: new Error(`Max retries reached for request to ${item.path}: ${code} ${res.statusText}`),
                        code,
                    });
                    return;
                }
                if (!retryableCodes.includes(code)) {
                    this.debug(`Non-retryable error processing request to ${item.path}: ${code} ${res.statusText}`);
                    this.errors.push({
                        item,
                        error: new Error(`Non-retryable error processing request to ${item.path}: ${code} ${res.statusText}`),
                        code,
                    });
                    return;
                }
                const message = res.statusText || 'Unknown error';
                const retryAfter = res.headers.get('Retry-After') ||
                    res.headers.get('retry-after') ||
                    null;
                const delayMS = retryAfter !== null
                    ? parseInt(retryAfter, 10) * 1000
                    : baseDelayMs * 2 ** attempt;
                this.debug(`Retryprocessing request to ${item.path}: ${code} ${message}. Retrying in ${delayMS}ms (attempt ${attempt}/${this.options.maxRetries})`);
                await new Promise((resolve) => setTimeout(resolve, delayMS));
                attempt++;
                return execute();
            }
            catch (err) {
                this.debug(`Error thrown processing request to ${item.path}: ${err}`);
                this.errors.push({
                    item,
                    error: new Error(`Error thrown processing request to ${item.path}: ${err}`),
                    code: 500, // Generic error code
                });
            }
        };
        return execute();
    }
    /**
     * Debug logging
     */
    debug(...messages) {
        if (this.options.debug) {
            console.log('[MLSDK:DEBUG:EventQueue]', ...messages);
        }
    }
}
