import test from 'ava';
import {build} from '../src/models/filter.js';

test('uAssets', async t => {
	const uAssets = [
		'https://ublockorigin.github.io/uAssets/filters/filters.txt',
		'https://ublockorigin.github.io/uAssets/filters/badware.txt',
		'https://ublockorigin.github.io/uAssets/filters/annoyances.txt',
		'https://ublockorigin.github.io/uAssets/filters/quick-fixes.txt',
		'https://ublockorigin.github.io/uAssets/filters/resource-abuse.txt',
		'https://ublockorigin.github.io/uAssets/filters/unbreak.txt',
		'https://ublockorigin.github.io/uAssets/filters/badlists.txt',
		'https://ublockorigin.github.io/uAssets/filters/lan-block.txt',
		'https://ublockorigin.github.io/uAssets/filters/annoyances.txt',
	];

	const sets = await build(uAssets);

	t.truthy(sets.negative.find('html-online.com').found);
	t.log(sets.positive.flatten().length, 'entries added to positives');
	t.log(sets.negative.flatten().length, 'entries added to negatives');
});
