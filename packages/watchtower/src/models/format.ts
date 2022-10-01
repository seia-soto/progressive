import {TSchema, Type} from '@sinclair/typebox';
import {TypeCompiler} from '@sinclair/typebox/compiler/compiler.js';
import {Format} from '@sinclair/typebox/format/index.js';
import {FastifySchemaCompiler} from 'fastify';

Format.Set('numeric', value => !isNaN(parseInt(value, 10)));
Format.Set('numeric.identifier', value => parseInt(value, 10) >= 0);

export const RTNumeric = Type.String({
	format: 'numeric',
});

export const RTNumericIdentifier = Type.String({
	format: 'numeric.identifier',
});

// For user-defined formats, we use our typebox instance
// https://github.com/fastify/fastify-type-provider-typebox/blob/main/index.ts#L23
export const typeValidator: FastifySchemaCompiler<TSchema> = ({schema}) => {
	const validator = TypeCompiler.Compile(schema as TSchema);

	return (value): any => {
		if (validator.Check(value)) {
			return;
		}

		const errors = [...validator.Errors(value)];

		return {
			error: errors.map(error => ({
				instancePath: error.path,
				message: error.message,
			})),
		};
	};
};
