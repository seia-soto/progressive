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
