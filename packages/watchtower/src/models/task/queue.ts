class Queue<T> {
	entries: {
		tries: number,
		value: T
	}[] = [];

	parallel: number = 0;

	processing: number = 0;

	retry = {
		limit: 0,
		delay: 0,
	};

	// eslint-disable-next-line no-unused-vars
	processor: (entry: T) => Promise<boolean> | boolean = () => false;

	constructor(options: {
    parallel: number,
		retry: {
			limit: number,
			delay: number
		},
    processor: typeof Queue.prototype.processor
  }) {
		this.parallel = options.parallel;
		this.retry = options.retry;
		this.processor = options.processor;
	}

	put(entry: T) {
		this.entries.push({
			tries: 0,
			value: entry,
		});
		this.process();
	}

	async process(): Promise<void> {
		if (this.parallel > this.processing) {
			return;
		}

		const entry = this.entries.shift();

		if (!entry) {
			return;
		}

		this.processing++;

		await this.sleep(entry.tries * this.retry.delay);

		const retry = await this.processor(entry.value);

		this.processing--;

		if (retry && this.retry.limit <= entry.tries) {
			this.entries.push({
				tries: entry.tries + 1,
				value: entry.value,
			});
		}

		return this.process();
	}

	sleep(ms: number) {
		return new Promise(resolve => {
			setTimeout(() => resolve(null), ms);
		});
	}
}

export default Queue;
