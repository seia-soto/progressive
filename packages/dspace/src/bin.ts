import {do53} from './index.js';

const {server, stop} = do53.server.createServer([
	do53.server.createForwardingHandler('1.1.1.1'),
]);

server.bind(53);

process.once('SIGINT', () => {
	stop();
	process.exit(0);
});
