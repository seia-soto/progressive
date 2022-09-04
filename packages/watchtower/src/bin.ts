import {factory} from './index.js';

(async () => {
	const server = await factory();
	const address = await server.listen({
		host: '0.0.0.0',
		port: 1298,
	});

	console.log(address);

	process.on('SIGINT', async () => {
		await server.close();
		process.exit(0);
	});
})();
