import {Node} from 'vertical-radix';
import * as database from '../database/provider.js';
import {load} from './fetcher.js';

export const kHostsMarkerPositions = [
	'127.0.0.1',
	'0.0.0.0',
]
	.map(i => i.length);

export const extract = (rule: string) => {
	const match = rule.match(/((?!-))(xn--)?[a-z0-9][a-z0-9-_]{0,61}[a-z0-9]{0,1}\.(xn--)?([a-z0-9-]{1,61}|[a-z0-9-]{1,30}\.[a-z]{2,})/);

	if (!match) {
		return false;
	}

	return match[0];
};

export const parse = (rule: string): ([boolean, string] | false) => {
	if (
		rule.includes('/')
		|| rule.includes('$')
	) {
		return false;
	}

	// Hosts
	const isHosts = !isNaN(parseInt(rule[rule.indexOf(' ') - 1], 10));
	// Filter
	const isPositive = rule.startsWith('||');
	const isFilter = isPositive || rule.startsWith('@@||');

	rule = rule.toLowerCase();

	if (isHosts) {
		const marker = rule.indexOf(' ');

		// If domain is at the back of marker
		if (kHostsMarkerPositions.indexOf(marker) >= 0) {
			return [true, rule.slice(marker + 1)];
		}

		return [true, rule.slice(0, marker)];
	}

	const domain = extract(rule);

	if (!domain) {
		return false;
	}

	if (isFilter) {
		return [isPositive, domain];
	}

	return [true, domain];
};

export const build = async (list: string) => {
	const filter = {
		p: new Node(),
		n: new Node(),
	};
	const lines = list.split('\n');

	for (let i = 0; i < lines.length; i++) {
		const result = parse(lines[i]);

		if (!result) {
			continue;
		}

		const [isPositive, domainName] = result;

		if (isPositive) {
			filter.p.insert(domainName);
		} else {
			filter.n.insert(domainName);
			filter.p.delete(domainName);
		}
	}

	return filter;
};

export const merge = async (instanceId: number) => {
	const filters = await database.blocklist(database.db)
		.find({i_instance: instanceId})
		.select('address')
		.all();
	let merged = '';

	for (let i = 0; i < filters.length; i++) {
		const {address} = filters[i];
		const [protocol] = address.split('://');

		let filter = '';

		switch (protocol) {
			case 'https': {
				filter = await load(address)
					.catch(error => {
						console.error(error);
					}) || '';

				break;
			}

			default: {
				break;
			}
		}

		merged += filter;
	}

	return merged;
};
