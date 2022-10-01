import {Instance} from '../models/database/schema/index.js';
import Queue from '../models/task/queue.js';
import {refreshProcessor} from '../processors/filter.js';

export const toBeRefreshed: Queue<Instance['i']> = new Queue({
	parallel: 16,
	retry: {
		delay: 15 * 1000,
		limit: 2,
	},
	processor: refreshProcessor,
});
