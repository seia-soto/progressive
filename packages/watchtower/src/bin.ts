import {factory} from './index.js';

(async () => {
	console.time('up');

	const server = await factory();
	const address = await server.listen({
		host: '0.0.0.0',
		port: 1298,
	});

	console.timeEnd('up');

	console.log(address);

	process.on('SIGINT', async () => {
		console.time('down');

		await server.close();

		console.timeEnd('down');
		process.exit(0);
	});
})();
