const derive = async <TSome extends Promise<unknown>, TError extends Error>(one: TSome): Promise<readonly [false, Awaited<TSome>] | readonly [TError, false]> => {
	try {
		const result: Awaited<typeof one> = await one;

		return [false, result] as const;
	} catch (error) {
		return [error as TError, false] as const;
	}
};

export default derive;
