import {create} from './index.js';

(async () => {
	const dspace = create();

	dspace.server.bind(53);

	console.log('listening on 53');
})();
