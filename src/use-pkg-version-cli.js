const slash = require('slash')
const path = require('path')
const program = require('commander')
const chalk = require('chalk')
const { directoryExists, fileExists } = require('./common/fs-helpers')

let verbose = false
let debug = true

const defaults = {
  name: 'use-pkg-version',
  packageFile: 'package.json',
  commands: ['update', 'info']
}

function createCmdModule(cmd) {
  return `./commands/${cmd._name}.cmd`
}

function camelcase(str) {
  return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''))
}

// Commander passes the Command object itself as options, extract only actual options into a fresh object,
// camelcase them and remove leading dashes
function cleanArgs(cmd, file = null) {
  const args = {
    cmd: cmd._name,
    file
  }
  cmd.options.forEach(opt => {
    const key = camelcase(opt.long.replace(/^--/, ''))
    // If an option is not present and Command has a method with the same name it should not be copied
    if (typeof cmd[key] !== 'function' && typeof cmd[key] !== 'undefined') {
      args[key] = cmd[key]
    }
  })
  return args
}

// All directories and files are relative to the current working directory (cwd), add the cwd to options so that
// individual commands do not have to handle this themselves
function enrichArgs(args) {
  const packageFile =
    args && args.packageFile ? args.packageFile : defaults.packageFile
  args.packageFile = slash(path.join(process.cwd(), packageFile))
  if (args && args.file) {
    const filePath = slash(path.join(process.cwd(), args.file))
    args.filePath = filePath
  }
  debug && console.log('enrichArgs', JSON.stringify(args, null, '\t'))
  return args
}

// Lets check that directories and files exist, so that individual commands do not have to handle this themselves
function checkArgs(args) {
  if (args) {
    if (args.packageFile && !fileExists(args.packageFile)) {
      debug && console.log('checkArgs', JSON.stringify(args, null, '\t'))
      console.error(chalk.red('package.json not found: ' + args.packageFile))
      process.exit(1)
    }
    if (args.filePath && !fileExists(args.filePath)) {
      debug && console.log('checkArgs', JSON.stringify(args, null, '\t'))
      console.error(chalk.red('File does not exist: ' + args.filePath))
      process.exit(2)
    }
  }
  return args
}

function cli() {
  program
    .version(require('../package.json').version)
    .usage('<command> [options]')

  program
    .command('update <file>')
    .description(
      'update the version number in the specified file with the version number from the package.json file, the file must be relevant to the current directory'
    )
    .option(
      '-p, --package-file',
      'path to the package.json file relevant to the current directory, default ' +
        `'${defaults.packageFile}'`,
      defaults.packageFile
    )
    .option(
      '-d, --dry',
      'dry run, only shows which file will be updated but does not actually update anything'
    )
    .option('-v, --verbose', 'show processing information, default false')
    .option('-q, --quiet', 'report errors only, default false')
    .option('-D, --debug', 'show debugging information, default false')
    .action(function(file, options) {
      debug = options.debug || false
      verbose = options.verbose || false
      const cmd = require(createCmdModule(options))
      cmd(checkArgs(enrichArgs(cleanArgs(options, file))))
    })

  program
    .command('info')
    .description('print debugging information about your environment')
    .action(cmd => {
      console.log(chalk.bold('\nEnvironment Info:'))
      require('envinfo')
        .run(
          {
            System: ['OS', 'CPU'],
            Binaries: ['Node', 'Yarn', 'npm'],
            Browsers: ['Chrome', 'Edge', 'Firefox', 'Safari'],
            npmPackages: '',
            npmGlobalPackages: []
          },
          {
            showNotFound: true,
            duplicates: true,
            fullTree: true
          }
        )
        .then(console.log)
    })

  // Output help information if command is unknown
  program.arguments('<command>').action(cmd => {
    program.outputHelp()
    console.log('  ' + chalk.red(`Unknown command ${chalk.red(cmd)}.`))
    console.log()
  })

  // Add additional information to the main help
  program.on('--help', function() {
    console.log()
    console.log(
      `  Run ${chalk.cyan(
        `${defaults.name} <command> --help`
      )} for detailed usage of given command.`
    )
    console.log()
  })

  // Placeholder to add additional help to the help of specific commands
  program.commands.forEach(cmd => cmd.on('--help', () => console.log()))

  program.parse(process.argv)

  if (!process.argv.slice(2).length) {
    program.outputHelp()
  }
}

module.exports = cli
