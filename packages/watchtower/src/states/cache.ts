import LeastRecentlyUnused from '../models/cache/leastRecentlyUsed.js';

export const listCache = new LeastRecentlyUnused<string>({
	live: 60 * 1000,
	threshold: 200,
});

export const filterCache = new LeastRecentlyUnused<string>({
	live: 15 * 60 * 1000,
	threshold: 500,
});
