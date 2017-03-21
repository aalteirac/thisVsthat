![Enigma.js](docs/enigma.png)

A framework to consume and extend the Qlik Sense Analytics Platform.

## Status

[![Build Status](https://circleci.com/gh/qlik-trial/enigma.js.svg?style=shield&circle-token=4c471894337462b35760dd2502dd9206c090a192)](https://circleci.com/gh/qlik-trial/enigma.js)

## How to use

See the [Documentation and examples](docs/usage.md).

## Contributing

For formal style guidelines, please follow the [Developing guidelines](https://confluence.qliktech.com/display/CL/Developing).

## Developing

Make sure you machine is setup to consume npm packages from our [private @qlik npm registry](https://confluence.qliktech.com/display/CL/Node+environment) before continuing.

As usual, begin by installing all dependencies:

```
$ npm install
```

Building the project will generate both commonjs and AMD modules to `dist/`:

```
$ npm run build
```

To build on file changes:

```
$ npm run build:watch
```

To run tests:

```
$ npm run test
```

To run integration tests (requires a Qlik Sense Engine):

```
$ npm run test:integration
```

These are just the more common tasks and there are other more specific ones you can use if needed, please see the `package.json`
files' `scripts` section for all the runnable tasks.

## Deploying

**Warning: If done incorrectly, you can end up publishing a globally public package, only run these commands if you have the `@qlik` npm registry set up properly.**

1. Make sure your git repo is building and working correctly by running `npm run build && npm run test && npm run test:integration`.
2. Analyze the changes since the previous version and decide the new version number based on [semantic versioning](http://semver.org/).
3. Update and commit `CHANGELOG.md` with a list of changes since the previous version.
4. Run the command `npm version [patch | minor | major]`. This will create a commit and a tag.
5. Push the changes with `git push` followed by `git push --tags`.
6. Run `npm publish` to deploy the new `@qlik/enigma.js` package, note that you will need publishing rights to the `@qlik` npm registry to do so.
