import {Node} from 'vertical-radix';
import {parse} from './rule';

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
