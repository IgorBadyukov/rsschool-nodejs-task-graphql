import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { changeMemberTypeBodySchema } from './schema';
import type { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';
import {HttpError} from "@fastify/sensible/lib/httpError";

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<MemberTypeEntity[]> {
      return await fastify.db.memberTypes.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity | HttpError> {
        const memberTypeID = request.params.id
        const memberType = await fastify.db.memberTypes.findOne({key: "id", equals: memberTypeID});
        if (!memberType) {
            return fastify.httpErrors.notFound();
        }
        return memberType;
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeMemberTypeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity | HttpError> {
        const memberType = await fastify.db.memberTypes.findOne({key: "id", equals: request.params.id});
        if (!memberType) {
            return fastify.httpErrors.badRequest();
        }
        const changeMemberType = await fastify.db.memberTypes.change(request.params.id, request.body);
        if (!changeMemberType) {
            return fastify.httpErrors.notFound();
        }
        return changeMemberType;
    }
  );
};

export default plugin;
