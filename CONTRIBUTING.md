# Getting started

After cloning the repository, you should be able to execute

```sh
yarn build
yarn test
```

And the unit tests should pass.

## Refreshing the API

The code base uses the Mindlytics OpenAPI spec to generate Typescript types and fetch apis.  If significant changes are made to the Mindlytics endpoints, then you can integrate these changes by running

```sh
yarn generate:api:schema
yarn build
yarn test
```

This will get the OpenAPI spec from `https://app.mindlytics.ai` and re-generate "packages/core/src/schema.gen.ts".
 