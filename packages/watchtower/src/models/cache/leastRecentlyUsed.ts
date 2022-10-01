class LeastRecentlyUnused<T> {
	entries: Record<string, {
    value: T,
    hits: number,
    createdAt: number
  }> = {};

	live: number = 0;

	threshold: number = 0;

	pressure: number = 0;

	constructor(options: {
    live: number,
    threshold: number,
  }) {
		this.live = options.live;
		this.threshold = options.threshold;
	}

	set(key: string, value: T) {
		if (this.pressure >= this.threshold) {
			const keys = Object.keys(this.entries);

			let least = this.entries[keys[0]].hits;
			let candidates: string[] = [keys[0]];

			for (let i = 1; i < keys.length; i++) {
				if (this.entries[keys[i]].hits < least) {
					least = this.entries[keys[i]].hits;
					candidates = [keys[i]];

					continue;
				}

				if (this.entries[keys[i]].hits === least) {
					candidates.push(keys[i]);
				}
			}

			this.pressure -= candidates.length;

			for (let i = 0; i < candidates.length; i++) {
				delete this.entries[candidates[i]];
			}
		}

		this.pressure++;
		this.entries[key] = {
			value,
			hits: 0,
			createdAt: Date.now(),
		};
	}

	get(key: string) {
		if (!this.entries[key]) {
			return;
		}

		if (Date.now() + this.live < this.entries[key].createdAt) {
			this.remove(key);

			return;
		}

		this.entries[key].hits++;

		return this.entries[key];
	}

	remove(key: string) {
		this.pressure--;
		delete this.entries[key];
	}
}

export default LeastRecentlyUnused;
