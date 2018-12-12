<p align="center">
  <img src="./images/hash-tag-logo.png" alt="use-pkg-version logo" width="200"/>
</p>
<p align="center" style="font-size: 1.5em"><b>use-pkg-version</b></p>
<p align="center" style="font-size: 0.5em">Update any static file with the version number from the package.json file</p>

[![NPM version](https://img.shields.io/npm/v/use-pkg-version.svg)](https://www.npmjs.com/package/use-pkg-version)
[![Vue 2](https://img.shields.io/badge/vue-2.x-brightgreen.svg)](https://vuejs.org/)
[![Vue CLI 3](https://img.shields.io/badge/vue%20cli-3-brightgreen.svg)](https://cli.vuejs.org/)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/nidkil/use-pkg-version#readme)
[![Dependency status](https://david-dm.org/alanshaw/david.svg)](https://david-dm.org/alanshaw/david)
[![devDependency status](https://david-dm.org/alanshaw/david/dev-status.svg)](https://david-dm.org/alanshaw/david?type=dev)
[![Hit count](http://hits.dwyl.com/nidkil/vue-test-plugin.svg)](http://hits.dwyl.com/dwyl/start-here)
[![License MIT](https://img.shields.io/badge/license-mit-yellow.svg)](https://opensource.org/licenses/MIT)

> Update any static file with the version number from the package.json file.

Ever had the problem that you have a version number in a static file that needs to be updated when a new version is released? This module is intended for this usecase.

## Installation

### Global

Install as a globally available CLI tool using [npm](https://www.npmjs.com/):

```bash
npm install --global use-pkg-version
```

Or install using [yarn](https://yarnpkg.com):

```bash
yarn global add use-pkg-version
```

### Local

Install as a `devDependency` using [npm](https://www.npmjs.com/):

```bash
npm install --save-dev use-pkg-version
```

Or install using [yarn](https://yarnpkg.com):

```bash
yarn add --dev use-pkg-version
```

Add this as a `script` to `package.json`:

```json
{
  "scripts": {
    "build:upd-version": "use-pkg-version"
  },
  "devDependencies": {
    "use-pkg-version": "^0.0.0"
  }
}
```

Now you can run `npm run build:upd-version` from the command line. You can pass it arguments using double dashes (--), e.g. `npm run build:upd-version -- info`.

## Usage

### Minimum configuration

The easiest way to use this module is adding it as a `prebuild` script in the `package.json` file. The following example demonstrates how to run `use-pkg-version` when before the build process starts. It uses sane defaults, if no `package.json` file is specified it assumes the `package.json` is in the current directory.

```json
{
  "scripts": {
    "prebuild": "npm run build:upd-version -- <file-to-update>",
    "build": "<your-build-command>"
  }
}
```

You can call this script directly by executing one of the following commands.

```bash
npm run prebuild
```

Or:

```bash
yarn prebuild
```

## Other options

- **--help** - Using `npm run build:upd-version -- --help` will list the available commands.

- **\<command\> --help** - Using `npm run build:upd-version -- <command> --help` will display information about the specified command and its options.

- **info** - Using `npm run build:upd-version -- info` will display information about your operating system and other environment information that is useful if you need to submit an issue.

## Roadmap

Currently there is nothing on the roadmap. Suggestions? Please submit an issue.

## Contributing

We welcome pull requests! What follows is the simplified version of the contribution process, please read [here](./CONTRIBUTING.md) to fully understand our contribution policy and [here](./CODE-OF-CONDUCT.md) to understand our code of conduct.

1. Fork the repository [here](https://github.com/nidkil/use-pkg-version)!
2. Create your feature branch: `git checkout -b my-new-feature`
3. If relevant, don't forget to add your tests
4. Commit your changes: `npm run commit`
5. Push to the branch: `git push origin my-new-feature`
6. Submit a pull request :-)

## Author

**nidkil** © [nidkil](https://github.com/nidkil), released under the [MIT](LICENSE.md) license.
Authored and maintained by nidkil with help from [contributors](https://github.com/nidkil/use-pkg-version/contributors).

> [Website](https://github.com/nidkil) · GitHub [@nidkil](https://github.com/nidkil) · Twitter [@nidkil](https://twitter.com/nidkil)
