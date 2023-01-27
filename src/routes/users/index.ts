import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeToBodySchema,
  unsubscribeFromBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';
import {HttpError} from "@fastify/sensible/lib/httpError";

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
      const allUsers = await fastify.db.users.findMany();
      return allUsers;
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity | HttpError> {
        const userID = request.params.id;
        const user = await fastify.db.users.findOne({
            key: "id",
            equals: userID,
        });
        if (!user) {
            return fastify.httpErrors.notFound('User not found');
        }
        return user;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
        const answer = await fastify.db.users.create(request.body);
        return answer;
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity | HttpError> {
        const userID = request.params.id
        const user = await fastify.db.users.findOne({key: "id", equals: userID});
        if (!user) {
            return fastify.httpErrors.badRequest('Not found');
        }
        const posts = await fastify.db.posts.findMany({key: "userId", equals: request.params.id});
        posts.forEach(async post => {
            if (post) {
                await fastify.db.posts.delete(post.id);
            }
        })
        const profile = await fastify.db.profiles.findOne({key: "userId", equals: request.params.id});
        if (profile) {
            await fastify.db.profiles.delete(profile.id);
        }
        const deletedUser = await fastify.db.users.delete(request.params.id);
        if (!deletedUser) {
            return fastify.httpErrors.notFound('Not found');
        }
        deletedUser.subscribedToUserIds.map(async(subID) => {
            const subscriptions = await fastify.db.users.findOne({key: "id", equals: subID});
            if (!subscriptions) {
                return fastify.httpErrors.notFound('Not found');
            }
            const newSubscriptions = subscriptions.subscribedToUserIds.filter((id) => id !== deletedUser.id);
            await fastify.db.users.change(subID, { subscribedToUserIds: newSubscriptions});
        })
        return deletedUser;
    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeToBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity | HttpError> {
        const userID = request.params.id;
        const subID = request.body.userId;
        const u1 = await fastify.db.users.findOne({ key: "id", equals: userID });
        if (!u1) {
            return fastify.httpErrors.badRequest();
        }
        const u2 = await fastify.db.users.findOne({ key: "id", equals: subID });
        if (!u2) {
            return fastify.httpErrors.badRequest();
        }
        let arr = u2.subscribedToUserIds;
        arr.push(userID);
        return await fastify.db.users.change(subID, {
            subscribedToUserIds: arr,
        });
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: unsubscribeFromBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity | HttpError> {
        const u1Id = request.params.id;
        const u2Id = request.body.userId;
        const u1 = await fastify.db.users.findOne({ key: "id", equals: u1Id });
        if (!u1) {
            return fastify.httpErrors.badRequest();
        }
        const u2 = await fastify.db.users.findOne({ key: "id", equals: u2Id });
        if (!u2) {
            return fastify.httpErrors.badRequest();
        }
        let arr = u2.subscribedToUserIds;
        const lengthBefore = arr.length;
        const resArray = arr.filter((id) => id !== u1Id);
        const lengthAfter = resArray.length;
        if (lengthAfter === lengthBefore) {
            return fastify.httpErrors.badRequest();
        }
        return await fastify.db.users.change(u2Id, {
            subscribedToUserIds: resArray,
        });
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity | HttpError> {
        const updatedUser = await fastify.db.users.change(request.params.id, request.body);
        if (!updatedUser) {
            return fastify.httpErrors.notFound('User not found');
        }
        return updatedUser;
    }
  );
};

export default plugin;
