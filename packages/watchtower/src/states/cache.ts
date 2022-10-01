import LeastRecentlyUnused from '../models/cache/leastRecentlyUsed';

export const filterCache = new LeastRecentlyUnused<string>({
	live: 60 * 1000,
	threshold: 200,
});
