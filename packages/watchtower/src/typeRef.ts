import {TypeBoxTypeProvider} from '@fastify/type-provider-typebox';
import {FastifyPluginCallback, FastifyPluginOptions, RawServerBase} from 'fastify';
import {factory} from './index.js';

export type TFastifyTyped = Awaited<ReturnType<typeof factory>>

// Proposal: Partial Type Argument Inference: https://github.com/microsoft/TypeScript/issues/26242
export type TFastifyTypedPluginCallback = FastifyPluginCallback<FastifyPluginOptions, RawServerBase, TypeBoxTypeProvider>
