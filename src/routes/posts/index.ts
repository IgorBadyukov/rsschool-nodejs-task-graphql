import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createPostBodySchema, changePostBodySchema } from './schema';
import type { PostEntity } from '../../utils/DB/entities/DBPosts';
import {HttpError} from "@fastify/sensible/lib/httpError";

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<PostEntity[]> {
      const allPosts = await fastify.db.posts.findMany();
      return allPosts;
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity | HttpError> {
        const postID = request.params.id;
        const post = await fastify.db.posts.findOne({key: "id", equals: postID});
        if (!post) {
            return fastify.httpErrors.notFound();
        }
        return post;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createPostBodySchema,
      },
    },
    async function (request, reply): Promise<PostEntity | HttpError> {
        const userID = request.body.userId;
        const user = await fastify.db.users.findOne({key: "id", equals: userID});
        if (!user) {
            return fastify.httpErrors.badRequest();
        }
        return await fastify.db.posts.create(request.body);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity | HttpError> {
        const postID = request.params.id
        const post = await fastify.db.posts.findOne({key: "id", equals: postID});

        if (!post) {
            return fastify.httpErrors.badRequest();
        }
        return await fastify.db.posts.delete(request.params.id);
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changePostBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity | HttpError> {
        const postID = request.params.id;
        const post = await fastify.db.posts.findOne({key: "id", equals: postID});
        if (!post) {
            return fastify.httpErrors.badRequest();
        }
        return await fastify.db.posts.change(request.params.id, request.body);
    }
  );
};

export default plugin;
