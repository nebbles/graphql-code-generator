import '@graphql-codegen/testing';
import { buildSchema } from 'graphql';
import { plugin } from '../src/index.js';

describe('TypeScript Resolvers Plugin - Union', () => {
  it('should generate ResolversUnionTypes', async () => {
    const testSchema = buildSchema(/* GraphQL */ `
      type Query {
        user(id: ID!): UserPayload!
        posts: PostsPayload!
      }

      type StandardError {
        error: String!
      }

      type User {
        id: ID!
        fullName: String!
      }

      type UserResult {
        result: User
      }

      union UserPayload = UserResult | StandardError

      type Post {
        author: String
        comment: String
      }

      type PostsResult {
        results: [Post!]!
      }

      union PostsPayload = PostsResult | StandardError
    `);
    const content = await plugin(testSchema, [], {}, { outputFile: 'graphql.ts' });

    expect(content.content).toBeSimilarStringTo(`
      export type ResolversUnionTypes<_RefType extends Record<string, unknown>> = {
        UserPayload: ( UserResult ) | ( StandardError );
        PostsPayload: ( PostsResult ) | ( StandardError );
      };
    `);

    expect(content.content).toBeSimilarStringTo(`
      export type ResolversTypes = {
        Query: ResolverTypeWrapper<{}>;
        ID: ResolverTypeWrapper<Scalars['ID']['output']>;
        StandardError: ResolverTypeWrapper<StandardError>;
        String: ResolverTypeWrapper<Scalars['String']['output']>;
        User: ResolverTypeWrapper<User>;
        UserResult: ResolverTypeWrapper<UserResult>;
        UserPayload: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['UserPayload']>;
        Post: ResolverTypeWrapper<Post>;
        PostsResult: ResolverTypeWrapper<PostsResult>;
        PostsPayload:  ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['PostsPayload']>;
        Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
      };
    `);

    expect(content.content).toBeSimilarStringTo(`
      export type ResolversParentTypes = {
        Query: {};
        ID: Scalars['ID']['output'];
        StandardError: StandardError;
        String: Scalars['String']['output'];
        User: User;
        UserResult: UserResult;
        UserPayload: ResolversUnionTypes<ResolversParentTypes>['UserPayload'];
        Post: Post;
        PostsResult: PostsResult;
        PostsPayload: ResolversUnionTypes<ResolversParentTypes>['PostsPayload'];
        Boolean: Scalars['Boolean']['output'];
      };
    `);
  });

  it('should NOT generate ResolversUnionTypes if there is no Union', async () => {
    const testSchema = buildSchema(/* GraphQL */ `
      type Query {
        user(id: ID!): User
      }

      type User {
        id: ID!
        fullName: String!
      }
    `);
    const content = await plugin(testSchema, [], {}, { outputFile: 'graphql.ts' });

    expect(content.content).not.toBeSimilarStringTo(`export type ResolversUnionTypes`);
    expect(content.content).not.toBeSimilarStringTo(`export type ResolversUnionParentTypes`);
  });

  it('if generateInternalResolversIfNeeded.__isTypeOf = false (default), generates __isTypeOf for all object types', async () => {
    const schema = buildSchema(/* GraphQL */ `
      type MemberOne {
        id: ID!
      }

      type MemberTwo {
        id: ID!
        name: String!
      }

      type MemberThree {
        id: ID!
        isMember: Boolean!
      }

      type Normal {
        id: ID!
      }
    `);

    const result = await plugin(schema, [], {}, { outputFile: '' });

    expect(result.content).toBeSimilarStringTo(`
      export type MemberOneResolvers<ContextType = any, ParentType extends ResolversParentTypes['MemberOne'] = ResolversParentTypes['MemberOne']> = {
        id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
        __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
      }
    `);

    expect(result.content).toBeSimilarStringTo(`
      export type MemberTwoResolvers<ContextType = any, ParentType extends ResolversParentTypes['MemberTwo'] = ResolversParentTypes['MemberTwo']> = {
        id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
        name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
        __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
      };
    `);

    expect(result.content).toBeSimilarStringTo(`
      export type MemberThreeResolvers<ContextType = any, ParentType extends ResolversParentTypes['MemberThree'] = ResolversParentTypes['MemberThree']> = {
        id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
        isMember?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
        __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
      };
    `);

    expect(result.content).toBeSimilarStringTo(`
      export type NormalResolvers<ContextType = any, ParentType extends ResolversParentTypes['Normal'] = ResolversParentTypes['Normal']> = {
        id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
        __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
      };
    `);
  });

  it('if generateInternalResolversIfNeeded.__isTypeOf = true, generates __isTypeOf for only union members', async () => {
    const schema = buildSchema(/* GraphQL */ `
      type MemberOne {
        id: ID!
      }

      type MemberTwo {
        id: ID!
        name: String!
      }

      type MemberThree {
        id: ID!
        isMember: Boolean!
      }

      union Union = MemberOne | MemberTwo | MemberThree

      type Normal {
        id: ID!
      }
    `);

    const result = await plugin(
      schema,
      [],
      { generateInternalResolversIfNeeded: { __isTypeOf: true } },
      { outputFile: '' }
    );

    expect(result.content).toBeSimilarStringTo(`
      export type MemberOneResolvers<ContextType = any, ParentType extends ResolversParentTypes['MemberOne'] = ResolversParentTypes['MemberOne']> = {
        id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
        __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
      }
    `);

    expect(result.content).toBeSimilarStringTo(`
      export type MemberTwoResolvers<ContextType = any, ParentType extends ResolversParentTypes['MemberTwo'] = ResolversParentTypes['MemberTwo']> = {
        id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
        name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
        __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
      };
    `);

    expect(result.content).toBeSimilarStringTo(`
      export type MemberThreeResolvers<ContextType = any, ParentType extends ResolversParentTypes['MemberThree'] = ResolversParentTypes['MemberThree']> = {
        id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
        isMember?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
        __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
      };
    `);

    expect(result.content).toBeSimilarStringTo(`
      export type NormalResolvers<ContextType = any, ParentType extends ResolversParentTypes['Normal'] = ResolversParentTypes['Normal']> = {
        id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
      };
    `);
  });
});
