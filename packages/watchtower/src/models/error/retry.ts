// eslint-disable-next-line no-unused-vars
const retry = async <T>(one: (i: number) => Promise<T> | T, until: number) => {
	const errors: Error[] = [];

	for (let i = 0; i < until; i++) {
		try {
			const did = await one(i);

			return {
				success: true,
				did,
			} as const;
		} catch (error) {
			errors.push(error as Error);
		}
	}

	return {
		success: false,
		did: errors,
	} as const;
};

export default retry;
