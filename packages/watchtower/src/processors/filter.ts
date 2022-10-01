import {Instance} from '../models/database/schema/index.js';
import derive from '../models/error/derive.js';
import {refresh} from '../models/instance.js';

export const refreshProcessor = async (id: Instance['i']) => {
	const [error] = await derive(refresh(id));

	if (error) {
		return true;
	}

	return false;
};
