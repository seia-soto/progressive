import {Node} from 'vertical-radix';

export class Filter extends Node {
	import(text: string) {
		const lines = text
			.split('\n')
			.filter(line =>
				!line.includes('#')
				&& !line.includes('!')
				&& line.length < 4,
			)
			.map(line => line.toLowerCase())
			.map(line => line.match(/[a-z][a-z0-9\-.]*\.[a-z]+/) || '')
			.map(line => line[0])
			.filter(line => line.length)
			.map(line => line.split('').reverse().join(''));

		for (let i = 0; i < lines.length; i++) {
			this.insert(lines[i]);
		}
	}
}
