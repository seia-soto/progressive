import {factory} from './index.js';

(async () => {
	console.log('up');

	const server = await factory();
	const address = await server.listen({
		host: '0.0.0.0',
		port: 1298,
	});

	console.log(address);

	process.on('SIGINT', async () => {
		console.log('down');

		await server.close();
		process.exit(0);
	});
})();
