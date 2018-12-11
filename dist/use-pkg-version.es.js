/*!
 * use-pkg-version v0.1.2
 * (c) 2018-present nidkil <info@nidkil.com> (https://www.nidkil.com)
 * Released under the MIT License.
 */
import fs from 'fs';
import path from 'path';
import cosmiconfig from 'cosmiconfig';
import slash from 'slash';
import commander from 'commander';
import chalk from 'chalk';
import envinfo from 'envinfo';

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');
}

function getCjsExportFromNamespace (n) {
	return n && n.default || n;
}

function getLineFromFile(filePath, lineNumber) {
  if (!fileExists(filePath)) {
    throw new Error('File does not exists: ' + filePath);
  }

  const data = fs.readFileSync(filePath).toString().split('\n');

  if (lineNumber <= data.length) {
    return data[lineNumber];
  }

  return '';
}

function addLineToFile(filePath, line, lineNumber = 0, emptyFile = false) {
  if (!fileExists(filePath)) {
    throw new Error('File does not exists: ' + filePath);
  }

  const data = emptyFile ? [] : fs.readFileSync(filePath).toString().split('\n');
  data.splice(lineNumber, 0, line);
  const content = data.join('\n');

  try {
    fs.writeFileSync(filePath, content);
    return true;
  } catch (err) {
    console.error(err.message, err.stack);
    return false;
  }
}

function createEmptyFile(filePath) {
  if (fileExists(filePath)) {
    throw new Error('File exists');
  }

  let fh = null;

  try {
    fh = fs.openSync(filePath, 'w');
  } catch (err) {
    console.error('Error creating empty file:', filePath);
  } finally {
    if (fh) fs.closeSync(fh);
  }
}

function createDirectory(dirPath) {
  if (directoryExists(dirPath)) {
    throw new Error('Directory exists');
  } else {
    fs.mkdirSync(dirPath);
  }
}

function deleteDirectory(dirPath) {
  if (directoryExists(dirPath)) {
    rmdirRecursive(dirPath);
    return true;
  }

  return false;
}

