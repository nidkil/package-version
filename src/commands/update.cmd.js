const replace = require('replace-in-file')
const { fileExists } = require('@/common/fs-helpers')
const chalk = require('chalk')

const defaults = {
  placeholder: '{{version}}',
  dry: false
}

// Enable or disable verbose output
let verbose = false
// Enable or disable quiet mode
let quiet = false

function validateOptions(options) {
  if (!options.updateFile) {
    throw new Error('The file to update must be specified (updateFile)')
  }
  if (!fileExists(options.updateFile)) {
    throw new Error('File not found: ' + options.updateFile)
  }
  if (!options.packageFile) {
    throw new Error('The package.json file must be specified (packageFile)')
  }
  if (!fileExists(options.packageFile)) {
    throw new Error('File not found: ' + options.packageFile)
  }
  if (!options.findRegex) {
    throw new Error('The regex expression to search for must be specified (findRegex)')
  }
  if (!options.replaceWith) {
    throw new Error('The value to replace the found value with not specified (replaceWith)')
  }
}

function updateVersion (options) {
  validateOptions(options)

  const _options = Object.assign({}, defaults, options)
  let compiledRegex = null

  try {
    compiledRegex = new RegExp(options.findRegex)
  } catch(err) {
    throw new Error('Invalid regex: ' + err.message)
  }
  if (options.replaceWith.indexOf(_options.placeholder) === -1) {
    throw new Error(`Version number placeholder '${_options.placeholder}' not specified in 'replaceWith'`)
  }

  verbose = options && options.verbose ? options.verbose : false
  quiet = options && options.quiet ? options.quiet : false

  verbose && console.log('options', JSON.stringify(_options, null, '\t'))

  const pkg = require(_options.packageFile)

  _options.replaceWith = _options.replaceWith.replace(_options.placeholder, pkg.version)

  const replaceOptions = {
    files: _options.updateFile,
    from: compiledRegex,
    to: _options.replaceWith,
    dry: _options.dry
  }

  verbose && console.log('replaceOptions', JSON.stringify(replaceOptions, null, '\t'))

  try {
    const changes = replace.sync(replaceOptions)
    if (!quiet) {
      if (changes && changes.length > 0) {
        console.log(chalk.green('Version number updated'))
      } else {
        console.log(chalk.red('Version number not updated'))
      }
    }
  } catch (err) {
    console.error('Error occurred:', err)
  }
}

module.exports = updateVersion
