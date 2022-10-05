/**
 * Make arbitrary numbers to octets regarding the type size
 * @param fragments An array consisted of the value and the size in bits
 * @returns An usable array with bytes can be converted into Buffer
 */
export const octets = (fragments: (readonly [number, number])[]) => {
	const buffer: number[] = [];
	let octet = 0o0;
	let count = 0;

	for (let i = 0; i < fragments.length; i++) {
		const [data, size] = fragments[i];

		for (let i = size - 1; i >= 0; i--) {
			if (!(count % 8)) {
				buffer.push(octet & 0xFF);
				octet = 0o0;
			}

			if (data & (2 ** i)) {
				octet |= 2 ** (i - (Math.floor(i / 8) * 8));
			}

			count++;
		}
	}

	buffer.push(octet);

	return buffer.slice(1);
};

/**
 * Read a single bit from buffer
 * @param buffer The buffer object
 * @param offset The offset in bits
 */
export const pick = (buffer: Buffer, offset: number): number => (buffer[offset >> 3] >> (7 - offset & 7)) & 1;

/**
 * Read bits in range and return as a number
 * @param buffer The buffer object
 * @param offset The offset in bits
 * @param size The size of value in bits
 * @returns A number data, convertable to string with String.fromCharCode method.
 */
export const range = (buffer: Buffer, offset: number, size: number): number => {
	let value = 0x0;

	for (let i = 0; i < size; i++) {
		if (pick(buffer, offset + (size - i - 1))) {
			value |= 2 ** i;
		}
	}

	return value;
};
