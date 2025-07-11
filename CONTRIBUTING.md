# Getting started

After cloning the repository, you should be able to execute

```sh
yarn build
yarn test
```

And the unit tests should pass.

You can run a single test like this:

```sh
npx vitest packages/node-sdk/test/node.test.ts 
```

> Unit tests do not hit a real Mindlytics backend.  The backend is mocked with `msw` library.

## Refreshing the API

The code base uses the Mindlytics OpenAPI spec to generate Typescript types and fetch apis.  If significant changes are made to the Mindlytics endpoints, then you can integrate these changes by running

```sh
yarn generate:api:schema
yarn build
yarn test
```

This will get the OpenAPI spec from `https://app.mindlytics.ai` and re-generate "packages/core/src/schema.gen.ts".

## Examples

Create a ".env" file at the top of the repository that looks something like:

```sh
API_KEY=xxxx
PROJECT_ID=yyyy
BASE_URL=http://localhost:3000
```

Leave out `BASE_URL` if you are testing against the production Mindlytics backend service.  Otherwise use

| Environment | BASE_URL |
| ----------- | -------- |
| local       | http://localhost:3000 |
| staging     | https://app-staging.mindlytics.ai |
| production  | https://app.mindlytics.ai |

Then you can run

```sh
eval `cat .env` npx tsx examples/basic/index.ts 
```

You can run the Jupyter notebooks (and create new ones)

```sh
cd examples/jupyter
eval `cat ../../.env` jupyter lab
```

## Installing Jupyter

You may need to install Jupyter.  If you haven't already you must run

```sh
yarn
yarn build
```

Then

```sh
pip install notebook
```

And you need to install the typescript kernel

```sh
npx tslab install
```
