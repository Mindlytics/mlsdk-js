export class EventQueue {
    client;
    queue = [];
    timer = null;
    isFlushing = false;
    options;
    constructor(client, options = {}) {
        this.client = client;
        this.options = {
            batchSize: options.batchSize ?? 10,
            flushInterval: options.flushInterval ?? 1000,
            maxRetries: options.maxRetries ?? 3,
            debug: options.debug ?? false,
        };
        this.startTimer();
    }
    /**
     * Add an item to the queue
     */
    enqueue(item) {
        this.queue.push({
            ...item,
            retries: 0,
            timestamp: item.timestamp ?? Date.now(),
        });
        this.debug(`Item added to queue. Queue size: ${this.queue.length}`, item);
        // If we've reached the batch size, flush immediately
        if (this.queue.length >= this.options.batchSize) {
            this.debug(`Queue reached batch size (${this.options.batchSize}). Flushing...`);
            this.flush();
        }
    }
    /**
     * Start the timer to periodically flush the queue
     */
    startTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.timer = setInterval(() => {
            if (this.queue.length > 0) {
                this.debug(`Timer triggered. Flushing queue...`);
                this.flush();
            }
        }, this.options.flushInterval);
        // Ensure the timer doesn't prevent the process from exiting
        if (this.timer.unref) {
            this.timer.unref();
        }
    }
    /**
     * Process and send all items in the queue
     */
    async flush() {
        if (this.isFlushing || this.queue.length === 0) {
            return;
        }
        this.isFlushing = true;
        try {
            // Take items up to the batch size
            const batch = this.queue.splice(0, this.options.batchSize);
            this.debug(`Processing batch of ${batch.length} items`);
            for (const item of batch) {
                await this.processItem(item);
            }
            // TODO: ideally we call everything in parallel
            // but it's not really possible, since session start needs to happen before any other events and end session needs to be last.
            // Process each item in the batch
            // const promises = batch.map((item) => this.processItem(item))
            // // Wait for all requests to complete
            // await Promise.all(promises)
        }
        catch (error) {
            this.debug(`Error during flush: ${error}`);
        }
        finally {
            this.isFlushing = false;
            // If there are still items in the queue, flush again
            if (this.queue.length > 0) {
                this.debug(`Queue still has ${this.queue.length} items. Continuing flush...`);
                this.flush();
            }
        }
    }
    /**
     * Process a single queue item
     */
    async processItem(item) {
        try {
            this.debug(`Processing request to ${item.path}`, item.body, item.params);
            // Make the API request
            const { data, error } = await this.client.POST(item.path, {
                body: item.body,
                params: item.params,
            });
            if (error) {
                this.debug(`Error processing request to ${item.path}: ${error}`);
                throw new Error(error.message ?? 'Unknown error', {
                    cause: {
                        data,
                    },
                });
            }
            this.debug(`Successfully processed request to ${item.path}`);
        }
        catch (error) {
            this.debug(`Error processing request to ${item.path}: ${error}`);
            // Retry logic
            const retries = item.retries || 0;
            if (retries < this.options.maxRetries) {
                this.debug(`Retrying request to ${item.path} (attempt ${retries + 1}/${this.options.maxRetries})`);
                // Add back to the queue with incremented retry count
                this.queue.push({
                    ...item,
                    retries: retries + 1,
                });
            }
            else {
                this.debug(`Max retries reached for request to ${item.path}. Dropping request.`);
            }
        }
    }
    /**
     * Stop the queue timer
     */
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
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