function deleteFile(filePath) {
  if (fileExists(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }

  return false;
}

function directoryExists(dir) {
  return fs.existsSync(dir) && fs.lstatSync(dir).isDirectory();
}

function fileExists(filePath) {
  return fs.existsSync(filePath) && fs.lstatSync(filePath).isFile();
} // eslint-disable-next-line no-unused-vars
/**
 * Remove directory even if it contains files or other directories. Comparable to Unix command 'rm -rf'.
 * @param {string} dirPath - Path to directory to remove including any directories or files it contains
 */


function rmdirRecursive(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach(function (entry) {
      const curPath = path.join(dirPath, entry);

      if (fs.lstatSync(curPath).isDirectory()) {
        rmdirRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
  }
}

var fsHelpers = {
  addLineToFile,
  createDirectory,
  createEmptyFile,
  deleteDirectory,
  deleteFile,
  directoryExists,
  fileExists,
  getLineFromFile,
  rmdirRecursive
};

/**
 * Starting from the directory specified by startDir it will try to load a configuration file that contains a
 * configuration object in the following places:
 * 1. A 'moduleName' property in the package.json file
 * 2. A '.<moduleName>rc' file with JSON or YAML syntax
 * 3. A '.<moduleName>rc.json' file
 * 4. A '.<moduleName>rc.yaml', '.<moduleName>rc.yml' or '.<moduleName>rc.js' file
 * 5. A '<moduleName>.config.js' file
 *
 * @param {string} startDir - The directory to look for the configuration file
 * @param {string} moduleName - The name of the module the configuration belongs to
 * @param {Object} defaults - Default configuration values
 * @returns {Object} The configuration object
 */


function loadConfig(startDir, moduleName, defaults = {}) {
  const explorer = cosmiconfig(moduleName);

  const _ref = explorer.searchSync(startDir) || {},
        _ref$config = _ref.config,
        config = _ref$config === void 0 ? {} : _ref$config;

  return Object.assign({}, defaults, config);
}

var loadConfig_1 = loadConfig;

var name = "use-pkg-version";
var version = "0.1.2";
var description = "Update any static file with the version number from the package.json file";
var keywords = [
	"javascript",
	"package.json",
	"npm",
	"build"
];
var author = "nidkil <info@nidkil.com> (https://www.nidkil.com)";
var license = "MIT";
var repository = {
	type: "git",
	url: "git+https://github.com/nidkil/use-pkg-version.git"
};
var bugs = {
	url: "https://github.com/nidkil/use-pkg-version/issues"
};
var homepage = "https://github.com/nidkil/use-pkg-version#readme";
var bin = "./bin/use-pkg-version.js";
var entry = "./src/use-pkg-version.cli.js";
var main = "./src/use-pkg-version.cli.cjs.js";
var module$1 = "./src/use-pkg-version.cli.es.js";
var browser = "./dist/use-pkg-version.min.js";
var unpkg = "./dist/use-pkg-version.min.js";
var files = [
	"LICENSE.md",
	"README.md",
	"bin",
	"dist",
	"src",
	"*.js",
	"*.json"
];
var scripts = {
	test: "DEBUG=stdout-stderr & jest",
	coverage: "npm run test -- --coverage",
	coveralls: "npm run coverage && cat ./coverage/lcov.info | coveralls",
	lint: "eslint -c .eslintrc.js --format codeframe bin src tests",
	"lint:fix": "eslint --fix -c .eslintrc.js --format codeframe bin src tests",
	"lint:error-only": "eslint -c .eslintrc.js --quiet --format codeframe src tests bin",
	"lint:check": "eslint --print-config .eslintrc.js | eslint-config-prettier-check",
	"cz:commit": "git cz",
	"cz:retry": "git cz --retry",
	commitlint: "commitlint",
	"commitlint:last": "commitlint --edit",
	"git:first": "git rev-list HEAD | tail -n 1",
	"git:last": "git rev-list HEAD | head -n 1",
	build: "rm -rf dist && bili --config .bili.config.json",
	release: "nodenv --env .env.local --exec release-it --verbose",
	"release-it": "release-it --verbose"
};
var engines = {
	node: ">=6"
};
var dependencies = {
	chalk: "^2.4.1",
	commander: "^2.19.0",
	cosmiconfig: "^5.0.7",
	envinfo: "^6.0.1",
	"replace-in-file": "^3.4.2",
	slash: "^2.0.0",
	"update-notifier": "^2.5.0"
};
var devDependencies = {
	"@commitlint/cli": "^7.2.1",
	"@commitlint/config-conventional": "^7.1.2",
	bili: "^3.4.2",
	"cz-conventional-changelog": "^2.1.0",
	debug: "^4.1.0",
	eslint: "^5.10.0",
	"eslint-config-prettier": "^3.3.0",
	"eslint-config-standard": "^12.0.0",
	"eslint-plugin-import": "^2.14.0",
	"eslint-plugin-jest": "^22.1.2",
	"eslint-plugin-node": "^8.0.0",
	"eslint-plugin-prettier": "^3.0.0",
	"eslint-plugin-promise": "^4.0.1",
	"eslint-plugin-standard": "^4.0.0",
	husky: "^1.2.0",
	jest: "^23.6.0",
	prettier: "^1.15.3",
	"release-it": "^8.3.0",
	"strip-ansi": "^5.0.0"
};
var config = {
	commitizen: {
		path: "./node_modules/cz-conventional-changelog"
	}
};
var _package = {
	name: name,
	version: version,
	description: description,
	keywords: keywords,
	author: author,
	license: license,
	repository: repository,
	bugs: bugs,
	homepage: homepage,
	bin: bin,
	entry: entry,
	main: main,
	module: module$1,
	browser: browser,
	unpkg: unpkg,
	files: files,
	scripts: scripts,
	engines: engines,
	dependencies: dependencies,
	devDependencies: devDependencies,
	config: config
};

var _package$1 = /*#__PURE__*/Object.freeze({
	name: name,
	version: version,
	description: description,
	keywords: keywords,
	author: author,
	license: license,
	repository: repository,
	bugs: bugs,
	homepage: homepage,
	bin: bin,
	entry: entry,
	main: main,
	module: module$1,
	browser: browser,
	unpkg: unpkg,
	files: files,
	scripts: scripts,
	engines: engines,
	dependencies: dependencies,
	devDependencies: devDependencies,
	config: config,
	default: _package
});

var require$$0 = getCjsExportFromNamespace(_package$1);

const fileExists$1 = fsHelpers.fileExists;



let verbose = false;
let debug = true;
const defaults = {
  name: require$$0.name,
  packageFile: 'package.json',
  commands: ['update', 'info']
};

function createCmdModule(cmd) {
  return `./commands/${cmd._name}.cmd`;
}

function camelcase(str) {
  return str.replace(/-(\w)/g, (_, c) => c ? c.toUpperCase() : '');
} // Commander passes the Command object itself as options, extract only actual options into a fresh object,
// camelcase them and remove leading dashes


function cleanArgs(cmd, file = null) {
  const args = {
    cmd: cmd._name,
    file
  };
  cmd.options.forEach(opt => {
    const key = camelcase(opt.long.replace(/^--/, '')); // If an option is not present and Command has a method with the same name it should not be copied

    if (typeof cmd[key] !== 'function' && typeof cmd[key] !== 'undefined') {
      args[key] = cmd[key];
    }
  });
  return args;
} // All directories and files are relative to the current working directory (cwd), add the cwd to options so that
// individual commands do not have to handle this themselves


function enrichArgs(args) {
  const packageFile = args && args.packageFile ? args.packageFile : defaults.packageFile;
  args.packageFile = slash(path.join(process.cwd(), packageFile));

  if (args && args.file) {
    const updateFile = slash(path.join(process.cwd(), args.file));
    args.updateFile = updateFile;
  }

  debug && console.log('enrichArgs', JSON.stringify(args, null, '\t'));
  return args;
} // Lets check that directories and files exist, so that individual commands do not have to handle this themselves


function checkArgs(args) {
  if (args) {
    if (args.packageFile && !fileExists$1(args.packageFile)) {
      debug && console.log('checkArgs', JSON.stringify(args, null, '\t'));
      console.error(chalk.red('package.json not found: ' + args.packageFile));
      process.exit(1);
    }

    if (args.filePath && !fileExists$1(args.filePath)) {
      debug && console.log('checkArgs', JSON.stringify(args, null, '\t'));
      console.error(chalk.red('File does not exist: ' + args.filePath));
      process.exit(2);
    }
  }

  return args;
} // Merge the args and config, args overrule config options


function mergeArgsAndConfig(args, config) {
  const merged = Object.assign({}, config, args);
  debug && console.log('mergeArgsAndConfig\nargs:', JSON.stringify(args, null, '\t'), ',\nconfig:', JSON.stringify(config, null, '\t'), ',\nmerged:', JSON.stringify(merged, null, '\t'));
  return merged;
}

function cli() {
  commander.version(require$$0.version).usage('<command> [options]');
  commander.command('update <file>').description('update the version number in the specified file with the version number from the package.json file, the file must be relevant to the current directory').option('-p, --package-file [filename]', 'path to the package.json file relevant to the current directory, default ' + `'${defaults.packageFile}'`, defaults.packageFile).option('-d, --dry', 'dry run, only shows which file will be updated but does not actually update anything').option('-c, --config', 'configuration file that contains the string to search for and replace with').option('-s, --search-for [regex]', 'string to search for, can be a regex expression').option('-r, --replace-with [string]', 'value to replace with, must contain the {{version}} placeholder for the version number').option('-v, --verbose', 'show processing information, default false').option('-q, --quiet', 'report errors only, default false').option('-D, --debug', 'show debugging information, default false').action(function (file, options) {
    const config = loadConfig_1(process.cwd(), defaults.name);
    debug = options.debug || config.debug || false;
    verbose = options.verbose || config.verbose || false;
    debug && console.log('loadConfig', JSON.stringify(config, null, '\t'));

    const cmd = commonjsRequire(createCmdModule(options));

    cmd(checkArgs(enrichArgs(mergeArgsAndConfig(cleanArgs(options, file), config))));
  });
  commander.command('info').description('print debugging information about your environment').action(cmd => {
    console.log(chalk.bold('\nEnvironment Info:'));

    envinfo.run({
      System: ['OS', 'CPU'],
      Binaries: ['Node', 'Yarn', 'npm'],
      Browsers: ['Chrome', 'Edge', 'Firefox', 'Safari'],
      npmPackages: '',
      npmGlobalPackages: []
    }, {
      showNotFound: true,
      duplicates: true,
      fullTree: true
    }).then(console.log);
  }); // Output help information if command is unknown

  commander.arguments('<command>').action(cmd => {
    commander.outputHelp();
    console.log('  ' + chalk.red(`Unknown command ${chalk.red(cmd)}.`));
    console.log();
  }); // Add additional information to the main help

  commander.on('--help', function () {
    console.log();
    console.log(`  Run ${chalk.cyan(`${defaults.name} <command> --help`)} for detailed usage of given command.`);
    console.log();
  }); // Placeholder to add additional help to the help of specific commands

  commander.commands.forEach(cmd => cmd.on('--help', () => console.log()));
  commander.parse(process.argv);

  if (!process.argv.slice(2).length) {
    commander.outputHelp();
  }
}

var usePkgVersionCli = cli;

export default usePkgVersionCli;
