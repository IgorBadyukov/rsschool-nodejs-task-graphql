import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import {ProfileEntity} from "../../utils/DB/entities/DBProfiles";
import {HttpError} from "@fastify/sensible/lib/httpError";

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<ProfileEntity[]>
  {
      const allProfiles = await fastify.db.profiles.findMany();
      return allProfiles;
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity | HttpError> {
        const profileID = request.params.id;
        const profile = await fastify.db.profiles.findOne({key: "id", equals: profileID});
        if (!profile) {
            return fastify.httpErrors.notFound();
        }
        return profile;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity | HttpError> {
        const userId = request.body.userId;
        const user = await fastify.db.users.findOne({key: "id", equals: userId});
        if (!user) {
            return fastify.httpErrors.badRequest();
        }
        const profile = await fastify.db.profiles.findOne({key: "userId", equals: userId});
        if (profile) {
            return fastify.httpErrors.badRequest();
        }
        const memberTypeId = await fastify.db.memberTypes.findOne({key: "id", equals: request.body.memberTypeId});
        if (!memberTypeId) {
            return fastify.httpErrors.badRequest();
        }
        return await fastify.db.profiles.create(request.body);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity | HttpError> {
        const profileID = request.params.id;
        const profile = await fastify.db.profiles.findOne({key: "id", equals: profileID});
        if (!profile) {
            return fastify.httpErrors.badRequest();
        }
        return await fastify.db.profiles.delete(request.params.id);
    }
  )

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity | HttpError> {
        const profileID = request.params.id;
        const profile = await fastify.db.profiles.findOne({key: "id", equals: profileID});
        if (!profile) {
            return fastify.httpErrors.badRequest();
        }
        const updatedProfile = await fastify.db.profiles.change(request.params.id, request.body);
        if (!updatedProfile) {
            return fastify.httpErrors.notFound();
        }
        return updatedProfile;
    }
  );
};

export default plugin;
