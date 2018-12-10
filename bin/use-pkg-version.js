#!/usr/bin/env node

const updater = require('update-notifier')
const pkg = require('../package.json')
const cli = require('../src/use-pkg-version-cli')

// Check if there is a new version of the module is available, if so show a warning message
updater({ pkg }).notify()
cli()
