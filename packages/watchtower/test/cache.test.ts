import test from 'ava';
import LeastRecentlyUnused from '../src/models/cache/leastRecentlyUsed.js';

test('leastRecentlyUsed', async t => {
	const cache = new LeastRecentlyUnused({live: 1 * 1000, threshold: 1});

	cache.set('apple', 1);
	cache.set('banana', 2);

	t.is(cache.pressure, 1);
	t.is(cache.get('banana')?.value, 2);
	t.is(cache.get('apple'), undefined);
});
