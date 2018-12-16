#!/usr/bin/env node

const updater = require('update-notifier')
const pkg = require('../package.json')
const chalk = require('chalk')

function isDebug() {
  return process.argv.indexOf('--debug') > -1 || process.argv.indexOf('-D') > -1
}

let cli = null
try {
  // First try to load dist version
  cli = require('../dist/use-pkg-version.es')
  if (isDebug()) console.log(chalk.green('Using dist version'))
} catch (e) {
  // Fallback to src version
  cli = require('../src/use-pkg-version-cli')
  if (isDebug()) {
    console.log(chalk.red('Using src version (fallback)'), e.message, e.stack.split('\n')[0])
  }
}

// Check if there is a new version of the module is available, if so show a warning message (interval: 24 hrs)
updater({ pkg, updateCheckInterval: 24 * 60 * 60 * 1000 }).notify()

cli()
