<p align="center">
  <img src="./images/hash-tag-logo.png" alt="use-pkg-version logo" width="200"/>
</p>
<p align="center" style="font-size: 1.5em"><b>use-pkg-version</b></p>
<p align="center" style="font-size: 0.5em">Update any static file with the version number from the package.json file</p>

[![Build Status](https://travis-ci.org/nidkil/use-pkg-version.svg?branch=master)](https://travis-ci.org/nidkil/use-pkg-version)
[![Coverage Status](https://coveralls.io/repos/github/nidkil/use-pkg-version/badge.svg)](https://coveralls.io/github/nidkil/use-pkg-version)
[![Greenkeeper badge](https://badges.greenkeeper.io/nidkil/use-pkg-version.svg)](https://greenkeeper.io/)
[![NPM version](https://img.shields.io/npm/v/use-pkg-version.svg)](https://www.npmjs.com/package/use-pkg-version)
[![Vue 2](https://img.shields.io/badge/vue-2.x-brightgreen.svg)](https://vuejs.org/)
[![Vue CLI 3](https://img.shields.io/badge/vue%20cli-3-brightgreen.svg)](https://cli.vuejs.org/)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/nidkil/use-pkg-version#readme)
[![Hit count](http://hits.dwyl.com/nidkil/vue-test-plugin.svg)](http://hits.dwyl.com/dwyl/start-here)
[![License MIT](https://img.shields.io/badge/license-mit-yellow.svg)](https://opensource.org/licenses/MIT)

> Update any static file with the version number from the package.json file.

Ever had the problem that you have a version number in a static file that needs to be updated when a new version is released? This module is intended for this use case. I use it for example with the `_coverpage.md` of [docsify](https://github.com/docsifyjs/docsify) and the version number in this README.md file.

<a name="toc">
  <strong>Table of Contents</strong>

<!-- toc -->

- [Installation](#installation)
- [Usage](#usage)
- [Using a configuration file](#using-a-configuration-file)
- [Other options](#other-options)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Support & brag about us](#support--brag-about-us)
- [Author](#author)

<!-- tocstop -->

</a>

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

The following entry will be added to the `devDependencies` section in the `package.json` file.

```json
{
  "devDependencies": {
    "use-pkg-version": "^0.1.8"
  }
}
```

Add the following entry to the `scripts` section in the `package.json` file:

```json
{
  "scripts": {
    "upd-version": "use-pkg-version"
  }
}
```

Now you can run `npm run build:upd-version` from the command line. You can pass it arguments using double dashes (--), e.g. `npm run build:upd-version -- info`.

[Go to Table of Contents](#toc)

## Usage

### Minimum configuration

The easiest way to use this module is adding it as a `prebuild` script in the `package.json` file. The following example demonstrates how to run `use-pkg-version` when before the build process starts. It uses sane defaults, if no `package.json` file is specified it assumes the `package.json` is in the current directory.

```
{
  "scripts": {
    "prebuild": "use-pkg-version update --search-for "^[0-9].[0-9].[0-9]" --replace-with "^{{version}}" README.md",
    "build": "<your-build-command>"
  }
}
```

You can call this script directly by executing `npm run prebuild` or `yarn prebuild`.

[Go to Table of Contents](#toc)

## Using a configuration file

You can also use a configuration file instead of passing options as commandline arguments. Change the `script` to the following.

```json
{
  "scripts": {
    "prebuild": "use-pkg-version update README.md",
    "build": "<your-build-command>"
  }
}
```

Create a `.use-pkg-versionrc.json` file with the following configuration object.

```json
{
  "search-for": "\\^[0-9].[0-9].[0-9]",
  "replace-with": "^{{version}}"
}
```

> **IMPORTANT** Commandline options overrule settings in the configuration object.

The configuration can be a configuration object specified in one of the following ways.

1. A `use-pkg-version` section to the `package.json` file

  ```json
  {
    "use-pkg-version": {
      "search-for": "\\^[0-9].[0-9].[0-9]",
      "replace-with": "^{{version}}"
    }
  }
  ```

2. A `.use-pkg-versionrc` file with JSON or YAML syntax
3. A `.use-pkg-versionrc.json` file
4. A `.use-pkg-versionrc.yaml`, `.use-pkg-versionrc.yml` or `.use-pkg-versionrc.js` file
5. A `.use-pkg-versionrc.config.js` file

Files must be located in the root directory of the project. The order specified is the order the configuration will be looked for, the first match is used.

If the configuration file has a name that does not match the above, then you can use the `-c <config-filename> to specify it.

The names of the configuration object properties are the same as the commandline options.

[Go to Table of Contents](#toc)

## Other options

- **--help**: Using `npm run build:upd-version -- --help` will list the available commands.

- **\<command\> --help**: Using `npm run build:upd-version -- <command> --help` will display information about the specified command and its options.

- **info**: Using `npm run build:upd-version -- info` will display information about your operating system and other environment information that is useful if you need to submit an issue.

[Go to Table of Contents](#toc)

## Roadmap

Currently there is nothing on the roadmap. Suggestions? Please submit an issue.

[Go to Table of Contents](#toc)

## Contributing

We welcome pull requests! What follows is the simplified version of the contribution process, please read [here](./CONTRIBUTING.md) to fully understand our contribution policy and [here](./CODE-OF-CONDUCT.md) to understand our code of conduct.

1. Fork the repository [here](https://github.com/nidkil/use-pkg-version)!
2. Create your feature branch: `git checkout -b my-new-feature`
3. If relevant, don't forget to add your tests
4. Commit your changes: `npm run commit`
5. Push to the branch: `git push origin my-new-feature`
6. Submit a pull request :-)

[Go to Table of Contents](#toc)

## Support & brag about us

If you like this project, please support us by starring ⭐ [this](https://github.com/nidkil/use-pkg-version) repository. Thx!

Please let the world know about us! Brag about us using Twitter, email, blog, Discord, Slack, forums, etc. etc. Thx!

[Go to Table of Contents](#toc)

## Author

**nidkil** © [nidkil](https://github.com/nidkil), released under the [MIT](LICENSE.md) license.
Authored and maintained by nidkil with help from [contributors](https://github.com/nidkil/use-pkg-version/contributors).

> [Website](https://github.com/nidkil) · GitHub [@nidkil](https://github.com/nidkil) · Twitter [@nidkil](https://twitter.com/nidkil)
