/*!
 * use-pkg-version v0.1.1
 * (c) 2018-present nidkil <info@nidkil.com> (https://www.nidkil.com)
 * Released under the MIT License.
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('events'), require('child_process'), require('path'), require('fs'), require('util'), require('os'), require('module'), require('assert')) :
	typeof define === 'function' && define.amd ? define(['events', 'child_process', 'path', 'fs', 'util', 'os', 'module', 'assert'], factory) :
	(global['use-pkg-version'] = factory(global.events,global.child_process,global.path,global.fs,global.util,global.os,global.module$1,global.assert));
}(this, (function (events,child_process,path,fs,util,os,module$1,assert) { 'use strict';

	events = events && events.hasOwnProperty('default') ? events['default'] : events;
	child_process = child_process && child_process.hasOwnProperty('default') ? child_process['default'] : child_process;
	path = path && path.hasOwnProperty('default') ? path['default'] : path;
	fs = fs && fs.hasOwnProperty('default') ? fs['default'] : fs;
	util = util && util.hasOwnProperty('default') ? util['default'] : util;
	os = os && os.hasOwnProperty('default') ? os['default'] : os;
	module$1 = module$1 && module$1.hasOwnProperty('default') ? module$1['default'] : module$1;
	assert = assert && assert.hasOwnProperty('default') ? assert['default'] : assert;

	var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function commonjsRequire () {
		throw new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');
	}

	function unwrapExports (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x.default : x;
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	function getCjsExportFromNamespace (n) {
		return n && n.default || n;
	}

	var slash = input => {
		const isExtendedLengthPath = /^\\\\\?\\/.test(input);
		const hasNonAscii = /[^\u0000-\u0080]+/.test(input); // eslint-disable-line no-control-regex

		if (isExtendedLengthPath || hasNonAscii) {
			return input;
		}

		return input.replace(/\\/g, '/');
	};

	var commander = createCommonjsModule(function (module, exports) {
	/**
	 * Module dependencies.
	 */

	var EventEmitter = events.EventEmitter;
	var spawn = child_process.spawn;

	var dirname = path.dirname;
	var basename = path.basename;


	/**
	 * Inherit `Command` from `EventEmitter.prototype`.
	 */

	util.inherits(Command, EventEmitter);

	/**
	 * Expose the root command.
	 */

	exports = module.exports = new Command();

	/**
	 * Expose `Command`.
	 */

	exports.Command = Command;

	/**
	 * Expose `Option`.
	 */

	exports.Option = Option;

	/**
	 * Initialize a new `Option` with the given `flags` and `description`.
	 *
	 * @param {String} flags
	 * @param {String} description
	 * @api public
	 */

	function Option(flags, description) {
	  this.flags = flags;
	  this.required = flags.indexOf('<') >= 0;
	  this.optional = flags.indexOf('[') >= 0;
	  this.bool = flags.indexOf('-no-') === -1;
	  flags = flags.split(/[ ,|]+/);
	  if (flags.length > 1 && !/^[[<]/.test(flags[1])) this.short = flags.shift();
	  this.long = flags.shift();
	  this.description = description || '';
	}

	/**
	 * Return option name.
	 *
	 * @return {String}
	 * @api private
	 */

	Option.prototype.name = function() {
	  return this.long
	    .replace('--', '')
	    .replace('no-', '');
	};

	/**
	 * Return option name, in a camelcase format that can be used
	 * as a object attribute key.
	 *
	 * @return {String}
	 * @api private
	 */

	Option.prototype.attributeName = function() {
	  return camelcase(this.name());
	};

	/**
	 * Check if `arg` matches the short or long flag.
	 *
	 * @param {String} arg
	 * @return {Boolean}
	 * @api private
	 */

	Option.prototype.is = function(arg) {
	  return this.short === arg || this.long === arg;
	};

	/**
	 * Initialize a new `Command`.
	 *
	 * @param {String} name
	 * @api public
	 */

	function Command(name) {
	  this.commands = [];
	  this.options = [];
	  this._execs = {};
	  this._allowUnknownOption = false;
	  this._args = [];
	  this._name = name || '';
	}

	/**
	 * Add command `name`.
	 *
	 * The `.action()` callback is invoked when the
	 * command `name` is specified via __ARGV__,
	 * and the remaining arguments are applied to the
	 * function for access.
	 *
	 * When the `name` is "*" an un-matched command
	 * will be passed as the first arg, followed by
	 * the rest of __ARGV__ remaining.
	 *
	 * Examples:
	 *
	 *      program
	 *        .version('0.0.1')
	 *        .option('-C, --chdir <path>', 'change the working directory')
	 *        .option('-c, --config <path>', 'set config path. defaults to ./deploy.conf')
	 *        .option('-T, --no-tests', 'ignore test hook')
	 *
	 *      program
	 *        .command('setup')
	 *        .description('run remote setup commands')
	 *        .action(function() {
	 *          console.log('setup');
	 *        });
	 *
	 *      program
	 *        .command('exec <cmd>')
	 *        .description('run the given remote command')
	 *        .action(function(cmd) {
	 *          console.log('exec "%s"', cmd);
	 *        });
	 *
	 *      program
	 *        .command('teardown <dir> [otherDirs...]')
	 *        .description('run teardown commands')
	 *        .action(function(dir, otherDirs) {
	 *          console.log('dir "%s"', dir);
	 *          if (otherDirs) {
	 *            otherDirs.forEach(function (oDir) {
	 *              console.log('dir "%s"', oDir);
	 *            });
	 *          }
	 *        });
	 *
	 *      program
	 *        .command('*')
	 *        .description('deploy the given env')
	 *        .action(function(env) {
	 *          console.log('deploying "%s"', env);
	 *        });
	 *
	 *      program.parse(process.argv);
	  *
	 * @param {String} name
	 * @param {String} [desc] for git-style sub-commands
	 * @return {Command} the new command
	 * @api public
	 */

	Command.prototype.command = function(name, desc, opts) {
	  if (typeof desc === 'object' && desc !== null) {
	    opts = desc;
	    desc = null;
	  }
	  opts = opts || {};
	  var args = name.split(/ +/);
	  var cmd = new Command(args.shift());

	  if (desc) {
	    cmd.description(desc);
	    this.executables = true;
	    this._execs[cmd._name] = true;
	    if (opts.isDefault) this.defaultExecutable = cmd._name;
	  }
	  cmd._noHelp = !!opts.noHelp;
	  this.commands.push(cmd);
	  cmd.parseExpectedArgs(args);
	  cmd.parent = this;

	  if (desc) return this;
	  return cmd;
	};

	/**
	 * Define argument syntax for the top-level command.
	 *
	 * @api public
	 */

	Command.prototype.arguments = function(desc) {
	  return this.parseExpectedArgs(desc.split(/ +/));
	};

	/**
	 * Add an implicit `help [cmd]` subcommand
	 * which invokes `--help` for the given command.
	 *
	 * @api private
	 */

	Command.prototype.addImplicitHelpCommand = function() {
	  this.command('help [cmd]', 'display help for [cmd]');
	};

	/**
	 * Parse expected `args`.
	 *
	 * For example `["[type]"]` becomes `[{ required: false, name: 'type' }]`.
	 *
	 * @param {Array} args
	 * @return {Command} for chaining
	 * @api public
	 */

	Command.prototype.parseExpectedArgs = function(args) {
	  if (!args.length) return;
	  var self = this;
	  args.forEach(function(arg) {
	    var argDetails = {
	      required: false,
	      name: '',
	      variadic: false
	    };

	    switch (arg[0]) {
	      case '<':
	        argDetails.required = true;
	        argDetails.name = arg.slice(1, -1);
	        break;
	      case '[':
	        argDetails.name = arg.slice(1, -1);
	        break;
	    }

	    if (argDetails.name.length > 3 && argDetails.name.slice(-3) === '...') {
	      argDetails.variadic = true;
	      argDetails.name = argDetails.name.slice(0, -3);
	    }
	    if (argDetails.name) {
	      self._args.push(argDetails);
	    }
	  });
	  return this;
	};

	/**
	 * Register callback `fn` for the command.
	 *
	 * Examples:
	 *
	 *      program
	 *        .command('help')
	 *        .description('display verbose help')
	 *        .action(function() {
	 *           // output help here
	 *        });
	 *
	 * @param {Function} fn
	 * @return {Command} for chaining
	 * @api public
	 */

	Command.prototype.action = function(fn) {
	  var self = this;
	  var listener = function(args, unknown) {
	    // Parse any so-far unknown options
	    args = args || [];
	    unknown = unknown || [];

	    var parsed = self.parseOptions(unknown);

	    // Output help if necessary
	    outputHelpIfNecessary(self, parsed.unknown);

	    // If there are still any unknown options, then we simply
	    // die, unless someone asked for help, in which case we give it
	    // to them, and then we die.
	    if (parsed.unknown.length > 0) {
	      self.unknownOption(parsed.unknown[0]);
	    }

	    // Leftover arguments need to be pushed back. Fixes issue #56
	    if (parsed.args.length) args = parsed.args.concat(args);

	    self._args.forEach(function(arg, i) {
	      if (arg.required && args[i] == null) {
	        self.missingArgument(arg.name);
	      } else if (arg.variadic) {
	        if (i !== self._args.length - 1) {
	          self.variadicArgNotLast(arg.name);
	        }

	        args[i] = args.splice(i);
	      }
	    });

	    // Always append ourselves to the end of the arguments,
	    // to make sure we match the number of arguments the user
	    // expects
	    if (self._args.length) {
	      args[self._args.length] = self;
	    } else {
	      args.push(self);
	    }

	    fn.apply(self, args);
	  };
	  var parent = this.parent || this;
	  var name = parent === this ? '*' : this._name;
	  parent.on('command:' + name, listener);
	  if (this._alias) parent.on('command:' + this._alias, listener);
	  return this;
	};

	/**
	 * Define option with `flags`, `description` and optional
	 * coercion `fn`.
	 *
	 * The `flags` string should contain both the short and long flags,
	 * separated by comma, a pipe or space. The following are all valid
	 * all will output this way when `--help` is used.
	 *
	 *    "-p, --pepper"
	 *    "-p|--pepper"
	 *    "-p --pepper"
	 *
	 * Examples:
	 *
	 *     // simple boolean defaulting to false
	 *     program.option('-p, --pepper', 'add pepper');
	 *
	 *     --pepper
	 *     program.pepper
	 *     // => Boolean
	 *
	 *     // simple boolean defaulting to true
	 *     program.option('-C, --no-cheese', 'remove cheese');
	 *
	 *     program.cheese
	 *     // => true
	 *
	 *     --no-cheese
	 *     program.cheese
	 *     // => false
	 *
	 *     // required argument
	 *     program.option('-C, --chdir <path>', 'change the working directory');
	 *
	 *     --chdir /tmp
	 *     program.chdir
	 *     // => "/tmp"
	 *
	 *     // optional argument
	 *     program.option('-c, --cheese [type]', 'add cheese [marble]');
	 *
	 * @param {String} flags
	 * @param {String} description
	 * @param {Function|*} [fn] or default
	 * @param {*} [defaultValue]
	 * @return {Command} for chaining
	 * @api public
	 */

	Command.prototype.option = function(flags, description, fn, defaultValue) {
	  var self = this,
	    option = new Option(flags, description),
	    oname = option.name(),
	    name = option.attributeName();

	  // default as 3rd arg
	  if (typeof fn !== 'function') {
	    if (fn instanceof RegExp) {
	      var regex = fn;
	      fn = function(val, def) {
	        var m = regex.exec(val);
	        return m ? m[0] : def;
	      };
	    } else {
	      defaultValue = fn;
	      fn = null;
	    }
	  }

	  // preassign default value only for --no-*, [optional], or <required>
	  if (!option.bool || option.optional || option.required) {
	    // when --no-* we make sure default is true
	    if (!option.bool) defaultValue = true;
	    // preassign only if we have a default
	    if (defaultValue !== undefined) {
	      self[name] = defaultValue;
	      option.defaultValue = defaultValue;
	    }
	  }

	  // register the option
	  this.options.push(option);

	  // when it's passed assign the value
	  // and conditionally invoke the callback
	  this.on('option:' + oname, function(val) {
	    // coercion
	    if (val !== null && fn) {
	      val = fn(val, self[name] === undefined ? defaultValue : self[name]);
	    }

	    // unassigned or bool
	    if (typeof self[name] === 'boolean' || typeof self[name] === 'undefined') {
	      // if no value, bool true, and we have a default, then use it!
	      if (val == null) {
	        self[name] = option.bool
	          ? defaultValue || true
	          : false;
	      } else {
	        self[name] = val;
	      }
	    } else if (val !== null) {
	      // reassign
	      self[name] = val;
	    }
	  });

	  return this;
	};

	/**
	 * Allow unknown options on the command line.
	 *
	 * @param {Boolean} arg if `true` or omitted, no error will be thrown
	 * for unknown options.
	 * @api public
	 */
	Command.prototype.allowUnknownOption = function(arg) {
	  this._allowUnknownOption = arguments.length === 0 || arg;
	  return this;
	};

	/**
	 * Parse `argv`, settings options and invoking commands when defined.
	 *
	 * @param {Array} argv
	 * @return {Command} for chaining
	 * @api public
	 */

	Command.prototype.parse = function(argv) {
	  // implicit help
	  if (this.executables) this.addImplicitHelpCommand();

	  // store raw args
	  this.rawArgs = argv;

	  // guess name
	  this._name = this._name || basename(argv[1], '.js');

	  // github-style sub-commands with no sub-command
	  if (this.executables && argv.length < 3 && !this.defaultExecutable) {
	    // this user needs help
	    argv.push('--help');
	  }

	  // process argv
	  var parsed = this.parseOptions(this.normalize(argv.slice(2)));
	  var args = this.args = parsed.args;

	  var result = this.parseArgs(this.args, parsed.unknown);

	  // executable sub-commands
	  var name = result.args[0];

	  var aliasCommand = null;
	  // check alias of sub commands
	  if (name) {
	    aliasCommand = this.commands.filter(function(command) {
	      return command.alias() === name;
	    })[0];
	  }

	  if (this._execs[name] && typeof this._execs[name] !== 'function') {
	    return this.executeSubCommand(argv, args, parsed.unknown);
	  } else if (aliasCommand) {
	    // is alias of a subCommand
	    args[0] = aliasCommand._name;
	    return this.executeSubCommand(argv, args, parsed.unknown);
	  } else if (this.defaultExecutable) {
	    // use the default subcommand
	    args.unshift(this.defaultExecutable);
	    return this.executeSubCommand(argv, args, parsed.unknown);
	  }

	  return result;
	};

	/**
	 * Execute a sub-command executable.
	 *
	 * @param {Array} argv
	 * @param {Array} args
	 * @param {Array} unknown
	 * @api private
	 */

	Command.prototype.executeSubCommand = function(argv, args, unknown) {
	  args = args.concat(unknown);

	  if (!args.length) this.help();
	  if (args[0] === 'help' && args.length === 1) this.help();

	  // <cmd> --help
	  if (args[0] === 'help') {
	    args[0] = args[1];
	    args[1] = '--help';
	  }

	  // executable
	  var f = argv[1];
	  // name of the subcommand, link `pm-install`
	  var bin = basename(f, path.extname(f)) + '-' + args[0];

	  // In case of globally installed, get the base dir where executable
	  //  subcommand file should be located at
	  var baseDir,
	    link = fs.lstatSync(f).isSymbolicLink() ? fs.readlinkSync(f) : f;

	  // when symbolink is relative path
	  if (link !== f && link.charAt(0) !== '/') {
	    link = path.join(dirname(f), link);
	  }
	  baseDir = dirname(link);

	  // prefer local `./<bin>` to bin in the $PATH
	  var localBin = path.join(baseDir, bin);

	  // whether bin file is a js script with explicit `.js` or `.ts` extension
	  var isExplicitJS = false;
	  if (exists(localBin + '.js')) {
	    bin = localBin + '.js';
	    isExplicitJS = true;
	  } else if (exists(localBin + '.ts')) {
	    bin = localBin + '.ts';
	    isExplicitJS = true;
	  } else if (exists(localBin)) {
	    bin = localBin;
	  }

	  args = args.slice(1);

	  var proc;
	  if (process.platform !== 'win32') {
	    if (isExplicitJS) {
	      args.unshift(bin);
	      // add executable arguments to spawn
	      args = (process.execArgv || []).concat(args);

	      proc = spawn(process.argv[0], args, { stdio: 'inherit', customFds: [0, 1, 2] });
	    } else {
	      proc = spawn(bin, args, { stdio: 'inherit', customFds: [0, 1, 2] });
	    }
	  } else {
	    args.unshift(bin);
	    proc = spawn(process.execPath, args, { stdio: 'inherit' });
	  }

	  var signals = ['SIGUSR1', 'SIGUSR2', 'SIGTERM', 'SIGINT', 'SIGHUP'];
	  signals.forEach(function(signal) {
	    process.on(signal, function() {
	      if (proc.killed === false && proc.exitCode === null) {
	        proc.kill(signal);
	      }
	    });
	  });
	  proc.on('close', process.exit.bind(process));
	  proc.on('error', function(err) {
	    if (err.code === 'ENOENT') {
	      console.error('error: %s(1) does not exist, try --help', bin);
	    } else if (err.code === 'EACCES') {
	      console.error('error: %s(1) not executable. try chmod or run with root', bin);
	    }
	    process.exit(1);
	  });

	  // Store the reference to the child process
	  this.runningCommand = proc;
	};

	/**
	 * Normalize `args`, splitting joined short flags. For example
	 * the arg "-abc" is equivalent to "-a -b -c".
	 * This also normalizes equal sign and splits "--abc=def" into "--abc def".
	 *
	 * @param {Array} args
	 * @return {Array}
	 * @api private
	 */

	Command.prototype.normalize = function(args) {
	  var ret = [],
	    arg,
	    lastOpt,
	    index;

	  for (var i = 0, len = args.length; i < len; ++i) {
	    arg = args[i];
	    if (i > 0) {
	      lastOpt = this.optionFor(args[i - 1]);
	    }

	    if (arg === '--') {
	      // Honor option terminator
	      ret = ret.concat(args.slice(i));
	      break;
	    } else if (lastOpt && lastOpt.required) {
	      ret.push(arg);
	    } else if (arg.length > 1 && arg[0] === '-' && arg[1] !== '-') {
	      arg.slice(1).split('').forEach(function(c) {
	        ret.push('-' + c);
	      });
	    } else if (/^--/.test(arg) && ~(index = arg.indexOf('='))) {
	      ret.push(arg.slice(0, index), arg.slice(index + 1));
	    } else {
	      ret.push(arg);
	    }
	  }

	  return ret;
	};

	/**
	 * Parse command `args`.
	 *
	 * When listener(s) are available those
	 * callbacks are invoked, otherwise the "*"
	 * event is emitted and those actions are invoked.
	 *
	 * @param {Array} args
	 * @return {Command} for chaining
	 * @api private
	 */

	Command.prototype.parseArgs = function(args, unknown) {
	  var name;

	  if (args.length) {
	    name = args[0];
	    if (this.listeners('command:' + name).length) {
	      this.emit('command:' + args.shift(), args, unknown);
	    } else {
	      this.emit('command:*', args);
	    }
	  } else {
	    outputHelpIfNecessary(this, unknown);

	    // If there were no args and we have unknown options,
	    // then they are extraneous and we need to error.
	    if (unknown.length > 0) {
	      this.unknownOption(unknown[0]);
	    }
	    if (this.commands.length === 0 &&
	        this._args.filter(function(a) { return a.required }).length === 0) {
	      this.emit('command:*');
	    }
	  }

	  return this;
	};

	/**
	 * Return an option matching `arg` if any.
	 *
	 * @param {String} arg
	 * @return {Option}
	 * @api private
	 */

	Command.prototype.optionFor = function(arg) {
	  for (var i = 0, len = this.options.length; i < len; ++i) {
	    if (this.options[i].is(arg)) {
	      return this.options[i];
	    }
	  }
	};

	/**
	 * Parse options from `argv` returning `argv`
	 * void of these options.
	 *
	 * @param {Array} argv
	 * @return {Array}
	 * @api public
	 */

	Command.prototype.parseOptions = function(argv) {
	  var args = [],
	    len = argv.length,
	    literal,
	    option,
	    arg;

	  var unknownOptions = [];

	  // parse options
	  for (var i = 0; i < len; ++i) {
	    arg = argv[i];

	    // literal args after --
	    if (literal) {
	      args.push(arg);
	      continue;
	    }

	    if (arg === '--') {
	      literal = true;
	      continue;
	    }

	    // find matching Option
	    option = this.optionFor(arg);

	    // option is defined
	    if (option) {
	      // requires arg
	      if (option.required) {
	        arg = argv[++i];
	        if (arg == null) return this.optionMissingArgument(option);
	        this.emit('option:' + option.name(), arg);
	      // optional arg
	      } else if (option.optional) {
	        arg = argv[i + 1];
	        if (arg == null || (arg[0] === '-' && arg !== '-')) {
	          arg = null;
	        } else {
	          ++i;
	        }
	        this.emit('option:' + option.name(), arg);
	      // bool
	      } else {
	        this.emit('option:' + option.name());
	      }
	      continue;
	    }

	    // looks like an option
	    if (arg.length > 1 && arg[0] === '-') {
	      unknownOptions.push(arg);

	      // If the next argument looks like it might be
	      // an argument for this option, we pass it on.
	      // If it isn't, then it'll simply be ignored
	      if ((i + 1) < argv.length && argv[i + 1][0] !== '-') {
	        unknownOptions.push(argv[++i]);
	      }
	      continue;
	    }

	    // arg
	    args.push(arg);
	  }

	  return { args: args, unknown: unknownOptions };
	};

	/**
	 * Return an object containing options as key-value pairs
	 *
	 * @return {Object}
	 * @api public
	 */
	Command.prototype.opts = function() {
	  var result = {},
	    len = this.options.length;

	  for (var i = 0; i < len; i++) {
	    var key = this.options[i].attributeName();
	    result[key] = key === this._versionOptionName ? this._version : this[key];
	  }
	  return result;
	};

	/**
	 * Argument `name` is missing.
	 *
	 * @param {String} name
	 * @api private
	 */

	Command.prototype.missingArgument = function(name) {
	  console.error("error: missing required argument `%s'", name);
	  process.exit(1);
	};

	/**
	 * `Option` is missing an argument, but received `flag` or nothing.
	 *
	 * @param {String} option
	 * @param {String} flag
	 * @api private
	 */

	Command.prototype.optionMissingArgument = function(option, flag) {
	  if (flag) {
	    console.error("error: option `%s' argument missing, got `%s'", option.flags, flag);
	  } else {
	    console.error("error: option `%s' argument missing", option.flags);
	  }
	  process.exit(1);
	};

	/**
	 * Unknown option `flag`.
	 *
	 * @param {String} flag
	 * @api private
	 */

	Command.prototype.unknownOption = function(flag) {
	  if (this._allowUnknownOption) return;
	  console.error("error: unknown option `%s'", flag);
	  process.exit(1);
	};

	/**
	 * Variadic argument with `name` is not the last argument as required.
	 *
	 * @param {String} name
	 * @api private
	 */

	Command.prototype.variadicArgNotLast = function(name) {
	  console.error("error: variadic arguments must be last `%s'", name);
	  process.exit(1);
	};

	/**
	 * Set the program version to `str`.
	 *
	 * This method auto-registers the "-V, --version" flag
	 * which will print the version number when passed.
	 *
	 * @param {String} str
	 * @param {String} [flags]
	 * @return {Command} for chaining
	 * @api public
	 */

	Command.prototype.version = function(str, flags) {
	  if (arguments.length === 0) return this._version;
	  this._version = str;
	  flags = flags || '-V, --version';
	  var versionOption = new Option(flags, 'output the version number');
	  this._versionOptionName = versionOption.long.substr(2) || 'version';
	  this.options.push(versionOption);
	  this.on('option:' + this._versionOptionName, function() {
	    process.stdout.write(str + '\n');
	    process.exit(0);
	  });
	  return this;
	};

	/**
	 * Set the description to `str`.
	 *
	 * @param {String} str
	 * @param {Object} argsDescription
	 * @return {String|Command}
	 * @api public
	 */

	Command.prototype.description = function(str, argsDescription) {
	  if (arguments.length === 0) return this._description;
	  this._description = str;
	  this._argsDescription = argsDescription;
	  return this;
	};

	/**
	 * Set an alias for the command
	 *
	 * @param {String} alias
	 * @return {String|Command}
	 * @api public
	 */

	Command.prototype.alias = function(alias) {
	  var command = this;
	  if (this.commands.length !== 0) {
	    command = this.commands[this.commands.length - 1];
	  }

	  if (arguments.length === 0) return command._alias;

	  if (alias === command._name) throw new Error('Command alias can\'t be the same as its name');

	  command._alias = alias;
	  return this;
	};

	/**
	 * Set / get the command usage `str`.
	 *
	 * @param {String} str
	 * @return {String|Command}
	 * @api public
	 */

	Command.prototype.usage = function(str) {
	  var args = this._args.map(function(arg) {
	    return humanReadableArgName(arg);
	  });

	  var usage = '[options]' +
	    (this.commands.length ? ' [command]' : '') +
	    (this._args.length ? ' ' + args.join(' ') : '');

	  if (arguments.length === 0) return this._usage || usage;
	  this._usage = str;

	  return this;
	};

	/**
	 * Get or set the name of the command
	 *
	 * @param {String} str
	 * @return {String|Command}
	 * @api public
	 */

	Command.prototype.name = function(str) {
	  if (arguments.length === 0) return this._name;
	  this._name = str;
	  return this;
	};

	/**
	 * Return prepared commands.
	 *
	 * @return {Array}
	 * @api private
	 */

	Command.prototype.prepareCommands = function() {
	  return this.commands.filter(function(cmd) {
	    return !cmd._noHelp;
	  }).map(function(cmd) {
	    var args = cmd._args.map(function(arg) {
	      return humanReadableArgName(arg);
	    }).join(' ');

	    return [
	      cmd._name +
	        (cmd._alias ? '|' + cmd._alias : '') +
	        (cmd.options.length ? ' [options]' : '') +
	        (args ? ' ' + args : ''),
	      cmd._description
	    ];
	  });
	};

	/**
	 * Return the largest command length.
	 *
	 * @return {Number}
	 * @api private
	 */

	Command.prototype.largestCommandLength = function() {
	  var commands = this.prepareCommands();
	  return commands.reduce(function(max, command) {
	    return Math.max(max, command[0].length);
	  }, 0);
	};

	/**
	 * Return the largest option length.
	 *
	 * @return {Number}
	 * @api private
	 */

	Command.prototype.largestOptionLength = function() {
	  var options = [].slice.call(this.options);
	  options.push({
	    flags: '-h, --help'
	  });
	  return options.reduce(function(max, option) {
	    return Math.max(max, option.flags.length);
	  }, 0);
	};

	/**
	 * Return the largest arg length.
	 *
	 * @return {Number}
	 * @api private
	 */

	Command.prototype.largestArgLength = function() {
	  return this._args.reduce(function(max, arg) {
	    return Math.max(max, arg.name.length);
	  }, 0);
	};

	/**
	 * Return the pad width.
	 *
	 * @return {Number}
	 * @api private
	 */

	Command.prototype.padWidth = function() {
	  var width = this.largestOptionLength();
	  if (this._argsDescription && this._args.length) {
	    if (this.largestArgLength() > width) {
	      width = this.largestArgLength();
	    }
	  }

	  if (this.commands && this.commands.length) {
	    if (this.largestCommandLength() > width) {
	      width = this.largestCommandLength();
	    }
	  }

	  return width;
	};

	/**
	 * Return help for options.
	 *
	 * @return {String}
	 * @api private
	 */

	Command.prototype.optionHelp = function() {
	  var width = this.padWidth();

	  // Append the help information
	  return this.options.map(function(option) {
	    return pad(option.flags, width) + '  ' + option.description +
	      ((option.bool && option.defaultValue !== undefined) ? ' (default: ' + JSON.stringify(option.defaultValue) + ')' : '');
	  }).concat([pad('-h, --help', width) + '  ' + 'output usage information'])
	    .join('\n');
	};

	/**
	 * Return command help documentation.
	 *
	 * @return {String}
	 * @api private
	 */

	Command.prototype.commandHelp = function() {
	  if (!this.commands.length) return '';

	  var commands = this.prepareCommands();
	  var width = this.padWidth();

	  return [
	    'Commands:',
	    commands.map(function(cmd) {
	      var desc = cmd[1] ? '  ' + cmd[1] : '';
	      return (desc ? pad(cmd[0], width) : cmd[0]) + desc;
	    }).join('\n').replace(/^/gm, '  '),
	    ''
	  ].join('\n');
	};

	/**
	 * Return program help documentation.
	 *
	 * @return {String}
	 * @api private
	 */

	Command.prototype.helpInformation = function() {
	  var desc = [];
	  if (this._description) {
	    desc = [
	      this._description,
	      ''
	    ];

	    var argsDescription = this._argsDescription;
	    if (argsDescription && this._args.length) {
	      var width = this.padWidth();
	      desc.push('Arguments:');
	      desc.push('');
	      this._args.forEach(function(arg) {
	        desc.push('  ' + pad(arg.name, width) + '  ' + argsDescription[arg.name]);
	      });
	      desc.push('');
	    }
	  }

	  var cmdName = this._name;
	  if (this._alias) {
	    cmdName = cmdName + '|' + this._alias;
	  }
	  var usage = [
	    'Usage: ' + cmdName + ' ' + this.usage(),
	    ''
	  ];

	  var cmds = [];
	  var commandHelp = this.commandHelp();
	  if (commandHelp) cmds = [commandHelp];

	  var options = [
	    'Options:',
	    '' + this.optionHelp().replace(/^/gm, '  '),
	    ''
	  ];

	  return usage
	    .concat(desc)
	    .concat(options)
	    .concat(cmds)
	    .join('\n');
	};

	/**
	 * Output help information for this command
	 *
	 * @api public
	 */

	Command.prototype.outputHelp = function(cb) {
	  if (!cb) {
	    cb = function(passthru) {
	      return passthru;
	    };
	  }
	  process.stdout.write(cb(this.helpInformation()));
	  this.emit('--help');
	};

	/**
	 * Output help information and exit.
	 *
	 * @api public
	 */

	Command.prototype.help = function(cb) {
	  this.outputHelp(cb);
	  process.exit();
	};

	/**
	 * Camel-case the given `flag`
	 *
	 * @param {String} flag
	 * @return {String}
	 * @api private
	 */

	function camelcase(flag) {
	  return flag.split('-').reduce(function(str, word) {
	    return str + word[0].toUpperCase() + word.slice(1);
	  });
	}

	/**
	 * Pad `str` to `width`.
	 *
	 * @param {String} str
	 * @param {Number} width
	 * @return {String}
	 * @api private
	 */

	function pad(str, width) {
	  var len = Math.max(0, width - str.length);
	  return str + Array(len + 1).join(' ');
	}

	/**
	 * Output help information if necessary
	 *
	 * @param {Command} command to output help for
	 * @param {Array} array of options to search for -h or --help
	 * @api private
	 */

	function outputHelpIfNecessary(cmd, options) {
	  options = options || [];
	  for (var i = 0; i < options.length; i++) {
	    if (options[i] === '--help' || options[i] === '-h') {
	      cmd.outputHelp();
	      process.exit(0);
	    }
	  }
	}

	/**
	 * Takes an argument an returns its human readable equivalent for help usage.
	 *
	 * @param {Object} arg
	 * @return {String}
	 * @api private
	 */

	function humanReadableArgName(arg) {
	  var nameOutput = arg.name + (arg.variadic === true ? '...' : '');

	  return arg.required
	    ? '<' + nameOutput + '>'
	    : '[' + nameOutput + ']';
	}

	// for versions before node v0.8 when there weren't `fs.existsSync`
	function exists(file) {
	  try {
	    if (fs.statSync(file).isFile()) {
	      return true;
	    }
	  } catch (e) {
	    return false;
	  }
	}
	});
	var commander_1 = commander.Command;
	var commander_2 = commander.Option;

	var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

	var escapeStringRegexp = function (str) {
		if (typeof str !== 'string') {
			throw new TypeError('Expected a string');
		}

		return str.replace(matchOperatorsRe, '\\$&');
	};

	var colorName = {
		"aliceblue": [240, 248, 255],
		"antiquewhite": [250, 235, 215],
		"aqua": [0, 255, 255],
		"aquamarine": [127, 255, 212],
		"azure": [240, 255, 255],
		"beige": [245, 245, 220],
		"bisque": [255, 228, 196],
		"black": [0, 0, 0],
		"blanchedalmond": [255, 235, 205],
		"blue": [0, 0, 255],
		"blueviolet": [138, 43, 226],
		"brown": [165, 42, 42],
		"burlywood": [222, 184, 135],
		"cadetblue": [95, 158, 160],
		"chartreuse": [127, 255, 0],
		"chocolate": [210, 105, 30],
		"coral": [255, 127, 80],
		"cornflowerblue": [100, 149, 237],
		"cornsilk": [255, 248, 220],
		"crimson": [220, 20, 60],
		"cyan": [0, 255, 255],
		"darkblue": [0, 0, 139],
		"darkcyan": [0, 139, 139],
		"darkgoldenrod": [184, 134, 11],
		"darkgray": [169, 169, 169],
		"darkgreen": [0, 100, 0],
		"darkgrey": [169, 169, 169],
		"darkkhaki": [189, 183, 107],
		"darkmagenta": [139, 0, 139],
		"darkolivegreen": [85, 107, 47],
		"darkorange": [255, 140, 0],
		"darkorchid": [153, 50, 204],
		"darkred": [139, 0, 0],
		"darksalmon": [233, 150, 122],
		"darkseagreen": [143, 188, 143],
		"darkslateblue": [72, 61, 139],
		"darkslategray": [47, 79, 79],
		"darkslategrey": [47, 79, 79],
		"darkturquoise": [0, 206, 209],
		"darkviolet": [148, 0, 211],
		"deeppink": [255, 20, 147],
		"deepskyblue": [0, 191, 255],
		"dimgray": [105, 105, 105],
		"dimgrey": [105, 105, 105],
		"dodgerblue": [30, 144, 255],
		"firebrick": [178, 34, 34],
		"floralwhite": [255, 250, 240],
		"forestgreen": [34, 139, 34],
		"fuchsia": [255, 0, 255],
		"gainsboro": [220, 220, 220],
		"ghostwhite": [248, 248, 255],
		"gold": [255, 215, 0],
		"goldenrod": [218, 165, 32],
		"gray": [128, 128, 128],
		"green": [0, 128, 0],
		"greenyellow": [173, 255, 47],
		"grey": [128, 128, 128],
		"honeydew": [240, 255, 240],
		"hotpink": [255, 105, 180],
		"indianred": [205, 92, 92],
		"indigo": [75, 0, 130],
		"ivory": [255, 255, 240],
		"khaki": [240, 230, 140],
		"lavender": [230, 230, 250],
		"lavenderblush": [255, 240, 245],
		"lawngreen": [124, 252, 0],
		"lemonchiffon": [255, 250, 205],
		"lightblue": [173, 216, 230],
		"lightcoral": [240, 128, 128],
		"lightcyan": [224, 255, 255],
		"lightgoldenrodyellow": [250, 250, 210],
		"lightgray": [211, 211, 211],
		"lightgreen": [144, 238, 144],
		"lightgrey": [211, 211, 211],
		"lightpink": [255, 182, 193],
		"lightsalmon": [255, 160, 122],
		"lightseagreen": [32, 178, 170],
		"lightskyblue": [135, 206, 250],
		"lightslategray": [119, 136, 153],
		"lightslategrey": [119, 136, 153],
		"lightsteelblue": [176, 196, 222],
		"lightyellow": [255, 255, 224],
		"lime": [0, 255, 0],
		"limegreen": [50, 205, 50],
		"linen": [250, 240, 230],
		"magenta": [255, 0, 255],
		"maroon": [128, 0, 0],
		"mediumaquamarine": [102, 205, 170],
		"mediumblue": [0, 0, 205],
		"mediumorchid": [186, 85, 211],
		"mediumpurple": [147, 112, 219],
		"mediumseagreen": [60, 179, 113],
		"mediumslateblue": [123, 104, 238],
		"mediumspringgreen": [0, 250, 154],
		"mediumturquoise": [72, 209, 204],
		"mediumvioletred": [199, 21, 133],
		"midnightblue": [25, 25, 112],
		"mintcream": [245, 255, 250],
		"mistyrose": [255, 228, 225],
		"moccasin": [255, 228, 181],
		"navajowhite": [255, 222, 173],
		"navy": [0, 0, 128],
		"oldlace": [253, 245, 230],
		"olive": [128, 128, 0],
		"olivedrab": [107, 142, 35],
		"orange": [255, 165, 0],
		"orangered": [255, 69, 0],
		"orchid": [218, 112, 214],
		"palegoldenrod": [238, 232, 170],
		"palegreen": [152, 251, 152],
		"paleturquoise": [175, 238, 238],
		"palevioletred": [219, 112, 147],
		"papayawhip": [255, 239, 213],
		"peachpuff": [255, 218, 185],
		"peru": [205, 133, 63],
		"pink": [255, 192, 203],
		"plum": [221, 160, 221],
		"powderblue": [176, 224, 230],
		"purple": [128, 0, 128],
		"rebeccapurple": [102, 51, 153],
		"red": [255, 0, 0],
		"rosybrown": [188, 143, 143],
		"royalblue": [65, 105, 225],
		"saddlebrown": [139, 69, 19],
		"salmon": [250, 128, 114],
		"sandybrown": [244, 164, 96],
		"seagreen": [46, 139, 87],
		"seashell": [255, 245, 238],
		"sienna": [160, 82, 45],
		"silver": [192, 192, 192],
		"skyblue": [135, 206, 235],
		"slateblue": [106, 90, 205],
		"slategray": [112, 128, 144],
		"slategrey": [112, 128, 144],
		"snow": [255, 250, 250],
		"springgreen": [0, 255, 127],
		"steelblue": [70, 130, 180],
		"tan": [210, 180, 140],
		"teal": [0, 128, 128],
		"thistle": [216, 191, 216],
		"tomato": [255, 99, 71],
		"turquoise": [64, 224, 208],
		"violet": [238, 130, 238],
		"wheat": [245, 222, 179],
		"white": [255, 255, 255],
		"whitesmoke": [245, 245, 245],
		"yellow": [255, 255, 0],
		"yellowgreen": [154, 205, 50]
	};

	var conversions = createCommonjsModule(function (module) {
	/* MIT license */


	// NOTE: conversions should only return primitive values (i.e. arrays, or
	//       values that give correct `typeof` results).
	//       do not use box values types (i.e. Number(), String(), etc.)

	var reverseKeywords = {};
	for (var key in colorName) {
		if (colorName.hasOwnProperty(key)) {
			reverseKeywords[colorName[key]] = key;
		}
	}

	var convert = module.exports = {
		rgb: {channels: 3, labels: 'rgb'},
		hsl: {channels: 3, labels: 'hsl'},
		hsv: {channels: 3, labels: 'hsv'},
		hwb: {channels: 3, labels: 'hwb'},
		cmyk: {channels: 4, labels: 'cmyk'},
		xyz: {channels: 3, labels: 'xyz'},
		lab: {channels: 3, labels: 'lab'},
		lch: {channels: 3, labels: 'lch'},
		hex: {channels: 1, labels: ['hex']},
		keyword: {channels: 1, labels: ['keyword']},
		ansi16: {channels: 1, labels: ['ansi16']},
		ansi256: {channels: 1, labels: ['ansi256']},
		hcg: {channels: 3, labels: ['h', 'c', 'g']},
		apple: {channels: 3, labels: ['r16', 'g16', 'b16']},
		gray: {channels: 1, labels: ['gray']}
	};

	// hide .channels and .labels properties
	for (var model in convert) {
		if (convert.hasOwnProperty(model)) {
			if (!('channels' in convert[model])) {
				throw new Error('missing channels property: ' + model);
			}

			if (!('labels' in convert[model])) {
				throw new Error('missing channel labels property: ' + model);
			}

			if (convert[model].labels.length !== convert[model].channels) {
				throw new Error('channel and label counts mismatch: ' + model);
			}

			var channels = convert[model].channels;
			var labels = convert[model].labels;
			delete convert[model].channels;
			delete convert[model].labels;
			Object.defineProperty(convert[model], 'channels', {value: channels});
			Object.defineProperty(convert[model], 'labels', {value: labels});
		}
	}

	convert.rgb.hsl = function (rgb) {
		var r = rgb[0] / 255;
		var g = rgb[1] / 255;
		var b = rgb[2] / 255;
		var min = Math.min(r, g, b);
		var max = Math.max(r, g, b);
		var delta = max - min;
		var h;
		var s;
		var l;

		if (max === min) {
			h = 0;
		} else if (r === max) {
			h = (g - b) / delta;
		} else if (g === max) {
			h = 2 + (b - r) / delta;
		} else if (b === max) {
			h = 4 + (r - g) / delta;
		}

		h = Math.min(h * 60, 360);

		if (h < 0) {
			h += 360;
		}

		l = (min + max) / 2;

		if (max === min) {
			s = 0;
		} else if (l <= 0.5) {
			s = delta / (max + min);
		} else {
			s = delta / (2 - max - min);
		}

		return [h, s * 100, l * 100];
	};

	convert.rgb.hsv = function (rgb) {
		var rdif;
		var gdif;
		var bdif;
		var h;
		var s;

		var r = rgb[0] / 255;
		var g = rgb[1] / 255;
		var b = rgb[2] / 255;
		var v = Math.max(r, g, b);
		var diff = v - Math.min(r, g, b);
		var diffc = function (c) {
			return (v - c) / 6 / diff + 1 / 2;
		};

		if (diff === 0) {
			h = s = 0;
		} else {
			s = diff / v;
			rdif = diffc(r);
			gdif = diffc(g);
			bdif = diffc(b);

			if (r === v) {
				h = bdif - gdif;
			} else if (g === v) {
				h = (1 / 3) + rdif - bdif;
			} else if (b === v) {
				h = (2 / 3) + gdif - rdif;
			}
			if (h < 0) {
				h += 1;
			} else if (h > 1) {
				h -= 1;
			}
		}

		return [
			h * 360,
			s * 100,
			v * 100
		];
	};

	convert.rgb.hwb = function (rgb) {
		var r = rgb[0];
		var g = rgb[1];
		var b = rgb[2];
		var h = convert.rgb.hsl(rgb)[0];
		var w = 1 / 255 * Math.min(r, Math.min(g, b));

		b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));

		return [h, w * 100, b * 100];
	};

	convert.rgb.cmyk = function (rgb) {
		var r = rgb[0] / 255;
		var g = rgb[1] / 255;
		var b = rgb[2] / 255;
		var c;
		var m;
		var y;
		var k;

		k = Math.min(1 - r, 1 - g, 1 - b);
		c = (1 - r - k) / (1 - k) || 0;
		m = (1 - g - k) / (1 - k) || 0;
		y = (1 - b - k) / (1 - k) || 0;

		return [c * 100, m * 100, y * 100, k * 100];
	};

	/**
	 * See https://en.m.wikipedia.org/wiki/Euclidean_distance#Squared_Euclidean_distance
	 * */
	function comparativeDistance(x, y) {
		return (
			Math.pow(x[0] - y[0], 2) +
			Math.pow(x[1] - y[1], 2) +
			Math.pow(x[2] - y[2], 2)
		);
	}

	convert.rgb.keyword = function (rgb) {
		var reversed = reverseKeywords[rgb];
		if (reversed) {
			return reversed;
		}

		var currentClosestDistance = Infinity;
		var currentClosestKeyword;

		for (var keyword in colorName) {
			if (colorName.hasOwnProperty(keyword)) {
				var value = colorName[keyword];

				// Compute comparative distance
				var distance = comparativeDistance(rgb, value);

				// Check if its less, if so set as closest
				if (distance < currentClosestDistance) {
					currentClosestDistance = distance;
					currentClosestKeyword = keyword;
				}
			}
		}

		return currentClosestKeyword;
	};

	convert.keyword.rgb = function (keyword) {
		return colorName[keyword];
	};

	convert.rgb.xyz = function (rgb) {
		var r = rgb[0] / 255;
		var g = rgb[1] / 255;
		var b = rgb[2] / 255;

		// assume sRGB
		r = r > 0.04045 ? Math.pow(((r + 0.055) / 1.055), 2.4) : (r / 12.92);
		g = g > 0.04045 ? Math.pow(((g + 0.055) / 1.055), 2.4) : (g / 12.92);
		b = b > 0.04045 ? Math.pow(((b + 0.055) / 1.055), 2.4) : (b / 12.92);

		var x = (r * 0.4124) + (g * 0.3576) + (b * 0.1805);
		var y = (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
		var z = (r * 0.0193) + (g * 0.1192) + (b * 0.9505);

		return [x * 100, y * 100, z * 100];
	};

	convert.rgb.lab = function (rgb) {
		var xyz = convert.rgb.xyz(rgb);
		var x = xyz[0];
		var y = xyz[1];
		var z = xyz[2];
		var l;
		var a;
		var b;

		x /= 95.047;
		y /= 100;
		z /= 108.883;

		x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + (16 / 116);
		y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + (16 / 116);
		z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + (16 / 116);

		l = (116 * y) - 16;
		a = 500 * (x - y);
		b = 200 * (y - z);

		return [l, a, b];
	};

	convert.hsl.rgb = function (hsl) {
		var h = hsl[0] / 360;
		var s = hsl[1] / 100;
		var l = hsl[2] / 100;
		var t1;
		var t2;
		var t3;
		var rgb;
		var val;

		if (s === 0) {
			val = l * 255;
			return [val, val, val];
		}

		if (l < 0.5) {
			t2 = l * (1 + s);
		} else {
			t2 = l + s - l * s;
		}

		t1 = 2 * l - t2;

		rgb = [0, 0, 0];
		for (var i = 0; i < 3; i++) {
			t3 = h + 1 / 3 * -(i - 1);
			if (t3 < 0) {
				t3++;
			}
			if (t3 > 1) {
				t3--;
			}

			if (6 * t3 < 1) {
				val = t1 + (t2 - t1) * 6 * t3;
			} else if (2 * t3 < 1) {
				val = t2;
			} else if (3 * t3 < 2) {
				val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
			} else {
				val = t1;
			}

			rgb[i] = val * 255;
		}

		return rgb;
	};

	convert.hsl.hsv = function (hsl) {
		var h = hsl[0];
		var s = hsl[1] / 100;
		var l = hsl[2] / 100;
		var smin = s;
		var lmin = Math.max(l, 0.01);
		var sv;
		var v;

		l *= 2;
		s *= (l <= 1) ? l : 2 - l;
		smin *= lmin <= 1 ? lmin : 2 - lmin;
		v = (l + s) / 2;
		sv = l === 0 ? (2 * smin) / (lmin + smin) : (2 * s) / (l + s);

		return [h, sv * 100, v * 100];
	};

	convert.hsv.rgb = function (hsv) {
		var h = hsv[0] / 60;
		var s = hsv[1] / 100;
		var v = hsv[2] / 100;
		var hi = Math.floor(h) % 6;

		var f = h - Math.floor(h);
		var p = 255 * v * (1 - s);
		var q = 255 * v * (1 - (s * f));
		var t = 255 * v * (1 - (s * (1 - f)));
		v *= 255;

		switch (hi) {
			case 0:
				return [v, t, p];
			case 1:
				return [q, v, p];
			case 2:
				return [p, v, t];
			case 3:
				return [p, q, v];
			case 4:
				return [t, p, v];
			case 5:
				return [v, p, q];
		}
	};

	convert.hsv.hsl = function (hsv) {
		var h = hsv[0];
		var s = hsv[1] / 100;
		var v = hsv[2] / 100;
		var vmin = Math.max(v, 0.01);
		var lmin;
		var sl;
		var l;

		l = (2 - s) * v;
		lmin = (2 - s) * vmin;
		sl = s * vmin;
		sl /= (lmin <= 1) ? lmin : 2 - lmin;
		sl = sl || 0;
		l /= 2;

		return [h, sl * 100, l * 100];
	};

	// http://dev.w3.org/csswg/css-color/#hwb-to-rgb
	convert.hwb.rgb = function (hwb) {
		var h = hwb[0] / 360;
		var wh = hwb[1] / 100;
		var bl = hwb[2] / 100;
		var ratio = wh + bl;
		var i;
		var v;
		var f;
		var n;

		// wh + bl cant be > 1
		if (ratio > 1) {
			wh /= ratio;
			bl /= ratio;
		}

		i = Math.floor(6 * h);
		v = 1 - bl;
		f = 6 * h - i;

		if ((i & 0x01) !== 0) {
			f = 1 - f;
		}

		n = wh + f * (v - wh); // linear interpolation

		var r;
		var g;
		var b;
		switch (i) {
			default:
			case 6:
			case 0: r = v; g = n; b = wh; break;
			case 1: r = n; g = v; b = wh; break;
			case 2: r = wh; g = v; b = n; break;
			case 3: r = wh; g = n; b = v; break;
			case 4: r = n; g = wh; b = v; break;
			case 5: r = v; g = wh; b = n; break;
		}

		return [r * 255, g * 255, b * 255];
	};

	convert.cmyk.rgb = function (cmyk) {
		var c = cmyk[0] / 100;
		var m = cmyk[1] / 100;
		var y = cmyk[2] / 100;
		var k = cmyk[3] / 100;
		var r;
		var g;
		var b;

		r = 1 - Math.min(1, c * (1 - k) + k);
		g = 1 - Math.min(1, m * (1 - k) + k);
		b = 1 - Math.min(1, y * (1 - k) + k);

		return [r * 255, g * 255, b * 255];
	};

	convert.xyz.rgb = function (xyz) {
		var x = xyz[0] / 100;
		var y = xyz[1] / 100;
		var z = xyz[2] / 100;
		var r;
		var g;
		var b;

		r = (x * 3.2406) + (y * -1.5372) + (z * -0.4986);
		g = (x * -0.9689) + (y * 1.8758) + (z * 0.0415);
		b = (x * 0.0557) + (y * -0.2040) + (z * 1.0570);

		// assume sRGB
		r = r > 0.0031308
			? ((1.055 * Math.pow(r, 1.0 / 2.4)) - 0.055)
			: r * 12.92;

		g = g > 0.0031308
			? ((1.055 * Math.pow(g, 1.0 / 2.4)) - 0.055)
			: g * 12.92;

		b = b > 0.0031308
			? ((1.055 * Math.pow(b, 1.0 / 2.4)) - 0.055)
			: b * 12.92;

		r = Math.min(Math.max(0, r), 1);
		g = Math.min(Math.max(0, g), 1);
		b = Math.min(Math.max(0, b), 1);

		return [r * 255, g * 255, b * 255];
	};

	convert.xyz.lab = function (xyz) {
		var x = xyz[0];
		var y = xyz[1];
		var z = xyz[2];
		var l;
		var a;
		var b;

		x /= 95.047;
		y /= 100;
		z /= 108.883;

		x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + (16 / 116);
		y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + (16 / 116);
		z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + (16 / 116);

		l = (116 * y) - 16;
		a = 500 * (x - y);
		b = 200 * (y - z);

		return [l, a, b];
	};

	convert.lab.xyz = function (lab) {
		var l = lab[0];
		var a = lab[1];
		var b = lab[2];
		var x;
		var y;
		var z;

		y = (l + 16) / 116;
		x = a / 500 + y;
		z = y - b / 200;

		var y2 = Math.pow(y, 3);
		var x2 = Math.pow(x, 3);
		var z2 = Math.pow(z, 3);
		y = y2 > 0.008856 ? y2 : (y - 16 / 116) / 7.787;
		x = x2 > 0.008856 ? x2 : (x - 16 / 116) / 7.787;
		z = z2 > 0.008856 ? z2 : (z - 16 / 116) / 7.787;

		x *= 95.047;
		y *= 100;
		z *= 108.883;

		return [x, y, z];
	};

	convert.lab.lch = function (lab) {
		var l = lab[0];
		var a = lab[1];
		var b = lab[2];
		var hr;
		var h;
		var c;

		hr = Math.atan2(b, a);
		h = hr * 360 / 2 / Math.PI;

		if (h < 0) {
			h += 360;
		}

		c = Math.sqrt(a * a + b * b);

		return [l, c, h];
	};

	convert.lch.lab = function (lch) {
		var l = lch[0];
		var c = lch[1];
		var h = lch[2];
		var a;
		var b;
		var hr;

		hr = h / 360 * 2 * Math.PI;
		a = c * Math.cos(hr);
		b = c * Math.sin(hr);

		return [l, a, b];
	};

	convert.rgb.ansi16 = function (args) {
		var r = args[0];
		var g = args[1];
		var b = args[2];
		var value = 1 in arguments ? arguments[1] : convert.rgb.hsv(args)[2]; // hsv -> ansi16 optimization

		value = Math.round(value / 50);

		if (value === 0) {
			return 30;
		}

		var ansi = 30
			+ ((Math.round(b / 255) << 2)
			| (Math.round(g / 255) << 1)
			| Math.round(r / 255));

		if (value === 2) {
			ansi += 60;
		}

		return ansi;
	};

	convert.hsv.ansi16 = function (args) {
		// optimization here; we already know the value and don't need to get
		// it converted for us.
		return convert.rgb.ansi16(convert.hsv.rgb(args), args[2]);
	};

	convert.rgb.ansi256 = function (args) {
		var r = args[0];
		var g = args[1];
		var b = args[2];

		// we use the extended greyscale palette here, with the exception of
		// black and white. normal palette only has 4 greyscale shades.
		if (r === g && g === b) {
			if (r < 8) {
				return 16;
			}

			if (r > 248) {
				return 231;
			}

			return Math.round(((r - 8) / 247) * 24) + 232;
		}

		var ansi = 16
			+ (36 * Math.round(r / 255 * 5))
			+ (6 * Math.round(g / 255 * 5))
			+ Math.round(b / 255 * 5);

		return ansi;
	};

	convert.ansi16.rgb = function (args) {
		var color = args % 10;

		// handle greyscale
		if (color === 0 || color === 7) {
			if (args > 50) {
				color += 3.5;
			}

			color = color / 10.5 * 255;

			return [color, color, color];
		}

		var mult = (~~(args > 50) + 1) * 0.5;
		var r = ((color & 1) * mult) * 255;
		var g = (((color >> 1) & 1) * mult) * 255;
		var b = (((color >> 2) & 1) * mult) * 255;

		return [r, g, b];
	};

	convert.ansi256.rgb = function (args) {
		// handle greyscale
		if (args >= 232) {
			var c = (args - 232) * 10 + 8;
			return [c, c, c];
		}

		args -= 16;

		var rem;
		var r = Math.floor(args / 36) / 5 * 255;
		var g = Math.floor((rem = args % 36) / 6) / 5 * 255;
		var b = (rem % 6) / 5 * 255;

		return [r, g, b];
	};

	convert.rgb.hex = function (args) {
		var integer = ((Math.round(args[0]) & 0xFF) << 16)
			+ ((Math.round(args[1]) & 0xFF) << 8)
			+ (Math.round(args[2]) & 0xFF);

		var string = integer.toString(16).toUpperCase();
		return '000000'.substring(string.length) + string;
	};

	convert.hex.rgb = function (args) {
		var match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
		if (!match) {
			return [0, 0, 0];
		}

		var colorString = match[0];

		if (match[0].length === 3) {
			colorString = colorString.split('').map(function (char) {
				return char + char;
			}).join('');
		}

		var integer = parseInt(colorString, 16);
		var r = (integer >> 16) & 0xFF;
		var g = (integer >> 8) & 0xFF;
		var b = integer & 0xFF;

		return [r, g, b];
	};

	convert.rgb.hcg = function (rgb) {
		var r = rgb[0] / 255;
		var g = rgb[1] / 255;
		var b = rgb[2] / 255;
		var max = Math.max(Math.max(r, g), b);
		var min = Math.min(Math.min(r, g), b);
		var chroma = (max - min);
		var grayscale;
		var hue;

		if (chroma < 1) {
			grayscale = min / (1 - chroma);
		} else {
			grayscale = 0;
		}

		if (chroma <= 0) {
			hue = 0;
		} else
		if (max === r) {
			hue = ((g - b) / chroma) % 6;
		} else
		if (max === g) {
			hue = 2 + (b - r) / chroma;
		} else {
			hue = 4 + (r - g) / chroma + 4;
		}

		hue /= 6;
		hue %= 1;

		return [hue * 360, chroma * 100, grayscale * 100];
	};

	convert.hsl.hcg = function (hsl) {
		var s = hsl[1] / 100;
		var l = hsl[2] / 100;
		var c = 1;
		var f = 0;

		if (l < 0.5) {
			c = 2.0 * s * l;
		} else {
			c = 2.0 * s * (1.0 - l);
		}

		if (c < 1.0) {
			f = (l - 0.5 * c) / (1.0 - c);
		}

		return [hsl[0], c * 100, f * 100];
	};

	convert.hsv.hcg = function (hsv) {
		var s = hsv[1] / 100;
		var v = hsv[2] / 100;

		var c = s * v;
		var f = 0;

		if (c < 1.0) {
			f = (v - c) / (1 - c);
		}

		return [hsv[0], c * 100, f * 100];
	};

	convert.hcg.rgb = function (hcg) {
		var h = hcg[0] / 360;
		var c = hcg[1] / 100;
		var g = hcg[2] / 100;

		if (c === 0.0) {
			return [g * 255, g * 255, g * 255];
		}

		var pure = [0, 0, 0];
		var hi = (h % 1) * 6;
		var v = hi % 1;
		var w = 1 - v;
		var mg = 0;

		switch (Math.floor(hi)) {
			case 0:
				pure[0] = 1; pure[1] = v; pure[2] = 0; break;
			case 1:
				pure[0] = w; pure[1] = 1; pure[2] = 0; break;
			case 2:
				pure[0] = 0; pure[1] = 1; pure[2] = v; break;
			case 3:
				pure[0] = 0; pure[1] = w; pure[2] = 1; break;
			case 4:
				pure[0] = v; pure[1] = 0; pure[2] = 1; break;
			default:
				pure[0] = 1; pure[1] = 0; pure[2] = w;
		}

		mg = (1.0 - c) * g;

		return [
			(c * pure[0] + mg) * 255,
			(c * pure[1] + mg) * 255,
			(c * pure[2] + mg) * 255
		];
	};

	convert.hcg.hsv = function (hcg) {
		var c = hcg[1] / 100;
		var g = hcg[2] / 100;

		var v = c + g * (1.0 - c);
		var f = 0;

		if (v > 0.0) {
			f = c / v;
		}

		return [hcg[0], f * 100, v * 100];
	};

	convert.hcg.hsl = function (hcg) {
		var c = hcg[1] / 100;
		var g = hcg[2] / 100;

		var l = g * (1.0 - c) + 0.5 * c;
		var s = 0;

		if (l > 0.0 && l < 0.5) {
			s = c / (2 * l);
		} else
		if (l >= 0.5 && l < 1.0) {
			s = c / (2 * (1 - l));
		}

		return [hcg[0], s * 100, l * 100];
	};

	convert.hcg.hwb = function (hcg) {
		var c = hcg[1] / 100;
		var g = hcg[2] / 100;
		var v = c + g * (1.0 - c);
		return [hcg[0], (v - c) * 100, (1 - v) * 100];
	};

	convert.hwb.hcg = function (hwb) {
		var w = hwb[1] / 100;
		var b = hwb[2] / 100;
		var v = 1 - b;
		var c = v - w;
		var g = 0;

		if (c < 1) {
			g = (v - c) / (1 - c);
		}

		return [hwb[0], c * 100, g * 100];
	};

	convert.apple.rgb = function (apple) {
		return [(apple[0] / 65535) * 255, (apple[1] / 65535) * 255, (apple[2] / 65535) * 255];
	};

	convert.rgb.apple = function (rgb) {
		return [(rgb[0] / 255) * 65535, (rgb[1] / 255) * 65535, (rgb[2] / 255) * 65535];
	};

	convert.gray.rgb = function (args) {
		return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
	};

	convert.gray.hsl = convert.gray.hsv = function (args) {
		return [0, 0, args[0]];
	};

	convert.gray.hwb = function (gray) {
		return [0, 100, gray[0]];
	};

	convert.gray.cmyk = function (gray) {
		return [0, 0, 0, gray[0]];
	};

	convert.gray.lab = function (gray) {
		return [gray[0], 0, 0];
	};

	convert.gray.hex = function (gray) {
		var val = Math.round(gray[0] / 100 * 255) & 0xFF;
		var integer = (val << 16) + (val << 8) + val;

		var string = integer.toString(16).toUpperCase();
		return '000000'.substring(string.length) + string;
	};

	convert.rgb.gray = function (rgb) {
		var val = (rgb[0] + rgb[1] + rgb[2]) / 3;
		return [val / 255 * 100];
	};
	});
	var conversions_1 = conversions.rgb;
	var conversions_2 = conversions.hsl;
	var conversions_3 = conversions.hsv;
	var conversions_4 = conversions.hwb;
	var conversions_5 = conversions.cmyk;
	var conversions_6 = conversions.xyz;
	var conversions_7 = conversions.lab;
	var conversions_8 = conversions.lch;
	var conversions_9 = conversions.hex;
	var conversions_10 = conversions.keyword;
	var conversions_11 = conversions.ansi16;
	var conversions_12 = conversions.ansi256;
	var conversions_13 = conversions.hcg;
	var conversions_14 = conversions.apple;
	var conversions_15 = conversions.gray;

	/*
		this function routes a model to all other models.

		all functions that are routed have a property `.conversion` attached
		to the returned synthetic function. This property is an array
		of strings, each with the steps in between the 'from' and 'to'
		color models (inclusive).

		conversions that are not possible simply are not included.
	*/

	function buildGraph() {
		var graph = {};
		// https://jsperf.com/object-keys-vs-for-in-with-closure/3
		var models = Object.keys(conversions);

		for (var len = models.length, i = 0; i < len; i++) {
			graph[models[i]] = {
				// http://jsperf.com/1-vs-infinity
				// micro-opt, but this is simple.
				distance: -1,
				parent: null
			};
		}

		return graph;
	}

	// https://en.wikipedia.org/wiki/Breadth-first_search
	function deriveBFS(fromModel) {
		var graph = buildGraph();
		var queue = [fromModel]; // unshift -> queue -> pop

		graph[fromModel].distance = 0;

		while (queue.length) {
			var current = queue.pop();
			var adjacents = Object.keys(conversions[current]);

			for (var len = adjacents.length, i = 0; i < len; i++) {
				var adjacent = adjacents[i];
				var node = graph[adjacent];

				if (node.distance === -1) {
					node.distance = graph[current].distance + 1;
					node.parent = current;
					queue.unshift(adjacent);
				}
			}
		}

		return graph;
	}

	function link(from, to) {
		return function (args) {
			return to(from(args));
		};
	}

	function wrapConversion(toModel, graph) {
		var path$$1 = [graph[toModel].parent, toModel];
		var fn = conversions[graph[toModel].parent][toModel];

		var cur = graph[toModel].parent;
		while (graph[cur].parent) {
			path$$1.unshift(graph[cur].parent);
			fn = link(conversions[graph[cur].parent][cur], fn);
			cur = graph[cur].parent;
		}

		fn.conversion = path$$1;
		return fn;
	}

	var route = function (fromModel) {
		var graph = deriveBFS(fromModel);
		var conversion = {};

		var models = Object.keys(graph);
		for (var len = models.length, i = 0; i < len; i++) {
			var toModel = models[i];
			var node = graph[toModel];

			if (node.parent === null) {
				// no possible conversion, or this node is the source model.
				continue;
			}

			conversion[toModel] = wrapConversion(toModel, graph);
		}

		return conversion;
	};

	var convert = {};

	var models = Object.keys(conversions);

	function wrapRaw(fn) {
		var wrappedFn = function (args) {
			if (args === undefined || args === null) {
				return args;
			}

			if (arguments.length > 1) {
				args = Array.prototype.slice.call(arguments);
			}

			return fn(args);
		};

		// preserve .conversion property if there is one
		if ('conversion' in fn) {
			wrappedFn.conversion = fn.conversion;
		}

		return wrappedFn;
	}

	function wrapRounded(fn) {
		var wrappedFn = function (args) {
			if (args === undefined || args === null) {
				return args;
			}

			if (arguments.length > 1) {
				args = Array.prototype.slice.call(arguments);
			}

			var result = fn(args);

			// we're assuming the result is an array here.
			// see notice in conversions.js; don't use box types
			// in conversion functions.
			if (typeof result === 'object') {
				for (var len = result.length, i = 0; i < len; i++) {
					result[i] = Math.round(result[i]);
				}
			}

			return result;
		};

		// preserve .conversion property if there is one
		if ('conversion' in fn) {
			wrappedFn.conversion = fn.conversion;
		}

		return wrappedFn;
	}

	models.forEach(function (fromModel) {
		convert[fromModel] = {};

		Object.defineProperty(convert[fromModel], 'channels', {value: conversions[fromModel].channels});
		Object.defineProperty(convert[fromModel], 'labels', {value: conversions[fromModel].labels});

		var routes = route(fromModel);
		var routeModels = Object.keys(routes);

		routeModels.forEach(function (toModel) {
			var fn = routes[toModel];

			convert[fromModel][toModel] = wrapRounded(fn);
			convert[fromModel][toModel].raw = wrapRaw(fn);
		});
	});

	var colorConvert = convert;

	var ansiStyles = createCommonjsModule(function (module) {


	const wrapAnsi16 = (fn, offset) => function () {
		const code = fn.apply(colorConvert, arguments);
		return `\u001B[${code + offset}m`;
	};

	const wrapAnsi256 = (fn, offset) => function () {
		const code = fn.apply(colorConvert, arguments);
		return `\u001B[${38 + offset};5;${code}m`;
	};

	const wrapAnsi16m = (fn, offset) => function () {
		const rgb = fn.apply(colorConvert, arguments);
		return `\u001B[${38 + offset};2;${rgb[0]};${rgb[1]};${rgb[2]}m`;
	};

	function assembleStyles() {
		const codes = new Map();
		const styles = {
			modifier: {
				reset: [0, 0],
				// 21 isn't widely supported and 22 does the same thing
				bold: [1, 22],
				dim: [2, 22],
				italic: [3, 23],
				underline: [4, 24],
				inverse: [7, 27],
				hidden: [8, 28],
				strikethrough: [9, 29]
			},
			color: {
				black: [30, 39],
				red: [31, 39],
				green: [32, 39],
				yellow: [33, 39],
				blue: [34, 39],
				magenta: [35, 39],
				cyan: [36, 39],
				white: [37, 39],
				gray: [90, 39],

				// Bright color
				redBright: [91, 39],
				greenBright: [92, 39],
				yellowBright: [93, 39],
				blueBright: [94, 39],
				magentaBright: [95, 39],
				cyanBright: [96, 39],
				whiteBright: [97, 39]
			},
			bgColor: {
				bgBlack: [40, 49],
				bgRed: [41, 49],
				bgGreen: [42, 49],
				bgYellow: [43, 49],
				bgBlue: [44, 49],
				bgMagenta: [45, 49],
				bgCyan: [46, 49],
				bgWhite: [47, 49],

				// Bright color
				bgBlackBright: [100, 49],
				bgRedBright: [101, 49],
				bgGreenBright: [102, 49],
				bgYellowBright: [103, 49],
				bgBlueBright: [104, 49],
				bgMagentaBright: [105, 49],
				bgCyanBright: [106, 49],
				bgWhiteBright: [107, 49]
			}
		};

		// Fix humans
		styles.color.grey = styles.color.gray;

		for (const groupName of Object.keys(styles)) {
			const group = styles[groupName];

			for (const styleName of Object.keys(group)) {
				const style = group[styleName];

				styles[styleName] = {
					open: `\u001B[${style[0]}m`,
					close: `\u001B[${style[1]}m`
				};

				group[styleName] = styles[styleName];

				codes.set(style[0], style[1]);
			}

			Object.defineProperty(styles, groupName, {
				value: group,
				enumerable: false
			});

			Object.defineProperty(styles, 'codes', {
				value: codes,
				enumerable: false
			});
		}

		const ansi2ansi = n => n;
		const rgb2rgb = (r, g, b) => [r, g, b];

		styles.color.close = '\u001B[39m';
		styles.bgColor.close = '\u001B[49m';

		styles.color.ansi = {
			ansi: wrapAnsi16(ansi2ansi, 0)
		};
		styles.color.ansi256 = {
			ansi256: wrapAnsi256(ansi2ansi, 0)
		};
		styles.color.ansi16m = {
			rgb: wrapAnsi16m(rgb2rgb, 0)
		};

		styles.bgColor.ansi = {
			ansi: wrapAnsi16(ansi2ansi, 10)
		};
		styles.bgColor.ansi256 = {
			ansi256: wrapAnsi256(ansi2ansi, 10)
		};
		styles.bgColor.ansi16m = {
			rgb: wrapAnsi16m(rgb2rgb, 10)
		};

		for (let key of Object.keys(colorConvert)) {
			if (typeof colorConvert[key] !== 'object') {
				continue;
			}

			const suite = colorConvert[key];

			if (key === 'ansi16') {
				key = 'ansi';
			}

			if ('ansi16' in suite) {
				styles.color.ansi[key] = wrapAnsi16(suite.ansi16, 0);
				styles.bgColor.ansi[key] = wrapAnsi16(suite.ansi16, 10);
			}

			if ('ansi256' in suite) {
				styles.color.ansi256[key] = wrapAnsi256(suite.ansi256, 0);
				styles.bgColor.ansi256[key] = wrapAnsi256(suite.ansi256, 10);
			}

			if ('rgb' in suite) {
				styles.color.ansi16m[key] = wrapAnsi16m(suite.rgb, 0);
				styles.bgColor.ansi16m[key] = wrapAnsi16m(suite.rgb, 10);
			}
		}

		return styles;
	}

	// Make the export immutable
	Object.defineProperty(module, 'exports', {
		enumerable: true,
		get: assembleStyles
	});
	});

	var hasFlag = (flag, argv) => {
		argv = argv || process.argv;
		const prefix = flag.startsWith('-') ? '' : (flag.length === 1 ? '-' : '--');
		const pos = argv.indexOf(prefix + flag);
		const terminatorPos = argv.indexOf('--');
		return pos !== -1 && (terminatorPos === -1 ? true : pos < terminatorPos);
	};

	const env = process.env;

	let forceColor;
	if (hasFlag('no-color') ||
		hasFlag('no-colors') ||
		hasFlag('color=false')) {
		forceColor = false;
	} else if (hasFlag('color') ||
		hasFlag('colors') ||
		hasFlag('color=true') ||
		hasFlag('color=always')) {
		forceColor = true;
	}
	if ('FORCE_COLOR' in env) {
		forceColor = env.FORCE_COLOR.length === 0 || parseInt(env.FORCE_COLOR, 10) !== 0;
	}

	function translateLevel(level) {
		if (level === 0) {
			return false;
		}

		return {
			level,
			hasBasic: true,
			has256: level >= 2,
			has16m: level >= 3
		};
	}

	function supportsColor(stream) {
		if (forceColor === false) {
			return 0;
		}

		if (hasFlag('color=16m') ||
			hasFlag('color=full') ||
			hasFlag('color=truecolor')) {
			return 3;
		}

		if (hasFlag('color=256')) {
			return 2;
		}

		if (stream && !stream.isTTY && forceColor !== true) {
			return 0;
		}

		const min = forceColor ? 1 : 0;

		if (process.platform === 'win32') {
			// Node.js 7.5.0 is the first version of Node.js to include a patch to
			// libuv that enables 256 color output on Windows. Anything earlier and it
			// won't work. However, here we target Node.js 8 at minimum as it is an LTS
			// release, and Node.js 7 is not. Windows 10 build 10586 is the first Windows
			// release that supports 256 colors. Windows 10 build 14931 is the first release
			// that supports 16m/TrueColor.
			const osRelease = os.release().split('.');
			if (
				Number(process.versions.node.split('.')[0]) >= 8 &&
				Number(osRelease[0]) >= 10 &&
				Number(osRelease[2]) >= 10586
			) {
				return Number(osRelease[2]) >= 14931 ? 3 : 2;
			}

			return 1;
		}

		if ('CI' in env) {
			if (['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI'].some(sign => sign in env) || env.CI_NAME === 'codeship') {
				return 1;
			}

			return min;
		}

		if ('TEAMCITY_VERSION' in env) {
			return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
		}

		if (env.COLORTERM === 'truecolor') {
			return 3;
		}

		if ('TERM_PROGRAM' in env) {
			const version = parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10);

			switch (env.TERM_PROGRAM) {
				case 'iTerm.app':
					return version >= 3 ? 3 : 2;
				case 'Apple_Terminal':
					return 2;
				// No default
			}
		}

		if (/-256(color)?$/i.test(env.TERM)) {
			return 2;
		}

		if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
			return 1;
		}

		if ('COLORTERM' in env) {
			return 1;
		}

		if (env.TERM === 'dumb') {
			return min;
		}

		return min;
	}

	function getSupportLevel(stream) {
		const level = supportsColor(stream);
		return translateLevel(level);
	}

	var supportsColor_1 = {
		supportsColor: getSupportLevel,
		stdout: getSupportLevel(process.stdout),
		stderr: getSupportLevel(process.stderr)
	};

	const TEMPLATE_REGEX = /(?:\\(u[a-f\d]{4}|x[a-f\d]{2}|.))|(?:\{(~)?(\w+(?:\([^)]*\))?(?:\.\w+(?:\([^)]*\))?)*)(?:[ \t]|(?=\r?\n)))|(\})|((?:.|[\r\n\f])+?)/gi;
	const STYLE_REGEX = /(?:^|\.)(\w+)(?:\(([^)]*)\))?/g;
	const STRING_REGEX = /^(['"])((?:\\.|(?!\1)[^\\])*)\1$/;
	const ESCAPE_REGEX = /\\(u[a-f\d]{4}|x[a-f\d]{2}|.)|([^\\])/gi;

	const ESCAPES = new Map([
		['n', '\n'],
		['r', '\r'],
		['t', '\t'],
		['b', '\b'],
		['f', '\f'],
		['v', '\v'],
		['0', '\0'],
		['\\', '\\'],
		['e', '\u001B'],
		['a', '\u0007']
	]);

	function unescape(c) {
		if ((c[0] === 'u' && c.length === 5) || (c[0] === 'x' && c.length === 3)) {
			return String.fromCharCode(parseInt(c.slice(1), 16));
		}

		return ESCAPES.get(c) || c;
	}

	function parseArguments(name, args) {
		const results = [];
		const chunks = args.trim().split(/\s*,\s*/g);
		let matches;

		for (const chunk of chunks) {
			if (!isNaN(chunk)) {
				results.push(Number(chunk));
			} else if ((matches = chunk.match(STRING_REGEX))) {
				results.push(matches[2].replace(ESCAPE_REGEX, (m, escape, chr) => escape ? unescape(escape) : chr));
			} else {
				throw new Error(`Invalid Chalk template style argument: ${chunk} (in style '${name}')`);
			}
		}

		return results;
	}

	function parseStyle(style) {
		STYLE_REGEX.lastIndex = 0;

		const results = [];
		let matches;

		while ((matches = STYLE_REGEX.exec(style)) !== null) {
			const name = matches[1];

			if (matches[2]) {
				const args = parseArguments(name, matches[2]);
				results.push([name].concat(args));
			} else {
				results.push([name]);
			}
		}

		return results;
	}

	function buildStyle(chalk, styles) {
		const enabled = {};

		for (const layer of styles) {
			for (const style of layer.styles) {
				enabled[style[0]] = layer.inverse ? null : style.slice(1);
			}
		}

		let current = chalk;
		for (const styleName of Object.keys(enabled)) {
			if (Array.isArray(enabled[styleName])) {
				if (!(styleName in current)) {
					throw new Error(`Unknown Chalk style: ${styleName}`);
				}

				if (enabled[styleName].length > 0) {
					current = current[styleName].apply(current, enabled[styleName]);
				} else {
					current = current[styleName];
				}
			}
		}

		return current;
	}

	var templates = (chalk, tmp) => {
		const styles = [];
		const chunks = [];
		let chunk = [];

		// eslint-disable-next-line max-params
		tmp.replace(TEMPLATE_REGEX, (m, escapeChar, inverse, style, close, chr) => {
			if (escapeChar) {
				chunk.push(unescape(escapeChar));
			} else if (style) {
				const str = chunk.join('');
				chunk = [];
				chunks.push(styles.length === 0 ? str : buildStyle(chalk, styles)(str));
				styles.push({inverse, styles: parseStyle(style)});
			} else if (close) {
				if (styles.length === 0) {
					throw new Error('Found extraneous } in Chalk template literal');
				}

				chunks.push(buildStyle(chalk, styles)(chunk.join('')));
				chunk = [];
				styles.pop();
			} else {
				chunk.push(chr);
			}
		});

		chunks.push(chunk.join(''));

		if (styles.length > 0) {
			const errMsg = `Chalk template literal is missing ${styles.length} closing bracket${styles.length === 1 ? '' : 's'} (\`}\`)`;
			throw new Error(errMsg);
		}

		return chunks.join('');
	};

	var chalk = createCommonjsModule(function (module) {


	const stdoutColor = supportsColor_1.stdout;



	const isSimpleWindowsTerm = process.platform === 'win32' && !(process.env.TERM || '').toLowerCase().startsWith('xterm');

	// `supportsColor.level` → `ansiStyles.color[name]` mapping
	const levelMapping = ['ansi', 'ansi', 'ansi256', 'ansi16m'];

	// `color-convert` models to exclude from the Chalk API due to conflicts and such
	const skipModels = new Set(['gray']);

	const styles = Object.create(null);

	function applyOptions(obj, options) {
		options = options || {};

		// Detect level if not set manually
		const scLevel = stdoutColor ? stdoutColor.level : 0;
		obj.level = options.level === undefined ? scLevel : options.level;
		obj.enabled = 'enabled' in options ? options.enabled : obj.level > 0;
	}

	function Chalk(options) {
		// We check for this.template here since calling `chalk.constructor()`
		// by itself will have a `this` of a previously constructed chalk object
		if (!this || !(this instanceof Chalk) || this.template) {
			const chalk = {};
			applyOptions(chalk, options);

			chalk.template = function () {
				const args = [].slice.call(arguments);
				return chalkTag.apply(null, [chalk.template].concat(args));
			};

			Object.setPrototypeOf(chalk, Chalk.prototype);
			Object.setPrototypeOf(chalk.template, chalk);

			chalk.template.constructor = Chalk;

			return chalk.template;
		}

		applyOptions(this, options);
	}

	// Use bright blue on Windows as the normal blue color is illegible
	if (isSimpleWindowsTerm) {
		ansiStyles.blue.open = '\u001B[94m';
	}

	for (const key of Object.keys(ansiStyles)) {
		ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), 'g');

		styles[key] = {
			get() {
				const codes = ansiStyles[key];
				return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, key);
			}
		};
	}

	styles.visible = {
		get() {
			return build.call(this, this._styles || [], true, 'visible');
		}
	};

	ansiStyles.color.closeRe = new RegExp(escapeStringRegexp(ansiStyles.color.close), 'g');
	for (const model of Object.keys(ansiStyles.color.ansi)) {
		if (skipModels.has(model)) {
			continue;
		}

		styles[model] = {
			get() {
				const level = this.level;
				return function () {
					const open = ansiStyles.color[levelMapping[level]][model].apply(null, arguments);
					const codes = {
						open,
						close: ansiStyles.color.close,
						closeRe: ansiStyles.color.closeRe
					};
					return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, model);
				};
			}
		};
	}

	ansiStyles.bgColor.closeRe = new RegExp(escapeStringRegexp(ansiStyles.bgColor.close), 'g');
	for (const model of Object.keys(ansiStyles.bgColor.ansi)) {
		if (skipModels.has(model)) {
			continue;
		}

		const bgModel = 'bg' + model[0].toUpperCase() + model.slice(1);
		styles[bgModel] = {
			get() {
				const level = this.level;
				return function () {
					const open = ansiStyles.bgColor[levelMapping[level]][model].apply(null, arguments);
					const codes = {
						open,
						close: ansiStyles.bgColor.close,
						closeRe: ansiStyles.bgColor.closeRe
					};
					return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, model);
				};
			}
		};
	}

	const proto = Object.defineProperties(() => {}, styles);

	function build(_styles, _empty, key) {
		const builder = function () {
			return applyStyle.apply(builder, arguments);
		};

		builder._styles = _styles;
		builder._empty = _empty;

		const self = this;

		Object.defineProperty(builder, 'level', {
			enumerable: true,
			get() {
				return self.level;
			},
			set(level) {
				self.level = level;
			}
		});

		Object.defineProperty(builder, 'enabled', {
			enumerable: true,
			get() {
				return self.enabled;
			},
			set(enabled) {
				self.enabled = enabled;
			}
		});

		// See below for fix regarding invisible grey/dim combination on Windows
		builder.hasGrey = this.hasGrey || key === 'gray' || key === 'grey';

		// `__proto__` is used because we must return a function, but there is
		// no way to create a function with a different prototype
		builder.__proto__ = proto; // eslint-disable-line no-proto

		return builder;
	}

	function applyStyle() {
		// Support varags, but simply cast to string in case there's only one arg
		const args = arguments;
		const argsLen = args.length;
		let str = String(arguments[0]);

		if (argsLen === 0) {
			return '';
		}

		if (argsLen > 1) {
			// Don't slice `arguments`, it prevents V8 optimizations
			for (let a = 1; a < argsLen; a++) {
				str += ' ' + args[a];
			}
		}

		if (!this.enabled || this.level <= 0 || !str) {
			return this._empty ? '' : str;
		}

		// Turns out that on Windows dimmed gray text becomes invisible in cmd.exe,
		// see https://github.com/chalk/chalk/issues/58
		// If we're on Windows and we're dealing with a gray color, temporarily make 'dim' a noop.
		const originalDim = ansiStyles.dim.open;
		if (isSimpleWindowsTerm && this.hasGrey) {
			ansiStyles.dim.open = '';
		}

		for (const code of this._styles.slice().reverse()) {
			// Replace any instances already present with a re-opening code
			// otherwise only the part of the string until said closing code
			// will be colored, and the rest will simply be 'plain'.
			str = code.open + str.replace(code.closeRe, code.open) + code.close;

			// Close the styling before a linebreak and reopen
			// after next line to fix a bleed issue on macOS
			// https://github.com/chalk/chalk/pull/92
			str = str.replace(/\r?\n/g, `${code.close}$&${code.open}`);
		}

		// Reset the original `dim` if we changed it to work around the Windows dimmed gray issue
		ansiStyles.dim.open = originalDim;

		return str;
	}

	function chalkTag(chalk, strings) {
		if (!Array.isArray(strings)) {
			// If chalk() was called by itself or with a string,
			// return the string itself as a string.
			return [].slice.call(arguments, 1).join(' ');
		}

		const args = [].slice.call(arguments, 2);
		const parts = [strings.raw[0]];

		for (let i = 1; i < strings.length; i++) {
			parts.push(String(args[i - 1]).replace(/[{}\\]/g, '\\$&'));
			parts.push(String(strings.raw[i]));
		}

		return templates(chalk, parts.join(''));
	}

	Object.defineProperties(Chalk.prototype, styles);

	module.exports = Chalk(); // eslint-disable-line new-cap
	module.exports.supportsColor = stdoutColor;
	module.exports.default = module.exports; // For TypeScript
	});
	var chalk_1 = chalk.supportsColor;

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

	var isArrayish = function isArrayish(obj) {
		if (!obj) {
			return false;
		}

		return obj instanceof Array || Array.isArray(obj) ||
			(obj.length >= 0 && obj.splice instanceof Function);
	};

	var errorEx = function errorEx(name, properties) {
		if (!name || name.constructor !== String) {
			properties = name || {};
			name = Error.name;
		}

		var errorExError = function ErrorEXError(message) {
			if (!this) {
				return new ErrorEXError(message);
			}

			message = message instanceof Error
				? message.message
				: (message || this.message);

			Error.call(this, message);
			Error.captureStackTrace(this, errorExError);

			this.name = name;

			Object.defineProperty(this, 'message', {
				configurable: true,
				enumerable: false,
				get: function () {
					var newMessage = message.split(/\r?\n/g);

					for (var key in properties) {
						if (!properties.hasOwnProperty(key)) {
							continue;
						}

						var modifier = properties[key];

						if ('message' in modifier) {
							newMessage = modifier.message(this[key], newMessage) || newMessage;
							if (!isArrayish(newMessage)) {
								newMessage = [newMessage];
							}
						}
					}

					return newMessage.join('\n');
				},
				set: function (v) {
					message = v;
				}
			});

			var overwrittenStack = null;

			var stackDescriptor = Object.getOwnPropertyDescriptor(this, 'stack');
			var stackGetter = stackDescriptor.get;
			var stackValue = stackDescriptor.value;
			delete stackDescriptor.value;
			delete stackDescriptor.writable;

			stackDescriptor.set = function (newstack) {
				overwrittenStack = newstack;
			};

			stackDescriptor.get = function () {
				var stack = (overwrittenStack || ((stackGetter)
					? stackGetter.call(this)
					: stackValue)).split(/\r?\n+/g);

				// starting in Node 7, the stack builder caches the message.
				// just replace it.
				if (!overwrittenStack) {
					stack[0] = this.name + ': ' + this.message;
				}

				var lineCount = 1;
				for (var key in properties) {
					if (!properties.hasOwnProperty(key)) {
						continue;
					}

					var modifier = properties[key];

					if ('line' in modifier) {
						var line = modifier.line(this[key]);
						if (line) {
							stack.splice(lineCount++, 0, '    ' + line);
						}
					}

					if ('stack' in modifier) {
						modifier.stack(this[key], stack);
					}
				}

				return stack.join('\n');
			};

			Object.defineProperty(this, 'stack', stackDescriptor);
		};

		if (Object.setPrototypeOf) {
			Object.setPrototypeOf(errorExError.prototype, Error.prototype);
			Object.setPrototypeOf(errorExError, Error);
		} else {
			util.inherits(errorExError, Error);
		}

		return errorExError;
	};

	errorEx.append = function (str, def) {
		return {
			message: function (v, message) {
				v = v || def;

				if (v) {
					message[0] += ' ' + str.replace('%s', v.toString());
				}

				return message;
			}
		};
	};

	errorEx.line = function (str, def) {
		return {
			line: function (v) {
				v = v || def;

				if (v) {
					return str.replace('%s', v.toString());
				}

				return null;
			}
		};
	};

	var errorEx_1 = errorEx;

	var jsonParseBetterErrors = parseJson;
	function parseJson (txt, reviver, context) {
	  context = context || 20;
	  try {
	    return JSON.parse(txt, reviver)
	  } catch (e) {
	    if (typeof txt !== 'string') {
	      const isEmptyArray = Array.isArray(txt) && txt.length === 0;
	      const errorMessage = 'Cannot parse ' +
	      (isEmptyArray ? 'an empty array' : String(txt));
	      throw new TypeError(errorMessage)
	    }
	    const syntaxErr = e.message.match(/^Unexpected token.*position\s+(\d+)/i);
	    const errIdx = syntaxErr
	    ? +syntaxErr[1]
	    : e.message.match(/^Unexpected end of JSON.*/i)
	    ? txt.length - 1
	    : null;
	    if (errIdx != null) {
	      const start = errIdx <= context
	      ? 0
	      : errIdx - context;
	      const end = errIdx + context >= txt.length
	      ? txt.length
	      : errIdx + context;
	      e.message += ` while parsing near '${
        start === 0 ? '' : '...'
      }${txt.slice(start, end)}${
        end === txt.length ? '' : '...'
      }'`;
	    } else {
	      e.message += ` while parsing '${txt.slice(0, context * 2)}'`;
	    }
	    throw e
	  }
	}

	const JSONError = errorEx_1('JSONError', {
		fileName: errorEx_1.append('in %s')
	});

	var parseJson$1 = (input, reviver, filename) => {
		if (typeof reviver === 'string') {
			filename = reviver;
			reviver = null;
		}

		try {
			try {
				return JSON.parse(input, reviver);
			} catch (err) {
				jsonParseBetterErrors(input, reviver);

				throw err;
			}
		} catch (err) {
			err.message = err.message.replace(/\n/g, '');

			const jsonErr = new JSONError(err);
			if (filename) {
				jsonErr.fileName = filename;
			}

			throw jsonErr;
		}
	};

	function isNothing(subject) {
	  return (typeof subject === 'undefined') || (subject === null);
	}


	function isObject(subject) {
	  return (typeof subject === 'object') && (subject !== null);
	}


	function toArray(sequence) {
	  if (Array.isArray(sequence)) return sequence;
	  else if (isNothing(sequence)) return [];

	  return [ sequence ];
	}


	function extend(target, source) {
	  var index, length, key, sourceKeys;

	  if (source) {
	    sourceKeys = Object.keys(source);

	    for (index = 0, length = sourceKeys.length; index < length; index += 1) {
	      key = sourceKeys[index];
	      target[key] = source[key];
	    }
	  }

	  return target;
	}


	function repeat(string, count) {
	  var result = '', cycle;

	  for (cycle = 0; cycle < count; cycle += 1) {
	    result += string;
	  }

	  return result;
	}


	function isNegativeZero(number) {
	  return (number === 0) && (Number.NEGATIVE_INFINITY === 1 / number);
	}


	var isNothing_1      = isNothing;
	var isObject_1       = isObject;
	var toArray_1        = toArray;
	var repeat_1         = repeat;
	var isNegativeZero_1 = isNegativeZero;
	var extend_1         = extend;

	var common = {
		isNothing: isNothing_1,
		isObject: isObject_1,
		toArray: toArray_1,
		repeat: repeat_1,
		isNegativeZero: isNegativeZero_1,
		extend: extend_1
	};

	// YAML error class. http://stackoverflow.com/questions/8458984

	function YAMLException(reason, mark) {
	  // Super constructor
	  Error.call(this);

	  this.name = 'YAMLException';
	  this.reason = reason;
	  this.mark = mark;
	  this.message = (this.reason || '(unknown reason)') + (this.mark ? ' ' + this.mark.toString() : '');

	  // Include stack trace in error object
	  if (Error.captureStackTrace) {
	    // Chrome and NodeJS
	    Error.captureStackTrace(this, this.constructor);
	  } else {
	    // FF, IE 10+ and Safari 6+. Fallback for others
	    this.stack = (new Error()).stack || '';
	  }
	}


	// Inherit from Error
	YAMLException.prototype = Object.create(Error.prototype);
	YAMLException.prototype.constructor = YAMLException;


	YAMLException.prototype.toString = function toString(compact) {
	  var result = this.name + ': ';

	  result += this.reason || '(unknown reason)';

	  if (!compact && this.mark) {
	    result += ' ' + this.mark.toString();
	  }

	  return result;
	};


	var exception = YAMLException;

	function Mark(name, buffer, position, line, column) {
	  this.name     = name;
	  this.buffer   = buffer;
	  this.position = position;
	  this.line     = line;
	  this.column   = column;
	}


	Mark.prototype.getSnippet = function getSnippet(indent, maxLength) {
	  var head, start, tail, end, snippet;

	  if (!this.buffer) return null;

	  indent = indent || 4;
	  maxLength = maxLength || 75;

	  head = '';
	  start = this.position;

	  while (start > 0 && '\x00\r\n\x85\u2028\u2029'.indexOf(this.buffer.charAt(start - 1)) === -1) {
	    start -= 1;
	    if (this.position - start > (maxLength / 2 - 1)) {
	      head = ' ... ';
	      start += 5;
	      break;
	    }
	  }

	  tail = '';
	  end = this.position;

	  while (end < this.buffer.length && '\x00\r\n\x85\u2028\u2029'.indexOf(this.buffer.charAt(end)) === -1) {
	    end += 1;
	    if (end - this.position > (maxLength / 2 - 1)) {
	      tail = ' ... ';
	      end -= 5;
	      break;
	    }
	  }

	  snippet = this.buffer.slice(start, end);

	  return common.repeat(' ', indent) + head + snippet + tail + '\n' +
	         common.repeat(' ', indent + this.position - start + head.length) + '^';
	};


	Mark.prototype.toString = function toString(compact) {
	  var snippet, where = '';

	  if (this.name) {
	    where += 'in "' + this.name + '" ';
	  }

	  where += 'at line ' + (this.line + 1) + ', column ' + (this.column + 1);

	  if (!compact) {
	    snippet = this.getSnippet();

	    if (snippet) {
	      where += ':\n' + snippet;
	    }
	  }

	  return where;
	};


	var mark = Mark;

	var TYPE_CONSTRUCTOR_OPTIONS = [
	  'kind',
	  'resolve',
	  'construct',
	  'instanceOf',
	  'predicate',
	  'represent',
	  'defaultStyle',
	  'styleAliases'
	];

	var YAML_NODE_KINDS = [
	  'scalar',
	  'sequence',
	  'mapping'
	];

	function compileStyleAliases(map) {
	  var result = {};

	  if (map !== null) {
	    Object.keys(map).forEach(function (style) {
	      map[style].forEach(function (alias) {
	        result[String(alias)] = style;
	      });
	    });
	  }

	  return result;
	}

	function Type(tag, options) {
	  options = options || {};

	  Object.keys(options).forEach(function (name) {
	    if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
	      throw new exception('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
	    }
	  });

	  // TODO: Add tag format check.
	  this.tag          = tag;
	  this.kind         = options['kind']         || null;
	  this.resolve      = options['resolve']      || function () { return true; };
	  this.construct    = options['construct']    || function (data) { return data; };
	  this.instanceOf   = options['instanceOf']   || null;
	  this.predicate    = options['predicate']    || null;
	  this.represent    = options['represent']    || null;
	  this.defaultStyle = options['defaultStyle'] || null;
	  this.styleAliases = compileStyleAliases(options['styleAliases'] || null);

	  if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
	    throw new exception('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
	  }
	}

	var type = Type;

	/*eslint-disable max-len*/






	function compileList(schema, name, result) {
	  var exclude = [];

	  schema.include.forEach(function (includedSchema) {
	    result = compileList(includedSchema, name, result);
	  });

	  schema[name].forEach(function (currentType) {
	    result.forEach(function (previousType, previousIndex) {
	      if (previousType.tag === currentType.tag && previousType.kind === currentType.kind) {
	        exclude.push(previousIndex);
	      }
	    });

	    result.push(currentType);
	  });

	  return result.filter(function (type$$1, index) {
	    return exclude.indexOf(index) === -1;
	  });
	}


	function compileMap(/* lists... */) {
	  var result = {
	        scalar: {},
	        sequence: {},
	        mapping: {},
	        fallback: {}
	      }, index, length;

	  function collectType(type$$1) {
	    result[type$$1.kind][type$$1.tag] = result['fallback'][type$$1.tag] = type$$1;
	  }

	  for (index = 0, length = arguments.length; index < length; index += 1) {
	    arguments[index].forEach(collectType);
	  }
	  return result;
	}


	function Schema(definition) {
	  this.include  = definition.include  || [];
	  this.implicit = definition.implicit || [];
	  this.explicit = definition.explicit || [];

	  this.implicit.forEach(function (type$$1) {
	    if (type$$1.loadKind && type$$1.loadKind !== 'scalar') {
	      throw new exception('There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.');
	    }
	  });

	  this.compiledImplicit = compileList(this, 'implicit', []);
	  this.compiledExplicit = compileList(this, 'explicit', []);
	  this.compiledTypeMap  = compileMap(this.compiledImplicit, this.compiledExplicit);
	}


	Schema.DEFAULT = null;


	Schema.create = function createSchema() {
	  var schemas, types;

	  switch (arguments.length) {
	    case 1:
	      schemas = Schema.DEFAULT;
	      types = arguments[0];
	      break;

	    case 2:
	      schemas = arguments[0];
	      types = arguments[1];
	      break;

	    default:
	      throw new exception('Wrong number of arguments for Schema.create function');
	  }

	  schemas = common.toArray(schemas);
	  types = common.toArray(types);

	  if (!schemas.every(function (schema) { return schema instanceof Schema; })) {
	    throw new exception('Specified list of super schemas (or a single Schema object) contains a non-Schema object.');
	  }

	  if (!types.every(function (type$$1) { return type$$1 instanceof type; })) {
	    throw new exception('Specified list of YAML types (or a single Type object) contains a non-Type object.');
	  }

	  return new Schema({
	    include: schemas,
	    explicit: types
	  });
	};


	var schema = Schema;

	var str = new type('tag:yaml.org,2002:str', {
	  kind: 'scalar',
	  construct: function (data) { return data !== null ? data : ''; }
	});

	var seq = new type('tag:yaml.org,2002:seq', {
	  kind: 'sequence',
	  construct: function (data) { return data !== null ? data : []; }
	});

	var map = new type('tag:yaml.org,2002:map', {
	  kind: 'mapping',
	  construct: function (data) { return data !== null ? data : {}; }
	});

	var failsafe = new schema({
	  explicit: [
	    str,
	    seq,
	    map
	  ]
	});

	function resolveYamlNull(data) {
	  if (data === null) return true;

	  var max = data.length;

	  return (max === 1 && data === '~') ||
	         (max === 4 && (data === 'null' || data === 'Null' || data === 'NULL'));
	}

	function constructYamlNull() {
	  return null;
	}

	function isNull(object) {
	  return object === null;
	}

	var _null = new type('tag:yaml.org,2002:null', {
	  kind: 'scalar',
	  resolve: resolveYamlNull,
	  construct: constructYamlNull,
	  predicate: isNull,
	  represent: {
	    canonical: function () { return '~';    },
	    lowercase: function () { return 'null'; },
	    uppercase: function () { return 'NULL'; },
	    camelcase: function () { return 'Null'; }
	  },
	  defaultStyle: 'lowercase'
	});

	function resolveYamlBoolean(data) {
	  if (data === null) return false;

	  var max = data.length;

	  return (max === 4 && (data === 'true' || data === 'True' || data === 'TRUE')) ||
	         (max === 5 && (data === 'false' || data === 'False' || data === 'FALSE'));
	}

	function constructYamlBoolean(data) {
	  return data === 'true' ||
	         data === 'True' ||
	         data === 'TRUE';
	}

	function isBoolean(object) {
	  return Object.prototype.toString.call(object) === '[object Boolean]';
	}

	var bool = new type('tag:yaml.org,2002:bool', {
	  kind: 'scalar',
	  resolve: resolveYamlBoolean,
	  construct: constructYamlBoolean,
	  predicate: isBoolean,
	  represent: {
	    lowercase: function (object) { return object ? 'true' : 'false'; },
	    uppercase: function (object) { return object ? 'TRUE' : 'FALSE'; },
	    camelcase: function (object) { return object ? 'True' : 'False'; }
	  },
	  defaultStyle: 'lowercase'
	});

	function isHexCode(c) {
	  return ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) ||
	         ((0x41/* A */ <= c) && (c <= 0x46/* F */)) ||
	         ((0x61/* a */ <= c) && (c <= 0x66/* f */));
	}

	function isOctCode(c) {
	  return ((0x30/* 0 */ <= c) && (c <= 0x37/* 7 */));
	}

	function isDecCode(c) {
	  return ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */));
	}

	function resolveYamlInteger(data) {
	  if (data === null) return false;

	  var max = data.length,
	      index = 0,
	      hasDigits = false,
	      ch;

	  if (!max) return false;

	  ch = data[index];

	  // sign
	  if (ch === '-' || ch === '+') {
	    ch = data[++index];
	  }

	  if (ch === '0') {
	    // 0
	    if (index + 1 === max) return true;
	    ch = data[++index];

	    // base 2, base 8, base 16

	    if (ch === 'b') {
	      // base 2
	      index++;

	      for (; index < max; index++) {
	        ch = data[index];
	        if (ch === '_') continue;
	        if (ch !== '0' && ch !== '1') return false;
	        hasDigits = true;
	      }
	      return hasDigits && ch !== '_';
	    }


	    if (ch === 'x') {
	      // base 16
	      index++;

	      for (; index < max; index++) {
	        ch = data[index];
	        if (ch === '_') continue;
	        if (!isHexCode(data.charCodeAt(index))) return false;
	        hasDigits = true;
	      }
	      return hasDigits && ch !== '_';
	    }

	    // base 8
	    for (; index < max; index++) {
	      ch = data[index];
	      if (ch === '_') continue;
	      if (!isOctCode(data.charCodeAt(index))) return false;
	      hasDigits = true;
	    }
	    return hasDigits && ch !== '_';
	  }

	  // base 10 (except 0) or base 60

	  // value should not start with `_`;
	  if (ch === '_') return false;

	  for (; index < max; index++) {
	    ch = data[index];
	    if (ch === '_') continue;
	    if (ch === ':') break;
	    if (!isDecCode(data.charCodeAt(index))) {
	      return false;
	    }
	    hasDigits = true;
	  }

	  // Should have digits and should not end with `_`
	  if (!hasDigits || ch === '_') return false;

	  // if !base60 - done;
	  if (ch !== ':') return true;

	  // base60 almost not used, no needs to optimize
	  return /^(:[0-5]?[0-9])+$/.test(data.slice(index));
	}

	function constructYamlInteger(data) {
	  var value = data, sign = 1, ch, base, digits = [];

	  if (value.indexOf('_') !== -1) {
	    value = value.replace(/_/g, '');
	  }

	  ch = value[0];

	  if (ch === '-' || ch === '+') {
	    if (ch === '-') sign = -1;
	    value = value.slice(1);
	    ch = value[0];
	  }

	  if (value === '0') return 0;

	  if (ch === '0') {
	    if (value[1] === 'b') return sign * parseInt(value.slice(2), 2);
	    if (value[1] === 'x') return sign * parseInt(value, 16);
	    return sign * parseInt(value, 8);
	  }

	  if (value.indexOf(':') !== -1) {
	    value.split(':').forEach(function (v) {
	      digits.unshift(parseInt(v, 10));
	    });

	    value = 0;
	    base = 1;

	    digits.forEach(function (d) {
	      value += (d * base);
	      base *= 60;
	    });

	    return sign * value;

	  }

	  return sign * parseInt(value, 10);
	}

	function isInteger(object) {
	  return (Object.prototype.toString.call(object)) === '[object Number]' &&
	         (object % 1 === 0 && !common.isNegativeZero(object));
	}

	var int_1 = new type('tag:yaml.org,2002:int', {
	  kind: 'scalar',
	  resolve: resolveYamlInteger,
	  construct: constructYamlInteger,
	  predicate: isInteger,
	  represent: {
	    binary:      function (obj) { return obj >= 0 ? '0b' + obj.toString(2) : '-0b' + obj.toString(2).slice(1); },
	    octal:       function (obj) { return obj >= 0 ? '0'  + obj.toString(8) : '-0'  + obj.toString(8).slice(1); },
	    decimal:     function (obj) { return obj.toString(10); },
	    /* eslint-disable max-len */
	    hexadecimal: function (obj) { return obj >= 0 ? '0x' + obj.toString(16).toUpperCase() :  '-0x' + obj.toString(16).toUpperCase().slice(1); }
	  },
	  defaultStyle: 'decimal',
	  styleAliases: {
	    binary:      [ 2,  'bin' ],
	    octal:       [ 8,  'oct' ],
	    decimal:     [ 10, 'dec' ],
	    hexadecimal: [ 16, 'hex' ]
	  }
	});

	var YAML_FLOAT_PATTERN = new RegExp(
	  // 2.5e4, 2.5 and integers
	  '^(?:[-+]?(?:0|[1-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?' +
	  // .2e4, .2
	  // special case, seems not from spec
	  '|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?' +
	  // 20:59
	  '|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\\.[0-9_]*' +
	  // .inf
	  '|[-+]?\\.(?:inf|Inf|INF)' +
	  // .nan
	  '|\\.(?:nan|NaN|NAN))$');

	function resolveYamlFloat(data) {
	  if (data === null) return false;

	  if (!YAML_FLOAT_PATTERN.test(data) ||
	      // Quick hack to not allow integers end with `_`
	      // Probably should update regexp & check speed
	      data[data.length - 1] === '_') {
	    return false;
	  }

	  return true;
	}

	function constructYamlFloat(data) {
	  var value, sign, base, digits;

	  value  = data.replace(/_/g, '').toLowerCase();
	  sign   = value[0] === '-' ? -1 : 1;
	  digits = [];

	  if ('+-'.indexOf(value[0]) >= 0) {
	    value = value.slice(1);
	  }

	  if (value === '.inf') {
	    return (sign === 1) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;

	  } else if (value === '.nan') {
	    return NaN;

	  } else if (value.indexOf(':') >= 0) {
	    value.split(':').forEach(function (v) {
	      digits.unshift(parseFloat(v, 10));
	    });

	    value = 0.0;
	    base = 1;

	    digits.forEach(function (d) {
	      value += d * base;
	      base *= 60;
	    });

	    return sign * value;

	  }
	  return sign * parseFloat(value, 10);
	}


	var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;

	function representYamlFloat(object, style) {
	  var res;

	  if (isNaN(object)) {
	    switch (style) {
	      case 'lowercase': return '.nan';
	      case 'uppercase': return '.NAN';
	      case 'camelcase': return '.NaN';
	    }
	  } else if (Number.POSITIVE_INFINITY === object) {
	    switch (style) {
	      case 'lowercase': return '.inf';
	      case 'uppercase': return '.INF';
	      case 'camelcase': return '.Inf';
	    }
	  } else if (Number.NEGATIVE_INFINITY === object) {
	    switch (style) {
	      case 'lowercase': return '-.inf';
	      case 'uppercase': return '-.INF';
	      case 'camelcase': return '-.Inf';
	    }
	  } else if (common.isNegativeZero(object)) {
	    return '-0.0';
	  }

	  res = object.toString(10);

	  // JS stringifier can build scientific format without dots: 5e-100,
	  // while YAML requres dot: 5.e-100. Fix it with simple hack

	  return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace('e', '.e') : res;
	}

	function isFloat(object) {
	  return (Object.prototype.toString.call(object) === '[object Number]') &&
	         (object % 1 !== 0 || common.isNegativeZero(object));
	}

	var float_1 = new type('tag:yaml.org,2002:float', {
	  kind: 'scalar',
	  resolve: resolveYamlFloat,
	  construct: constructYamlFloat,
	  predicate: isFloat,
	  represent: representYamlFloat,
	  defaultStyle: 'lowercase'
	});

	var json = new schema({
	  include: [
	    failsafe
	  ],
	  implicit: [
	    _null,
	    bool,
	    int_1,
	    float_1
	  ]
	});

	var core = new schema({
	  include: [
	    json
	  ]
	});

	var YAML_DATE_REGEXP = new RegExp(
	  '^([0-9][0-9][0-9][0-9])'          + // [1] year
	  '-([0-9][0-9])'                    + // [2] month
	  '-([0-9][0-9])$');                   // [3] day

	var YAML_TIMESTAMP_REGEXP = new RegExp(
	  '^([0-9][0-9][0-9][0-9])'          + // [1] year
	  '-([0-9][0-9]?)'                   + // [2] month
	  '-([0-9][0-9]?)'                   + // [3] day
	  '(?:[Tt]|[ \\t]+)'                 + // ...
	  '([0-9][0-9]?)'                    + // [4] hour
	  ':([0-9][0-9])'                    + // [5] minute
	  ':([0-9][0-9])'                    + // [6] second
	  '(?:\\.([0-9]*))?'                 + // [7] fraction
	  '(?:[ \\t]*(Z|([-+])([0-9][0-9]?)' + // [8] tz [9] tz_sign [10] tz_hour
	  '(?::([0-9][0-9]))?))?$');           // [11] tz_minute

	function resolveYamlTimestamp(data) {
	  if (data === null) return false;
	  if (YAML_DATE_REGEXP.exec(data) !== null) return true;
	  if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
	  return false;
	}

	function constructYamlTimestamp(data) {
	  var match, year, month, day, hour, minute, second, fraction = 0,
	      delta = null, tz_hour, tz_minute, date;

	  match = YAML_DATE_REGEXP.exec(data);
	  if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);

	  if (match === null) throw new Error('Date resolve error');

	  // match: [1] year [2] month [3] day

	  year = +(match[1]);
	  month = +(match[2]) - 1; // JS month starts with 0
	  day = +(match[3]);

	  if (!match[4]) { // no hour
	    return new Date(Date.UTC(year, month, day));
	  }

	  // match: [4] hour [5] minute [6] second [7] fraction

	  hour = +(match[4]);
	  minute = +(match[5]);
	  second = +(match[6]);

	  if (match[7]) {
	    fraction = match[7].slice(0, 3);
	    while (fraction.length < 3) { // milli-seconds
	      fraction += '0';
	    }
	    fraction = +fraction;
	  }

	  // match: [8] tz [9] tz_sign [10] tz_hour [11] tz_minute

	  if (match[9]) {
	    tz_hour = +(match[10]);
	    tz_minute = +(match[11] || 0);
	    delta = (tz_hour * 60 + tz_minute) * 60000; // delta in mili-seconds
	    if (match[9] === '-') delta = -delta;
	  }

	  date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));

	  if (delta) date.setTime(date.getTime() - delta);

	  return date;
	}

	function representYamlTimestamp(object /*, style*/) {
	  return object.toISOString();
	}

	var timestamp = new type('tag:yaml.org,2002:timestamp', {
	  kind: 'scalar',
	  resolve: resolveYamlTimestamp,
	  construct: constructYamlTimestamp,
	  instanceOf: Date,
	  represent: representYamlTimestamp
	});

	function resolveYamlMerge(data) {
	  return data === '<<' || data === null;
	}

	var merge = new type('tag:yaml.org,2002:merge', {
	  kind: 'scalar',
	  resolve: resolveYamlMerge
	});

	/*eslint-disable no-bitwise*/

	var NodeBuffer;

	try {
	  // A trick for browserified version, to not include `Buffer` shim
	  var _require = commonjsRequire;
	  NodeBuffer = _require('buffer').Buffer;
	} catch (__) {}




	// [ 64, 65, 66 ] -> [ padding, CR, LF ]
	var BASE64_MAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r';


	function resolveYamlBinary(data) {
	  if (data === null) return false;

	  var code, idx, bitlen = 0, max = data.length, map = BASE64_MAP;

	  // Convert one by one.
	  for (idx = 0; idx < max; idx++) {
	    code = map.indexOf(data.charAt(idx));

	    // Skip CR/LF
	    if (code > 64) continue;

	    // Fail on illegal characters
	    if (code < 0) return false;

	    bitlen += 6;
	  }

	  // If there are any bits left, source was corrupted
	  return (bitlen % 8) === 0;
	}

	function constructYamlBinary(data) {
	  var idx, tailbits,
	      input = data.replace(/[\r\n=]/g, ''), // remove CR/LF & padding to simplify scan
	      max = input.length,
	      map = BASE64_MAP,
	      bits = 0,
	      result = [];

	  // Collect by 6*4 bits (3 bytes)

	  for (idx = 0; idx < max; idx++) {
	    if ((idx % 4 === 0) && idx) {
	      result.push((bits >> 16) & 0xFF);
	      result.push((bits >> 8) & 0xFF);
	      result.push(bits & 0xFF);
	    }

	    bits = (bits << 6) | map.indexOf(input.charAt(idx));
	  }

	  // Dump tail

	  tailbits = (max % 4) * 6;

	  if (tailbits === 0) {
	    result.push((bits >> 16) & 0xFF);
	    result.push((bits >> 8) & 0xFF);
	    result.push(bits & 0xFF);
	  } else if (tailbits === 18) {
	    result.push((bits >> 10) & 0xFF);
	    result.push((bits >> 2) & 0xFF);
	  } else if (tailbits === 12) {
	    result.push((bits >> 4) & 0xFF);
	  }

	  // Wrap into Buffer for NodeJS and leave Array for browser
	  if (NodeBuffer) {
	    // Support node 6.+ Buffer API when available
	    return NodeBuffer.from ? NodeBuffer.from(result) : new NodeBuffer(result);
	  }

	  return result;
	}

	function representYamlBinary(object /*, style*/) {
	  var result = '', bits = 0, idx, tail,
	      max = object.length,
	      map = BASE64_MAP;

	  // Convert every three bytes to 4 ASCII characters.

	  for (idx = 0; idx < max; idx++) {
	    if ((idx % 3 === 0) && idx) {
	      result += map[(bits >> 18) & 0x3F];
	      result += map[(bits >> 12) & 0x3F];
	      result += map[(bits >> 6) & 0x3F];
	      result += map[bits & 0x3F];
	    }

	    bits = (bits << 8) + object[idx];
	  }

	  // Dump tail

	  tail = max % 3;

	  if (tail === 0) {
	    result += map[(bits >> 18) & 0x3F];
	    result += map[(bits >> 12) & 0x3F];
	    result += map[(bits >> 6) & 0x3F];
	    result += map[bits & 0x3F];
	  } else if (tail === 2) {
	    result += map[(bits >> 10) & 0x3F];
	    result += map[(bits >> 4) & 0x3F];
	    result += map[(bits << 2) & 0x3F];
	    result += map[64];
	  } else if (tail === 1) {
	    result += map[(bits >> 2) & 0x3F];
	    result += map[(bits << 4) & 0x3F];
	    result += map[64];
	    result += map[64];
	  }

	  return result;
	}

	function isBinary(object) {
	  return NodeBuffer && NodeBuffer.isBuffer(object);
	}

	var binary = new type('tag:yaml.org,2002:binary', {
	  kind: 'scalar',
	  resolve: resolveYamlBinary,
	  construct: constructYamlBinary,
	  predicate: isBinary,
	  represent: representYamlBinary
	});

	var _hasOwnProperty = Object.prototype.hasOwnProperty;
	var _toString       = Object.prototype.toString;

	function resolveYamlOmap(data) {
	  if (data === null) return true;

	  var objectKeys = [], index, length, pair, pairKey, pairHasKey,
	      object = data;

	  for (index = 0, length = object.length; index < length; index += 1) {
	    pair = object[index];
	    pairHasKey = false;

	    if (_toString.call(pair) !== '[object Object]') return false;

	    for (pairKey in pair) {
	      if (_hasOwnProperty.call(pair, pairKey)) {
	        if (!pairHasKey) pairHasKey = true;
	        else return false;
	      }
	    }

	    if (!pairHasKey) return false;

	    if (objectKeys.indexOf(pairKey) === -1) objectKeys.push(pairKey);
	    else return false;
	  }

	  return true;
	}

	function constructYamlOmap(data) {
	  return data !== null ? data : [];
	}

	var omap = new type('tag:yaml.org,2002:omap', {
	  kind: 'sequence',
	  resolve: resolveYamlOmap,
	  construct: constructYamlOmap
	});

	var _toString$1 = Object.prototype.toString;

	function resolveYamlPairs(data) {
	  if (data === null) return true;

	  var index, length, pair, keys, result,
	      object = data;

	  result = new Array(object.length);

	  for (index = 0, length = object.length; index < length; index += 1) {
	    pair = object[index];

	    if (_toString$1.call(pair) !== '[object Object]') return false;

	    keys = Object.keys(pair);

	    if (keys.length !== 1) return false;

	    result[index] = [ keys[0], pair[keys[0]] ];
	  }

	  return true;
	}

	function constructYamlPairs(data) {
	  if (data === null) return [];

	  var index, length, pair, keys, result,
	      object = data;

	  result = new Array(object.length);

	  for (index = 0, length = object.length; index < length; index += 1) {
	    pair = object[index];

	    keys = Object.keys(pair);

	    result[index] = [ keys[0], pair[keys[0]] ];
	  }

	  return result;
	}

	var pairs = new type('tag:yaml.org,2002:pairs', {
	  kind: 'sequence',
	  resolve: resolveYamlPairs,
	  construct: constructYamlPairs
	});

	var _hasOwnProperty$1 = Object.prototype.hasOwnProperty;

	function resolveYamlSet(data) {
	  if (data === null) return true;

	  var key, object = data;

	  for (key in object) {
	    if (_hasOwnProperty$1.call(object, key)) {
	      if (object[key] !== null) return false;
	    }
	  }

	  return true;
	}

	function constructYamlSet(data) {
	  return data !== null ? data : {};
	}

	var set = new type('tag:yaml.org,2002:set', {
	  kind: 'mapping',
	  resolve: resolveYamlSet,
	  construct: constructYamlSet
	});

	var default_safe = new schema({
	  include: [
	    core
	  ],
	  implicit: [
	    timestamp,
	    merge
	  ],
	  explicit: [
	    binary,
	    omap,
	    pairs,
	    set
	  ]
	});

	function resolveJavascriptUndefined() {
	  return true;
	}

	function constructJavascriptUndefined() {
	  /*eslint-disable no-undefined*/
	  return undefined;
	}

	function representJavascriptUndefined() {
	  return '';
	}

	function isUndefined(object) {
	  return typeof object === 'undefined';
	}

	var _undefined = new type('tag:yaml.org,2002:js/undefined', {
	  kind: 'scalar',
	  resolve: resolveJavascriptUndefined,
	  construct: constructJavascriptUndefined,
	  predicate: isUndefined,
	  represent: representJavascriptUndefined
	});

	function resolveJavascriptRegExp(data) {
	  if (data === null) return false;
	  if (data.length === 0) return false;

	  var regexp = data,
	      tail   = /\/([gim]*)$/.exec(data),
	      modifiers = '';

	  // if regexp starts with '/' it can have modifiers and must be properly closed
	  // `/foo/gim` - modifiers tail can be maximum 3 chars
	  if (regexp[0] === '/') {
	    if (tail) modifiers = tail[1];

	    if (modifiers.length > 3) return false;
	    // if expression starts with /, is should be properly terminated
	    if (regexp[regexp.length - modifiers.length - 1] !== '/') return false;
	  }

	  return true;
	}

	function constructJavascriptRegExp(data) {
	  var regexp = data,
	      tail   = /\/([gim]*)$/.exec(data),
	      modifiers = '';

	  // `/foo/gim` - tail can be maximum 4 chars
	  if (regexp[0] === '/') {
	    if (tail) modifiers = tail[1];
	    regexp = regexp.slice(1, regexp.length - modifiers.length - 1);
	  }

	  return new RegExp(regexp, modifiers);
	}

	function representJavascriptRegExp(object /*, style*/) {
	  var result = '/' + object.source + '/';

	  if (object.global) result += 'g';
	  if (object.multiline) result += 'm';
	  if (object.ignoreCase) result += 'i';

	  return result;
	}

	function isRegExp(object) {
	  return Object.prototype.toString.call(object) === '[object RegExp]';
	}

	var regexp = new type('tag:yaml.org,2002:js/regexp', {
	  kind: 'scalar',
	  resolve: resolveJavascriptRegExp,
	  construct: constructJavascriptRegExp,
	  predicate: isRegExp,
	  represent: representJavascriptRegExp
	});

	var esprima;

	// Browserified version does not have esprima
	//
	// 1. For node.js just require module as deps
	// 2. For browser try to require mudule via external AMD system.
	//    If not found - try to fallback to window.esprima. If not
	//    found too - then fail to parse.
	//
	try {
	  // workaround to exclude package from browserify list.
	  var _require$1 = commonjsRequire;
	  esprima = _require$1('esprima');
	} catch (_) {
	  /*global window */
	  if (typeof window !== 'undefined') esprima = window.esprima;
	}



	function resolveJavascriptFunction(data) {
	  if (data === null) return false;

	  try {
	    var source = '(' + data + ')',
	        ast    = esprima.parse(source, { range: true });

	    if (ast.type                    !== 'Program'             ||
	        ast.body.length             !== 1                     ||
	        ast.body[0].type            !== 'ExpressionStatement' ||
	        (ast.body[0].expression.type !== 'ArrowFunctionExpression' &&
	          ast.body[0].expression.type !== 'FunctionExpression')) {
	      return false;
	    }

	    return true;
	  } catch (err) {
	    return false;
	  }
	}

	function constructJavascriptFunction(data) {
	  /*jslint evil:true*/

	  var source = '(' + data + ')',
	      ast    = esprima.parse(source, { range: true }),
	      params = [],
	      body;

	  if (ast.type                    !== 'Program'             ||
	      ast.body.length             !== 1                     ||
	      ast.body[0].type            !== 'ExpressionStatement' ||
	      (ast.body[0].expression.type !== 'ArrowFunctionExpression' &&
	        ast.body[0].expression.type !== 'FunctionExpression')) {
	    throw new Error('Failed to resolve function');
	  }

	  ast.body[0].expression.params.forEach(function (param) {
	    params.push(param.name);
	  });

	  body = ast.body[0].expression.body.range;

	  // Esprima's ranges include the first '{' and the last '}' characters on
	  // function expressions. So cut them out.
	  if (ast.body[0].expression.body.type === 'BlockStatement') {
	    /*eslint-disable no-new-func*/
	    return new Function(params, source.slice(body[0] + 1, body[1] - 1));
	  }
	  // ES6 arrow functions can omit the BlockStatement. In that case, just return
	  // the body.
	  /*eslint-disable no-new-func*/
	  return new Function(params, 'return ' + source.slice(body[0], body[1]));
	}

	function representJavascriptFunction(object /*, style*/) {
	  return object.toString();
	}

	function isFunction(object) {
	  return Object.prototype.toString.call(object) === '[object Function]';
	}

	var _function = new type('tag:yaml.org,2002:js/function', {
	  kind: 'scalar',
	  resolve: resolveJavascriptFunction,
	  construct: constructJavascriptFunction,
	  predicate: isFunction,
	  represent: representJavascriptFunction
	});

	var default_full = schema.DEFAULT = new schema({
	  include: [
	    default_safe
	  ],
	  explicit: [
	    _undefined,
	    regexp,
	    _function
	  ]
	});

	/*eslint-disable max-len,no-use-before-define*/








	var _hasOwnProperty$2 = Object.prototype.hasOwnProperty;


	var CONTEXT_FLOW_IN   = 1;
	var CONTEXT_FLOW_OUT  = 2;
	var CONTEXT_BLOCK_IN  = 3;
	var CONTEXT_BLOCK_OUT = 4;


	var CHOMPING_CLIP  = 1;
	var CHOMPING_STRIP = 2;
	var CHOMPING_KEEP  = 3;


	var PATTERN_NON_PRINTABLE         = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
	var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
	var PATTERN_FLOW_INDICATORS       = /[,\[\]\{\}]/;
	var PATTERN_TAG_HANDLE            = /^(?:!|!!|![a-z\-]+!)$/i;
	var PATTERN_TAG_URI               = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;


	function is_EOL(c) {
	  return (c === 0x0A/* LF */) || (c === 0x0D/* CR */);
	}

	function is_WHITE_SPACE(c) {
	  return (c === 0x09/* Tab */) || (c === 0x20/* Space */);
	}

	function is_WS_OR_EOL(c) {
	  return (c === 0x09/* Tab */) ||
	         (c === 0x20/* Space */) ||
	         (c === 0x0A/* LF */) ||
	         (c === 0x0D/* CR */);
	}

	function is_FLOW_INDICATOR(c) {
	  return c === 0x2C/* , */ ||
	         c === 0x5B/* [ */ ||
	         c === 0x5D/* ] */ ||
	         c === 0x7B/* { */ ||
	         c === 0x7D/* } */;
	}

	function fromHexCode(c) {
	  var lc;

	  if ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) {
	    return c - 0x30;
	  }

	  /*eslint-disable no-bitwise*/
	  lc = c | 0x20;

	  if ((0x61/* a */ <= lc) && (lc <= 0x66/* f */)) {
	    return lc - 0x61 + 10;
	  }

	  return -1;
	}

	function escapedHexLen(c) {
	  if (c === 0x78/* x */) { return 2; }
	  if (c === 0x75/* u */) { return 4; }
	  if (c === 0x55/* U */) { return 8; }
	  return 0;
	}

	function fromDecimalCode(c) {
	  if ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) {
	    return c - 0x30;
	  }

	  return -1;
	}

	function simpleEscapeSequence(c) {
	  /* eslint-disable indent */
	  return (c === 0x30/* 0 */) ? '\x00' :
	        (c === 0x61/* a */) ? '\x07' :
	        (c === 0x62/* b */) ? '\x08' :
	        (c === 0x74/* t */) ? '\x09' :
	        (c === 0x09/* Tab */) ? '\x09' :
	        (c === 0x6E/* n */) ? '\x0A' :
	        (c === 0x76/* v */) ? '\x0B' :
	        (c === 0x66/* f */) ? '\x0C' :
	        (c === 0x72/* r */) ? '\x0D' :
	        (c === 0x65/* e */) ? '\x1B' :
	        (c === 0x20/* Space */) ? ' ' :
	        (c === 0x22/* " */) ? '\x22' :
	        (c === 0x2F/* / */) ? '/' :
	        (c === 0x5C/* \ */) ? '\x5C' :
	        (c === 0x4E/* N */) ? '\x85' :
	        (c === 0x5F/* _ */) ? '\xA0' :
	        (c === 0x4C/* L */) ? '\u2028' :
	        (c === 0x50/* P */) ? '\u2029' : '';
	}

	function charFromCodepoint(c) {
	  if (c <= 0xFFFF) {
	    return String.fromCharCode(c);
	  }
	  // Encode UTF-16 surrogate pair
	  // https://en.wikipedia.org/wiki/UTF-16#Code_points_U.2B010000_to_U.2B10FFFF
	  return String.fromCharCode(
	    ((c - 0x010000) >> 10) + 0xD800,
	    ((c - 0x010000) & 0x03FF) + 0xDC00
	  );
	}

	var simpleEscapeCheck = new Array(256); // integer, for fast access
	var simpleEscapeMap = new Array(256);
	for (var i = 0; i < 256; i++) {
	  simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
	  simpleEscapeMap[i] = simpleEscapeSequence(i);
	}


	function State(input, options) {
	  this.input = input;

	  this.filename  = options['filename']  || null;
	  this.schema    = options['schema']    || default_full;
	  this.onWarning = options['onWarning'] || null;
	  this.legacy    = options['legacy']    || false;
	  this.json      = options['json']      || false;
	  this.listener  = options['listener']  || null;

	  this.implicitTypes = this.schema.compiledImplicit;
	  this.typeMap       = this.schema.compiledTypeMap;

	  this.length     = input.length;
	  this.position   = 0;
	  this.line       = 0;
	  this.lineStart  = 0;
	  this.lineIndent = 0;

	  this.documents = [];

	  /*
	  this.version;
	  this.checkLineBreaks;
	  this.tagMap;
	  this.anchorMap;
	  this.tag;
	  this.anchor;
	  this.kind;
	  this.result;*/

	}


	function generateError(state, message) {
	  return new exception(
	    message,
	    new mark(state.filename, state.input, state.position, state.line, (state.position - state.lineStart)));
	}

	function throwError(state, message) {
	  throw generateError(state, message);
	}

	function throwWarning(state, message) {
	  if (state.onWarning) {
	    state.onWarning.call(null, generateError(state, message));
	  }
	}


	var directiveHandlers = {

	  YAML: function handleYamlDirective(state, name, args) {

	    var match, major, minor;

	    if (state.version !== null) {
	      throwError(state, 'duplication of %YAML directive');
	    }

	    if (args.length !== 1) {
	      throwError(state, 'YAML directive accepts exactly one argument');
	    }

	    match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);

	    if (match === null) {
	      throwError(state, 'ill-formed argument of the YAML directive');
	    }

	    major = parseInt(match[1], 10);
	    minor = parseInt(match[2], 10);

	    if (major !== 1) {
	      throwError(state, 'unacceptable YAML version of the document');
	    }

	    state.version = args[0];
	    state.checkLineBreaks = (minor < 2);

	    if (minor !== 1 && minor !== 2) {
	      throwWarning(state, 'unsupported YAML version of the document');
	    }
	  },

	  TAG: function handleTagDirective(state, name, args) {

	    var handle, prefix;

	    if (args.length !== 2) {
	      throwError(state, 'TAG directive accepts exactly two arguments');
	    }

	    handle = args[0];
	    prefix = args[1];

	    if (!PATTERN_TAG_HANDLE.test(handle)) {
	      throwError(state, 'ill-formed tag handle (first argument) of the TAG directive');
	    }

	    if (_hasOwnProperty$2.call(state.tagMap, handle)) {
	      throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
	    }

	    if (!PATTERN_TAG_URI.test(prefix)) {
	      throwError(state, 'ill-formed tag prefix (second argument) of the TAG directive');
	    }

	    state.tagMap[handle] = prefix;
	  }
	};


	function captureSegment(state, start, end, checkJson) {
	  var _position, _length, _character, _result;

	  if (start < end) {
	    _result = state.input.slice(start, end);

	    if (checkJson) {
	      for (_position = 0, _length = _result.length; _position < _length; _position += 1) {
	        _character = _result.charCodeAt(_position);
	        if (!(_character === 0x09 ||
	              (0x20 <= _character && _character <= 0x10FFFF))) {
	          throwError(state, 'expected valid JSON character');
	        }
	      }
	    } else if (PATTERN_NON_PRINTABLE.test(_result)) {
	      throwError(state, 'the stream contains non-printable characters');
	    }

	    state.result += _result;
	  }
	}

	function mergeMappings(state, destination, source, overridableKeys) {
	  var sourceKeys, key, index, quantity;

	  if (!common.isObject(source)) {
	    throwError(state, 'cannot merge mappings; the provided source object is unacceptable');
	  }

	  sourceKeys = Object.keys(source);

	  for (index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
	    key = sourceKeys[index];

	    if (!_hasOwnProperty$2.call(destination, key)) {
	      destination[key] = source[key];
	      overridableKeys[key] = true;
	    }
	  }
	}

	function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startPos) {
	  var index, quantity;

	  keyNode = String(keyNode);

	  if (_result === null) {
	    _result = {};
	  }

	  if (keyTag === 'tag:yaml.org,2002:merge') {
	    if (Array.isArray(valueNode)) {
	      for (index = 0, quantity = valueNode.length; index < quantity; index += 1) {
	        mergeMappings(state, _result, valueNode[index], overridableKeys);
	      }
	    } else {
	      mergeMappings(state, _result, valueNode, overridableKeys);
	    }
	  } else {
	    if (!state.json &&
	        !_hasOwnProperty$2.call(overridableKeys, keyNode) &&
	        _hasOwnProperty$2.call(_result, keyNode)) {
	      state.line = startLine || state.line;
	      state.position = startPos || state.position;
	      throwError(state, 'duplicated mapping key');
	    }
	    _result[keyNode] = valueNode;
	    delete overridableKeys[keyNode];
	  }

	  return _result;
	}

	function readLineBreak(state) {
	  var ch;

	  ch = state.input.charCodeAt(state.position);

	  if (ch === 0x0A/* LF */) {
	    state.position++;
	  } else if (ch === 0x0D/* CR */) {
	    state.position++;
	    if (state.input.charCodeAt(state.position) === 0x0A/* LF */) {
	      state.position++;
	    }
	  } else {
	    throwError(state, 'a line break is expected');
	  }

	  state.line += 1;
	  state.lineStart = state.position;
	}

	function skipSeparationSpace(state, allowComments, checkIndent) {
	  var lineBreaks = 0,
	      ch = state.input.charCodeAt(state.position);

	  while (ch !== 0) {
	    while (is_WHITE_SPACE(ch)) {
	      ch = state.input.charCodeAt(++state.position);
	    }

	    if (allowComments && ch === 0x23/* # */) {
	      do {
	        ch = state.input.charCodeAt(++state.position);
	      } while (ch !== 0x0A/* LF */ && ch !== 0x0D/* CR */ && ch !== 0);
	    }

	    if (is_EOL(ch)) {
	      readLineBreak(state);

	      ch = state.input.charCodeAt(state.position);
	      lineBreaks++;
	      state.lineIndent = 0;

	      while (ch === 0x20/* Space */) {
	        state.lineIndent++;
	        ch = state.input.charCodeAt(++state.position);
	      }
	    } else {
	      break;
	    }
	  }

	  if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
	    throwWarning(state, 'deficient indentation');
	  }

	  return lineBreaks;
	}

	function testDocumentSeparator(state) {
	  var _position = state.position,
	      ch;

	  ch = state.input.charCodeAt(_position);

	  // Condition state.position === state.lineStart is tested
	  // in parent on each call, for efficiency. No needs to test here again.
	  if ((ch === 0x2D/* - */ || ch === 0x2E/* . */) &&
	      ch === state.input.charCodeAt(_position + 1) &&
	      ch === state.input.charCodeAt(_position + 2)) {

	    _position += 3;

	    ch = state.input.charCodeAt(_position);

	    if (ch === 0 || is_WS_OR_EOL(ch)) {
	      return true;
	    }
	  }

	  return false;
	}

	function writeFoldedLines(state, count) {
	  if (count === 1) {
	    state.result += ' ';
	  } else if (count > 1) {
	    state.result += common.repeat('\n', count - 1);
	  }
	}


	function readPlainScalar(state, nodeIndent, withinFlowCollection) {
	  var preceding,
	      following,
	      captureStart,
	      captureEnd,
	      hasPendingContent,
	      _line,
	      _lineStart,
	      _lineIndent,
	      _kind = state.kind,
	      _result = state.result,
	      ch;

	  ch = state.input.charCodeAt(state.position);

	  if (is_WS_OR_EOL(ch)      ||
	      is_FLOW_INDICATOR(ch) ||
	      ch === 0x23/* # */    ||
	      ch === 0x26/* & */    ||
	      ch === 0x2A/* * */    ||
	      ch === 0x21/* ! */    ||
	      ch === 0x7C/* | */    ||
	      ch === 0x3E/* > */    ||
	      ch === 0x27/* ' */    ||
	      ch === 0x22/* " */    ||
	      ch === 0x25/* % */    ||
	      ch === 0x40/* @ */    ||
	      ch === 0x60/* ` */) {
	    return false;
	  }

	  if (ch === 0x3F/* ? */ || ch === 0x2D/* - */) {
	    following = state.input.charCodeAt(state.position + 1);

	    if (is_WS_OR_EOL(following) ||
	        withinFlowCollection && is_FLOW_INDICATOR(following)) {
	      return false;
	    }
	  }

	  state.kind = 'scalar';
	  state.result = '';
	  captureStart = captureEnd = state.position;
	  hasPendingContent = false;

	  while (ch !== 0) {
	    if (ch === 0x3A/* : */) {
	      following = state.input.charCodeAt(state.position + 1);

	      if (is_WS_OR_EOL(following) ||
	          withinFlowCollection && is_FLOW_INDICATOR(following)) {
	        break;
	      }

	    } else if (ch === 0x23/* # */) {
	      preceding = state.input.charCodeAt(state.position - 1);

	      if (is_WS_OR_EOL(preceding)) {
	        break;
	      }

	    } else if ((state.position === state.lineStart && testDocumentSeparator(state)) ||
	               withinFlowCollection && is_FLOW_INDICATOR(ch)) {
	      break;

	    } else if (is_EOL(ch)) {
	      _line = state.line;
	      _lineStart = state.lineStart;
	      _lineIndent = state.lineIndent;
	      skipSeparationSpace(state, false, -1);

	      if (state.lineIndent >= nodeIndent) {
	        hasPendingContent = true;
	        ch = state.input.charCodeAt(state.position);
	        continue;
	      } else {
	        state.position = captureEnd;
	        state.line = _line;
	        state.lineStart = _lineStart;
	        state.lineIndent = _lineIndent;
	        break;
	      }
	    }

	    if (hasPendingContent) {
	      captureSegment(state, captureStart, captureEnd, false);
	      writeFoldedLines(state, state.line - _line);
	      captureStart = captureEnd = state.position;
	      hasPendingContent = false;
	    }

	    if (!is_WHITE_SPACE(ch)) {
	      captureEnd = state.position + 1;
	    }

	    ch = state.input.charCodeAt(++state.position);
	  }

	  captureSegment(state, captureStart, captureEnd, false);

	  if (state.result) {
	    return true;
	  }

	  state.kind = _kind;
	  state.result = _result;
	  return false;
	}

	function readSingleQuotedScalar(state, nodeIndent) {
	  var ch,
	      captureStart, captureEnd;

	  ch = state.input.charCodeAt(state.position);

	  if (ch !== 0x27/* ' */) {
	    return false;
	  }

	  state.kind = 'scalar';
	  state.result = '';
	  state.position++;
	  captureStart = captureEnd = state.position;

	  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
	    if (ch === 0x27/* ' */) {
	      captureSegment(state, captureStart, state.position, true);
	      ch = state.input.charCodeAt(++state.position);

	      if (ch === 0x27/* ' */) {
	        captureStart = state.position;
	        state.position++;
	        captureEnd = state.position;
	      } else {
	        return true;
	      }

	    } else if (is_EOL(ch)) {
	      captureSegment(state, captureStart, captureEnd, true);
	      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
	      captureStart = captureEnd = state.position;

	    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
	      throwError(state, 'unexpected end of the document within a single quoted scalar');

	    } else {
	      state.position++;
	      captureEnd = state.position;
	    }
	  }

	  throwError(state, 'unexpected end of the stream within a single quoted scalar');
	}

	function readDoubleQuotedScalar(state, nodeIndent) {
	  var captureStart,
	      captureEnd,
	      hexLength,
	      hexResult,
	      tmp,
	      ch;

	  ch = state.input.charCodeAt(state.position);

	  if (ch !== 0x22/* " */) {
	    return false;
	  }

	  state.kind = 'scalar';
	  state.result = '';
	  state.position++;
	  captureStart = captureEnd = state.position;

	  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
	    if (ch === 0x22/* " */) {
	      captureSegment(state, captureStart, state.position, true);
	      state.position++;
	      return true;

	    } else if (ch === 0x5C/* \ */) {
	      captureSegment(state, captureStart, state.position, true);
	      ch = state.input.charCodeAt(++state.position);

	      if (is_EOL(ch)) {
	        skipSeparationSpace(state, false, nodeIndent);

	        // TODO: rework to inline fn with no type cast?
	      } else if (ch < 256 && simpleEscapeCheck[ch]) {
	        state.result += simpleEscapeMap[ch];
	        state.position++;

	      } else if ((tmp = escapedHexLen(ch)) > 0) {
	        hexLength = tmp;
	        hexResult = 0;

	        for (; hexLength > 0; hexLength--) {
	          ch = state.input.charCodeAt(++state.position);

	          if ((tmp = fromHexCode(ch)) >= 0) {
	            hexResult = (hexResult << 4) + tmp;

	          } else {
	            throwError(state, 'expected hexadecimal character');
	          }
	        }

	        state.result += charFromCodepoint(hexResult);

	        state.position++;

	      } else {
	        throwError(state, 'unknown escape sequence');
	      }

	      captureStart = captureEnd = state.position;

	    } else if (is_EOL(ch)) {
	      captureSegment(state, captureStart, captureEnd, true);
	      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
	      captureStart = captureEnd = state.position;

	    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
	      throwError(state, 'unexpected end of the document within a double quoted scalar');

	    } else {
	      state.position++;
	      captureEnd = state.position;
	    }
	  }

	  throwError(state, 'unexpected end of the stream within a double quoted scalar');
	}

	function readFlowCollection(state, nodeIndent) {
	  var readNext = true,
	      _line,
	      _tag     = state.tag,
	      _result,
	      _anchor  = state.anchor,
	      following,
	      terminator,
	      isPair,
	      isExplicitPair,
	      isMapping,
	      overridableKeys = {},
	      keyNode,
	      keyTag,
	      valueNode,
	      ch;

	  ch = state.input.charCodeAt(state.position);

	  if (ch === 0x5B/* [ */) {
	    terminator = 0x5D;/* ] */
	    isMapping = false;
	    _result = [];
	  } else if (ch === 0x7B/* { */) {
	    terminator = 0x7D;/* } */
	    isMapping = true;
	    _result = {};
	  } else {
	    return false;
	  }

	  if (state.anchor !== null) {
	    state.anchorMap[state.anchor] = _result;
	  }

	  ch = state.input.charCodeAt(++state.position);

	  while (ch !== 0) {
	    skipSeparationSpace(state, true, nodeIndent);

	    ch = state.input.charCodeAt(state.position);

	    if (ch === terminator) {
	      state.position++;
	      state.tag = _tag;
	      state.anchor = _anchor;
	      state.kind = isMapping ? 'mapping' : 'sequence';
	      state.result = _result;
	      return true;
	    } else if (!readNext) {
	      throwError(state, 'missed comma between flow collection entries');
	    }

	    keyTag = keyNode = valueNode = null;
	    isPair = isExplicitPair = false;

	    if (ch === 0x3F/* ? */) {
	      following = state.input.charCodeAt(state.position + 1);

	      if (is_WS_OR_EOL(following)) {
	        isPair = isExplicitPair = true;
	        state.position++;
	        skipSeparationSpace(state, true, nodeIndent);
	      }
	    }

	    _line = state.line;
	    composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
	    keyTag = state.tag;
	    keyNode = state.result;
	    skipSeparationSpace(state, true, nodeIndent);

	    ch = state.input.charCodeAt(state.position);

	    if ((isExplicitPair || state.line === _line) && ch === 0x3A/* : */) {
	      isPair = true;
	      ch = state.input.charCodeAt(++state.position);
	      skipSeparationSpace(state, true, nodeIndent);
	      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
	      valueNode = state.result;
	    }

	    if (isMapping) {
	      storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode);
	    } else if (isPair) {
	      _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode));
	    } else {
	      _result.push(keyNode);
	    }

	    skipSeparationSpace(state, true, nodeIndent);

	    ch = state.input.charCodeAt(state.position);

	    if (ch === 0x2C/* , */) {
	      readNext = true;
	      ch = state.input.charCodeAt(++state.position);
	    } else {
	      readNext = false;
	    }
	  }

	  throwError(state, 'unexpected end of the stream within a flow collection');
	}

	function readBlockScalar(state, nodeIndent) {
	  var captureStart,
	      folding,
	      chomping       = CHOMPING_CLIP,
	      didReadContent = false,
	      detectedIndent = false,
	      textIndent     = nodeIndent,
	      emptyLines     = 0,
	      atMoreIndented = false,
	      tmp,
	      ch;

	  ch = state.input.charCodeAt(state.position);

	  if (ch === 0x7C/* | */) {
	    folding = false;
	  } else if (ch === 0x3E/* > */) {
	    folding = true;
	  } else {
	    return false;
	  }

	  state.kind = 'scalar';
	  state.result = '';

	  while (ch !== 0) {
	    ch = state.input.charCodeAt(++state.position);

	    if (ch === 0x2B/* + */ || ch === 0x2D/* - */) {
	      if (CHOMPING_CLIP === chomping) {
	        chomping = (ch === 0x2B/* + */) ? CHOMPING_KEEP : CHOMPING_STRIP;
	      } else {
	        throwError(state, 'repeat of a chomping mode identifier');
	      }

	    } else if ((tmp = fromDecimalCode(ch)) >= 0) {
	      if (tmp === 0) {
	        throwError(state, 'bad explicit indentation width of a block scalar; it cannot be less than one');
	      } else if (!detectedIndent) {
	        textIndent = nodeIndent + tmp - 1;
	        detectedIndent = true;
	      } else {
	        throwError(state, 'repeat of an indentation width identifier');
	      }

	    } else {
	      break;
	    }
	  }

	  if (is_WHITE_SPACE(ch)) {
	    do { ch = state.input.charCodeAt(++state.position); }
	    while (is_WHITE_SPACE(ch));

	    if (ch === 0x23/* # */) {
	      do { ch = state.input.charCodeAt(++state.position); }
	      while (!is_EOL(ch) && (ch !== 0));
	    }
	  }

	  while (ch !== 0) {
	    readLineBreak(state);
	    state.lineIndent = 0;

	    ch = state.input.charCodeAt(state.position);

	    while ((!detectedIndent || state.lineIndent < textIndent) &&
	           (ch === 0x20/* Space */)) {
	      state.lineIndent++;
	      ch = state.input.charCodeAt(++state.position);
	    }

	    if (!detectedIndent && state.lineIndent > textIndent) {
	      textIndent = state.lineIndent;
	    }

	    if (is_EOL(ch)) {
	      emptyLines++;
	      continue;
	    }

	    // End of the scalar.
	    if (state.lineIndent < textIndent) {

	      // Perform the chomping.
	      if (chomping === CHOMPING_KEEP) {
	        state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);
	      } else if (chomping === CHOMPING_CLIP) {
	        if (didReadContent) { // i.e. only if the scalar is not empty.
	          state.result += '\n';
	        }
	      }

	      // Break this `while` cycle and go to the funciton's epilogue.
	      break;
	    }

	    // Folded style: use fancy rules to handle line breaks.
	    if (folding) {

	      // Lines starting with white space characters (more-indented lines) are not folded.
	      if (is_WHITE_SPACE(ch)) {
	        atMoreIndented = true;
	        // except for the first content line (cf. Example 8.1)
	        state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);

	      // End of more-indented block.
	      } else if (atMoreIndented) {
	        atMoreIndented = false;
	        state.result += common.repeat('\n', emptyLines + 1);

	      // Just one line break - perceive as the same line.
	      } else if (emptyLines === 0) {
	        if (didReadContent) { // i.e. only if we have already read some scalar content.
	          state.result += ' ';
	        }

	      // Several line breaks - perceive as different lines.
	      } else {
	        state.result += common.repeat('\n', emptyLines);
	      }

	    // Literal style: just add exact number of line breaks between content lines.
	    } else {
	      // Keep all line breaks except the header line break.
	      state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);
	    }

	    didReadContent = true;
	    detectedIndent = true;
	    emptyLines = 0;
	    captureStart = state.position;

	    while (!is_EOL(ch) && (ch !== 0)) {
	      ch = state.input.charCodeAt(++state.position);
	    }

	    captureSegment(state, captureStart, state.position, false);
	  }

	  return true;
	}

	function readBlockSequence(state, nodeIndent) {
	  var _line,
	      _tag      = state.tag,
	      _anchor   = state.anchor,
	      _result   = [],
	      following,
	      detected  = false,
	      ch;

	  if (state.anchor !== null) {
	    state.anchorMap[state.anchor] = _result;
	  }

	  ch = state.input.charCodeAt(state.position);

	  while (ch !== 0) {

	    if (ch !== 0x2D/* - */) {
	      break;
	    }

	    following = state.input.charCodeAt(state.position + 1);

	    if (!is_WS_OR_EOL(following)) {
	      break;
	    }

	    detected = true;
	    state.position++;

	    if (skipSeparationSpace(state, true, -1)) {
	      if (state.lineIndent <= nodeIndent) {
	        _result.push(null);
	        ch = state.input.charCodeAt(state.position);
	        continue;
	      }
	    }

	    _line = state.line;
	    composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
	    _result.push(state.result);
	    skipSeparationSpace(state, true, -1);

	    ch = state.input.charCodeAt(state.position);

	    if ((state.line === _line || state.lineIndent > nodeIndent) && (ch !== 0)) {
	      throwError(state, 'bad indentation of a sequence entry');
	    } else if (state.lineIndent < nodeIndent) {
	      break;
	    }
	  }

	  if (detected) {
	    state.tag = _tag;
	    state.anchor = _anchor;
	    state.kind = 'sequence';
	    state.result = _result;
	    return true;
	  }
	  return false;
	}

	function readBlockMapping(state, nodeIndent, flowIndent) {
	  var following,
	      allowCompact,
	      _line,
	      _pos,
	      _tag          = state.tag,
	      _anchor       = state.anchor,
	      _result       = {},
	      overridableKeys = {},
	      keyTag        = null,
	      keyNode       = null,
	      valueNode     = null,
	      atExplicitKey = false,
	      detected      = false,
	      ch;

	  if (state.anchor !== null) {
	    state.anchorMap[state.anchor] = _result;
	  }

	  ch = state.input.charCodeAt(state.position);

	  while (ch !== 0) {
	    following = state.input.charCodeAt(state.position + 1);
	    _line = state.line; // Save the current line.
	    _pos = state.position;

	    //
	    // Explicit notation case. There are two separate blocks:
	    // first for the key (denoted by "?") and second for the value (denoted by ":")
	    //
	    if ((ch === 0x3F/* ? */ || ch === 0x3A/* : */) && is_WS_OR_EOL(following)) {

	      if (ch === 0x3F/* ? */) {
	        if (atExplicitKey) {
	          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
	          keyTag = keyNode = valueNode = null;
	        }

	        detected = true;
	        atExplicitKey = true;
	        allowCompact = true;

	      } else if (atExplicitKey) {
	        // i.e. 0x3A/* : */ === character after the explicit key.
	        atExplicitKey = false;
	        allowCompact = true;

	      } else {
	        throwError(state, 'incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line');
	      }

	      state.position += 1;
	      ch = following;

	    //
	    // Implicit notation case. Flow-style node as the key first, then ":", and the value.
	    //
	    } else if (composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {

	      if (state.line === _line) {
	        ch = state.input.charCodeAt(state.position);

	        while (is_WHITE_SPACE(ch)) {
	          ch = state.input.charCodeAt(++state.position);
	        }

	        if (ch === 0x3A/* : */) {
	          ch = state.input.charCodeAt(++state.position);

	          if (!is_WS_OR_EOL(ch)) {
	            throwError(state, 'a whitespace character is expected after the key-value separator within a block mapping');
	          }

	          if (atExplicitKey) {
	            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
	            keyTag = keyNode = valueNode = null;
	          }

	          detected = true;
	          atExplicitKey = false;
	          allowCompact = false;
	          keyTag = state.tag;
	          keyNode = state.result;

	        } else if (detected) {
	          throwError(state, 'can not read an implicit mapping pair; a colon is missed');

	        } else {
	          state.tag = _tag;
	          state.anchor = _anchor;
	          return true; // Keep the result of `composeNode`.
	        }

	      } else if (detected) {
	        throwError(state, 'can not read a block mapping entry; a multiline key may not be an implicit key');

	      } else {
	        state.tag = _tag;
	        state.anchor = _anchor;
	        return true; // Keep the result of `composeNode`.
	      }

	    } else {
	      break; // Reading is done. Go to the epilogue.
	    }

	    //
	    // Common reading code for both explicit and implicit notations.
	    //
	    if (state.line === _line || state.lineIndent > nodeIndent) {
	      if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
	        if (atExplicitKey) {
	          keyNode = state.result;
	        } else {
	          valueNode = state.result;
	        }
	      }

	      if (!atExplicitKey) {
	        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _pos);
	        keyTag = keyNode = valueNode = null;
	      }

	      skipSeparationSpace(state, true, -1);
	      ch = state.input.charCodeAt(state.position);
	    }

	    if (state.lineIndent > nodeIndent && (ch !== 0)) {
	      throwError(state, 'bad indentation of a mapping entry');
	    } else if (state.lineIndent < nodeIndent) {
	      break;
	    }
	  }

	  //
	  // Epilogue.
	  //

	  // Special case: last mapping's node contains only the key in explicit notation.
	  if (atExplicitKey) {
	    storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
	  }

	  // Expose the resulting mapping.
	  if (detected) {
	    state.tag = _tag;
	    state.anchor = _anchor;
	    state.kind = 'mapping';
	    state.result = _result;
	  }

	  return detected;
	}

	function readTagProperty(state) {
	  var _position,
	      isVerbatim = false,
	      isNamed    = false,
	      tagHandle,
	      tagName,
	      ch;

	  ch = state.input.charCodeAt(state.position);

	  if (ch !== 0x21/* ! */) return false;

	  if (state.tag !== null) {
	    throwError(state, 'duplication of a tag property');
	  }

	  ch = state.input.charCodeAt(++state.position);

	  if (ch === 0x3C/* < */) {
	    isVerbatim = true;
	    ch = state.input.charCodeAt(++state.position);

	  } else if (ch === 0x21/* ! */) {
	    isNamed = true;
	    tagHandle = '!!';
	    ch = state.input.charCodeAt(++state.position);

	  } else {
	    tagHandle = '!';
	  }

	  _position = state.position;

	  if (isVerbatim) {
	    do { ch = state.input.charCodeAt(++state.position); }
	    while (ch !== 0 && ch !== 0x3E/* > */);

	    if (state.position < state.length) {
	      tagName = state.input.slice(_position, state.position);
	      ch = state.input.charCodeAt(++state.position);
	    } else {
	      throwError(state, 'unexpected end of the stream within a verbatim tag');
	    }
	  } else {
	    while (ch !== 0 && !is_WS_OR_EOL(ch)) {

	      if (ch === 0x21/* ! */) {
	        if (!isNamed) {
	          tagHandle = state.input.slice(_position - 1, state.position + 1);

	          if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
	            throwError(state, 'named tag handle cannot contain such characters');
	          }

	          isNamed = true;
	          _position = state.position + 1;
	        } else {
	          throwError(state, 'tag suffix cannot contain exclamation marks');
	        }
	      }

	      ch = state.input.charCodeAt(++state.position);
	    }

	    tagName = state.input.slice(_position, state.position);

	    if (PATTERN_FLOW_INDICATORS.test(tagName)) {
	      throwError(state, 'tag suffix cannot contain flow indicator characters');
	    }
	  }

	  if (tagName && !PATTERN_TAG_URI.test(tagName)) {
	    throwError(state, 'tag name cannot contain such characters: ' + tagName);
	  }

	  if (isVerbatim) {
	    state.tag = tagName;

	  } else if (_hasOwnProperty$2.call(state.tagMap, tagHandle)) {
	    state.tag = state.tagMap[tagHandle] + tagName;

	  } else if (tagHandle === '!') {
	    state.tag = '!' + tagName;

	  } else if (tagHandle === '!!') {
	    state.tag = 'tag:yaml.org,2002:' + tagName;

	  } else {
	    throwError(state, 'undeclared tag handle "' + tagHandle + '"');
	  }

	  return true;
	}

	function readAnchorProperty(state) {
	  var _position,
	      ch;

	  ch = state.input.charCodeAt(state.position);

	  if (ch !== 0x26/* & */) return false;

	  if (state.anchor !== null) {
	    throwError(state, 'duplication of an anchor property');
	  }

	  ch = state.input.charCodeAt(++state.position);
	  _position = state.position;

	  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
	    ch = state.input.charCodeAt(++state.position);
	  }

	  if (state.position === _position) {
	    throwError(state, 'name of an anchor node must contain at least one character');
	  }

	  state.anchor = state.input.slice(_position, state.position);
	  return true;
	}

	function readAlias(state) {
	  var _position, alias,
	      ch;

	  ch = state.input.charCodeAt(state.position);

	  if (ch !== 0x2A/* * */) return false;

	  ch = state.input.charCodeAt(++state.position);
	  _position = state.position;

	  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
	    ch = state.input.charCodeAt(++state.position);
	  }

	  if (state.position === _position) {
	    throwError(state, 'name of an alias node must contain at least one character');
	  }

	  alias = state.input.slice(_position, state.position);

	  if (!state.anchorMap.hasOwnProperty(alias)) {
	    throwError(state, 'unidentified alias "' + alias + '"');
	  }

	  state.result = state.anchorMap[alias];
	  skipSeparationSpace(state, true, -1);
	  return true;
	}

	function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
	  var allowBlockStyles,
	      allowBlockScalars,
	      allowBlockCollections,
	      indentStatus = 1, // 1: this>parent, 0: this=parent, -1: this<parent
	      atNewLine  = false,
	      hasContent = false,
	      typeIndex,
	      typeQuantity,
	      type,
	      flowIndent,
	      blockIndent;

	  if (state.listener !== null) {
	    state.listener('open', state);
	  }

	  state.tag    = null;
	  state.anchor = null;
	  state.kind   = null;
	  state.result = null;

	  allowBlockStyles = allowBlockScalars = allowBlockCollections =
	    CONTEXT_BLOCK_OUT === nodeContext ||
	    CONTEXT_BLOCK_IN  === nodeContext;

	  if (allowToSeek) {
	    if (skipSeparationSpace(state, true, -1)) {
	      atNewLine = true;

	      if (state.lineIndent > parentIndent) {
	        indentStatus = 1;
	      } else if (state.lineIndent === parentIndent) {
	        indentStatus = 0;
	      } else if (state.lineIndent < parentIndent) {
	        indentStatus = -1;
	      }
	    }
	  }

	  if (indentStatus === 1) {
	    while (readTagProperty(state) || readAnchorProperty(state)) {
	      if (skipSeparationSpace(state, true, -1)) {
	        atNewLine = true;
	        allowBlockCollections = allowBlockStyles;

	        if (state.lineIndent > parentIndent) {
	          indentStatus = 1;
	        } else if (state.lineIndent === parentIndent) {
	          indentStatus = 0;
	        } else if (state.lineIndent < parentIndent) {
	          indentStatus = -1;
	        }
	      } else {
	        allowBlockCollections = false;
	      }
	    }
	  }

	  if (allowBlockCollections) {
	    allowBlockCollections = atNewLine || allowCompact;
	  }

	  if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
	    if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
	      flowIndent = parentIndent;
	    } else {
	      flowIndent = parentIndent + 1;
	    }

	    blockIndent = state.position - state.lineStart;

	    if (indentStatus === 1) {
	      if (allowBlockCollections &&
	          (readBlockSequence(state, blockIndent) ||
	           readBlockMapping(state, blockIndent, flowIndent)) ||
	          readFlowCollection(state, flowIndent)) {
	        hasContent = true;
	      } else {
	        if ((allowBlockScalars && readBlockScalar(state, flowIndent)) ||
	            readSingleQuotedScalar(state, flowIndent) ||
	            readDoubleQuotedScalar(state, flowIndent)) {
	          hasContent = true;

	        } else if (readAlias(state)) {
	          hasContent = true;

	          if (state.tag !== null || state.anchor !== null) {
	            throwError(state, 'alias node should not have any properties');
	          }

	        } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
	          hasContent = true;

	          if (state.tag === null) {
	            state.tag = '?';
	          }
	        }

	        if (state.anchor !== null) {
	          state.anchorMap[state.anchor] = state.result;
	        }
	      }
	    } else if (indentStatus === 0) {
	      // Special case: block sequences are allowed to have same indentation level as the parent.
	      // http://www.yaml.org/spec/1.2/spec.html#id2799784
	      hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
	    }
	  }

	  if (state.tag !== null && state.tag !== '!') {
	    if (state.tag === '?') {
	      for (typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
	        type = state.implicitTypes[typeIndex];

	        // Implicit resolving is not allowed for non-scalar types, and '?'
	        // non-specific tag is only assigned to plain scalars. So, it isn't
	        // needed to check for 'kind' conformity.

	        if (type.resolve(state.result)) { // `state.result` updated in resolver if matched
	          state.result = type.construct(state.result);
	          state.tag = type.tag;
	          if (state.anchor !== null) {
	            state.anchorMap[state.anchor] = state.result;
	          }
	          break;
	        }
	      }
	    } else if (_hasOwnProperty$2.call(state.typeMap[state.kind || 'fallback'], state.tag)) {
	      type = state.typeMap[state.kind || 'fallback'][state.tag];

	      if (state.result !== null && type.kind !== state.kind) {
	        throwError(state, 'unacceptable node kind for !<' + state.tag + '> tag; it should be "' + type.kind + '", not "' + state.kind + '"');
	      }

	      if (!type.resolve(state.result)) { // `state.result` updated in resolver if matched
	        throwError(state, 'cannot resolve a node with !<' + state.tag + '> explicit tag');
	      } else {
	        state.result = type.construct(state.result);
	        if (state.anchor !== null) {
	          state.anchorMap[state.anchor] = state.result;
	        }
	      }
	    } else {
	      throwError(state, 'unknown tag !<' + state.tag + '>');
	    }
	  }

	  if (state.listener !== null) {
	    state.listener('close', state);
	  }
	  return state.tag !== null ||  state.anchor !== null || hasContent;
	}

	function readDocument(state) {
	  var documentStart = state.position,
	      _position,
	      directiveName,
	      directiveArgs,
	      hasDirectives = false,
	      ch;

	  state.version = null;
	  state.checkLineBreaks = state.legacy;
	  state.tagMap = {};
	  state.anchorMap = {};

	  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
	    skipSeparationSpace(state, true, -1);

	    ch = state.input.charCodeAt(state.position);

	    if (state.lineIndent > 0 || ch !== 0x25/* % */) {
	      break;
	    }

	    hasDirectives = true;
	    ch = state.input.charCodeAt(++state.position);
	    _position = state.position;

	    while (ch !== 0 && !is_WS_OR_EOL(ch)) {
	      ch = state.input.charCodeAt(++state.position);
	    }

	    directiveName = state.input.slice(_position, state.position);
	    directiveArgs = [];

	    if (directiveName.length < 1) {
	      throwError(state, 'directive name must not be less than one character in length');
	    }

	    while (ch !== 0) {
	      while (is_WHITE_SPACE(ch)) {
	        ch = state.input.charCodeAt(++state.position);
	      }

	      if (ch === 0x23/* # */) {
	        do { ch = state.input.charCodeAt(++state.position); }
	        while (ch !== 0 && !is_EOL(ch));
	        break;
	      }

	      if (is_EOL(ch)) break;

	      _position = state.position;

	      while (ch !== 0 && !is_WS_OR_EOL(ch)) {
	        ch = state.input.charCodeAt(++state.position);
	      }

	      directiveArgs.push(state.input.slice(_position, state.position));
	    }

	    if (ch !== 0) readLineBreak(state);

	    if (_hasOwnProperty$2.call(directiveHandlers, directiveName)) {
	      directiveHandlers[directiveName](state, directiveName, directiveArgs);
	    } else {
	      throwWarning(state, 'unknown document directive "' + directiveName + '"');
	    }
	  }

	  skipSeparationSpace(state, true, -1);

	  if (state.lineIndent === 0 &&
	      state.input.charCodeAt(state.position)     === 0x2D/* - */ &&
	      state.input.charCodeAt(state.position + 1) === 0x2D/* - */ &&
	      state.input.charCodeAt(state.position + 2) === 0x2D/* - */) {
	    state.position += 3;
	    skipSeparationSpace(state, true, -1);

	  } else if (hasDirectives) {
	    throwError(state, 'directives end mark is expected');
	  }

	  composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
	  skipSeparationSpace(state, true, -1);

	  if (state.checkLineBreaks &&
	      PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
	    throwWarning(state, 'non-ASCII line breaks are interpreted as content');
	  }

	  state.documents.push(state.result);

	  if (state.position === state.lineStart && testDocumentSeparator(state)) {

	    if (state.input.charCodeAt(state.position) === 0x2E/* . */) {
	      state.position += 3;
	      skipSeparationSpace(state, true, -1);
	    }
	    return;
	  }

	  if (state.position < (state.length - 1)) {
	    throwError(state, 'end of the stream or a document separator is expected');
	  } else {
	    return;
	  }
	}


	function loadDocuments(input, options) {
	  input = String(input);
	  options = options || {};

	  if (input.length !== 0) {

	    // Add tailing `\n` if not exists
	    if (input.charCodeAt(input.length - 1) !== 0x0A/* LF */ &&
	        input.charCodeAt(input.length - 1) !== 0x0D/* CR */) {
	      input += '\n';
	    }

	    // Strip BOM
	    if (input.charCodeAt(0) === 0xFEFF) {
	      input = input.slice(1);
	    }
	  }

	  var state = new State(input, options);

	  // Use 0 as string terminator. That significantly simplifies bounds check.
	  state.input += '\0';

	  while (state.input.charCodeAt(state.position) === 0x20/* Space */) {
	    state.lineIndent += 1;
	    state.position += 1;
	  }

	  while (state.position < (state.length - 1)) {
	    readDocument(state);
	  }

	  return state.documents;
	}


	function loadAll(input, iterator, options) {
	  var documents = loadDocuments(input, options), index, length;

	  if (typeof iterator !== 'function') {
	    return documents;
	  }

	  for (index = 0, length = documents.length; index < length; index += 1) {
	    iterator(documents[index]);
	  }
	}


	function load(input, options) {
	  var documents = loadDocuments(input, options);

	  if (documents.length === 0) {
	    /*eslint-disable no-undefined*/
	    return undefined;
	  } else if (documents.length === 1) {
	    return documents[0];
	  }
	  throw new exception('expected a single document in the stream, but found more');
	}


	function safeLoadAll(input, output, options) {
	  if (typeof output === 'function') {
	    loadAll(input, output, common.extend({ schema: default_safe }, options));
	  } else {
	    return loadAll(input, common.extend({ schema: default_safe }, options));
	  }
	}


	function safeLoad(input, options) {
	  return load(input, common.extend({ schema: default_safe }, options));
	}


	var loadAll_1     = loadAll;
	var load_1        = load;
	var safeLoadAll_1 = safeLoadAll;
	var safeLoad_1    = safeLoad;

	var loader = {
		loadAll: loadAll_1,
		load: load_1,
		safeLoadAll: safeLoadAll_1,
		safeLoad: safeLoad_1
	};

	/*eslint-disable no-use-before-define*/






	var _toString$2       = Object.prototype.toString;
	var _hasOwnProperty$3 = Object.prototype.hasOwnProperty;

	var CHAR_TAB                  = 0x09; /* Tab */
	var CHAR_LINE_FEED            = 0x0A; /* LF */
	var CHAR_SPACE                = 0x20; /* Space */
	var CHAR_EXCLAMATION          = 0x21; /* ! */
	var CHAR_DOUBLE_QUOTE         = 0x22; /* " */
	var CHAR_SHARP                = 0x23; /* # */
	var CHAR_PERCENT              = 0x25; /* % */
	var CHAR_AMPERSAND            = 0x26; /* & */
	var CHAR_SINGLE_QUOTE         = 0x27; /* ' */
	var CHAR_ASTERISK             = 0x2A; /* * */
	var CHAR_COMMA                = 0x2C; /* , */
	var CHAR_MINUS                = 0x2D; /* - */
	var CHAR_COLON                = 0x3A; /* : */
	var CHAR_GREATER_THAN         = 0x3E; /* > */
	var CHAR_QUESTION             = 0x3F; /* ? */
	var CHAR_COMMERCIAL_AT        = 0x40; /* @ */
	var CHAR_LEFT_SQUARE_BRACKET  = 0x5B; /* [ */
	var CHAR_RIGHT_SQUARE_BRACKET = 0x5D; /* ] */
	var CHAR_GRAVE_ACCENT         = 0x60; /* ` */
	var CHAR_LEFT_CURLY_BRACKET   = 0x7B; /* { */
	var CHAR_VERTICAL_LINE        = 0x7C; /* | */
	var CHAR_RIGHT_CURLY_BRACKET  = 0x7D; /* } */

	var ESCAPE_SEQUENCES = {};

	ESCAPE_SEQUENCES[0x00]   = '\\0';
	ESCAPE_SEQUENCES[0x07]   = '\\a';
	ESCAPE_SEQUENCES[0x08]   = '\\b';
	ESCAPE_SEQUENCES[0x09]   = '\\t';
	ESCAPE_SEQUENCES[0x0A]   = '\\n';
	ESCAPE_SEQUENCES[0x0B]   = '\\v';
	ESCAPE_SEQUENCES[0x0C]   = '\\f';
	ESCAPE_SEQUENCES[0x0D]   = '\\r';
	ESCAPE_SEQUENCES[0x1B]   = '\\e';
	ESCAPE_SEQUENCES[0x22]   = '\\"';
	ESCAPE_SEQUENCES[0x5C]   = '\\\\';
	ESCAPE_SEQUENCES[0x85]   = '\\N';
	ESCAPE_SEQUENCES[0xA0]   = '\\_';
	ESCAPE_SEQUENCES[0x2028] = '\\L';
	ESCAPE_SEQUENCES[0x2029] = '\\P';

	var DEPRECATED_BOOLEANS_SYNTAX = [
	  'y', 'Y', 'yes', 'Yes', 'YES', 'on', 'On', 'ON',
	  'n', 'N', 'no', 'No', 'NO', 'off', 'Off', 'OFF'
	];

	function compileStyleMap(schema, map) {
	  var result, keys, index, length, tag, style, type;

	  if (map === null) return {};

	  result = {};
	  keys = Object.keys(map);

	  for (index = 0, length = keys.length; index < length; index += 1) {
	    tag = keys[index];
	    style = String(map[tag]);

	    if (tag.slice(0, 2) === '!!') {
	      tag = 'tag:yaml.org,2002:' + tag.slice(2);
	    }
	    type = schema.compiledTypeMap['fallback'][tag];

	    if (type && _hasOwnProperty$3.call(type.styleAliases, style)) {
	      style = type.styleAliases[style];
	    }

	    result[tag] = style;
	  }

	  return result;
	}

	function encodeHex(character) {
	  var string, handle, length;

	  string = character.toString(16).toUpperCase();

	  if (character <= 0xFF) {
	    handle = 'x';
	    length = 2;
	  } else if (character <= 0xFFFF) {
	    handle = 'u';
	    length = 4;
	  } else if (character <= 0xFFFFFFFF) {
	    handle = 'U';
	    length = 8;
	  } else {
	    throw new exception('code point within a string may not be greater than 0xFFFFFFFF');
	  }

	  return '\\' + handle + common.repeat('0', length - string.length) + string;
	}

	function State$1(options) {
	  this.schema       = options['schema'] || default_full;
	  this.indent       = Math.max(1, (options['indent'] || 2));
	  this.skipInvalid  = options['skipInvalid'] || false;
	  this.flowLevel    = (common.isNothing(options['flowLevel']) ? -1 : options['flowLevel']);
	  this.styleMap     = compileStyleMap(this.schema, options['styles'] || null);
	  this.sortKeys     = options['sortKeys'] || false;
	  this.lineWidth    = options['lineWidth'] || 80;
	  this.noRefs       = options['noRefs'] || false;
	  this.noCompatMode = options['noCompatMode'] || false;
	  this.condenseFlow = options['condenseFlow'] || false;

	  this.implicitTypes = this.schema.compiledImplicit;
	  this.explicitTypes = this.schema.compiledExplicit;

	  this.tag = null;
	  this.result = '';

	  this.duplicates = [];
	  this.usedDuplicates = null;
	}

	// Indents every line in a string. Empty lines (\n only) are not indented.
	function indentString(string, spaces) {
	  var ind = common.repeat(' ', spaces),
	      position = 0,
	      next = -1,
	      result = '',
	      line,
	      length = string.length;

	  while (position < length) {
	    next = string.indexOf('\n', position);
	    if (next === -1) {
	      line = string.slice(position);
	      position = length;
	    } else {
	      line = string.slice(position, next + 1);
	      position = next + 1;
	    }

	    if (line.length && line !== '\n') result += ind;

	    result += line;
	  }

	  return result;
	}

	function generateNextLine(state, level) {
	  return '\n' + common.repeat(' ', state.indent * level);
	}

	function testImplicitResolving(state, str) {
	  var index, length, type;

	  for (index = 0, length = state.implicitTypes.length; index < length; index += 1) {
	    type = state.implicitTypes[index];

	    if (type.resolve(str)) {
	      return true;
	    }
	  }

	  return false;
	}

	// [33] s-white ::= s-space | s-tab
	function isWhitespace(c) {
	  return c === CHAR_SPACE || c === CHAR_TAB;
	}

	// Returns true if the character can be printed without escaping.
	// From YAML 1.2: "any allowed characters known to be non-printable
	// should also be escaped. [However,] This isn’t mandatory"
	// Derived from nb-char - \t - #x85 - #xA0 - #x2028 - #x2029.
	function isPrintable(c) {
	  return  (0x00020 <= c && c <= 0x00007E)
	      || ((0x000A1 <= c && c <= 0x00D7FF) && c !== 0x2028 && c !== 0x2029)
	      || ((0x0E000 <= c && c <= 0x00FFFD) && c !== 0xFEFF /* BOM */)
	      ||  (0x10000 <= c && c <= 0x10FFFF);
	}

	// Simplified test for values allowed after the first character in plain style.
	function isPlainSafe(c) {
	  // Uses a subset of nb-char - c-flow-indicator - ":" - "#"
	  // where nb-char ::= c-printable - b-char - c-byte-order-mark.
	  return isPrintable(c) && c !== 0xFEFF
	    // - c-flow-indicator
	    && c !== CHAR_COMMA
	    && c !== CHAR_LEFT_SQUARE_BRACKET
	    && c !== CHAR_RIGHT_SQUARE_BRACKET
	    && c !== CHAR_LEFT_CURLY_BRACKET
	    && c !== CHAR_RIGHT_CURLY_BRACKET
	    // - ":" - "#"
	    && c !== CHAR_COLON
	    && c !== CHAR_SHARP;
	}

	// Simplified test for values allowed as the first character in plain style.
	function isPlainSafeFirst(c) {
	  // Uses a subset of ns-char - c-indicator
	  // where ns-char = nb-char - s-white.
	  return isPrintable(c) && c !== 0xFEFF
	    && !isWhitespace(c) // - s-white
	    // - (c-indicator ::=
	    // “-” | “?” | “:” | “,” | “[” | “]” | “{” | “}”
	    && c !== CHAR_MINUS
	    && c !== CHAR_QUESTION
	    && c !== CHAR_COLON
	    && c !== CHAR_COMMA
	    && c !== CHAR_LEFT_SQUARE_BRACKET
	    && c !== CHAR_RIGHT_SQUARE_BRACKET
	    && c !== CHAR_LEFT_CURLY_BRACKET
	    && c !== CHAR_RIGHT_CURLY_BRACKET
	    // | “#” | “&” | “*” | “!” | “|” | “>” | “'” | “"”
	    && c !== CHAR_SHARP
	    && c !== CHAR_AMPERSAND
	    && c !== CHAR_ASTERISK
	    && c !== CHAR_EXCLAMATION
	    && c !== CHAR_VERTICAL_LINE
	    && c !== CHAR_GREATER_THAN
	    && c !== CHAR_SINGLE_QUOTE
	    && c !== CHAR_DOUBLE_QUOTE
	    // | “%” | “@” | “`”)
	    && c !== CHAR_PERCENT
	    && c !== CHAR_COMMERCIAL_AT
	    && c !== CHAR_GRAVE_ACCENT;
	}

	// Determines whether block indentation indicator is required.
	function needIndentIndicator(string) {
	  var leadingSpaceRe = /^\n* /;
	  return leadingSpaceRe.test(string);
	}

	var STYLE_PLAIN   = 1,
	    STYLE_SINGLE  = 2,
	    STYLE_LITERAL = 3,
	    STYLE_FOLDED  = 4,
	    STYLE_DOUBLE  = 5;

	// Determines which scalar styles are possible and returns the preferred style.
	// lineWidth = -1 => no limit.
	// Pre-conditions: str.length > 0.
	// Post-conditions:
	//    STYLE_PLAIN or STYLE_SINGLE => no \n are in the string.
	//    STYLE_LITERAL => no lines are suitable for folding (or lineWidth is -1).
	//    STYLE_FOLDED => a line > lineWidth and can be folded (and lineWidth != -1).
	function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType) {
	  var i;
	  var char;
	  var hasLineBreak = false;
	  var hasFoldableLine = false; // only checked if shouldTrackWidth
	  var shouldTrackWidth = lineWidth !== -1;
	  var previousLineBreak = -1; // count the first line correctly
	  var plain = isPlainSafeFirst(string.charCodeAt(0))
	          && !isWhitespace(string.charCodeAt(string.length - 1));

	  if (singleLineOnly) {
	    // Case: no block styles.
	    // Check for disallowed characters to rule out plain and single.
	    for (i = 0; i < string.length; i++) {
	      char = string.charCodeAt(i);
	      if (!isPrintable(char)) {
	        return STYLE_DOUBLE;
	      }
	      plain = plain && isPlainSafe(char);
	    }
	  } else {
	    // Case: block styles permitted.
	    for (i = 0; i < string.length; i++) {
	      char = string.charCodeAt(i);
	      if (char === CHAR_LINE_FEED) {
	        hasLineBreak = true;
	        // Check if any line can be folded.
	        if (shouldTrackWidth) {
	          hasFoldableLine = hasFoldableLine ||
	            // Foldable line = too long, and not more-indented.
	            (i - previousLineBreak - 1 > lineWidth &&
	             string[previousLineBreak + 1] !== ' ');
	          previousLineBreak = i;
	        }
	      } else if (!isPrintable(char)) {
	        return STYLE_DOUBLE;
	      }
	      plain = plain && isPlainSafe(char);
	    }
	    // in case the end is missing a \n
	    hasFoldableLine = hasFoldableLine || (shouldTrackWidth &&
	      (i - previousLineBreak - 1 > lineWidth &&
	       string[previousLineBreak + 1] !== ' '));
	  }
	  // Although every style can represent \n without escaping, prefer block styles
	  // for multiline, since they're more readable and they don't add empty lines.
	  // Also prefer folding a super-long line.
	  if (!hasLineBreak && !hasFoldableLine) {
	    // Strings interpretable as another type have to be quoted;
	    // e.g. the string 'true' vs. the boolean true.
	    return plain && !testAmbiguousType(string)
	      ? STYLE_PLAIN : STYLE_SINGLE;
	  }
	  // Edge case: block indentation indicator can only have one digit.
	  if (indentPerLevel > 9 && needIndentIndicator(string)) {
	    return STYLE_DOUBLE;
	  }
	  // At this point we know block styles are valid.
	  // Prefer literal style unless we want to fold.
	  return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
	}

	// Note: line breaking/folding is implemented for only the folded style.
	// NB. We drop the last trailing newline (if any) of a returned block scalar
	//  since the dumper adds its own newline. This always works:
	//    • No ending newline => unaffected; already using strip "-" chomping.
	//    • Ending newline    => removed then restored.
	//  Importantly, this keeps the "+" chomp indicator from gaining an extra line.
	function writeScalar(state, string, level, iskey) {
	  state.dump = (function () {
	    if (string.length === 0) {
	      return "''";
	    }
	    if (!state.noCompatMode &&
	        DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1) {
	      return "'" + string + "'";
	    }

	    var indent = state.indent * Math.max(1, level); // no 0-indent scalars
	    // As indentation gets deeper, let the width decrease monotonically
	    // to the lower bound min(state.lineWidth, 40).
	    // Note that this implies
	    //  state.lineWidth ≤ 40 + state.indent: width is fixed at the lower bound.
	    //  state.lineWidth > 40 + state.indent: width decreases until the lower bound.
	    // This behaves better than a constant minimum width which disallows narrower options,
	    // or an indent threshold which causes the width to suddenly increase.
	    var lineWidth = state.lineWidth === -1
	      ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);

	    // Without knowing if keys are implicit/explicit, assume implicit for safety.
	    var singleLineOnly = iskey
	      // No block styles in flow mode.
	      || (state.flowLevel > -1 && level >= state.flowLevel);
	    function testAmbiguity(string) {
	      return testImplicitResolving(state, string);
	    }

	    switch (chooseScalarStyle(string, singleLineOnly, state.indent, lineWidth, testAmbiguity)) {
	      case STYLE_PLAIN:
	        return string;
	      case STYLE_SINGLE:
	        return "'" + string.replace(/'/g, "''") + "'";
	      case STYLE_LITERAL:
	        return '|' + blockHeader(string, state.indent)
	          + dropEndingNewline(indentString(string, indent));
	      case STYLE_FOLDED:
	        return '>' + blockHeader(string, state.indent)
	          + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
	      case STYLE_DOUBLE:
	        return '"' + escapeString(string, lineWidth) + '"';
	      default:
	        throw new exception('impossible error: invalid scalar style');
	    }
	  }());
	}

	// Pre-conditions: string is valid for a block scalar, 1 <= indentPerLevel <= 9.
	function blockHeader(string, indentPerLevel) {
	  var indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : '';

	  // note the special case: the string '\n' counts as a "trailing" empty line.
	  var clip =          string[string.length - 1] === '\n';
	  var keep = clip && (string[string.length - 2] === '\n' || string === '\n');
	  var chomp = keep ? '+' : (clip ? '' : '-');

	  return indentIndicator + chomp + '\n';
	}

	// (See the note for writeScalar.)
	function dropEndingNewline(string) {
	  return string[string.length - 1] === '\n' ? string.slice(0, -1) : string;
	}

	// Note: a long line without a suitable break point will exceed the width limit.
	// Pre-conditions: every char in str isPrintable, str.length > 0, width > 0.
	function foldString(string, width) {
	  // In folded style, $k$ consecutive newlines output as $k+1$ newlines—
	  // unless they're before or after a more-indented line, or at the very
	  // beginning or end, in which case $k$ maps to $k$.
	  // Therefore, parse each chunk as newline(s) followed by a content line.
	  var lineRe = /(\n+)([^\n]*)/g;

	  // first line (possibly an empty line)
	  var result = (function () {
	    var nextLF = string.indexOf('\n');
	    nextLF = nextLF !== -1 ? nextLF : string.length;
	    lineRe.lastIndex = nextLF;
	    return foldLine(string.slice(0, nextLF), width);
	  }());
	  // If we haven't reached the first content line yet, don't add an extra \n.
	  var prevMoreIndented = string[0] === '\n' || string[0] === ' ';
	  var moreIndented;

	  // rest of the lines
	  var match;
	  while ((match = lineRe.exec(string))) {
	    var prefix = match[1], line = match[2];
	    moreIndented = (line[0] === ' ');
	    result += prefix
	      + (!prevMoreIndented && !moreIndented && line !== ''
	        ? '\n' : '')
	      + foldLine(line, width);
	    prevMoreIndented = moreIndented;
	  }

	  return result;
	}

	// Greedy line breaking.
	// Picks the longest line under the limit each time,
	// otherwise settles for the shortest line over the limit.
	// NB. More-indented lines *cannot* be folded, as that would add an extra \n.
	function foldLine(line, width) {
	  if (line === '' || line[0] === ' ') return line;

	  // Since a more-indented line adds a \n, breaks can't be followed by a space.
	  var breakRe = / [^ ]/g; // note: the match index will always be <= length-2.
	  var match;
	  // start is an inclusive index. end, curr, and next are exclusive.
	  var start = 0, end, curr = 0, next = 0;
	  var result = '';

	  // Invariants: 0 <= start <= length-1.
	  //   0 <= curr <= next <= max(0, length-2). curr - start <= width.
	  // Inside the loop:
	  //   A match implies length >= 2, so curr and next are <= length-2.
	  while ((match = breakRe.exec(line))) {
	    next = match.index;
	    // maintain invariant: curr - start <= width
	    if (next - start > width) {
	      end = (curr > start) ? curr : next; // derive end <= length-2
	      result += '\n' + line.slice(start, end);
	      // skip the space that was output as \n
	      start = end + 1;                    // derive start <= length-1
	    }
	    curr = next;
	  }

	  // By the invariants, start <= length-1, so there is something left over.
	  // It is either the whole string or a part starting from non-whitespace.
	  result += '\n';
	  // Insert a break if the remainder is too long and there is a break available.
	  if (line.length - start > width && curr > start) {
	    result += line.slice(start, curr) + '\n' + line.slice(curr + 1);
	  } else {
	    result += line.slice(start);
	  }

	  return result.slice(1); // drop extra \n joiner
	}

	// Escapes a double-quoted string.
	function escapeString(string) {
	  var result = '';
	  var char, nextChar;
	  var escapeSeq;

	  for (var i = 0; i < string.length; i++) {
	    char = string.charCodeAt(i);
	    // Check for surrogate pairs (reference Unicode 3.0 section "3.7 Surrogates").
	    if (char >= 0xD800 && char <= 0xDBFF/* high surrogate */) {
	      nextChar = string.charCodeAt(i + 1);
	      if (nextChar >= 0xDC00 && nextChar <= 0xDFFF/* low surrogate */) {
	        // Combine the surrogate pair and store it escaped.
	        result += encodeHex((char - 0xD800) * 0x400 + nextChar - 0xDC00 + 0x10000);
	        // Advance index one extra since we already used that char here.
	        i++; continue;
	      }
	    }
	    escapeSeq = ESCAPE_SEQUENCES[char];
	    result += !escapeSeq && isPrintable(char)
	      ? string[i]
	      : escapeSeq || encodeHex(char);
	  }

	  return result;
	}

	function writeFlowSequence(state, level, object) {
	  var _result = '',
	      _tag    = state.tag,
	      index,
	      length;

	  for (index = 0, length = object.length; index < length; index += 1) {
	    // Write only valid elements.
	    if (writeNode(state, level, object[index], false, false)) {
	      if (index !== 0) _result += ',' + (!state.condenseFlow ? ' ' : '');
	      _result += state.dump;
	    }
	  }

	  state.tag = _tag;
	  state.dump = '[' + _result + ']';
	}

	function writeBlockSequence(state, level, object, compact) {
	  var _result = '',
	      _tag    = state.tag,
	      index,
	      length;

	  for (index = 0, length = object.length; index < length; index += 1) {
	    // Write only valid elements.
	    if (writeNode(state, level + 1, object[index], true, true)) {
	      if (!compact || index !== 0) {
	        _result += generateNextLine(state, level);
	      }

	      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
	        _result += '-';
	      } else {
	        _result += '- ';
	      }

	      _result += state.dump;
	    }
	  }

	  state.tag = _tag;
	  state.dump = _result || '[]'; // Empty sequence if no valid values.
	}

	function writeFlowMapping(state, level, object) {
	  var _result       = '',
	      _tag          = state.tag,
	      objectKeyList = Object.keys(object),
	      index,
	      length,
	      objectKey,
	      objectValue,
	      pairBuffer;

	  for (index = 0, length = objectKeyList.length; index < length; index += 1) {
	    pairBuffer = state.condenseFlow ? '"' : '';

	    if (index !== 0) pairBuffer += ', ';

	    objectKey = objectKeyList[index];
	    objectValue = object[objectKey];

	    if (!writeNode(state, level, objectKey, false, false)) {
	      continue; // Skip this pair because of invalid key;
	    }

	    if (state.dump.length > 1024) pairBuffer += '? ';

	    pairBuffer += state.dump + (state.condenseFlow ? '"' : '') + ':' + (state.condenseFlow ? '' : ' ');

	    if (!writeNode(state, level, objectValue, false, false)) {
	      continue; // Skip this pair because of invalid value.
	    }

	    pairBuffer += state.dump;

	    // Both key and value are valid.
	    _result += pairBuffer;
	  }

	  state.tag = _tag;
	  state.dump = '{' + _result + '}';
	}

	function writeBlockMapping(state, level, object, compact) {
	  var _result       = '',
	      _tag          = state.tag,
	      objectKeyList = Object.keys(object),
	      index,
	      length,
	      objectKey,
	      objectValue,
	      explicitPair,
	      pairBuffer;

	  // Allow sorting keys so that the output file is deterministic
	  if (state.sortKeys === true) {
	    // Default sorting
	    objectKeyList.sort();
	  } else if (typeof state.sortKeys === 'function') {
	    // Custom sort function
	    objectKeyList.sort(state.sortKeys);
	  } else if (state.sortKeys) {
	    // Something is wrong
	    throw new exception('sortKeys must be a boolean or a function');
	  }

	  for (index = 0, length = objectKeyList.length; index < length; index += 1) {
	    pairBuffer = '';

	    if (!compact || index !== 0) {
	      pairBuffer += generateNextLine(state, level);
	    }

	    objectKey = objectKeyList[index];
	    objectValue = object[objectKey];

	    if (!writeNode(state, level + 1, objectKey, true, true, true)) {
	      continue; // Skip this pair because of invalid key.
	    }

	    explicitPair = (state.tag !== null && state.tag !== '?') ||
	                   (state.dump && state.dump.length > 1024);

	    if (explicitPair) {
	      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
	        pairBuffer += '?';
	      } else {
	        pairBuffer += '? ';
	      }
	    }

	    pairBuffer += state.dump;

	    if (explicitPair) {
	      pairBuffer += generateNextLine(state, level);
	    }

	    if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
	      continue; // Skip this pair because of invalid value.
	    }

	    if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
	      pairBuffer += ':';
	    } else {
	      pairBuffer += ': ';
	    }

	    pairBuffer += state.dump;

	    // Both key and value are valid.
	    _result += pairBuffer;
	  }

	  state.tag = _tag;
	  state.dump = _result || '{}'; // Empty mapping if no valid pairs.
	}

	function detectType(state, object, explicit) {
	  var _result, typeList, index, length, type, style;

	  typeList = explicit ? state.explicitTypes : state.implicitTypes;

	  for (index = 0, length = typeList.length; index < length; index += 1) {
	    type = typeList[index];

	    if ((type.instanceOf  || type.predicate) &&
	        (!type.instanceOf || ((typeof object === 'object') && (object instanceof type.instanceOf))) &&
	        (!type.predicate  || type.predicate(object))) {

	      state.tag = explicit ? type.tag : '?';

	      if (type.represent) {
	        style = state.styleMap[type.tag] || type.defaultStyle;

	        if (_toString$2.call(type.represent) === '[object Function]') {
	          _result = type.represent(object, style);
	        } else if (_hasOwnProperty$3.call(type.represent, style)) {
	          _result = type.represent[style](object, style);
	        } else {
	          throw new exception('!<' + type.tag + '> tag resolver accepts not "' + style + '" style');
	        }

	        state.dump = _result;
	      }

	      return true;
	    }
	  }

	  return false;
	}

	// Serializes `object` and writes it to global `result`.
	// Returns true on success, or false on invalid object.
	//
	function writeNode(state, level, object, block, compact, iskey) {
	  state.tag = null;
	  state.dump = object;

	  if (!detectType(state, object, false)) {
	    detectType(state, object, true);
	  }

	  var type = _toString$2.call(state.dump);

	  if (block) {
	    block = (state.flowLevel < 0 || state.flowLevel > level);
	  }

	  var objectOrArray = type === '[object Object]' || type === '[object Array]',
	      duplicateIndex,
	      duplicate;

	  if (objectOrArray) {
	    duplicateIndex = state.duplicates.indexOf(object);
	    duplicate = duplicateIndex !== -1;
	  }

	  if ((state.tag !== null && state.tag !== '?') || duplicate || (state.indent !== 2 && level > 0)) {
	    compact = false;
	  }

	  if (duplicate && state.usedDuplicates[duplicateIndex]) {
	    state.dump = '*ref_' + duplicateIndex;
	  } else {
	    if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
	      state.usedDuplicates[duplicateIndex] = true;
	    }
	    if (type === '[object Object]') {
	      if (block && (Object.keys(state.dump).length !== 0)) {
	        writeBlockMapping(state, level, state.dump, compact);
	        if (duplicate) {
	          state.dump = '&ref_' + duplicateIndex + state.dump;
	        }
	      } else {
	        writeFlowMapping(state, level, state.dump);
	        if (duplicate) {
	          state.dump = '&ref_' + duplicateIndex + ' ' + state.dump;
	        }
	      }
	    } else if (type === '[object Array]') {
	      if (block && (state.dump.length !== 0)) {
	        writeBlockSequence(state, level, state.dump, compact);
	        if (duplicate) {
	          state.dump = '&ref_' + duplicateIndex + state.dump;
	        }
	      } else {
	        writeFlowSequence(state, level, state.dump);
	        if (duplicate) {
	          state.dump = '&ref_' + duplicateIndex + ' ' + state.dump;
	        }
	      }
	    } else if (type === '[object String]') {
	      if (state.tag !== '?') {
	        writeScalar(state, state.dump, level, iskey);
	      }
	    } else {
	      if (state.skipInvalid) return false;
	      throw new exception('unacceptable kind of an object to dump ' + type);
	    }

	    if (state.tag !== null && state.tag !== '?') {
	      state.dump = '!<' + state.tag + '> ' + state.dump;
	    }
	  }

	  return true;
	}

	function getDuplicateReferences(object, state) {
	  var objects = [],
	      duplicatesIndexes = [],
	      index,
	      length;

	  inspectNode(object, objects, duplicatesIndexes);

	  for (index = 0, length = duplicatesIndexes.length; index < length; index += 1) {
	    state.duplicates.push(objects[duplicatesIndexes[index]]);
	  }
	  state.usedDuplicates = new Array(length);
	}

	function inspectNode(object, objects, duplicatesIndexes) {
	  var objectKeyList,
	      index,
	      length;

	  if (object !== null && typeof object === 'object') {
	    index = objects.indexOf(object);
	    if (index !== -1) {
	      if (duplicatesIndexes.indexOf(index) === -1) {
	        duplicatesIndexes.push(index);
	      }
	    } else {
	      objects.push(object);

	      if (Array.isArray(object)) {
	        for (index = 0, length = object.length; index < length; index += 1) {
	          inspectNode(object[index], objects, duplicatesIndexes);
	        }
	      } else {
	        objectKeyList = Object.keys(object);

	        for (index = 0, length = objectKeyList.length; index < length; index += 1) {
	          inspectNode(object[objectKeyList[index]], objects, duplicatesIndexes);
	        }
	      }
	    }
	  }
	}

	function dump(input, options) {
	  options = options || {};

	  var state = new State$1(options);

	  if (!state.noRefs) getDuplicateReferences(input, state);

	  if (writeNode(state, 0, input, true, true)) return state.dump + '\n';

	  return '';
	}

	function safeDump(input, options) {
	  return dump(input, common.extend({ schema: default_safe }, options));
	}

	var dump_1     = dump;
	var safeDump_1 = safeDump;

	var dumper = {
		dump: dump_1,
		safeDump: safeDump_1
	};

	function deprecated(name) {
	  return function () {
	    throw new Error('Function ' + name + ' is deprecated and cannot be used.');
	  };
	}


	var Type$1                = type;
	var Schema$1              = schema;
	var FAILSAFE_SCHEMA     = failsafe;
	var JSON_SCHEMA         = json;
	var CORE_SCHEMA         = core;
	var DEFAULT_SAFE_SCHEMA = default_safe;
	var DEFAULT_FULL_SCHEMA = default_full;
	var load$1                = loader.load;
	var loadAll$1             = loader.loadAll;
	var safeLoad$1            = loader.safeLoad;
	var safeLoadAll$1         = loader.safeLoadAll;
	var dump$1                = dumper.dump;
	var safeDump$1            = dumper.safeDump;
	var YAMLException$1       = exception;

	// Deprecated schema names from JS-YAML 2.0.x
	var MINIMAL_SCHEMA = failsafe;
	var SAFE_SCHEMA    = default_safe;
	var DEFAULT_SCHEMA = default_full;

	// Deprecated functions from JS-YAML 1.x.x
	var scan           = deprecated('scan');
	var parse          = deprecated('parse');
	var compose        = deprecated('compose');
	var addConstructor = deprecated('addConstructor');

	var jsYaml = {
		Type: Type$1,
		Schema: Schema$1,
		FAILSAFE_SCHEMA: FAILSAFE_SCHEMA,
		JSON_SCHEMA: JSON_SCHEMA,
		CORE_SCHEMA: CORE_SCHEMA,
		DEFAULT_SAFE_SCHEMA: DEFAULT_SAFE_SCHEMA,
		DEFAULT_FULL_SCHEMA: DEFAULT_FULL_SCHEMA,
		load: load$1,
		loadAll: loadAll$1,
		safeLoad: safeLoad$1,
		safeLoadAll: safeLoadAll$1,
		dump: dump$1,
		safeDump: safeDump$1,
		YAMLException: YAMLException$1,
		MINIMAL_SCHEMA: MINIMAL_SCHEMA,
		SAFE_SCHEMA: SAFE_SCHEMA,
		DEFAULT_SCHEMA: DEFAULT_SCHEMA,
		scan: scan,
		parse: parse,
		compose: compose,
		addConstructor: addConstructor
	};

	var jsYaml$1 = jsYaml;

	const resolveFrom = (fromDir, moduleId, silent) => {
		if (typeof fromDir !== 'string') {
			throw new TypeError(`Expected \`fromDir\` to be of type \`string\`, got \`${typeof fromDir}\``);
		}

		if (typeof moduleId !== 'string') {
			throw new TypeError(`Expected \`moduleId\` to be of type \`string\`, got \`${typeof moduleId}\``);
		}

		fromDir = path.resolve(fromDir);
		const fromFile = path.join(fromDir, 'noop.js');

		const resolveFileName = () => module$1._resolveFilename(moduleId, {
			id: fromFile,
			filename: fromFile,
			paths: module$1._nodeModulePaths(fromDir)
		});

		if (silent) {
			try {
				return resolveFileName();
			} catch (err) {
				return null;
			}
		}

		return resolveFileName();
	};

	var resolveFrom_1 = (fromDir, moduleId) => resolveFrom(fromDir, moduleId);
	var silent = (fromDir, moduleId) => resolveFrom(fromDir, moduleId, true);
	resolveFrom_1.silent = silent;

	var callsites = () => {
		const _ = Error.prepareStackTrace;
		Error.prepareStackTrace = (_, stack) => stack;
		const stack = new Error().stack.slice(1);
		Error.prepareStackTrace = _;
		return stack;
	};

	var callerCallsite = () => {
		const c = callsites();
		let caller;

		for (let i = 0; i < c.length; i++) {
			const hasReceiver = c[i].getTypeName() !== null;

			if (hasReceiver) {
				caller = i;
				break;
			}
		}

		return c[caller];
	};

	var callerPath = () => callerCallsite().getFileName();

	var importFresh = moduleId => {
		if (typeof moduleId !== 'string') {
			throw new TypeError('Expected a string');
		}

		const filePath = resolveFrom_1(path.dirname(callerPath()), moduleId);

		// Delete itself from module parent
		if (commonjsRequire.cache[filePath] && commonjsRequire.cache[filePath].parent) {
			let i = commonjsRequire.cache[filePath].parent.children.length;

			while (i--) {
				if (commonjsRequire.cache[filePath].parent.children[i].id === filePath) {
					commonjsRequire.cache[filePath].parent.children.splice(i, 1);
				}
			}
		}

		// Delete module from cache
		delete commonjsRequire.cache[filePath];

		// Return fresh module
		return commonjsRequire(filePath);
	};

	function loadJs(filepath        )         {
	  const result = importFresh(filepath);
	  return result;
	}

	function loadJson(filepath        , content        )         {
	  try {
	    return parseJson$1(content);
	  } catch (err) {
	    err.message = `JSON Error in ${filepath}:\n${err.message}`;
	    throw err;
	  }
	}

	function loadYaml(filepath        , content        )         {
	  return jsYaml$1.safeLoad(content, { filename: filepath });
	}

	var loaders = {
	  loadJs,
	  loadJson,
	  loadYaml,
	};

	function readFile(filepath        , options          )                         {
	  options = options || {};
	  const throwNotFound = options.throwNotFound || false;

	  return new Promise((resolve, reject) => {
	    fs.readFile(filepath, 'utf8', (err, content) => {
	      if (err && err.code === 'ENOENT' && !throwNotFound) {
	        return resolve(null);
	      }
	      if (err) return reject(err);
	      resolve(content);
	    });
	  });
	}

	readFile.sync = function readFileSync(
	  filepath        ,
	  options          
	)                {
	  options = options || {};
	  const throwNotFound = options.throwNotFound || false;

	  try {
	    return fs.readFileSync(filepath, 'utf8');
	  } catch (err) {
	    if (err.code === 'ENOENT' && !throwNotFound) {
	      return null;
	    }
	    throw err;
	  }
	};

	var readFile_1 = readFile;

	//      

	function cacheWrapper   (cache                 , key        , fn         )    {
	  if (!cache) {
	    return fn();
	  }

	  const cached = cache.get(key);
	  if (cached !== undefined) {
	    return cached;
	  }

	  const result = fn();
	  cache.set(key, result);
	  return result;
	}

	var cacheWrapper_1 = cacheWrapper;

	/**
	 * async
	 */

	function isDirectory(filepath, cb) {
	  if (typeof cb !== 'function') {
	    throw new Error('expected a callback function');
	  }

	  if (typeof filepath !== 'string') {
	    cb(new Error('expected filepath to be a string'));
	    return;
	  }

	  fs.stat(filepath, function(err, stats) {
	    if (err) {
	      if (err.code === 'ENOENT') {
	        cb(null, false);
	        return;
	      }
	      cb(err);
	      return;
	    }
	    cb(null, stats.isDirectory());
	  });
	}

	/**
	 * sync
	 */

	isDirectory.sync = function isDirectorySync(filepath) {
	  if (typeof filepath !== 'string') {
	    throw new Error('expected filepath to be a string');
	  }

	  try {
	    var stat = fs.statSync(filepath);
	    return stat.isDirectory();
	  } catch (err) {
	    if (err.code === 'ENOENT') {
	      return false;
	    } else {
	      throw err;
	    }
	  }
	  return false;
	};

	/**
	 * Expose `isDirectory`
	 */

	var isDirectory_1 = isDirectory;

	function getDirectory(filepath        )                  {
	  return new Promise((resolve, reject) => {
	    return isDirectory_1(filepath, (err, filepathIsDirectory) => {
	      if (err) {
	        return reject(err);
	      }
	      return resolve(filepathIsDirectory ? filepath : path.dirname(filepath));
	    });
	  });
	}

	getDirectory.sync = function getDirectorySync(filepath        )         {
	  return isDirectory_1.sync(filepath) ? filepath : path.dirname(filepath);
	};

	var getDirectory_1 = getDirectory;

	const MODE_SYNC = 'sync';

	// An object value represents a config object.
	// null represents that the loader did not find anything relevant.
	// undefined represents that the loader found something relevant
	// but it was empty.
	                                              

	class Explorer {
	                                                      
	                                                 
	                                                        
	                                                   
	                          

	  constructor(options                 ) {
	    this.loadCache = options.cache ? new Map() : null;
	    this.loadSyncCache = options.cache ? new Map() : null;
	    this.searchCache = options.cache ? new Map() : null;
	    this.searchSyncCache = options.cache ? new Map() : null;
	    this.config = options;
	    this.validateConfig();
	  }

	  clearLoadCache() {
	    if (this.loadCache) {
	      this.loadCache.clear();
	    }
	    if (this.loadSyncCache) {
	      this.loadSyncCache.clear();
	    }
	  }

	  clearSearchCache() {
	    if (this.searchCache) {
	      this.searchCache.clear();
	    }
	    if (this.searchSyncCache) {
	      this.searchSyncCache.clear();
	    }
	  }

	  clearCaches() {
	    this.clearLoadCache();
	    this.clearSearchCache();
	  }

	  validateConfig() {
	    const config = this.config;

	    config.searchPlaces.forEach(place => {
	      const loaderKey = path.extname(place) || 'noExt';
	      const loader = config.loaders[loaderKey];
	      if (!loader) {
	        throw new Error(
	          `No loader specified for ${getExtensionDescription(
            place
          )}, so searchPlaces item "${place}" is invalid`
	        );
	      }
	    });
	  }

	  search(searchFrom         )                             {
	    searchFrom = searchFrom || process.cwd();
	    return getDirectory_1(searchFrom).then(dir => {
	      return this.searchFromDirectory(dir);
	    });
	  }

	  searchFromDirectory(dir        )                             {
	    const absoluteDir = path.resolve(process.cwd(), dir);
	    const run = () => {
	      return this.searchDirectory(absoluteDir).then(result => {
	        const nextDir = this.nextDirectoryToSearch(absoluteDir, result);
	        if (nextDir) {
	          return this.searchFromDirectory(nextDir);
	        }
	        return this.config.transform(result);
	      });
	    };

	    if (this.searchCache) {
	      return cacheWrapper_1(this.searchCache, absoluteDir, run);
	    }
	    return run();
	  }

	  searchSync(searchFrom         )                    {
	    searchFrom = searchFrom || process.cwd();
	    const dir = getDirectory_1.sync(searchFrom);
	    return this.searchFromDirectorySync(dir);
	  }

	  searchFromDirectorySync(dir        )                    {
	    const absoluteDir = path.resolve(process.cwd(), dir);
	    const run = () => {
	      const result = this.searchDirectorySync(absoluteDir);
	      const nextDir = this.nextDirectoryToSearch(absoluteDir, result);
	      if (nextDir) {
	        return this.searchFromDirectorySync(nextDir);
	      }
	      return this.config.transform(result);
	    };

	    if (this.searchSyncCache) {
	      return cacheWrapper_1(this.searchSyncCache, absoluteDir, run);
	    }
	    return run();
	  }

	  searchDirectory(dir        )                             {
	    return this.config.searchPlaces.reduce((prevResultPromise, place) => {
	      return prevResultPromise.then(prevResult => {
	        if (this.shouldSearchStopWithResult(prevResult)) {
	          return prevResult;
	        }
	        return this.loadSearchPlace(dir, place);
	      });
	    }, Promise.resolve(null));
	  }

	  searchDirectorySync(dir        )                    {
	    let result = null;
	    for (const place of this.config.searchPlaces) {
	      result = this.loadSearchPlaceSync(dir, place);
	      if (this.shouldSearchStopWithResult(result)) break;
	    }
	    return result;
	  }

	  shouldSearchStopWithResult(result                   )          {
	    if (result === null) return false;
	    if (result.isEmpty && this.config.ignoreEmptySearchPlaces) return false;
	    return true;
	  }

	  loadSearchPlace(dir        , place        )                             {
	    const filepath = path.join(dir, place);
	    return readFile_1(filepath).then(content => {
	      return this.createCosmiconfigResult(filepath, content);
	    });
	  }

	  loadSearchPlaceSync(dir        , place        )                    {
	    const filepath = path.join(dir, place);
	    const content = readFile_1.sync(filepath);
	    return this.createCosmiconfigResultSync(filepath, content);
	  }

	  nextDirectoryToSearch(
	    currentDir        ,
	    currentResult                   
	  )          {
	    if (this.shouldSearchStopWithResult(currentResult)) {
	      return null;
	    }
	    const nextDir = nextDirUp(currentDir);
	    if (nextDir === currentDir || currentDir === this.config.stopDir) {
	      return null;
	    }
	    return nextDir;
	  }

	  loadPackageProp(filepath        , content        ) {
	    const parsedContent = loaders.loadJson(filepath, content);
	    const packagePropValue = parsedContent[this.config.packageProp];
	    return packagePropValue || null;
	  }

	  getLoaderEntryForFile(filepath        )              {
	    if (path.basename(filepath) === 'package.json') {
	      const loader = this.loadPackageProp.bind(this);
	      return { sync: loader, async: loader };
	    }

	    const loaderKey = path.extname(filepath) || 'noExt';
	    return this.config.loaders[loaderKey] || {};
	  }

	  getSyncLoaderForFile(filepath        )             {
	    const entry = this.getLoaderEntryForFile(filepath);
	    if (!entry.sync) {
	      throw new Error(
	        `No sync loader specified for ${getExtensionDescription(filepath)}`
	      );
	    }
	    return entry.sync;
	  }

	  getAsyncLoaderForFile(filepath        )              {
	    const entry = this.getLoaderEntryForFile(filepath);
	    const loader = entry.async || entry.sync;
	    if (!loader) {
	      throw new Error(
	        `No async loader specified for ${getExtensionDescription(filepath)}`
	      );
	    }
	    return loader;
	  }

	  loadFileContent(
	    mode                  ,
	    filepath        ,
	    content               
	  )                                                 {
	    if (content === null) {
	      return null;
	    }
	    if (content.trim() === '') {
	      return undefined;
	    }
	    const loader =
	      mode === MODE_SYNC
	        ? this.getSyncLoaderForFile(filepath)
	        : this.getAsyncLoaderForFile(filepath);
	    return loader(filepath, content);
	  }

	  loadedContentToCosmiconfigResult(
	    filepath        ,
	    loadedContent                   
	  )                    {
	    if (loadedContent === null) {
	      return null;
	    }
	    if (loadedContent === undefined) {
	      return { filepath, config: undefined, isEmpty: true };
	    }
	    return { config: loadedContent, filepath };
	  }

	  createCosmiconfigResult(
	    filepath        ,
	    content               
	  )                             {
	    return Promise.resolve()
	      .then(() => {
	        return this.loadFileContent('async', filepath, content);
	      })
	      .then(loaderResult => {
	        return this.loadedContentToCosmiconfigResult(filepath, loaderResult);
	      });
	  }

	  createCosmiconfigResultSync(
	    filepath        ,
	    content               
	  )                    {
	    const loaderResult = this.loadFileContent('sync', filepath, content);
	    return this.loadedContentToCosmiconfigResult(filepath, loaderResult);
	  }

	  validateFilePath(filepath         ) {
	    if (!filepath) {
	      throw new Error('load and loadSync must pass a non-empty string');
	    }
	  }

	  load(filepath        )                             {
	    return Promise.resolve().then(() => {
	      this.validateFilePath(filepath);
	      const absoluteFilePath = path.resolve(process.cwd(), filepath);
	      return cacheWrapper_1(this.loadCache, absoluteFilePath, () => {
	        return readFile_1(absoluteFilePath, { throwNotFound: true })
	          .then(content => {
	            return this.createCosmiconfigResult(absoluteFilePath, content);
	          })
	          .then(this.config.transform);
	      });
	    });
	  }

	  loadSync(filepath        )                    {
	    this.validateFilePath(filepath);
	    const absoluteFilePath = path.resolve(process.cwd(), filepath);
	    return cacheWrapper_1(this.loadSyncCache, absoluteFilePath, () => {
	      const content = readFile_1.sync(absoluteFilePath, { throwNotFound: true });
	      const result = this.createCosmiconfigResultSync(
	        absoluteFilePath,
	        content
	      );
	      return this.config.transform(result);
	    });
	  }
	}

	var createExplorer = function createExplorer(options                 ) {
	  const explorer = new Explorer(options);

	  return {
	    search: explorer.search.bind(explorer),
	    searchSync: explorer.searchSync.bind(explorer),
	    load: explorer.load.bind(explorer),
	    loadSync: explorer.loadSync.bind(explorer),
	    clearLoadCache: explorer.clearLoadCache.bind(explorer),
	    clearSearchCache: explorer.clearSearchCache.bind(explorer),
	    clearCaches: explorer.clearCaches.bind(explorer),
	  };
	};

	function nextDirUp(dir        )         {
	  return path.dirname(dir);
	}

	function getExtensionDescription(filepath        )         {
	  const ext = path.extname(filepath);
	  return ext ? `extension "${ext}"` : 'files without extensions';
	}

	var dist = cosmiconfig;

	function cosmiconfig(
	  moduleName        ,
	  options   
	                         
	                     
	                                 
	                                      
	                     
	                    
	                                                       
	   
	) {
	  options = options || {};
	  const defaults = {
	    packageProp: moduleName,
	    searchPlaces: [
	      'package.json',
	      `.${moduleName}rc`,
	      `.${moduleName}rc.json`,
	      `.${moduleName}rc.yaml`,
	      `.${moduleName}rc.yml`,
	      `.${moduleName}rc.js`,
	      `${moduleName}.config.js`,
	    ],
	    ignoreEmptySearchPlaces: true,
	    stopDir: os.homedir(),
	    cache: true,
	    transform: identity,
	  };
	  const normalizedOptions                  = Object.assign(
	    {},
	    defaults,
	    options,
	    {
	      loaders: normalizeLoaders(options.loaders),
	    }
	  );

	  return createExplorer(normalizedOptions);
	}

	cosmiconfig.loadJs = loaders.loadJs;
	cosmiconfig.loadJson = loaders.loadJson;
	cosmiconfig.loadYaml = loaders.loadYaml;

	function normalizeLoaders(rawLoaders         )          {
	  const defaults = {
	    '.js': { sync: loaders.loadJs, async: loaders.loadJs },
	    '.json': { sync: loaders.loadJson, async: loaders.loadJson },
	    '.yaml': { sync: loaders.loadYaml, async: loaders.loadYaml },
	    '.yml': { sync: loaders.loadYaml, async: loaders.loadYaml },
	    noExt: { sync: loaders.loadYaml, async: loaders.loadYaml },
	  };

	  if (!rawLoaders) {
	    return defaults;
	  }

	  return Object.keys(rawLoaders).reduce((result, ext) => {
	    const entry = rawLoaders && rawLoaders[ext];
	    if (typeof entry === 'function') {
	      result[ext] = { sync: entry, async: entry };
	    } else {
	      result[ext] = entry;
	    }
	    return result;
	  }, defaults);
	}

	function identity(x) {
	  return x;
	}

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
	  const explorer = dist(moduleName);

	  const _ref = explorer.searchSync(startDir) || {},
	        _ref$config = _ref.config,
	        config = _ref$config === void 0 ? {} : _ref$config;

	  return Object.assign({}, defaults, config);
	}

	var loadConfig_1 = loadConfig;

	var name = "use-pkg-version";
	var version = "0.1.1";
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
	var module$2 = "./src/use-pkg-version.cli.es.js";
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
		release: "nodenv --env .env.local --exec release-it --verbose"
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
		module: module$2,
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
		module: module$2,
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

	var envinfo = createCommonjsModule(function (module) {
	module.exports=function(e){var t={};function r(n){if(t[n])return t[n].exports;var o=t[n]={i:n,l:!1,exports:{}};return e[n].call(o.exports,o,o.exports,r),o.l=!0,o.exports}return r.m=e,r.c=t,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n});},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0});},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)r.d(n,o,function(t){return e[t]}.bind(null,o));return n},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=34)}([function(e,t){e.exports=path;},function(e,t){e.exports=fs;},function(e,t,r){var n=r(65),o="function"==typeof Symbol&&"symbol"==typeof Symbol("foo"),i=Object.prototype.toString,s=Array.prototype.concat,a=Object.defineProperty,c=a&&function(){var e={};try{for(var t in a(e,"x",{enumerable:!1,value:e}),e)return !1;return e.x===e}catch(e){return !1}}(),u=function(e,t,r,n){var o;t in e&&("function"!=typeof(o=n)||"[object Function]"!==i.call(o)||!n())||(c?a(e,t,{configurable:!0,enumerable:!1,value:r,writable:!0}):e[t]=r);},l=function(e,t){var r=arguments.length>2?arguments[2]:{},i=n(t);o&&(i=s.call(i,Object.getOwnPropertySymbols(t)));for(var a=0;a<i.length;a+=1)u(e,i[a],t[i[a]],r[i[a]]);};l.supportsDescriptors=!!c,e.exports=l;},function(e,t,r){var n=r(4);e.exports=n.call(Function.call,Object.prototype.hasOwnProperty);},function(e,t,r){var n=r(67);e.exports=Function.prototype.bind||n;},function(e,t){e.exports=os;},function(e,t,r){const n=r(0),o=r(1),i=r(12),s=r(50),a=r(7),c=r(54),u=e=>new Promise(t=>{i.exec(e,{stdio:[0,"pipe","ignore"]},(e,r)=>{t((e?"":r.toString()||"").trim());});}),l=function(e){const t=Object.values(Array.prototype.slice.call(arguments).slice(1));(process.env.ENVINFO_DEBUG||"").toLowerCase()===e&&console.log(e,JSON.stringify(t));},p=e=>new Promise(t=>{o.stat(e,r=>t(r?null:e));}),f=e=>new Promise(t=>{e||t(null),o.readFile(e,"utf8",(e,r)=>t(r||null));}),h=e=>p(e).then(f).then(e=>e?JSON.parse(e):null),d=/\d+\.[\d+|.]+/g,y=e=>{l("trace","findDarwinApplication",e);const t=`mdfind "kMDItemCFBundleIdentifier=='${e}'"`;return l("trace",t),u(t).then(e=>e.replace(/(\s)/g,"\\ "))},m=(e,t)=>{var r=(t||["CFBundleShortVersionString"]).map(function(e){return "-c Print:"+e});return ["/usr/libexec/PlistBuddy"].concat(r).concat([e]).join(" ")},g=(e,t)=>{const r=[];let n=null;for(;null!==(n=e.exec(t));)r.push(n);return r};e.exports={run:u,log:l,fileExists:p,readFile:f,requireJson:h,versionRegex:d,findDarwinApplication:y,generatePlistBuddyCommand:m,matchAll:g,parseSDKManagerOutput:e=>{const t=e.split("Available")[0];return {apiLevels:g(c.androidAPILevels,t).map(e=>e[1]),buildTools:g(c.androidBuildTools,t).map(e=>e[1]),systemImages:g(c.androidSystemImages,t).map(e=>e[1].split("|").map(e=>e.trim())).map(e=>e[0].split(";")[0]+" | "+e[2].split(" System Image")[0])}},isObject:e=>"object"==typeof e&&!Array.isArray(e),noop:e=>e,pipe:e=>t=>e.reduce((e,t)=>t(e),t),browserBundleIdentifiers:{Chrome:"com.google.Chrome","Chrome Canary":"com.google.Chrome.canary",Firefox:"org.mozilla.firefox","Firefox Developer Edition":"org.mozilla.firefoxdeveloperedition","Firefox Nightly":"org.mozilla.nightly",Safari:"com.apple.Safari","Safari Technology Preview":"com.apple.SafariTechnologyPreview"},ideBundleIdentifiers:{Atom:"com.github.atom",IntelliJ:"com.jetbrains.intellij",PhpStorm:"com.jetbrains.PhpStorm","Sublime Text":"com.sublimetext.3",WebStorm:"com.jetbrains.WebStorm"},runSync:e=>(i.execSync(e,{stdio:[0,"pipe","ignore"]}).toString()||"").trim(),which:e=>new Promise(t=>s(e,(e,r)=>t(r))),getDarwinApplicationVersion:e=>{var t;return l("trace","getDarwinApplicationVersion",e),t="darwin"!==process.platform?"N/A":y(e).then(e=>u(m(n.join(e,"Contents","Info.plist"),["CFBundleShortVersionString"]))),Promise.resolve(t)},uniq:e=>Array.from(new Set(e)),toReadableBytes:e=>{const t=Math.floor(Math.log(e)/Math.log(1024));return e?(e/Math.pow(1024,t)).toFixed(2)+" "+["B","KB","MB","GB","TB","PB"][t]:"0 Bytes"},omit:(e,t)=>Object.keys(e).filter(e=>t.indexOf(e)<0).reduce((t,r)=>Object.assign(t,{[r]:e[r]}),{}),pick:(e,t)=>Object.keys(e).filter(e=>t.indexOf(e)>=0).reduce((t,r)=>Object.assign(t,{[r]:e[r]}),{}),getPackageJsonByName:e=>h(n.join(process.cwd(),"node_modules",e,"package.json")),getPackageJsonByPath:e=>h(n.join(process.cwd(),e)),getPackageJsonByFullPath:e=>(l("trace","getPackageJsonByFullPath",e),h(e)),getAllPackageJsonPaths:e=>(l("trace","getAllPackageJsonPaths",e),new Promise(t=>{const r=(e,r)=>t(r||[]);return a(e?n.join("node_modules",e,"package.json"):n.join("node_modules","**","package.json"),r)})),sortObject:e=>Object.keys(e).sort().reduce((t,r)=>(t[r]=e[r],t),{}),findVersion:(e,t,r)=>{const n=r||0,o=t||d,i=e.match(o);return i?i[n]:e},condensePath:e=>(e||"").replace(process.env.HOME,"~"),determineFound:(e,t,r)=>(l("trace","determineFound",e,t,r),"N/A"===t||"N/A"===t&&"N/A"===r?Promise.resolve([e,"N/A"]):t?r?Promise.resolve([e,t,r]):Promise.resolve([e,t]):Promise.resolve([e,"Not Found"]))};},function(e,t,r){e.exports=b;var n=r(1),o=r(13),i=r(8),s=(i.Minimatch,r(45)),a=r(47).EventEmitter,c=r(0),u=r(14),l=r(10),p=r(48),f=r(15),h=(f.alphasort,f.alphasorti,f.setopts),d=f.ownProp,y=r(49),m=(r(9),f.childrenIgnored),g=f.isIgnored,v=r(17);function b(e,t,r){if("function"==typeof t&&(r=t,t={}),t||(t={}),t.sync){if(r)throw new TypeError("callback provided to sync glob");return p(e,t)}return new S(e,t,r)}b.sync=p;var w=b.GlobSync=p.GlobSync;function S(e,t,r){if("function"==typeof t&&(r=t,t=null),t&&t.sync){if(r)throw new TypeError("callback provided to sync glob");return new w(e,t)}if(!(this instanceof S))return new S(e,t,r);h(this,e,t),this._didRealPath=!1;var n=this.minimatch.set.length;this.matches=new Array(n),"function"==typeof r&&(r=v(r),this.on("error",r),this.on("end",function(e){r(null,e);}));var o=this;if(this._processing=0,this._emitQueue=[],this._processQueue=[],this.paused=!1,this.noprocess)return this;if(0===n)return a();for(var i=!0,s=0;s<n;s++)this._process(this.minimatch.set[s],s,!1,a);function a(){--o._processing,o._processing<=0&&(i?process.nextTick(function(){o._finish();}):o._finish());}i=!1;}b.glob=b,b.hasMagic=function(e,t){var r=function(e,t){if(null===t||"object"!=typeof t)return e;for(var r=Object.keys(t),n=r.length;n--;)e[r[n]]=t[r[n]];return e}({},t);r.noprocess=!0;var n=new S(e,r).minimatch.set;if(!e)return !1;if(n.length>1)return !0;for(var o=0;o<n[0].length;o++)if("string"!=typeof n[0][o])return !0;return !1},b.Glob=S,s(S,a),S.prototype._finish=function(){if(u(this instanceof S),!this.aborted){if(this.realpath&&!this._didRealpath)return this._realpath();f.finish(this),this.emit("end",this.found);}},S.prototype._realpath=function(){if(!this._didRealpath){this._didRealpath=!0;var e=this.matches.length;if(0===e)return this._finish();for(var t=this,r=0;r<this.matches.length;r++)this._realpathSet(r,n);}function n(){0==--e&&t._finish();}},S.prototype._realpathSet=function(e,t){var r=this.matches[e];if(!r)return t();var n=Object.keys(r),i=this,s=n.length;if(0===s)return t();var a=this.matches[e]=Object.create(null);n.forEach(function(r,n){r=i._makeAbs(r),o.realpath(r,i.realpathCache,function(n,o){n?"stat"===n.syscall?a[r]=!0:i.emit("error",n):a[o]=!0,0==--s&&(i.matches[e]=a,t());});});},S.prototype._mark=function(e){return f.mark(this,e)},S.prototype._makeAbs=function(e){return f.makeAbs(this,e)},S.prototype.abort=function(){this.aborted=!0,this.emit("abort");},S.prototype.pause=function(){this.paused||(this.paused=!0,this.emit("pause"));},S.prototype.resume=function(){if(this.paused){if(this.emit("resume"),this.paused=!1,this._emitQueue.length){var e=this._emitQueue.slice(0);this._emitQueue.length=0;for(var t=0;t<e.length;t++){var r=e[t];this._emitMatch(r[0],r[1]);}}if(this._processQueue.length){var n=this._processQueue.slice(0);this._processQueue.length=0;for(t=0;t<n.length;t++){var o=n[t];this._processing--,this._process(o[0],o[1],o[2],o[3]);}}}},S.prototype._process=function(e,t,r,n){if(u(this instanceof S),u("function"==typeof n),!this.aborted)if(this._processing++,this.paused)this._processQueue.push([e,t,r,n]);else{for(var o,s=0;"string"==typeof e[s];)s++;switch(s){case e.length:return void this._processSimple(e.join("/"),t,n);case 0:o=null;break;default:o=e.slice(0,s).join("/");}var a,c=e.slice(s);null===o?a=".":l(o)||l(e.join("/"))?(o&&l(o)||(o="/"+o),a=o):a=o;var p=this._makeAbs(a);if(m(this,a))return n();c[0]===i.GLOBSTAR?this._processGlobStar(o,a,p,c,t,r,n):this._processReaddir(o,a,p,c,t,r,n);}},S.prototype._processReaddir=function(e,t,r,n,o,i,s){var a=this;this._readdir(r,i,function(c,u){return a._processReaddir2(e,t,r,n,o,i,u,s)});},S.prototype._processReaddir2=function(e,t,r,n,o,i,s,a){if(!s)return a();for(var u=n[0],l=!!this.minimatch.negate,p=u._glob,f=this.dot||"."===p.charAt(0),h=[],d=0;d<s.length;d++){if("."!==(m=s[d]).charAt(0)||f)(l&&!e?!m.match(u):m.match(u))&&h.push(m);}var y=h.length;if(0===y)return a();if(1===n.length&&!this.mark&&!this.stat){this.matches[o]||(this.matches[o]=Object.create(null));for(d=0;d<y;d++){var m=h[d];e&&(m="/"!==e?e+"/"+m:e+m),"/"!==m.charAt(0)||this.nomount||(m=c.join(this.root,m)),this._emitMatch(o,m);}return a()}n.shift();for(d=0;d<y;d++){m=h[d];e&&(m="/"!==e?e+"/"+m:e+m),this._process([m].concat(n),o,i,a);}a();},S.prototype._emitMatch=function(e,t){if(!this.aborted&&!g(this,t))if(this.paused)this._emitQueue.push([e,t]);else{var r=l(t)?t:this._makeAbs(t);if(this.mark&&(t=this._mark(t)),this.absolute&&(t=r),!this.matches[e][t]){if(this.nodir){var n=this.cache[r];if("DIR"===n||Array.isArray(n))return}this.matches[e][t]=!0;var o=this.statCache[r];o&&this.emit("stat",t,o),this.emit("match",t);}}},S.prototype._readdirInGlobStar=function(e,t){if(!this.aborted){if(this.follow)return this._readdir(e,!1,t);var r=this,o=y("lstat\0"+e,function(n,o){if(n&&"ENOENT"===n.code)return t();var i=o&&o.isSymbolicLink();r.symlinks[e]=i,i||!o||o.isDirectory()?r._readdir(e,!1,t):(r.cache[e]="FILE",t());});o&&n.lstat(e,o);}},S.prototype._readdir=function(e,t,r){if(!this.aborted&&(r=y("readdir\0"+e+"\0"+t,r))){if(t&&!d(this.symlinks,e))return this._readdirInGlobStar(e,r);if(d(this.cache,e)){var o=this.cache[e];if(!o||"FILE"===o)return r();if(Array.isArray(o))return r(null,o)}n.readdir(e,function(e,t,r){return function(n,o){n?e._readdirError(t,n,r):e._readdirEntries(t,o,r);}}(this,e,r));}},S.prototype._readdirEntries=function(e,t,r){if(!this.aborted){if(!this.mark&&!this.stat)for(var n=0;n<t.length;n++){var o=t[n];o="/"===e?e+o:e+"/"+o,this.cache[o]=!0;}return this.cache[e]=t,r(null,t)}},S.prototype._readdirError=function(e,t,r){if(!this.aborted){switch(t.code){case"ENOTSUP":case"ENOTDIR":var n=this._makeAbs(e);if(this.cache[n]="FILE",n===this.cwdAbs){var o=new Error(t.code+" invalid cwd "+this.cwd);o.path=this.cwd,o.code=t.code,this.emit("error",o),this.abort();}break;case"ENOENT":case"ELOOP":case"ENAMETOOLONG":case"UNKNOWN":this.cache[this._makeAbs(e)]=!1;break;default:this.cache[this._makeAbs(e)]=!1,this.strict&&(this.emit("error",t),this.abort()),this.silent||console.error("glob error",t);}return r()}},S.prototype._processGlobStar=function(e,t,r,n,o,i,s){var a=this;this._readdir(r,i,function(c,u){a._processGlobStar2(e,t,r,n,o,i,u,s);});},S.prototype._processGlobStar2=function(e,t,r,n,o,i,s,a){if(!s)return a();var c=n.slice(1),u=e?[e]:[],l=u.concat(c);this._process(l,o,!1,a);var p=this.symlinks[r],f=s.length;if(p&&i)return a();for(var h=0;h<f;h++){if("."!==s[h].charAt(0)||this.dot){var d=u.concat(s[h],c);this._process(d,o,!0,a);var y=u.concat(s[h],n);this._process(y,o,!0,a);}}a();},S.prototype._processSimple=function(e,t,r){var n=this;this._stat(e,function(o,i){n._processSimple2(e,t,o,i,r);});},S.prototype._processSimple2=function(e,t,r,n,o){if(this.matches[t]||(this.matches[t]=Object.create(null)),!n)return o();if(e&&l(e)&&!this.nomount){var i=/[\/\\]$/.test(e);"/"===e.charAt(0)?e=c.join(this.root,e):(e=c.resolve(this.root,e),i&&(e+="/"));}"win32"===process.platform&&(e=e.replace(/\\/g,"/")),this._emitMatch(t,e),o();},S.prototype._stat=function(e,t){var r=this._makeAbs(e),o="/"===e.slice(-1);if(e.length>this.maxLength)return t();if(!this.stat&&d(this.cache,r)){var i=this.cache[r];if(Array.isArray(i)&&(i="DIR"),!o||"DIR"===i)return t(null,i);if(o&&"FILE"===i)return t()}var s=this.statCache[r];if(void 0!==s){if(!1===s)return t(null,s);var a=s.isDirectory()?"DIR":"FILE";return o&&"FILE"===a?t():t(null,a,s)}var c=this,u=y("stat\0"+r,function(o,i){if(i&&i.isSymbolicLink())return n.stat(r,function(n,o){n?c._stat2(e,r,null,i,t):c._stat2(e,r,n,o,t);});c._stat2(e,r,o,i,t);});u&&n.lstat(r,u);},S.prototype._stat2=function(e,t,r,n,o){if(r&&("ENOENT"===r.code||"ENOTDIR"===r.code))return this.statCache[t]=!1,o();var i="/"===e.slice(-1);if(this.statCache[t]=n,"/"===t.slice(-1)&&n&&!n.isDirectory())return o(null,!1,n);var s=!0;return n&&(s=n.isDirectory()?"DIR":"FILE"),this.cache[t]=this.cache[t]||s,i&&"FILE"===s?o():o(null,s,n)};},function(e,t,r){e.exports=d,d.Minimatch=y;var n={sep:"/"};try{n=r(0);}catch(e){}var o=d.GLOBSTAR=y.GLOBSTAR={},i=r(42),s={"!":{open:"(?:(?!(?:",close:"))[^/]*?)"},"?":{open:"(?:",close:")?"},"+":{open:"(?:",close:")+"},"*":{open:"(?:",close:")*"},"@":{open:"(?:",close:")"}},a="[^/]",c=a+"*?",u="(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?",l="(?:(?!(?:\\/|^)\\.).)*?",p="().*{}+?[]^$\\!".split("").reduce(function(e,t){return e[t]=!0,e},{});var f=/\/+/;function h(e,t){e=e||{},t=t||{};var r={};return Object.keys(t).forEach(function(e){r[e]=t[e];}),Object.keys(e).forEach(function(t){r[t]=e[t];}),r}function d(e,t,r){if("string"!=typeof t)throw new TypeError("glob pattern string required");return r||(r={}),!(!r.nocomment&&"#"===t.charAt(0))&&(""===t.trim()?""===e:new y(t,r).match(e))}function y(e,t){if(!(this instanceof y))return new y(e,t);if("string"!=typeof e)throw new TypeError("glob pattern string required");t||(t={}),e=e.trim(),"/"!==n.sep&&(e=e.split(n.sep).join("/")),this.options=t,this.set=[],this.pattern=e,this.regexp=null,this.negate=!1,this.comment=!1,this.empty=!1,this.make();}function m(e,t){if(t||(t=this instanceof y?this.options:{}),void 0===(e=void 0===e?this.pattern:e))throw new TypeError("undefined pattern");return t.nobrace||!e.match(/\{.*\}/)?[e]:i(e)}d.filter=function(e,t){return t=t||{},function(r,n,o){return d(r,e,t)}},d.defaults=function(e){if(!e||!Object.keys(e).length)return d;var t=d,r=function(r,n,o){return t.minimatch(r,n,h(e,o))};return r.Minimatch=function(r,n){return new t.Minimatch(r,h(e,n))},r},y.defaults=function(e){return e&&Object.keys(e).length?d.defaults(e).Minimatch:y},y.prototype.debug=function(){},y.prototype.make=function(){if(this._made)return;var e=this.pattern,t=this.options;if(!t.nocomment&&"#"===e.charAt(0))return void(this.comment=!0);if(!e)return void(this.empty=!0);this.parseNegate();var r=this.globSet=this.braceExpand();t.debug&&(this.debug=console.error);this.debug(this.pattern,r),r=this.globParts=r.map(function(e){return e.split(f)}),this.debug(this.pattern,r),r=r.map(function(e,t,r){return e.map(this.parse,this)},this),this.debug(this.pattern,r),r=r.filter(function(e){return -1===e.indexOf(!1)}),this.debug(this.pattern,r),this.set=r;},y.prototype.parseNegate=function(){var e=this.pattern,t=!1,r=this.options,n=0;if(r.nonegate)return;for(var o=0,i=e.length;o<i&&"!"===e.charAt(o);o++)t=!t,n++;n&&(this.pattern=e.substr(n));this.negate=t;},d.braceExpand=function(e,t){return m(e,t)},y.prototype.braceExpand=m,y.prototype.parse=function(e,t){if(e.length>65536)throw new TypeError("pattern is too long");var r=this.options;if(!r.noglobstar&&"**"===e)return o;if(""===e)return "";var n,i="",u=!!r.nocase,l=!1,f=[],h=[],d=!1,y=-1,m=-1,v="."===e.charAt(0)?"":r.dot?"(?!(?:^|\\/)\\.{1,2}(?:$|\\/))":"(?!\\.)",b=this;function w(){if(n){switch(n){case"*":i+=c,u=!0;break;case"?":i+=a,u=!0;break;default:i+="\\"+n;}b.debug("clearStateChar %j %j",n,i),n=!1;}}for(var S,P=0,j=e.length;P<j&&(S=e.charAt(P));P++)if(this.debug("%s\t%s %s %j",e,P,i,S),l&&p[S])i+="\\"+S,l=!1;else switch(S){case"/":return !1;case"\\":w(),l=!0;continue;case"?":case"*":case"+":case"@":case"!":if(this.debug("%s\t%s %s %j <-- stateChar",e,P,i,S),d){this.debug("  in class"),"!"===S&&P===m+1&&(S="^"),i+=S;continue}b.debug("call clearStateChar %j",n),w(),n=S,r.noext&&w();continue;case"(":if(d){i+="(";continue}if(!n){i+="\\(";continue}f.push({type:n,start:P-1,reStart:i.length,open:s[n].open,close:s[n].close}),i+="!"===n?"(?:(?!(?:":"(?:",this.debug("plType %j %j",n,i),n=!1;continue;case")":if(d||!f.length){i+="\\)";continue}w(),u=!0;var O=f.pop();i+=O.close,"!"===O.type&&h.push(O),O.reEnd=i.length;continue;case"|":if(d||!f.length||l){i+="\\|",l=!1;continue}w(),i+="|";continue;case"[":if(w(),d){i+="\\"+S;continue}d=!0,m=P,y=i.length,i+=S;continue;case"]":if(P===m+1||!d){i+="\\"+S,l=!1;continue}if(d){var I=e.substring(m+1,P);try{}catch(e){var A=this.parse(I,g);i=i.substr(0,y)+"\\["+A[0]+"\\]",u=u||A[1],d=!1;continue}}u=!0,d=!1,i+=S;continue;default:w(),l?l=!1:!p[S]||"^"===S&&d||(i+="\\"),i+=S;}d&&(I=e.substr(m+1),A=this.parse(I,g),i=i.substr(0,y)+"\\["+A[0],u=u||A[1]);for(O=f.pop();O;O=f.pop()){var x=i.slice(O.reStart+O.open.length);this.debug("setting tail",i,O),x=x.replace(/((?:\\{2}){0,64})(\\?)\|/g,function(e,t,r){return r||(r="\\"),t+t+r+"|"}),this.debug("tail=%j\n   %s",x,x,O,i);var E="*"===O.type?c:"?"===O.type?a:"\\"+O.type;u=!0,i=i.slice(0,O.reStart)+E+"\\("+x;}w(),l&&(i+="\\\\");var k=!1;switch(i.charAt(0)){case".":case"[":case"(":k=!0;}for(var $=h.length-1;$>-1;$--){var T=h[$],C=i.slice(0,T.reStart),F=i.slice(T.reStart,T.reEnd-8),N=i.slice(T.reEnd-8,T.reEnd),_=i.slice(T.reEnd);N+=_;var D=C.split("(").length-1,M=_;for(P=0;P<D;P++)M=M.replace(/\)[+*?]?/,"");var V="";""===(_=M)&&t!==g&&(V="$");var B=C+F+_+V+N;i=B;}""!==i&&u&&(i="(?=.)"+i);k&&(i=v+i);if(t===g)return [i,u];if(!u)return e.replace(/\\(.)/g,"$1");var R=r.nocase?"i":"";try{var G=new RegExp("^"+i+"$",R);}catch(e){return new RegExp("$.")}return G._glob=e,G._src=i,G};var g={};d.makeRe=function(e,t){return new y(e,t||{}).makeRe()},y.prototype.makeRe=function(){if(this.regexp||!1===this.regexp)return this.regexp;var e=this.set;if(!e.length)return this.regexp=!1,this.regexp;var t=this.options,r=t.noglobstar?c:t.dot?u:l,n=t.nocase?"i":"",i=e.map(function(e){return e.map(function(e){return e===o?r:"string"==typeof e?e.replace(/[-[\]{}()*+?.,\\^$|#\s]/g,"\\$&"):e._src}).join("\\/")}).join("|");i="^(?:"+i+")$",this.negate&&(i="^(?!"+i+").*$");try{this.regexp=new RegExp(i,n);}catch(e){this.regexp=!1;}return this.regexp},d.match=function(e,t,r){var n=new y(t,r=r||{});return e=e.filter(function(e){return n.match(e)}),n.options.nonull&&!e.length&&e.push(t),e},y.prototype.match=function(e,t){if(this.debug("match",e,this.pattern),this.comment)return !1;if(this.empty)return ""===e;if("/"===e&&t)return !0;var r=this.options;"/"!==n.sep&&(e=e.split(n.sep).join("/"));e=e.split(f),this.debug(this.pattern,"split",e);var o,i,s=this.set;for(this.debug(this.pattern,"set",s),i=e.length-1;i>=0&&!(o=e[i]);i--);for(i=0;i<s.length;i++){var a=s[i],c=e;r.matchBase&&1===a.length&&(c=[o]);var u=this.matchOne(c,a,t);if(u)return !!r.flipNegate||!this.negate}return !r.flipNegate&&this.negate},y.prototype.matchOne=function(e,t,r){var n=this.options;this.debug("matchOne",{this:this,file:e,pattern:t}),this.debug("matchOne",e.length,t.length);for(var i=0,s=0,a=e.length,c=t.length;i<a&&s<c;i++,s++){this.debug("matchOne loop");var u,l=t[s],p=e[i];if(this.debug(t,l,p),!1===l)return !1;if(l===o){this.debug("GLOBSTAR",[t,l,p]);var f=i,h=s+1;if(h===c){for(this.debug("** at the end");i<a;i++)if("."===e[i]||".."===e[i]||!n.dot&&"."===e[i].charAt(0))return !1;return !0}for(;f<a;){var d=e[f];if(this.debug("\nglobstar while",e,f,t,h,d),this.matchOne(e.slice(f),t.slice(h),r))return this.debug("globstar found match!",f,a,d),!0;if("."===d||".."===d||!n.dot&&"."===d.charAt(0)){this.debug("dot detected!",e,f,t,h);break}this.debug("globstar swallow a segment, and continue"),f++;}return !(!r||(this.debug("\n>>> no match, partial?",e,f,t,h),f!==a))}if("string"==typeof l?(u=n.nocase?p.toLowerCase()===l.toLowerCase():p===l,this.debug("string match",l,p,u)):(u=p.match(l),this.debug("pattern match",l,p,u)),!u)return !1}if(i===a&&s===c)return !0;if(i===a)return r;if(s===c)return i===a-1&&""===e[i];throw new Error("wtf?")};},function(e,t){e.exports=util;},function(e,t,r){function n(e){return "/"===e.charAt(0)}function o(e){var t=/^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/.exec(e),r=t[1]||"",n=Boolean(r&&":"!==r.charAt(1));return Boolean(t[2]||n)}e.exports="win32"===process.platform?o:n,e.exports.posix=n,e.exports.win32=o;},function(e,t,r){var n=Function.prototype.toString,o=/^\s*class\b/,i=function(e){try{var t=n.call(e);return o.test(t)}catch(e){return !1}},s=Object.prototype.toString,a="function"==typeof Symbol&&"symbol"==typeof Symbol.toStringTag;e.exports=function(e){if(!e)return !1;if("function"!=typeof e&&"object"!=typeof e)return !1;if("function"==typeof e&&!e.prototype)return !0;if(a)return function(e){try{return !i(e)&&(n.call(e),!0)}catch(e){return !1}}(e);if(i(e))return !1;var t=s.call(e);return "[object Function]"===t||"[object GeneratorFunction]"===t};},function(e,t){e.exports=child_process;},function(e,t,r){e.exports=l,l.realpath=l,l.sync=p,l.realpathSync=p,l.monkeypatch=function(){n.realpath=l,n.realpathSync=p;},l.unmonkeypatch=function(){n.realpath=o,n.realpathSync=i;};var n=r(1),o=n.realpath,i=n.realpathSync,s=process.version,a=/^v[0-5]\./.test(s),c=r(41);function u(e){return e&&"realpath"===e.syscall&&("ELOOP"===e.code||"ENOMEM"===e.code||"ENAMETOOLONG"===e.code)}function l(e,t,r){if(a)return o(e,t,r);"function"==typeof t&&(r=t,t=null),o(e,t,function(n,o){u(n)?c.realpath(e,t,r):r(n,o);});}function p(e,t){if(a)return i(e,t);try{return i(e,t)}catch(r){if(u(r))return c.realpathSync(e,t);throw r}}},function(e,t){e.exports=assert;},function(e,t,r){function n(e,t){return Object.prototype.hasOwnProperty.call(e,t)}t.alphasort=u,t.alphasorti=c,t.setopts=function(e,t,r){r||(r={});if(r.matchBase&&-1===t.indexOf("/")){if(r.noglobstar)throw new Error("base matching requires globstar");t="**/"+t;}e.silent=!!r.silent,e.pattern=t,e.strict=!1!==r.strict,e.realpath=!!r.realpath,e.realpathCache=r.realpathCache||Object.create(null),e.follow=!!r.follow,e.dot=!!r.dot,e.mark=!!r.mark,e.nodir=!!r.nodir,e.nodir&&(e.mark=!0);e.sync=!!r.sync,e.nounique=!!r.nounique,e.nonull=!!r.nonull,e.nosort=!!r.nosort,e.nocase=!!r.nocase,e.stat=!!r.stat,e.noprocess=!!r.noprocess,e.absolute=!!r.absolute,e.maxLength=r.maxLength||1/0,e.cache=r.cache||Object.create(null),e.statCache=r.statCache||Object.create(null),e.symlinks=r.symlinks||Object.create(null),function(e,t){e.ignore=t.ignore||[],Array.isArray(e.ignore)||(e.ignore=[e.ignore]);e.ignore.length&&(e.ignore=e.ignore.map(l));}(e,r),e.changedCwd=!1;var i=process.cwd();n(r,"cwd")?(e.cwd=o.resolve(r.cwd),e.changedCwd=e.cwd!==i):e.cwd=i;e.root=r.root||o.resolve(e.cwd,"/"),e.root=o.resolve(e.root),"win32"===process.platform&&(e.root=e.root.replace(/\\/g,"/"));e.cwdAbs=s(e.cwd)?e.cwd:p(e,e.cwd),"win32"===process.platform&&(e.cwdAbs=e.cwdAbs.replace(/\\/g,"/"));e.nomount=!!r.nomount,r.nonegate=!0,r.nocomment=!0,e.minimatch=new a(t,r),e.options=e.minimatch.options;},t.ownProp=n,t.makeAbs=p,t.finish=function(e){for(var t=e.nounique,r=t?[]:Object.create(null),n=0,o=e.matches.length;n<o;n++){var i=e.matches[n];if(i&&0!==Object.keys(i).length){var s=Object.keys(i);t?r.push.apply(r,s):s.forEach(function(e){r[e]=!0;});}else if(e.nonull){var a=e.minimatch.globSet[n];t?r.push(a):r[a]=!0;}}t||(r=Object.keys(r));e.nosort||(r=r.sort(e.nocase?c:u));if(e.mark){for(var n=0;n<r.length;n++)r[n]=e._mark(r[n]);e.nodir&&(r=r.filter(function(t){var r=!/\/$/.test(t),n=e.cache[t]||e.cache[p(e,t)];return r&&n&&(r="DIR"!==n&&!Array.isArray(n)),r}));}e.ignore.length&&(r=r.filter(function(t){return !f(e,t)}));e.found=r;},t.mark=function(e,t){var r=p(e,t),n=e.cache[r],o=t;if(n){var i="DIR"===n||Array.isArray(n),s="/"===t.slice(-1);if(i&&!s?o+="/":!i&&s&&(o=o.slice(0,-1)),o!==t){var a=p(e,o);e.statCache[a]=e.statCache[r],e.cache[a]=e.cache[r];}}return o},t.isIgnored=f,t.childrenIgnored=function(e,t){return !!e.ignore.length&&e.ignore.some(function(e){return !(!e.gmatcher||!e.gmatcher.match(t))})};var o=r(0),i=r(8),s=r(10),a=i.Minimatch;function c(e,t){return e.toLowerCase().localeCompare(t.toLowerCase())}function u(e,t){return e.localeCompare(t)}function l(e){var t=null;if("/**"===e.slice(-3)){var r=e.replace(/(\/\*\*)+$/,"");t=new a(r,{dot:!0});}return {matcher:new a(e,{dot:!0}),gmatcher:t}}function p(e,t){var r=t;return r="/"===t.charAt(0)?o.join(e.root,t):s(t)||""===t?t:e.changedCwd?o.resolve(e.cwd,t):o.resolve(t),"win32"===process.platform&&(r=r.replace(/\\/g,"/")),r}function f(e,t){return !!e.ignore.length&&e.ignore.some(function(e){return e.matcher.match(t)||!(!e.gmatcher||!e.gmatcher.match(t))})}},function(e,t){e.exports=function e(t,r){if(t&&r)return e(t)(r);if("function"!=typeof t)throw new TypeError("need wrapper function");Object.keys(t).forEach(function(e){n[e]=t[e];});return n;function n(){for(var e=new Array(arguments.length),r=0;r<e.length;r++)e[r]=arguments[r];var n=t.apply(this,e),o=e[e.length-1];return "function"==typeof n&&n!==o&&Object.keys(o).forEach(function(e){n[e]=o[e];}),n}};},function(e,t,r){var n=r(16);function o(e){var t=function(){return t.called?t.value:(t.called=!0,t.value=e.apply(this,arguments))};return t.called=!1,t}function i(e){var t=function(){if(t.called)throw new Error(t.onceError);return t.called=!0,t.value=e.apply(this,arguments)},r=e.name||"Function wrapped with `once`";return t.onceError=r+" shouldn't be called more than once",t.called=!1,t}e.exports=n(o),e.exports.strict=n(i),o.proto=o(function(){Object.defineProperty(Function.prototype,"once",{value:function(){return o(this)},configurable:!0}),Object.defineProperty(Function.prototype,"onceStrict",{value:function(){return i(this)},configurable:!0});});},function(e,t,r){e.exports=r(19);},function(e,t,r){var n=r(3),o=r(68),i=r(21),s=i("%TypeError%"),a=i("%SyntaxError%"),c=i("%Array%"),u=i("%String%"),l=i("%Object%"),p=i("%Number%"),f=i("%Symbol%",!0),h=i("%RegExp%"),d=!!f,y=r(22),m=r(23),g=p.MAX_SAFE_INTEGER||Math.pow(2,53)-1,v=r(24),b=r(25),w=r(26),S=r(74),P=parseInt,j=r(4),O=j.call(Function.call,c.prototype.slice),I=j.call(Function.call,u.prototype.slice),A=j.call(Function.call,h.prototype.test,/^0b[01]+$/i),x=j.call(Function.call,h.prototype.test,/^0o[0-7]+$/i),E=j.call(Function.call,h.prototype.exec),k=new h("["+["","​","￾"].join("")+"]","g"),$=j.call(Function.call,h.prototype.test,k),T=j.call(Function.call,h.prototype.test,/^[-+]0x[0-9a-f]+$/i),C=j.call(Function.call,u.prototype.charCodeAt),F=j.call(Function.call,Object.prototype.toString),N=Math.floor,_=Math.abs,D=Object.create,M=l.getOwnPropertyDescriptor,V=l.isExtensible,B=["\t\n\v\f\r   ᠎    ","         　\u2028","\u2029\ufeff"].join(""),R=new RegExp("(^["+B+"]+)|(["+B+"]+$)","g"),G=j.call(Function.call,u.prototype.replace),L=r(75),U=r(77),W=v(v({},L),{Call:function(e,t){var r=arguments.length>2?arguments[2]:[];if(!this.IsCallable(e))throw new s(e+" is not a function");return e.apply(t,r)},ToPrimitive:o,ToNumber:function(e){var t=S(e)?e:o(e,p);if("symbol"==typeof t)throw new s("Cannot convert a Symbol value to a number");if("string"==typeof t){if(A(t))return this.ToNumber(P(I(t,2),2));if(x(t))return this.ToNumber(P(I(t,2),8));if($(t)||T(t))return NaN;var r=function(e){return G(e,R,"")}(t);if(r!==t)return this.ToNumber(r)}return p(t)},ToInt16:function(e){var t=this.ToUint16(e);return t>=32768?t-65536:t},ToInt8:function(e){var t=this.ToUint8(e);return t>=128?t-256:t},ToUint8:function(e){var t=this.ToNumber(e);if(y(t)||0===t||!m(t))return 0;var r=b(t)*N(_(t));return w(r,256)},ToUint8Clamp:function(e){var t=this.ToNumber(e);if(y(t)||t<=0)return 0;if(t>=255)return 255;var r=N(e);return r+.5<t?r+1:t<r+.5?r:r%2!=0?r+1:r},ToString:function(e){if("symbol"==typeof e)throw new s("Cannot convert a Symbol value to a string");return u(e)},ToObject:function(e){return this.RequireObjectCoercible(e),l(e)},ToPropertyKey:function(e){var t=this.ToPrimitive(e,u);return "symbol"==typeof t?t:this.ToString(t)},ToLength:function(e){var t=this.ToInteger(e);return t<=0?0:t>g?g:t},CanonicalNumericIndexString:function(e){if("[object String]"!==F(e))throw new s("must be a string");if("-0"===e)return -0;var t=this.ToNumber(e);return this.SameValue(this.ToString(t),e)?t:void 0},RequireObjectCoercible:L.CheckObjectCoercible,IsArray:c.isArray||function(e){return "[object Array]"===F(e)},IsConstructor:function(e){return "function"==typeof e&&!!e.prototype},IsExtensible:Object.preventExtensions?function(e){return !S(e)&&V(e)}:function(e){return !0},IsInteger:function(e){if("number"!=typeof e||y(e)||!m(e))return !1;var t=_(e);return N(t)===t},IsPropertyKey:function(e){return "string"==typeof e||"symbol"==typeof e},IsRegExp:function(e){if(!e||"object"!=typeof e)return !1;if(d){var t=e[f.match];if(void 0!==t)return L.ToBoolean(t)}return U(e)},SameValueZero:function(e,t){return e===t||y(e)&&y(t)},GetV:function(e,t){if(!this.IsPropertyKey(t))throw new s("Assertion failed: IsPropertyKey(P) is not true");return this.ToObject(e)[t]},GetMethod:function(e,t){if(!this.IsPropertyKey(t))throw new s("Assertion failed: IsPropertyKey(P) is not true");var r=this.GetV(e,t);if(null!=r){if(!this.IsCallable(r))throw new s(t+"is not a function");return r}},Get:function(e,t){if("Object"!==this.Type(e))throw new s("Assertion failed: Type(O) is not Object");if(!this.IsPropertyKey(t))throw new s("Assertion failed: IsPropertyKey(P) is not true");return e[t]},Type:function(e){return "symbol"==typeof e?"Symbol":L.Type(e)},SpeciesConstructor:function(e,t){if("Object"!==this.Type(e))throw new s("Assertion failed: Type(O) is not Object");var r=e.constructor;if(void 0===r)return t;if("Object"!==this.Type(r))throw new s("O.constructor is not an Object");var n=d&&f.species?r[f.species]:void 0;if(null==n)return t;if(this.IsConstructor(n))return n;throw new s("no constructor found")},CompletePropertyDescriptor:function(e){if(!this.IsPropertyDescriptor(e))throw new s("Desc must be a Property Descriptor");return this.IsGenericDescriptor(e)||this.IsDataDescriptor(e)?(n(e,"[[Value]]")||(e["[[Value]]"]=void 0),n(e,"[[Writable]]")||(e["[[Writable]]"]=!1)):(n(e,"[[Get]]")||(e["[[Get]]"]=void 0),n(e,"[[Set]]")||(e["[[Set]]"]=void 0)),n(e,"[[Enumerable]]")||(e["[[Enumerable]]"]=!1),n(e,"[[Configurable]]")||(e["[[Configurable]]"]=!1),e},Set:function(e,t,r,n){if("Object"!==this.Type(e))throw new s("O must be an Object");if(!this.IsPropertyKey(t))throw new s("P must be a Property Key");if("Boolean"!==this.Type(n))throw new s("Throw must be a Boolean");if(n)return e[t]=r,!0;try{e[t]=r;}catch(e){return !1}},HasOwnProperty:function(e,t){if("Object"!==this.Type(e))throw new s("O must be an Object");if(!this.IsPropertyKey(t))throw new s("P must be a Property Key");return n(e,t)},HasProperty:function(e,t){if("Object"!==this.Type(e))throw new s("O must be an Object");if(!this.IsPropertyKey(t))throw new s("P must be a Property Key");return t in e},IsConcatSpreadable:function(e){if("Object"!==this.Type(e))return !1;if(d&&"symbol"==typeof f.isConcatSpreadable){var t=this.Get(e,Symbol.isConcatSpreadable);if(void 0!==t)return this.ToBoolean(t)}return this.IsArray(e)},Invoke:function(e,t){if(!this.IsPropertyKey(t))throw new s("P must be a Property Key");var r=O(arguments,2),n=this.GetV(e,t);return this.Call(n,e,r)},GetIterator:function(e,t){if(!d)throw new SyntaxError("ES.GetIterator depends on native iterator support.");var r=t;arguments.length<2&&(r=this.GetMethod(e,f.iterator));var n=this.Call(r,e);if("Object"!==this.Type(n))throw new s("iterator must return an object");return n},IteratorNext:function(e,t){var r=this.Invoke(e,"next",arguments.length<2?[]:[t]);if("Object"!==this.Type(r))throw new s("iterator next must return an object");return r},IteratorComplete:function(e){if("Object"!==this.Type(e))throw new s("Assertion failed: Type(iterResult) is not Object");return this.ToBoolean(this.Get(e,"done"))},IteratorValue:function(e){if("Object"!==this.Type(e))throw new s("Assertion failed: Type(iterResult) is not Object");return this.Get(e,"value")},IteratorStep:function(e){var t=this.IteratorNext(e);return !0!==this.IteratorComplete(t)&&t},IteratorClose:function(e,t){if("Object"!==this.Type(e))throw new s("Assertion failed: Type(iterator) is not Object");if(!this.IsCallable(t))throw new s("Assertion failed: completion is not a thunk for a Completion Record");var r,n=t,o=this.GetMethod(e,"return");if(void 0===o)return n();try{var i=this.Call(o,e,[]);}catch(e){throw r=n(),n=null,e}if(r=n(),n=null,"Object"!==this.Type(i))throw new s("iterator .return must return an object");return r},CreateIterResultObject:function(e,t){if("Boolean"!==this.Type(t))throw new s("Assertion failed: Type(done) is not Boolean");return {value:e,done:t}},RegExpExec:function(e,t){if("Object"!==this.Type(e))throw new s("R must be an Object");if("String"!==this.Type(t))throw new s("S must be a String");var r=this.Get(e,"exec");if(this.IsCallable(r)){var n=this.Call(r,e,[t]);if(null===n||"Object"===this.Type(n))return n;throw new s('"exec" method must return `null` or an Object')}return E(e,t)},ArraySpeciesCreate:function(e,t){if(!this.IsInteger(t)||t<0)throw new s("Assertion failed: length must be an integer >= 0");var r,n=0===t?0:t;if(this.IsArray(e)&&(r=this.Get(e,"constructor"),"Object"===this.Type(r)&&d&&f.species&&null===(r=this.Get(r,f.species))&&(r=void 0)),void 0===r)return c(n);if(!this.IsConstructor(r))throw new s("C must be a constructor");return new r(n)},CreateDataProperty:function(e,t,r){if("Object"!==this.Type(e))throw new s("Assertion failed: Type(O) is not Object");if(!this.IsPropertyKey(t))throw new s("Assertion failed: IsPropertyKey(P) is not true");var n=M(e,t),o=n||"function"!=typeof V||V(e);if(n&&(!n.writable||!n.configurable)||!o)return !1;var i={configurable:!0,enumerable:!0,value:r,writable:!0};return Object.defineProperty(e,t,i),!0},CreateDataPropertyOrThrow:function(e,t,r){if("Object"!==this.Type(e))throw new s("Assertion failed: Type(O) is not Object");if(!this.IsPropertyKey(t))throw new s("Assertion failed: IsPropertyKey(P) is not true");var n=this.CreateDataProperty(e,t,r);if(!n)throw new s("unable to create data property");return n},ObjectCreate:function(e,t){if(null!==e&&"Object"!==this.Type(e))throw new s("Assertion failed: proto must be null or an object");if((arguments.length<2?[]:t).length>0)throw new a("es-abstract does not yet support internal slots");if(null===e&&!D)throw new a("native Object.create support is required to create null objects");return D(e)},AdvanceStringIndex:function(e,t,r){if("String"!==this.Type(e))throw new s("S must be a String");if(!this.IsInteger(t)||t<0||t>g)throw new s("Assertion failed: length must be an integer >= 0 and <= 2**53");if("Boolean"!==this.Type(r))throw new s("Assertion failed: unicode must be a Boolean");if(!r)return t+1;if(t+1>=e.length)return t+1;var n=C(e,t);if(n<55296||n>56319)return t+1;var o=C(e,t+1);return o<56320||o>57343?t+1:t+2}});delete W.CheckObjectCoercible,e.exports=W;},function(e,t){e.exports=function(e){return null===e||"function"!=typeof e&&"object"!=typeof e};},function(e,t,r){var n=Object.getOwnPropertyDescriptor?function(){return Object.getOwnPropertyDescriptor(arguments,"callee").get}():function(){throw new TypeError},o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator,i=Object.getPrototypeOf||function(e){return e.__proto__},a="undefined"==typeof Uint8Array?void 0:i(Uint8Array),c={"$ %Array%":Array,"$ %ArrayBuffer%":"undefined"==typeof ArrayBuffer?void 0:ArrayBuffer,"$ %ArrayBufferPrototype%":"undefined"==typeof ArrayBuffer?void 0:ArrayBuffer.prototype,"$ %ArrayIteratorPrototype%":o?i([][Symbol.iterator]()):void 0,"$ %ArrayPrototype%":Array.prototype,"$ %ArrayProto_entries%":Array.prototype.entries,"$ %ArrayProto_forEach%":Array.prototype.forEach,"$ %ArrayProto_keys%":Array.prototype.keys,"$ %ArrayProto_values%":Array.prototype.values,"$ %AsyncFromSyncIteratorPrototype%":void 0,"$ %AsyncFunction%":void 0,"$ %AsyncFunctionPrototype%":void 0,"$ %AsyncGenerator%":void 0,"$ %AsyncGeneratorFunction%":void 0,"$ %AsyncGeneratorPrototype%":void 0,"$ %AsyncIteratorPrototype%":void 0,"$ %Atomics%":"undefined"==typeof Atomics?void 0:Atomics,"$ %Boolean%":Boolean,"$ %BooleanPrototype%":Boolean.prototype,"$ %DataView%":"undefined"==typeof DataView?void 0:DataView,"$ %DataViewPrototype%":"undefined"==typeof DataView?void 0:DataView.prototype,"$ %Date%":Date,"$ %DatePrototype%":Date.prototype,"$ %decodeURI%":decodeURI,"$ %decodeURIComponent%":decodeURIComponent,"$ %encodeURI%":encodeURI,"$ %encodeURIComponent%":encodeURIComponent,"$ %Error%":Error,"$ %ErrorPrototype%":Error.prototype,"$ %eval%":eval,"$ %EvalError%":EvalError,"$ %EvalErrorPrototype%":EvalError.prototype,"$ %Float32Array%":"undefined"==typeof Float32Array?void 0:Float32Array,"$ %Float32ArrayPrototype%":"undefined"==typeof Float32Array?void 0:Float32Array.prototype,"$ %Float64Array%":"undefined"==typeof Float64Array?void 0:Float64Array,"$ %Float64ArrayPrototype%":"undefined"==typeof Float64Array?void 0:Float64Array.prototype,"$ %Function%":Function,"$ %FunctionPrototype%":Function.prototype,"$ %Generator%":void 0,"$ %GeneratorFunction%":void 0,"$ %GeneratorPrototype%":void 0,"$ %Int8Array%":"undefined"==typeof Int8Array?void 0:Int8Array,"$ %Int8ArrayPrototype%":"undefined"==typeof Int8Array?void 0:Int8Array.prototype,"$ %Int16Array%":"undefined"==typeof Int16Array?void 0:Int16Array,"$ %Int16ArrayPrototype%":"undefined"==typeof Int16Array?void 0:Int8Array.prototype,"$ %Int32Array%":"undefined"==typeof Int32Array?void 0:Int32Array,"$ %Int32ArrayPrototype%":"undefined"==typeof Int32Array?void 0:Int32Array.prototype,"$ %isFinite%":isFinite,"$ %isNaN%":isNaN,"$ %IteratorPrototype%":o?i(i([][Symbol.iterator]())):void 0,"$ %JSON%":JSON,"$ %JSONParse%":JSON.parse,"$ %Map%":"undefined"==typeof Map?void 0:Map,"$ %MapIteratorPrototype%":"undefined"!=typeof Map&&o?i((new Map)[Symbol.iterator]()):void 0,"$ %MapPrototype%":"undefined"==typeof Map?void 0:Map.prototype,"$ %Math%":Math,"$ %Number%":Number,"$ %NumberPrototype%":Number.prototype,"$ %Object%":Object,"$ %ObjectPrototype%":Object.prototype,"$ %ObjProto_toString%":Object.prototype.toString,"$ %ObjProto_valueOf%":Object.prototype.valueOf,"$ %parseFloat%":parseFloat,"$ %parseInt%":parseInt,"$ %Promise%":"undefined"==typeof Promise?void 0:Promise,"$ %PromisePrototype%":"undefined"==typeof Promise?void 0:Promise.prototype,"$ %PromiseProto_then%":"undefined"==typeof Promise?void 0:Promise.prototype.then,"$ %Promise_all%":"undefined"==typeof Promise?void 0:Promise.all,"$ %Promise_reject%":"undefined"==typeof Promise?void 0:Promise.reject,"$ %Promise_resolve%":"undefined"==typeof Promise?void 0:Promise.resolve,"$ %Proxy%":"undefined"==typeof Proxy?void 0:Proxy,"$ %RangeError%":RangeError,"$ %RangeErrorPrototype%":RangeError.prototype,"$ %ReferenceError%":ReferenceError,"$ %ReferenceErrorPrototype%":ReferenceError.prototype,"$ %Reflect%":"undefined"==typeof Reflect?void 0:Reflect,"$ %RegExp%":RegExp,"$ %RegExpPrototype%":RegExp.prototype,"$ %Set%":"undefined"==typeof Set?void 0:Set,"$ %SetIteratorPrototype%":"undefined"!=typeof Set&&o?i((new Set)[Symbol.iterator]()):void 0,"$ %SetPrototype%":"undefined"==typeof Set?void 0:Set.prototype,"$ %SharedArrayBuffer%":"undefined"==typeof SharedArrayBuffer?void 0:SharedArrayBuffer,"$ %SharedArrayBufferPrototype%":"undefined"==typeof SharedArrayBuffer?void 0:SharedArrayBuffer.prototype,"$ %String%":String,"$ %StringIteratorPrototype%":o?i(""[Symbol.iterator]()):void 0,"$ %StringPrototype%":String.prototype,"$ %Symbol%":o?Symbol:void 0,"$ %SymbolPrototype%":o?Symbol.prototype:void 0,"$ %SyntaxError%":SyntaxError,"$ %SyntaxErrorPrototype%":SyntaxError.prototype,"$ %ThrowTypeError%":n,"$ %TypedArray%":a,"$ %TypedArrayPrototype%":a?a.prototype:void 0,"$ %TypeError%":TypeError,"$ %TypeErrorPrototype%":TypeError.prototype,"$ %Uint8Array%":"undefined"==typeof Uint8Array?void 0:Uint8Array,"$ %Uint8ArrayPrototype%":"undefined"==typeof Uint8Array?void 0:Uint8Array.prototype,"$ %Uint8ClampedArray%":"undefined"==typeof Uint8ClampedArray?void 0:Uint8ClampedArray,"$ %Uint8ClampedArrayPrototype%":"undefined"==typeof Uint8ClampedArray?void 0:Uint8ClampedArray.prototype,"$ %Uint16Array%":"undefined"==typeof Uint16Array?void 0:Uint16Array,"$ %Uint16ArrayPrototype%":"undefined"==typeof Uint16Array?void 0:Uint16Array.prototype,"$ %Uint32Array%":"undefined"==typeof Uint32Array?void 0:Uint32Array,"$ %Uint32ArrayPrototype%":"undefined"==typeof Uint32Array?void 0:Uint32Array.prototype,"$ %URIError%":URIError,"$ %URIErrorPrototype%":URIError.prototype,"$ %WeakMap%":"undefined"==typeof WeakMap?void 0:WeakMap,"$ %WeakMapPrototype%":"undefined"==typeof WeakMap?void 0:WeakMap.prototype,"$ %WeakSet%":"undefined"==typeof WeakSet?void 0:WeakSet,"$ %WeakSetPrototype%":"undefined"==typeof WeakSet?void 0:WeakSet.prototype};e.exports=function(e,t){if(arguments.length>1&&"boolean"!=typeof t)throw new TypeError('"allowMissing" argument must be a boolean');var r="$ "+e;if(!(r in c))throw new SyntaxError("intrinsic "+e+" does not exist!");if(void 0===c[r]&&!t)throw new TypeError("intrinsic "+e+" exists, but is not available. Please file an issue!");return c[r]};},function(e,t){e.exports=Number.isNaN||function(e){return e!=e};},function(e,t){var r=Number.isNaN||function(e){return e!=e};e.exports=Number.isFinite||function(e){return "number"==typeof e&&!r(e)&&e!==1/0&&e!==-1/0};},function(e,t,r){var n=r(4).call(Function.call,Object.prototype.hasOwnProperty),o=Object.assign;e.exports=function(e,t){if(o)return o(e,t);for(var r in t)n(t,r)&&(e[r]=t[r]);return e};},function(e,t){e.exports=function(e){return e>=0?1:-1};},function(e,t){e.exports=function(e,t){var r=e%t;return Math.floor(r>=0?r:r+t)};},function(e,t,r){var n=r(18),o=Number.isNaN||function(e){return e!=e},i=Number.isFinite||function(e){return "number"==typeof e&&commonjsGlobal.isFinite(e)},s=Array.prototype.indexOf;e.exports=function(e){var t=arguments.length>1?n.ToInteger(arguments[1]):0;if(s&&!o(e)&&i(t)&&void 0!==e)return s.apply(this,arguments)>-1;var r=n.ToObject(this),a=n.ToLength(r.length);if(0===a)return !1;for(var c=t>=0?t:Math.max(0,a+t);c<a;){if(n.SameValueZero(e,r[c]))return !0;c+=1;}return !1};},function(e,t,r){var n=r(27);e.exports=function(){return Array.prototype.includes||n};},function(e,t,r){var n=r(30),o=r(3),i=r(4).call(Function.call,Object.prototype.propertyIsEnumerable);e.exports=function(e){var t=n.RequireObjectCoercible(e),r=[];for(var s in t)o(t,s)&&i(t,s)&&r.push([s,t[s]]);return r};},function(e,t,r){e.exports=r(80);},function(e,t,r){var n=r(29);e.exports=function(){return "function"==typeof Object.entries?Object.entries:n};},function(e,t,r){var n=r(30),o=r(3),i=r(4).call(Function.call,Object.prototype.propertyIsEnumerable);e.exports=function(e){var t=n.RequireObjectCoercible(e),r=[];for(var s in t)o(t,s)&&i(t,s)&&r.push(t[s]);return r};},function(e,t,r){var n=r(32);e.exports=function(){return "function"==typeof Object.values?Object.values:n};},function(e,t,r){const n=r(35),o=r(55),i=r(63),s=r(6),a=r(64),c=r(79),u=r(82);function l(e,t){(t=t||{}).clipboard&&console.log("\n*** Clipboard option removed - use clipboardy or clipboard-cli directly ***\n");const r=Object.keys(e).length>0?e:i.defaults,s=Object.entries(r).reduce((e,r)=>{const o=r[0],i=r[1],s=n[`get${o}`];return s?(i&&e.push(s(i,t)),e):e=e.concat((i||[]).map(e=>{const t=n[`get${e.replace(/\s/g,"")}Info`];return t?t():Promise.resolve(["Unknown"])}))},[]);return Promise.all(s).then(e=>{const r=e.reduce((e,t)=>(t&&t[0]&&Object.assign(e,{[t[0]]:t}),e),{});return function(e,t){const r=(()=>t.json?o.json:t.markdown?o.markdown:o.yaml)();return t.console&&console.log(r(e,Object.assign({},t,{console:!0}))),r(e,Object.assign({},t,{console:!1}))}(Object.entries(i.defaults).reduce((e,t)=>{const n=t[0],o=t[1];return r[n]?Object.assign(e,{[n]:r[n][1]}):Object.assign(e,{[n]:(o||[]).reduce((e,t)=>r[t]?(r[t].shift(),1===r[t].length?Object.assign(e,{[t]:r[t][0]}):Object.assign(e,{[t]:{version:r[t][0],path:r[t][1]}})):e,{})})},{}),t)})}Array.prototype.includes||a.shim(),Object.entries||c.shim(),Object.values||u.shim(),e.exports={cli:function(e){if(e.all)return l(Object.assign({},i.defaults,{npmPackages:!0,npmGlobalPackages:!0}),e);if(e.raw)return l(JSON.parse(e.raw),e);if(e.helper){const t=n[`get${e.helper}`]||n[`get${e.helper}Info`]||n[e.helper];return t?t().then(console.log):console.error("Not Found")}const t=(e,t)=>e.toLowerCase().includes(t.toLowerCase()),r=Object.keys(e).filter(e=>Object.keys(i.defaults).some(r=>t(r,e))),o=Object.entries(i.defaults).reduce((n,o)=>r.some(e=>t(e,o[0]))?Object.assign(n,{[o[0]]:o[1]||e[o[0]]}):n,{});return e.preset?(i[e.preset]||console.error(`\nNo "${e.preset}" preset found.`),l(Object.assign({},s.omit(i[e.preset],["options"]),o),Object.assign({},i[e.preset].options,s.pick(e,["duplicates","fullTree","json","markdown","console"])))):l(o,e)},helpers:n,main:l,run:function(e,t){return "string"==typeof e.preset?l(i[e.preset],t):l(e,t)}};},function(e,t,r){const n=r(5),o=r(36),i=r(0),s=r(40),a=r(6),c="N/A",u="darwin"===process.platform,l="linux"===process.platform,p=process.platform.startsWith("win");e.exports=Object.assign({},a,s,{getiOSSDKInfo:()=>u?a.run("xcodebuild -showsdks").then(e=>e.match(/[\w]+\s[\d|.]+/g)).then(a.uniq).then(e=>e.length?["iOS SDK",{Platforms:e}]:["iOS SDK","Not Found"]):Promise.resolve(["iOS SDK",c]),getAndroidSDKInfo:()=>a.run(process.env.ANDROID_HOME?"$ANDROID_HOME/tools/bin/sdkmanager --list":"sdkmanager --list").then(e=>!e&&u?a.run("~/Library/Android/sdk/tools/bin/sdkmanager --list"):e).then(e=>{const t=a.parseSDKManagerOutput(e);return t.buildTools.length||t.apiLevels.length||t.systemImages.length?Promise.resolve(["Android SDK",{"API Levels":t.apiLevels||"Not Found","Build Tools":t.buildTools||"Not Found","System Images":t.systemImages||"Not Found"}]):Promise.resolve(["Android SDK","Not Found"])}),getAndroidStudioInfo:()=>{let e;return u?e=a.run(a.generatePlistBuddyCommand(i.join("/","Applications","Android\\ Studio.app","Contents","Info.plist"),["CFBundleShortVersionString","CFBundleVersion"])).then(e=>e.split("\n").join(" ")):l?e=Promise.all([a.run('cat /opt/android-studio/bin/studio.sh | grep "$Home/.AndroidStudio" | head -1').then(a.findVersion),a.run("cat /opt/android-studio/build.txt")]).then(e=>{return `${e[0]} ${e[1]}`.trim()||"Not Found"}):p&&(e=Promise.all([a.run('wmic datafile where name="C:\\\\Program Files\\\\Android\\\\Android Studio\\\\bin\\\\studio.exe" get Version').then(e=>e.replace(/(\r\n|\n|\r)/gm,"")),a.run('type "C:\\\\Program Files\\\\Android\\\\Android Studio\\\\build.txt"').then(e=>e.replace(/(\r\n|\n|\r)/gm,""))]).then(e=>{return `${e[0]} ${e[1]}`.trim()||"Not Found"})),e.then(e=>a.determineFound("Android Studio",e))},getAtomInfo:()=>(a.log("trace","getAtomInfo"),Promise.all([a.getDarwinApplicationVersion(a.ideBundleIdentifiers.Atom),c]).then(e=>a.determineFound("Atom",e[0],e[1]))),getMySQLInfo:()=>(a.log("trace","getMySQLInfo"),Promise.all([a.run("mysql --version").then(e=>`${a.findVersion(e,null,1)}${e.includes("MariaDB")?" (MariaDB)":""}`),a.which("mysql")]).then(e=>a.determineFound("MySQL",e[0],e[1]))),getMongoDBInfo:()=>(a.log("trace","getMongoDBInfo"),Promise.all([a.run("mongo --version").then(a.findVersion),a.which("mongo")]).then(e=>a.determineFound("MongoDB",e[0],e[1]))),getSQLiteInfo:()=>(a.log("trace","getSQLiteInfo"),Promise.all([a.run("sqlite3 --version").then(a.findVersion),a.which("sqlite3")]).then(e=>a.determineFound("SQLite",e[0],e[1]))),getPostgreSQLInfo:()=>(a.log("trace","getPostgreSQLInfo"),Promise.all([a.run("postgres --version").then(a.findVersion),a.which("postgres")]).then(e=>a.determineFound("PostgreSQL",e[0],e[1]))),getCPUInfo:()=>{let e;a.log("trace","getCPUInfo");try{const t=n.cpus();e="("+t.length+") "+n.arch()+" "+t[0].model;}catch(t){e="Unknown";}return Promise.all(["CPU",e])},getBashInfo:()=>(a.log("trace","getBashInfo"),Promise.all([a.run("bash --version").then(a.findVersion),a.which("bash")]).then(e=>a.determineFound("Bash",e[0],e[1]))),getPerlInfo:()=>(a.log("trace","getPerlInfo"),Promise.all([a.run("perl -v").then(a.findVersion),a.which("perl")]).then(e=>a.determineFound("Perl",e[0],e[1]))),getPHPInfo:()=>(a.log("trace","getPHPInfo"),Promise.all([a.run("php -v").then(a.findVersion),a.which("php")]).then(e=>a.determineFound("PHP",e[0],e[1]))),getParallelsInfo:()=>(a.log("trace","getParallelsInfo"),Promise.all([a.run("prlctl --version").then(a.findVersion),a.which("prlctl")]).then(e=>a.determineFound("Parallels",e[0],e[1]))),getDockerInfo:()=>(a.log("trace","getDockerInfo"),Promise.all([a.run("docker --version").then(a.findVersion),a.which("docker")]).then(e=>a.determineFound("Docker",e[0],e[1]))),getElixirInfo:()=>(a.log("trace","getElixirInfo"),Promise.all([a.run("elixir --version").then(e=>a.findVersion(e,/[Elixir]+\s([\d+.[\d+|.]+)/,1)),a.which("elixir")]).then(e=>Promise.resolve(a.determineFound("Elixir",e[0],e[1])))),getMemoryInfo:()=>(a.log("trace","getMemoryInfo"),Promise.all(["Memory",`${a.toReadableBytes(n.freemem())} / ${a.toReadableBytes(n.totalmem())}`])),getSublimeTextInfo:()=>(a.log("trace","getSublimeTextInfo"),Promise.all([a.run("subl --version").then(e=>a.findVersion(e,/\d+/)),a.which("subl")]).then(e=>""===e[0]&&u?(a.log("trace","getSublimeTextInfo using plist"),Promise.all([a.getDarwinApplicationVersion(a.ideBundleIdentifiers["Sublime Text"]),c])):e).then(e=>a.determineFound("Sublime Text",e[0],e[1]))),getHomeBrewInfo:()=>{return a.log("trace","getHomeBrewInfo"),u?Promise.all(["Homebrew",a.run("brew --version").then(a.findVersion),a.which("brew")]):Promise.all(["Homebrew",c])},getGoInfo:()=>(a.log("trace","getGoInfo"),Promise.all([a.run("go version").then(a.findVersion),a.which("go")]).then(e=>a.determineFound("Go",e[0],e[1]))),getRubyInfo:()=>(a.log("trace","getRubyInfo"),Promise.all([a.run("ruby -v").then(a.findVersion),a.which("ruby")]).then(e=>a.determineFound("Ruby",e[0],e[1]))),getNodeInfo:()=>(a.log("trace","getNodeInfo"),Promise.all([p?a.run("node -v").then(a.findVersion):a.which("node").then(e=>e?a.run(e+" -v"):Promise.resolve("")).then(a.findVersion),a.which("node").then(a.condensePath)]).then(e=>a.determineFound("Node",e[0],e[1]))),getnpmInfo:()=>(a.log("trace","getnpmInfo"),Promise.all([a.run("npm -v"),a.which("npm").then(a.condensePath)]).then(e=>a.determineFound("npm",e[0],e[1]))),getShellInfo:()=>{if(a.log("trace","getShellInfo",process.env),u||l){const e=process.env.SHELL||a.runSync("getent passwd $LOGNAME | cut -d: -f7 | head -1");return Promise.all([a.run(`${e} --version`).then(a.findVersion),a.which(e)]).then(e=>a.determineFound("Shell",e[0]||"Unknown",e[1]))}return Promise.resolve(["Shell",c])},getOSInfo:()=>{let e;return a.log("trace","getOSInfo"),(e=u?a.run("sw_vers -productVersion "):l?a.run("cat /etc/os-release").then(e=>{const t=(e||"").match(/NAME="(.+)"/),r=(e||"").match(/VERSION="(.+)"/)||[];return `${t[1]} ${r[1]}`.trim()||""}):Promise.resolve()).then(e=>{let t=o(n.platform(),n.release());return e&&(t+=` ${e}`),["OS",t]})},getContainerInfo:()=>(a.log("trace","getContainerInfo"),l?Promise.all([a.fileExists("/.dockerenv"),a.readFile("/proc/self/cgroup")]).then(e=>(a.log("trace","getContainerInfoThen",e),Promise.resolve(["Container",e[0]||e[1]?"Yes":c]))).catch(e=>a.log("trace","getContainerInfoCatch",e)):Promise.resolve(["Container",c])),getWatchmanInfo:()=>(a.log("trace","getWatchmanInfo"),Promise.all([a.which("watchman").then(e=>e?a.run(e+" -v"):void 0),a.which("watchman")]).then(e=>a.determineFound("Watchman",e[0],e[1]))),getVSCodeInfo:()=>(a.log("trace","getVSCodeInfo"),Promise.all([a.run("code --version").then(a.findVersion),a.which("code")]).then(e=>a.determineFound("VSCode",e[0],e[1]))),getIntelliJInfo:()=>(a.log("trace","getIntelliJInfo"),a.getDarwinApplicationVersion(a.ideBundleIdentifiers.IntelliJ).then(e=>a.determineFound("IntelliJ",e))),getPhpStormInfo:()=>(a.log("trace","getPhpStormInfo"),a.getDarwinApplicationVersion(a.ideBundleIdentifiers.PhpStorm).then(e=>a.determineFound("PhpStorm",e))),getWebStormInfo:()=>(a.log("trace","getWebStormInfo"),a.getDarwinApplicationVersion(a.ideBundleIdentifiers.WebStorm).then(e=>a.determineFound("WebStorm",e))),getVirtualBoxInfo:()=>(a.log("trace","getVirtualBoxInfo"),Promise.all([a.run("vboxmanage --version").then(a.findVersion),a.which("vboxmanage")]).then(e=>a.determineFound("VirtualBox",e[0],e[1]))),getVMwareFusionInfo:()=>(a.log("trace","getVMwareFusionInfo"),a.getDarwinApplicationVersion("com.vmware.fusion").then(e=>a.determineFound("VMWare Fusion",e,c))),getPythonInfo:()=>(a.log("trace","getPythonInfo"),Promise.all([a.run("python -V 2>&1").then(a.findVersion),a.run("which python")]).then(e=>a.determineFound("Python",e[0],e[1]))),getXcodeInfo:()=>(a.log("trace","getXcodeInfo"),u?Promise.all([a.which("xcodebuild").then(e=>a.run(e+" -version")).then(e=>`${a.findVersion(e)}/${e.split("Build version ")[1]}`),a.which("xcodebuild")]).then(e=>a.determineFound("Xcode",e[0],e[1])):Promise.resolve(["Xcode",c])),getYarnInfo:()=>(a.log("trace","getYarnInfo"),Promise.all([a.run("yarn -v"),a.which("yarn").then(a.condensePath)]).then(e=>a.determineFound("Yarn",e[0],e[1]))),getEdgeInfo:()=>{let e;return a.log("trace","getEdgeInfo"),(e=p&&"10"===n.release().split(".")[0]?a.run("powershell get-appxpackage Microsoft.MicrosoftEdge").then(a.findVersion):Promise.resolve(c)).then(e=>a.determineFound("Edge",e,c))},getInternetExplorerInfo:()=>{let e;if(a.log("trace","getInternetExplorerInfo"),p){const t=[process.env.SYSTEMDRIVE||"C:","Program Files","Internet Explorer","iexplore.exe"].join("\\\\");e=a.run(`wmic datafile where "name='${t}'" get Version`).then(a.findVersion);}else e=Promise.resolve(c);return e.then(e=>a.determineFound("Internet Explorer",e,c))},getChromeInfo:()=>{let e;return a.log("trace","getChromeInfo"),(e=l?a.run("google-chrome --version").then(e=>e.replace(/^.* ([^ ]*)/g,"$1")):u?a.getDarwinApplicationVersion(a.browserBundleIdentifiers.Chrome).then(a.findVersion):Promise.resolve(c)).then(e=>a.determineFound("Chrome",e,c))},getChromeCanaryInfo:()=>{return a.log("trace","getChromeCanaryInfo"),a.getDarwinApplicationVersion(a.browserBundleIdentifiers["Chrome Canary"]).then(e=>a.determineFound("Chrome Canary",e,c))},getFirefoxDeveloperEditionInfo:()=>{return a.log("trace","getFirefoxDeveloperEditionInfo"),a.getDarwinApplicationVersion(a.browserBundleIdentifiers["Firefox Developer Edition"]).then(e=>a.determineFound("Firefox Developer Edition",e,c))},getSafariTechnologyPreviewInfo:()=>{return a.log("trace","getSafariTechnologyPreviewInfo"),a.getDarwinApplicationVersion(a.browserBundleIdentifiers["Safari Technology Preview"]).then(e=>a.determineFound("Safari Technology Preview",e,c))},getSafariInfo:()=>{return a.log("trace","getSafariInfo"),a.getDarwinApplicationVersion(a.browserBundleIdentifiers.Safari).then(e=>a.determineFound("Safari",e,c))},getFirefoxInfo:()=>{let e;return a.log("trace","getFirefoxInfo"),(e=l?a.run("firefox --version").then(e=>e.replace(/^.* ([^ ]*)/g,"$1")):u?a.getDarwinApplicationVersion(a.browserBundleIdentifiers.Firefox):Promise.resolve(c)).then(e=>a.determineFound("Firefox",e,c))},getFirefoxNightlyInfo:()=>{let e;return a.log("trace","getFirefoxNightlyInfo"),(e=l?a.run("firefox-trunk --version").then(e=>e.replace(/^.* ([^ ]*)/g,"$1")):u?a.getDarwinApplicationVersion(a.browserBundleIdentifiers["Firefox Nightly"]):Promise.resolve(c)).then(e=>a.determineFound("Firefox Nightly",e,c))},getGitInfo:()=>(a.log("trace","getGitInfo"),u||l?Promise.all([a.run("git --version").then(a.findVersion),a.run("which git")]).then(e=>a.determineFound("Git",e[0],e[1])):Promise.resolve(["Git",c])),getMakeInfo:()=>(a.log("trace","getMakeInfo"),u||l?Promise.all([a.run("make --version").then(a.findVersion),a.run("which make")]).then(e=>a.determineFound("Make",e[0],e[1])):Promise.resolve(["Make",c])),getCMakeInfo:()=>(a.log("trace","getCMakeInfo"),u||l?Promise.all([a.run("cmake --version").then(a.findVersion),a.run("which cmake")]).then(e=>a.determineFound("CMake",e[0],e[1])):Promise.resolve(["CMake",c])),getGCCInfo:()=>(a.log("trace","getGCCInfo"),u||l?Promise.all([a.run("gcc -v 2>&1").then(a.findVersion),a.run("which gcc")]).then(e=>a.determineFound("GCC",e[0],e[1])):Promise.resolve(["GCC",c])),getNanoInfo:()=>(a.log("trace","getNanoInfo"),u||l?Promise.all([a.run("nano --version").then(a.findVersion),a.run("which nano")]).then(e=>a.determineFound("Nano",e[0],e[1])):Promise.resolve(["Nano",c])),getEmacsInfo:()=>(a.log("trace","getEmacsInfo"),u||l?Promise.all([a.run("emacs --version").then(a.findVersion),a.run("which emacs")]).then(e=>a.determineFound("Emacs",e[0],e[1])):Promise.resolve(["Emacs",c])),getVimInfo:()=>(a.log("trace","getVimInfo"),u||l?Promise.all([a.run("vim --version").then(a.findVersion),a.run("which vim")]).then(e=>a.determineFound("Vim",e[0],e[1])):Promise.resolve(["Vim",c])),getNvimInfo:()=>(a.log("trace","getNvimInfo"),u||l?Promise.all([a.run("nvim --version").then(a.findVersion),a.run("which nvim")]).then(e=>a.determineFound("Nvim",e[0],e[1])):Promise.resolve(["Vim",c])),getRustInfo:()=>(a.log("trace","getRustInfo"),u||l?Promise.all([a.run("rustup --version").then(a.findVersion),a.run("which rustup")]).then(e=>a.determineFound("Rust",e[0],e[1])):Promise.resolve(["Rust",c])),getScalaInfo:()=>(a.log("trace","getScalaInfo"),u||l?Promise.all([a.run("scalac -version").then(a.findVersion),a.run("which scalac")]).then(e=>a.determineFound("Scala",e[0],e[1])):Promise.resolve(["Scala",c])),getJavaInfo:()=>(a.log("trace","getJavaInfo"),u||l?Promise.all([a.run("javac -version 2>&1").then(a.findVersion),a.run("which javac")]).then(e=>a.determineFound("Java",e[0],e[1])):Promise.resolve(["Java",c])),getApacheInfo:()=>(a.log("trace","getApacheInfo"),u||l?Promise.all([a.run("apachectl -v").then(a.findVersion),a.run("which apachectl")]).then(e=>a.determineFound("Apache",e[0],e[1])):Promise.resolve(["Apache",c])),getNginxInfo:()=>(a.log("trace","getNginxInfo"),u||l?Promise.all([a.run("nginx -v 2>&1").then(a.findVersion),a.run("which nginx")]).then(e=>a.determineFound("Nginx",e[0],e[1])):Promise.resolve(["Nginx",c]))});},function(e,t,r){var n=r(5),o=r(37),i=r(38);e.exports=function(e,t){if(!e&&t)throw new Error("You can't specify a `release` without specifying `platform`");var r;return e=e||n.platform(),t=t||n.release(),"darwin"===e?(Number(t.split(".")[0])>15?"macOS":"OS X")+((r=o(t).name)?" "+r:""):"linux"===e?"Linux"+((r=t.replace(/^(\d+\.\d+).*/,"$1"))?" "+r:""):"win32"===e?"Windows"+((r=i(t))?" "+r:""):e};},function(e,t,r){var n=r(5),o={17:"High Sierra",16:"Sierra",15:"El Capitan",14:"Yosemite",13:"Mavericks",12:"Mountain Lion",11:"Lion",10:"Snow Leopard",9:"Leopard",8:"Tiger",7:"Panther",6:"Jaguar",5:"Puma"};e.exports=function(e){return e=(e||n.release()).split(".")[0],{name:o[e],version:"10."+(Number(e)-4)}};},function(e,t,r){var n=r(5),o=r(39),i={"10.0":"10",6.3:"8.1",6.2:"8",6.1:"7","6.0":"Vista",5.1:"XP","5.0":"2000",4.9:"ME",4.1:"98","4.0":"95"};e.exports=function(e){var t=/\d+\.\d+/,s=t.exec(e||n.release());if(!e&&"win32"===process.platform&&o.satisfies(process.version,">=0.12.0 <3.1.0"))try{s=t.exec(String(r(12).execSync("ver.exe",{timeout:2e3})));}catch(e){}if(e&&!s)throw new Error("`release` argument doesn't match `n.n`");return i[(s||[])[0]]};},function(e,t){var r;t=e.exports=J,r="object"==typeof process&&process.env&&process.env.NODE_DEBUG&&/\bsemver\b/i.test(process.env.NODE_DEBUG)?function(){var e=Array.prototype.slice.call(arguments,0);e.unshift("SEMVER"),console.log.apply(console,e);}:function(){},t.SEMVER_SPEC_VERSION="2.0.0";var n=256,o=Number.MAX_SAFE_INTEGER||9007199254740991,i=t.re=[],s=t.src=[],a=0,c=a++;s[c]="0|[1-9]\\d*";var u=a++;s[u]="[0-9]+";var l=a++;s[l]="\\d*[a-zA-Z-][a-zA-Z0-9-]*";var p=a++;s[p]="("+s[c]+")\\.("+s[c]+")\\.("+s[c]+")";var f=a++;s[f]="("+s[u]+")\\.("+s[u]+")\\.("+s[u]+")";var h=a++;s[h]="(?:"+s[c]+"|"+s[l]+")";var d=a++;s[d]="(?:"+s[u]+"|"+s[l]+")";var y=a++;s[y]="(?:-("+s[h]+"(?:\\."+s[h]+")*))";var m=a++;s[m]="(?:-?("+s[d]+"(?:\\."+s[d]+")*))";var g=a++;s[g]="[0-9A-Za-z-]+";var v=a++;s[v]="(?:\\+("+s[g]+"(?:\\."+s[g]+")*))";var b=a++,w="v?"+s[p]+s[y]+"?"+s[v]+"?";s[b]="^"+w+"$";var S="[v=\\s]*"+s[f]+s[m]+"?"+s[v]+"?",P=a++;s[P]="^"+S+"$";var j=a++;s[j]="((?:<|>)?=?)";var O=a++;s[O]=s[u]+"|x|X|\\*";var I=a++;s[I]=s[c]+"|x|X|\\*";var A=a++;s[A]="[v=\\s]*("+s[I]+")(?:\\.("+s[I]+")(?:\\.("+s[I]+")(?:"+s[y]+")?"+s[v]+"?)?)?";var x=a++;s[x]="[v=\\s]*("+s[O]+")(?:\\.("+s[O]+")(?:\\.("+s[O]+")(?:"+s[m]+")?"+s[v]+"?)?)?";var E=a++;s[E]="^"+s[j]+"\\s*"+s[A]+"$";var k=a++;s[k]="^"+s[j]+"\\s*"+s[x]+"$";var $=a++;s[$]="(?:^|[^\\d])(\\d{1,16})(?:\\.(\\d{1,16}))?(?:\\.(\\d{1,16}))?(?:$|[^\\d])";var T=a++;s[T]="(?:~>?)";var C=a++;s[C]="(\\s*)"+s[T]+"\\s+",i[C]=new RegExp(s[C],"g");var F=a++;s[F]="^"+s[T]+s[A]+"$";var N=a++;s[N]="^"+s[T]+s[x]+"$";var _=a++;s[_]="(?:\\^)";var D=a++;s[D]="(\\s*)"+s[_]+"\\s+",i[D]=new RegExp(s[D],"g");var M=a++;s[M]="^"+s[_]+s[A]+"$";var V=a++;s[V]="^"+s[_]+s[x]+"$";var B=a++;s[B]="^"+s[j]+"\\s*("+S+")$|^$";var R=a++;s[R]="^"+s[j]+"\\s*("+w+")$|^$";var G=a++;s[G]="(\\s*)"+s[j]+"\\s*("+S+"|"+s[A]+")",i[G]=new RegExp(s[G],"g");var L=a++;s[L]="^\\s*("+s[A]+")\\s+-\\s+("+s[A]+")\\s*$";var U=a++;s[U]="^\\s*("+s[x]+")\\s+-\\s+("+s[x]+")\\s*$";var W=a++;s[W]="(<|>)?=?\\s*\\*";for(var K=0;K<35;K++)r(K,s[K]),i[K]||(i[K]=new RegExp(s[K]));function q(e,t){if(t&&"object"==typeof t||(t={loose:!!t,includePrerelease:!1}),e instanceof J)return e;if("string"!=typeof e)return null;if(e.length>n)return null;if(!(t.loose?i[P]:i[b]).test(e))return null;try{return new J(e,t)}catch(e){return null}}function J(e,t){if(t&&"object"==typeof t||(t={loose:!!t,includePrerelease:!1}),e instanceof J){if(e.loose===t.loose)return e;e=e.version;}else if("string"!=typeof e)throw new TypeError("Invalid Version: "+e);if(e.length>n)throw new TypeError("version is longer than "+n+" characters");if(!(this instanceof J))return new J(e,t);r("SemVer",e,t),this.options=t,this.loose=!!t.loose;var s=e.trim().match(t.loose?i[P]:i[b]);if(!s)throw new TypeError("Invalid Version: "+e);if(this.raw=e,this.major=+s[1],this.minor=+s[2],this.patch=+s[3],this.major>o||this.major<0)throw new TypeError("Invalid major version");if(this.minor>o||this.minor<0)throw new TypeError("Invalid minor version");if(this.patch>o||this.patch<0)throw new TypeError("Invalid patch version");s[4]?this.prerelease=s[4].split(".").map(function(e){if(/^[0-9]+$/.test(e)){var t=+e;if(t>=0&&t<o)return t}return e}):this.prerelease=[],this.build=s[5]?s[5].split("."):[],this.format();}t.parse=q,t.valid=function(e,t){var r=q(e,t);return r?r.version:null},t.clean=function(e,t){var r=q(e.trim().replace(/^[=v]+/,""),t);return r?r.version:null},t.SemVer=J,J.prototype.format=function(){return this.version=this.major+"."+this.minor+"."+this.patch,this.prerelease.length&&(this.version+="-"+this.prerelease.join(".")),this.version},J.prototype.toString=function(){return this.version},J.prototype.compare=function(e){return r("SemVer.compare",this.version,this.options,e),e instanceof J||(e=new J(e,this.options)),this.compareMain(e)||this.comparePre(e)},J.prototype.compareMain=function(e){return e instanceof J||(e=new J(e,this.options)),Q(this.major,e.major)||Q(this.minor,e.minor)||Q(this.patch,e.patch)},J.prototype.comparePre=function(e){if(e instanceof J||(e=new J(e,this.options)),this.prerelease.length&&!e.prerelease.length)return -1;if(!this.prerelease.length&&e.prerelease.length)return 1;if(!this.prerelease.length&&!e.prerelease.length)return 0;var t=0;do{var n=this.prerelease[t],o=e.prerelease[t];if(r("prerelease compare",t,n,o),void 0===n&&void 0===o)return 0;if(void 0===o)return 1;if(void 0===n)return -1;if(n!==o)return Q(n,o)}while(++t)},J.prototype.inc=function(e,t){switch(e){case"premajor":this.prerelease.length=0,this.patch=0,this.minor=0,this.major++,this.inc("pre",t);break;case"preminor":this.prerelease.length=0,this.patch=0,this.minor++,this.inc("pre",t);break;case"prepatch":this.prerelease.length=0,this.inc("patch",t),this.inc("pre",t);break;case"prerelease":0===this.prerelease.length&&this.inc("patch",t),this.inc("pre",t);break;case"major":0===this.minor&&0===this.patch&&0!==this.prerelease.length||this.major++,this.minor=0,this.patch=0,this.prerelease=[];break;case"minor":0===this.patch&&0!==this.prerelease.length||this.minor++,this.patch=0,this.prerelease=[];break;case"patch":0===this.prerelease.length&&this.patch++,this.prerelease=[];break;case"pre":if(0===this.prerelease.length)this.prerelease=[0];else{for(var r=this.prerelease.length;--r>=0;)"number"==typeof this.prerelease[r]&&(this.prerelease[r]++,r=-2);-1===r&&this.prerelease.push(0);}t&&(this.prerelease[0]===t?isNaN(this.prerelease[1])&&(this.prerelease=[t,0]):this.prerelease=[t,0]);break;default:throw new Error("invalid increment argument: "+e)}return this.format(),this.raw=this.version,this},t.inc=function(e,t,r,n){"string"==typeof r&&(n=r,r=void 0);try{return new J(e,r).inc(t,n).version}catch(e){return null}},t.diff=function(e,t){if(Z(e,t))return null;var r=q(e),n=q(t);if(r.prerelease.length||n.prerelease.length){for(var o in r)if(("major"===o||"minor"===o||"patch"===o)&&r[o]!==n[o])return "pre"+o;return "prerelease"}for(var o in r)if(("major"===o||"minor"===o||"patch"===o)&&r[o]!==n[o])return o},t.compareIdentifiers=Q;var H=/^[0-9]+$/;function Q(e,t){var r=H.test(e),n=H.test(t);return r&&n&&(e=+e,t=+t),r&&!n?-1:n&&!r?1:e<t?-1:e>t?1:0}function Y(e,t,r){return new J(e,r).compare(new J(t,r))}function X(e,t,r){return Y(e,t,r)>0}function z(e,t,r){return Y(e,t,r)<0}function Z(e,t,r){return 0===Y(e,t,r)}function ee(e,t,r){return 0!==Y(e,t,r)}function te(e,t,r){return Y(e,t,r)>=0}function re(e,t,r){return Y(e,t,r)<=0}function ne(e,t,r,n){var o;switch(t){case"===":"object"==typeof e&&(e=e.version),"object"==typeof r&&(r=r.version),o=e===r;break;case"!==":"object"==typeof e&&(e=e.version),"object"==typeof r&&(r=r.version),o=e!==r;break;case"":case"=":case"==":o=Z(e,r,n);break;case"!=":o=ee(e,r,n);break;case">":o=X(e,r,n);break;case">=":o=te(e,r,n);break;case"<":o=z(e,r,n);break;case"<=":o=re(e,r,n);break;default:throw new TypeError("Invalid operator: "+t)}return o}function oe(e,t){if(t&&"object"==typeof t||(t={loose:!!t,includePrerelease:!1}),e instanceof oe){if(e.loose===!!t.loose)return e;e=e.value;}if(!(this instanceof oe))return new oe(e,t);r("comparator",e,t),this.options=t,this.loose=!!t.loose,this.parse(e),this.semver===ie?this.value="":this.value=this.operator+this.semver.version,r("comp",this);}t.rcompareIdentifiers=function(e,t){return Q(t,e)},t.major=function(e,t){return new J(e,t).major},t.minor=function(e,t){return new J(e,t).minor},t.patch=function(e,t){return new J(e,t).patch},t.compare=Y,t.compareLoose=function(e,t){return Y(e,t,!0)},t.rcompare=function(e,t,r){return Y(t,e,r)},t.sort=function(e,r){return e.sort(function(e,n){return t.compare(e,n,r)})},t.rsort=function(e,r){return e.sort(function(e,n){return t.rcompare(e,n,r)})},t.gt=X,t.lt=z,t.eq=Z,t.neq=ee,t.gte=te,t.lte=re,t.cmp=ne,t.Comparator=oe;var ie={};function se(e,t){if(t&&"object"==typeof t||(t={loose:!!t,includePrerelease:!1}),e instanceof se)return e.loose===!!t.loose&&e.includePrerelease===!!t.includePrerelease?e:new se(e.raw,t);if(e instanceof oe)return new se(e.value,t);if(!(this instanceof se))return new se(e,t);if(this.options=t,this.loose=!!t.loose,this.includePrerelease=!!t.includePrerelease,this.raw=e,this.set=e.split(/\s*\|\|\s*/).map(function(e){return this.parseRange(e.trim())},this).filter(function(e){return e.length}),!this.set.length)throw new TypeError("Invalid SemVer Range: "+e);this.format();}function ae(e){return !e||"x"===e.toLowerCase()||"*"===e}function ce(e,t,r,n,o,i,s,a,c,u,l,p,f){return ((t=ae(r)?"":ae(n)?">="+r+".0.0":ae(o)?">="+r+"."+n+".0":">="+t)+" "+(a=ae(c)?"":ae(u)?"<"+(+c+1)+".0.0":ae(l)?"<"+c+"."+(+u+1)+".0":p?"<="+c+"."+u+"."+l+"-"+p:"<="+a)).trim()}function ue(e,t,n){for(var o=0;o<e.length;o++)if(!e[o].test(t))return !1;if(n||(n={}),t.prerelease.length&&!n.includePrerelease){for(o=0;o<e.length;o++)if(r(e[o].semver),e[o].semver!==ie&&e[o].semver.prerelease.length>0){var i=e[o].semver;if(i.major===t.major&&i.minor===t.minor&&i.patch===t.patch)return !0}return !1}return !0}function le(e,t,r){try{t=new se(t,r);}catch(e){return !1}return t.test(e)}function pe(e,t,r,n){var o,i,s,a,c;switch(e=new J(e,n),t=new se(t,n),r){case">":o=X,i=re,s=z,a=">",c=">=";break;case"<":o=z,i=te,s=X,a="<",c="<=";break;default:throw new TypeError('Must provide a hilo val of "<" or ">"')}if(le(e,t,n))return !1;for(var u=0;u<t.set.length;++u){var l=t.set[u],p=null,f=null;if(l.forEach(function(e){e.semver===ie&&(e=new oe(">=0.0.0")),p=p||e,f=f||e,o(e.semver,p.semver,n)?p=e:s(e.semver,f.semver,n)&&(f=e);}),p.operator===a||p.operator===c)return !1;if((!f.operator||f.operator===a)&&i(e,f.semver))return !1;if(f.operator===c&&s(e,f.semver))return !1}return !0}oe.prototype.parse=function(e){var t=this.options.loose?i[B]:i[R],r=e.match(t);if(!r)throw new TypeError("Invalid comparator: "+e);this.operator=r[1],"="===this.operator&&(this.operator=""),r[2]?this.semver=new J(r[2],this.options.loose):this.semver=ie;},oe.prototype.toString=function(){return this.value},oe.prototype.test=function(e){return r("Comparator.test",e,this.options.loose),this.semver===ie||("string"==typeof e&&(e=new J(e,this.options)),ne(e,this.operator,this.semver,this.options))},oe.prototype.intersects=function(e,t){if(!(e instanceof oe))throw new TypeError("a Comparator is required");var r;if(t&&"object"==typeof t||(t={loose:!!t,includePrerelease:!1}),""===this.operator)return r=new se(e.value,t),le(this.value,r,t);if(""===e.operator)return r=new se(this.value,t),le(e.semver,r,t);var n=!(">="!==this.operator&&">"!==this.operator||">="!==e.operator&&">"!==e.operator),o=!("<="!==this.operator&&"<"!==this.operator||"<="!==e.operator&&"<"!==e.operator),i=this.semver.version===e.semver.version,s=!(">="!==this.operator&&"<="!==this.operator||">="!==e.operator&&"<="!==e.operator),a=ne(this.semver,"<",e.semver,t)&&(">="===this.operator||">"===this.operator)&&("<="===e.operator||"<"===e.operator),c=ne(this.semver,">",e.semver,t)&&("<="===this.operator||"<"===this.operator)&&(">="===e.operator||">"===e.operator);return n||o||i&&s||a||c},t.Range=se,se.prototype.format=function(){return this.range=this.set.map(function(e){return e.join(" ").trim()}).join("||").trim(),this.range},se.prototype.toString=function(){return this.range},se.prototype.parseRange=function(e){var t=this.options.loose;e=e.trim();var n=t?i[U]:i[L];e=e.replace(n,ce),r("hyphen replace",e),e=e.replace(i[G],"$1$2$3"),r("comparator trim",e,i[G]),e=(e=(e=e.replace(i[C],"$1~")).replace(i[D],"$1^")).split(/\s+/).join(" ");var o=t?i[B]:i[R],s=e.split(" ").map(function(e){return function(e,t){return r("comp",e,t),e=function(e,t){return e.trim().split(/\s+/).map(function(e){return function(e,t){r("caret",e,t),t&&"object"==typeof t||(t={loose:!!t,includePrerelease:!1});var n=t.loose?i[V]:i[M];return e.replace(n,function(t,n,o,i,s){var a;return r("caret",e,t,n,o,i,s),ae(n)?a="":ae(o)?a=">="+n+".0.0 <"+(+n+1)+".0.0":ae(i)?a="0"===n?">="+n+"."+o+".0 <"+n+"."+(+o+1)+".0":">="+n+"."+o+".0 <"+(+n+1)+".0.0":s?(r("replaceCaret pr",s),"-"!==s.charAt(0)&&(s="-"+s),a="0"===n?"0"===o?">="+n+"."+o+"."+i+s+" <"+n+"."+o+"."+(+i+1):">="+n+"."+o+"."+i+s+" <"+n+"."+(+o+1)+".0":">="+n+"."+o+"."+i+s+" <"+(+n+1)+".0.0"):(r("no pr"),a="0"===n?"0"===o?">="+n+"."+o+"."+i+" <"+n+"."+o+"."+(+i+1):">="+n+"."+o+"."+i+" <"+n+"."+(+o+1)+".0":">="+n+"."+o+"."+i+" <"+(+n+1)+".0.0"),r("caret return",a),a})}(e,t)}).join(" ")}(e,t),r("caret",e),e=function(e,t){return e.trim().split(/\s+/).map(function(e){return function(e,t){t&&"object"==typeof t||(t={loose:!!t,includePrerelease:!1});var n=t.loose?i[N]:i[F];return e.replace(n,function(t,n,o,i,s){var a;return r("tilde",e,t,n,o,i,s),ae(n)?a="":ae(o)?a=">="+n+".0.0 <"+(+n+1)+".0.0":ae(i)?a=">="+n+"."+o+".0 <"+n+"."+(+o+1)+".0":s?(r("replaceTilde pr",s),"-"!==s.charAt(0)&&(s="-"+s),a=">="+n+"."+o+"."+i+s+" <"+n+"."+(+o+1)+".0"):a=">="+n+"."+o+"."+i+" <"+n+"."+(+o+1)+".0",r("tilde return",a),a})}(e,t)}).join(" ")}(e,t),r("tildes",e),e=function(e,t){return r("replaceXRanges",e,t),e.split(/\s+/).map(function(e){return function(e,t){e=e.trim(),t&&"object"==typeof t||(t={loose:!!t,includePrerelease:!1});var n=t.loose?i[k]:i[E];return e.replace(n,function(t,n,o,i,s,a){r("xRange",e,t,n,o,i,s,a);var c=ae(o),u=c||ae(i),l=u||ae(s),p=l;return "="===n&&p&&(n=""),c?t=">"===n||"<"===n?"<0.0.0":"*":n&&p?(u&&(i=0),l&&(s=0),">"===n?(n=">=",u?(o=+o+1,i=0,s=0):l&&(i=+i+1,s=0)):"<="===n&&(n="<",u?o=+o+1:i=+i+1),t=n+o+"."+i+"."+s):u?t=">="+o+".0.0 <"+(+o+1)+".0.0":l&&(t=">="+o+"."+i+".0 <"+o+"."+(+i+1)+".0"),r("xRange return",t),t})}(e,t)}).join(" ")}(e,t),r("xrange",e),e=function(e,t){return r("replaceStars",e,t),e.trim().replace(i[W],"")}(e,t),r("stars",e),e}(e,this.options)},this).join(" ").split(/\s+/);return this.options.loose&&(s=s.filter(function(e){return !!e.match(o)})),s=s.map(function(e){return new oe(e,this.options)},this)},se.prototype.intersects=function(e,t){if(!(e instanceof se))throw new TypeError("a Range is required");return this.set.some(function(r){return r.every(function(r){return e.set.some(function(e){return e.every(function(e){return r.intersects(e,t)})})})})},t.toComparators=function(e,t){return new se(e,t).set.map(function(e){return e.map(function(e){return e.value}).join(" ").trim().split(" ")})},se.prototype.test=function(e){if(!e)return !1;"string"==typeof e&&(e=new J(e,this.options));for(var t=0;t<this.set.length;t++)if(ue(this.set[t],e,this.options))return !0;return !1},t.satisfies=le,t.maxSatisfying=function(e,t,r){var n=null,o=null;try{var i=new se(t,r);}catch(e){return null}return e.forEach(function(e){i.test(e)&&(n&&-1!==o.compare(e)||(o=new J(n=e,r)));}),n},t.minSatisfying=function(e,t,r){var n=null,o=null;try{var i=new se(t,r);}catch(e){return null}return e.forEach(function(e){i.test(e)&&(n&&1!==o.compare(e)||(o=new J(n=e,r)));}),n},t.validRange=function(e,t){try{return new se(e,t).range||"*"}catch(e){return null}},t.ltr=function(e,t,r){return pe(e,t,"<",r)},t.gtr=function(e,t,r){return pe(e,t,">",r)},t.outside=pe,t.prerelease=function(e,t){var r=q(e,t);return r&&r.prerelease.length?r.prerelease:null},t.intersects=function(e,t,r){return e=new se(e,r),t=new se(t,r),e.intersects(t)},t.coerce=function(e){if(e instanceof J)return e;if("string"!=typeof e)return null;var t=e.match(i[$]);return null==t?null:q((t[1]||"0")+"."+(t[2]||"0")+"."+(t[3]||"0"))};},function(e,t,r){const n=r(7),o=r(0),i=r(6),s=e=>{const t=e.split("node_modules/"),r=t[t.length-1];return "@"===r.charAt(0)?[r.split("/")[0],r.split("/")[1]].join("/"):r.split("/")[0]};e.exports={getnpmPackages:function(e,t){i.log("trace","getnpmPackages"),t||(t={});let r=null,n=null;return "string"==typeof e&&(e.includes("*")||e.includes("?")||e.includes("+")||e.includes("!")?r=e:e=e.split(",")),Promise.all(["npmPackages",i.getPackageJsonByPath("package.json").then(e=>Object.assign({},(e||{}).devDependencies||{},(e||{}).dependencies||{})).then(e=>(n=e,t.fullTree||t.duplicates||r?i.getAllPackageJsonPaths(r):Promise.resolve(Object.keys(e||[]).map(e=>o.join("node_modules",e,"package.json"))))).then(o=>!r&&"boolean"!=typeof e||t.fullTree?Array.isArray(e)?Promise.resolve((o||[]).filter(t=>e.includes(s(t)))):Promise.resolve(o):Promise.resolve((o||[]).filter(e=>Object.keys(n||[]).includes(s(e))))).then(e=>Promise.all([e,Promise.all(e.map(e=>i.getPackageJsonByPath(e)))])).then(e=>{const r=e[0];return e[1].reduce((e,o,s)=>o&&o.name?(e[o.name]||(e[o.name]={}),t.duplicates&&e[o.name].installed&&e[o.name].installed!==o.version&&i.uniq(e[o.name].duplicates=(e[o.name].duplicates||[]).concat(o.version)),1===(r[s].match(/node_modules/g)||[]).length&&(e[o.name].installed=o.version),n[o.name]&&(e[o.name].wanted=n[o.name]),e):e,{})}).then(r=>(t.showNotFound&&Array.isArray(e)&&e.forEach(e=>{r[e]||(r[e]="Not Found");}),r)).then(e=>i.sortObject(e))])},getnpmGlobalPackages:function(e,t){i.log("trace","getnpmGlobalPackages",e);let r=null;return "string"==typeof e?e.includes("*")||e.includes("?")||e.includes("+")||e.includes("!")?r=e:e=e.split(","):Array.isArray(e)||(e=!0),Promise.all(["npmGlobalPackages",i.run("npm get prefix --global").then(e=>new Promise((t,i)=>n(o.join(e,"lib","node_modules",r||"{*,@*/*}","package.json"),(e,r)=>{e||t(r),i(e);}))).then(t=>Promise.all(t.filter(t=>"boolean"==typeof e||null!==r||e.includes(s(t))).map(e=>i.getPackageJsonByFullPath(e)))).then(e=>e.reduce((e,t)=>t?Object.assign(e,{[t.name]:t.version}):e,{})).then(r=>(t.showNotFound&&Array.isArray(e)&&e.forEach(e=>{r[e]||(r[e]="Not Found");}),r))])}};},function(e,t,r){var n=r(0),o="win32"===process.platform,i=r(1),s=process.env.NODE_DEBUG&&/fs/.test(process.env.NODE_DEBUG);function a(e){return "function"==typeof e?e:function(){var e;if(s){var t=new Error;e=function(e){e&&(t.message=e.message,r(e=t));};}else e=r;return e;function r(e){if(e){if(process.throwDeprecation)throw e;if(!process.noDeprecation){var t="fs: missing callback "+(e.stack||e.message);process.traceDeprecation?console.trace(t):console.error(t);}}}}()}n.normalize;if(o)var c=/(.*?)(?:[\/\\]+|$)/g;else c=/(.*?)(?:[\/]+|$)/g;if(o)var u=/^(?:[a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/][^\\\/]+)?[\\\/]*/;else u=/^[\/]*/;t.realpathSync=function(e,t){if(e=n.resolve(e),t&&Object.prototype.hasOwnProperty.call(t,e))return t[e];var r,s,a,l,p=e,f={},h={};function d(){var t=u.exec(e);r=t[0].length,s=t[0],a=t[0],l="",o&&!h[a]&&(i.lstatSync(a),h[a]=!0);}for(d();r<e.length;){c.lastIndex=r;var y=c.exec(e);if(l=s,s+=y[0],a=l+y[1],r=c.lastIndex,!(h[a]||t&&t[a]===a)){var m;if(t&&Object.prototype.hasOwnProperty.call(t,a))m=t[a];else{var g=i.lstatSync(a);if(!g.isSymbolicLink()){h[a]=!0,t&&(t[a]=a);continue}var v=null;if(!o){var b=g.dev.toString(32)+":"+g.ino.toString(32);f.hasOwnProperty(b)&&(v=f[b]);}null===v&&(i.statSync(a),v=i.readlinkSync(a)),m=n.resolve(l,v),t&&(t[a]=m),o||(f[b]=v);}e=n.resolve(m,e.slice(r)),d();}}return t&&(t[p]=e),e},t.realpath=function(e,t,r){if("function"!=typeof r&&(r=a(t),t=null),e=n.resolve(e),t&&Object.prototype.hasOwnProperty.call(t,e))return process.nextTick(r.bind(null,null,t[e]));var s,l,p,f,h=e,d={},y={};function m(){var t=u.exec(e);s=t[0].length,l=t[0],p=t[0],f="",o&&!y[p]?i.lstat(p,function(e){if(e)return r(e);y[p]=!0,g();}):process.nextTick(g);}function g(){if(s>=e.length)return t&&(t[h]=e),r(null,e);c.lastIndex=s;var n=c.exec(e);return f=l,l+=n[0],p=f+n[1],s=c.lastIndex,y[p]||t&&t[p]===p?process.nextTick(g):t&&Object.prototype.hasOwnProperty.call(t,p)?w(t[p]):i.lstat(p,v)}function v(e,n){if(e)return r(e);if(!n.isSymbolicLink())return y[p]=!0,t&&(t[p]=p),process.nextTick(g);if(!o){var s=n.dev.toString(32)+":"+n.ino.toString(32);if(d.hasOwnProperty(s))return b(null,d[s],p)}i.stat(p,function(e){if(e)return r(e);i.readlink(p,function(e,t){o||(d[s]=t),b(e,t);});});}function b(e,o,i){if(e)return r(e);var s=n.resolve(f,o);t&&(t[i]=s),w(s);}function w(t){e=n.resolve(t,e.slice(s)),m();}m();};},function(e,t,r){var n=r(43),o=r(44);e.exports=function(e){if(!e)return [];"{}"===e.substr(0,2)&&(e="\\{\\}"+e.substr(2));return function e(t,r){var i=[];var s=o("{","}",t);if(!s||/\$$/.test(s.pre))return [t];var c=/^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(s.body);var u=/^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(s.body);var p=c||u;var m=s.body.indexOf(",")>=0;if(!p&&!m)return s.post.match(/,.*\}/)?(t=s.pre+"{"+s.body+a+s.post,e(t)):[t];var g;if(p)g=s.body.split(/\.\./);else if(1===(g=function e(t){if(!t)return [""];var r=[];var n=o("{","}",t);if(!n)return t.split(",");var i=n.pre;var s=n.body;var a=n.post;var c=i.split(",");c[c.length-1]+="{"+s+"}";var u=e(a);a.length&&(c[c.length-1]+=u.shift(),c.push.apply(c,u));r.push.apply(r,c);return r}(s.body)).length&&1===(g=e(g[0],!1).map(f)).length){var v=s.post.length?e(s.post,!1):[""];return v.map(function(e){return s.pre+g[0]+e})}var b=s.pre;var v=s.post.length?e(s.post,!1):[""];var w;if(p){var S=l(g[0]),P=l(g[1]),j=Math.max(g[0].length,g[1].length),O=3==g.length?Math.abs(l(g[2])):1,I=d,A=P<S;A&&(O*=-1,I=y);var x=g.some(h);w=[];for(var E=S;I(E,P);E+=O){var k;if(u)"\\"===(k=String.fromCharCode(E))&&(k="");else if(k=String(E),x){var $=j-k.length;if($>0){var T=new Array($+1).join("0");k=E<0?"-"+T+k.slice(1):T+k;}}w.push(k);}}else w=n(g,function(t){return e(t,!1)});for(var C=0;C<w.length;C++)for(var F=0;F<v.length;F++){var N=b+w[C]+v[F];(!r||p||N)&&i.push(N);}return i}(function(e){return e.split("\\\\").join(i).split("\\{").join(s).split("\\}").join(a).split("\\,").join(c).split("\\.").join(u)}(e),!0).map(p)};var i="\0SLASH"+Math.random()+"\0",s="\0OPEN"+Math.random()+"\0",a="\0CLOSE"+Math.random()+"\0",c="\0COMMA"+Math.random()+"\0",u="\0PERIOD"+Math.random()+"\0";function l(e){return parseInt(e,10)==e?parseInt(e,10):e.charCodeAt(0)}function p(e){return e.split(i).join("\\").split(s).join("{").split(a).join("}").split(c).join(",").split(u).join(".")}function f(e){return "{"+e+"}"}function h(e){return /^-?0\d/.test(e)}function d(e,t){return e<=t}function y(e,t){return e>=t}},function(e,t){e.exports=function(e,t){for(var n=[],o=0;o<e.length;o++){var i=t(e[o],o);r(i)?n.push.apply(n,i):n.push(i);}return n};var r=Array.isArray||function(e){return "[object Array]"===Object.prototype.toString.call(e)};},function(e,t,r){function n(e,t,r){e instanceof RegExp&&(e=o(e,r)),t instanceof RegExp&&(t=o(t,r));var n=i(e,t,r);return n&&{start:n[0],end:n[1],pre:r.slice(0,n[0]),body:r.slice(n[0]+e.length,n[1]),post:r.slice(n[1]+t.length)}}function o(e,t){var r=t.match(e);return r?r[0]:null}function i(e,t,r){var n,o,i,s,a,c=r.indexOf(e),u=r.indexOf(t,c+1),l=c;if(c>=0&&u>0){for(n=[],i=r.length;l>=0&&!a;)l==c?(n.push(l),c=r.indexOf(e,l+1)):1==n.length?a=[n.pop(),u]:((o=n.pop())<i&&(i=o,s=u),u=r.indexOf(t,l+1)),l=c<u&&c>=0?c:u;n.length&&(a=[i,s]);}return a}e.exports=n,n.range=i;},function(e,t,r){try{var n=r(9);if("function"!=typeof n.inherits)throw"";e.exports=n.inherits;}catch(t){e.exports=r(46);}},function(e,t){"function"==typeof Object.create?e.exports=function(e,t){e.super_=t,e.prototype=Object.create(t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}});}:e.exports=function(e,t){e.super_=t;var r=function(){};r.prototype=t.prototype,e.prototype=new r,e.prototype.constructor=e;};},function(e,t){e.exports=events;},function(e,t,r){e.exports=d,d.GlobSync=y;var n=r(1),o=r(13),i=r(8),s=(i.Minimatch,r(7).Glob,r(9),r(0)),a=r(14),c=r(10),u=r(15),l=(u.alphasort,u.alphasorti,u.setopts),p=u.ownProp,f=u.childrenIgnored,h=u.isIgnored;function d(e,t){if("function"==typeof t||3===arguments.length)throw new TypeError("callback provided to sync glob\nSee: https://github.com/isaacs/node-glob/issues/167");return new y(e,t).found}function y(e,t){if(!e)throw new Error("must provide pattern");if("function"==typeof t||3===arguments.length)throw new TypeError("callback provided to sync glob\nSee: https://github.com/isaacs/node-glob/issues/167");if(!(this instanceof y))return new y(e,t);if(l(this,e,t),this.noprocess)return this;var r=this.minimatch.set.length;this.matches=new Array(r);for(var n=0;n<r;n++)this._process(this.minimatch.set[n],n,!1);this._finish();}y.prototype._finish=function(){if(a(this instanceof y),this.realpath){var e=this;this.matches.forEach(function(t,r){var n=e.matches[r]=Object.create(null);for(var i in t)try{i=e._makeAbs(i),n[o.realpathSync(i,e.realpathCache)]=!0;}catch(t){if("stat"!==t.syscall)throw t;n[e._makeAbs(i)]=!0;}});}u.finish(this);},y.prototype._process=function(e,t,r){a(this instanceof y);for(var n,o=0;"string"==typeof e[o];)o++;switch(o){case e.length:return void this._processSimple(e.join("/"),t);case 0:n=null;break;default:n=e.slice(0,o).join("/");}var s,u=e.slice(o);null===n?s=".":c(n)||c(e.join("/"))?(n&&c(n)||(n="/"+n),s=n):s=n;var l=this._makeAbs(s);f(this,s)||(u[0]===i.GLOBSTAR?this._processGlobStar(n,s,l,u,t,r):this._processReaddir(n,s,l,u,t,r));},y.prototype._processReaddir=function(e,t,r,n,o,i){var a=this._readdir(r,i);if(a){for(var c=n[0],u=!!this.minimatch.negate,l=c._glob,p=this.dot||"."===l.charAt(0),f=[],h=0;h<a.length;h++){if("."!==(m=a[h]).charAt(0)||p)(u&&!e?!m.match(c):m.match(c))&&f.push(m);}var d=f.length;if(0!==d)if(1!==n.length||this.mark||this.stat){n.shift();for(h=0;h<d;h++){var y;m=f[h];y=e?[e,m]:[m],this._process(y.concat(n),o,i);}}else{this.matches[o]||(this.matches[o]=Object.create(null));for(var h=0;h<d;h++){var m=f[h];e&&(m="/"!==e.slice(-1)?e+"/"+m:e+m),"/"!==m.charAt(0)||this.nomount||(m=s.join(this.root,m)),this._emitMatch(o,m);}}}},y.prototype._emitMatch=function(e,t){if(!h(this,t)){var r=this._makeAbs(t);if(this.mark&&(t=this._mark(t)),this.absolute&&(t=r),!this.matches[e][t]){if(this.nodir){var n=this.cache[r];if("DIR"===n||Array.isArray(n))return}this.matches[e][t]=!0,this.stat&&this._stat(t);}}},y.prototype._readdirInGlobStar=function(e){if(this.follow)return this._readdir(e,!1);var t,r;try{r=n.lstatSync(e);}catch(e){if("ENOENT"===e.code)return null}var o=r&&r.isSymbolicLink();return this.symlinks[e]=o,o||!r||r.isDirectory()?t=this._readdir(e,!1):this.cache[e]="FILE",t},y.prototype._readdir=function(e,t){if(t&&!p(this.symlinks,e))return this._readdirInGlobStar(e);if(p(this.cache,e)){var r=this.cache[e];if(!r||"FILE"===r)return null;if(Array.isArray(r))return r}try{return this._readdirEntries(e,n.readdirSync(e))}catch(t){return this._readdirError(e,t),null}},y.prototype._readdirEntries=function(e,t){if(!this.mark&&!this.stat)for(var r=0;r<t.length;r++){var n=t[r];n="/"===e?e+n:e+"/"+n,this.cache[n]=!0;}return this.cache[e]=t,t},y.prototype._readdirError=function(e,t){switch(t.code){case"ENOTSUP":case"ENOTDIR":var r=this._makeAbs(e);if(this.cache[r]="FILE",r===this.cwdAbs){var n=new Error(t.code+" invalid cwd "+this.cwd);throw n.path=this.cwd,n.code=t.code,n}break;case"ENOENT":case"ELOOP":case"ENAMETOOLONG":case"UNKNOWN":this.cache[this._makeAbs(e)]=!1;break;default:if(this.cache[this._makeAbs(e)]=!1,this.strict)throw t;this.silent||console.error("glob error",t);}},y.prototype._processGlobStar=function(e,t,r,n,o,i){var s=this._readdir(r,i);if(s){var a=n.slice(1),c=e?[e]:[],u=c.concat(a);this._process(u,o,!1);var l=s.length;if(!this.symlinks[r]||!i)for(var p=0;p<l;p++){if("."!==s[p].charAt(0)||this.dot){var f=c.concat(s[p],a);this._process(f,o,!0);var h=c.concat(s[p],n);this._process(h,o,!0);}}}},y.prototype._processSimple=function(e,t){var r=this._stat(e);if(this.matches[t]||(this.matches[t]=Object.create(null)),r){if(e&&c(e)&&!this.nomount){var n=/[\/\\]$/.test(e);"/"===e.charAt(0)?e=s.join(this.root,e):(e=s.resolve(this.root,e),n&&(e+="/"));}"win32"===process.platform&&(e=e.replace(/\\/g,"/")),this._emitMatch(t,e);}},y.prototype._stat=function(e){var t=this._makeAbs(e),r="/"===e.slice(-1);if(e.length>this.maxLength)return !1;if(!this.stat&&p(this.cache,t)){var o=this.cache[t];if(Array.isArray(o)&&(o="DIR"),!r||"DIR"===o)return o;if(r&&"FILE"===o)return !1}var i=this.statCache[t];if(!i){var s;try{s=n.lstatSync(t);}catch(e){if(e&&("ENOENT"===e.code||"ENOTDIR"===e.code))return this.statCache[t]=!1,!1}if(s&&s.isSymbolicLink())try{i=n.statSync(t);}catch(e){i=s;}else i=s;}this.statCache[t]=i;o=!0;return i&&(o=i.isDirectory()?"DIR":"FILE"),this.cache[t]=this.cache[t]||o,(!r||"FILE"!==o)&&o},y.prototype._mark=function(e){return u.mark(this,e)},y.prototype._makeAbs=function(e){return u.makeAbs(this,e)};},function(e,t,r){var n=r(16),o=Object.create(null),i=r(17);e.exports=n(function(e,t){return o[e]?(o[e].push(t),null):(o[e]=[t],function(e){return i(function t(){var r=o[e],n=r.length,i=function(e){for(var t=e.length,r=[],n=0;n<t;n++)r[n]=e[n];return r}(arguments);try{for(var s=0;s<n;s++)r[s].apply(null,i);}finally{r.length>n?(r.splice(0,n),process.nextTick(function(){t.apply(null,i);})):delete o[e];}})}(e))});},function(e,t,r){e.exports=u,u.sync=function(e,t){for(var r=c(e,t=t||{}),n=r.env,i=r.ext,u=r.extExe,l=[],p=0,f=n.length;p<f;p++){var h=n[p];'"'===h.charAt(0)&&'"'===h.slice(-1)&&(h=h.slice(1,-1));var d=o.join(h,e);!h&&/^\.[\\\/]/.test(e)&&(d=e.slice(0,2)+d);for(var y=0,m=i.length;y<m;y++){var g=d+i[y];try{if(s.sync(g,{pathExt:u})){if(!t.all)return g;l.push(g);}}catch(e){}}}if(t.all&&l.length)return l;if(t.nothrow)return null;throw a(e)};var n="win32"===process.platform||"cygwin"===process.env.OSTYPE||"msys"===process.env.OSTYPE,o=r(0),i=n?";":":",s=r(51);function a(e){var t=new Error("not found: "+e);return t.code="ENOENT",t}function c(e,t){var r=t.colon||i,o=t.path||process.env.PATH||"",s=[""];o=o.split(r);var a="";return n&&(o.unshift(process.cwd()),s=(a=t.pathExt||process.env.PATHEXT||".EXE;.CMD;.BAT;.COM").split(r),-1!==e.indexOf(".")&&""!==s[0]&&s.unshift("")),(e.match(/\//)||n&&e.match(/\\/))&&(o=[""]),{env:o,ext:s,extExe:a}}function u(e,t,r){"function"==typeof t&&(r=t,t={});var n=c(e,t),i=n.env,u=n.ext,l=n.extExe,p=[];!function n(c,f){if(c===f)return t.all&&p.length?r(null,p):r(a(e));var h=i[c];'"'===h.charAt(0)&&'"'===h.slice(-1)&&(h=h.slice(1,-1));var d=o.join(h,e);!h&&/^\.[\\\/]/.test(e)&&(d=e.slice(0,2)+d),function e(o,i){if(o===i)return n(c+1,f);var a=u[o];s(d+a,{pathExt:l},function(n,s){if(!n&&s){if(!t.all)return r(null,d+a);p.push(d+a);}return e(o+1,i)});}(0,u.length);}(0,i.length);}},function(e,t,r){var n;r(1);function o(e,t,r){if("function"==typeof t&&(r=t,t={}),!r){if("function"!=typeof Promise)throw new TypeError("callback not provided");return new Promise(function(r,n){o(e,t||{},function(e,t){e?n(e):r(t);});})}n(e,t||{},function(e,n){e&&("EACCES"===e.code||t&&t.ignoreErrors)&&(e=null,n=!1),r(e,n);});}n="win32"===process.platform||commonjsGlobal.TESTING_WINDOWS?r(52):r(53),e.exports=o,o.sync=function(e,t){try{return n.sync(e,t||{})}catch(e){if(t&&t.ignoreErrors||"EACCES"===e.code)return !1;throw e}};},function(e,t,r){e.exports=i,i.sync=function(e,t){return o(n.statSync(e),e,t)};var n=r(1);function o(e,t,r){return !(!e.isSymbolicLink()&&!e.isFile())&&function(e,t){var r=void 0!==t.pathExt?t.pathExt:process.env.PATHEXT;if(!r)return !0;if(-1!==(r=r.split(";")).indexOf(""))return !0;for(var n=0;n<r.length;n++){var o=r[n].toLowerCase();if(o&&e.substr(-o.length).toLowerCase()===o)return !0}return !1}(t,r)}function i(e,t,r){n.stat(e,function(n,i){r(n,!n&&o(i,e,t));});}},function(e,t,r){e.exports=o,o.sync=function(e,t){return i(n.statSync(e),t)};var n=r(1);function o(e,t,r){n.stat(e,function(e,n){r(e,!e&&i(n,t));});}function i(e,t){return e.isFile()&&function(e,t){var r=e.mode,n=e.uid,o=e.gid,i=void 0!==t.uid?t.uid:process.getuid&&process.getuid(),s=void 0!==t.gid?t.gid:process.getgid&&process.getgid(),a=parseInt("100",8),c=parseInt("010",8),u=parseInt("001",8),l=a|c;return r&u||r&c&&o===s||r&a&&n===i||r&l&&0===i}(e,t)}},function(e,t){e.exports={androidSystemImages:/system-images;([\S \t]+)/g,androidAPILevels:/platforms;android-(\d+)[\S\s]/g,androidBuildTools:/build-tools;([\d|.]+)[\S\s]/g};},function(e,t,r){const n=r(56),o=r(6);function i(e,t){return o.log("trace","clean",e),Object.keys(e).reduce((r,n)=>!t.showNotFound&&"Not Found"===e[n]||"N/A"===e[n]||void 0===e[n]||0===Object.keys(e[n]).length?r:o.isObject(e[n])?Object.values(e[n]).every(e=>"N/A"===e||!t.showNotFound&&"Not Found"===e)?r:Object.assign(r,{[n]:i(e[n],t)}):Object.assign(r,{[n]:e[n]}),{})}function s(e,t){o.log("trace","formatHeaders"),t||(t={type:"underline"});const r={underline:["[4m","[0m"]};return e.slice().split("\n").map(e=>{if(":"===e.slice("-1")){const n=e.match(/^[\s]*/g)[0];return `${n}${r[t.type][0]}${e.slice(n.length)}${r[t.type][1]}`}return e}).join("\n")}function a(e){return o.log("trace","formatPackages"),e.npmPackages?Object.assign(e,{npmPackages:Object.entries(e.npmPackages||{}).reduce((e,t)=>{const r=t[0],n=t[1];if("Not Found"===n)return Object.assign(e,{[r]:n});const o=n.wanted?`${n.wanted} =>`:"",i=Array.isArray(n.installed)?n.installed.join(", "):n.installed,s=n.duplicates?`(${n.duplicates.join(", ")})`:"";return Object.assign(e,{[r]:`${o} ${i} ${s}`})},{})}):e}function c(e,t,r){return r||(r={emptyMessage:"None"}),Array.isArray(t)&&(t=t.length>0?t.join(", "):r.emptyMessage),{[e]:t}}function u(e){return o.log("trace","serializeArrays"),function e(t,r){return Object.entries(t).reduce((t,n)=>{const i=n[0],s=n[1];return o.isObject(s)?Object.assign(t,{[i]:e(s,r)}):Object.assign(t,r(i,s))},{})}(e,c)}function l(e){return o.log("trace","serializeVersionsAndPaths"),Object.entries(e).reduce((e,t)=>Object.assign(e,{[t[0]]:Object.entries(t[1]).reduce((e,t)=>{const r=t[0],n=t[1];return n.version?Object.assign(e,{[r]:[n.version,n.path].filter(Boolean).join(" - ")}):Object.assign(e,{[r]:[n][0]})},{})},{}),{})}function p(e){return n(e,{indent:"  ",prefix:"\n",postfix:"\n"})}function f(e){return e.slice().split("\n").map(e=>{if(""!==e){const t=":"===e.slice("-1"),r=e.search(/\S|$/);return t?`${"#".repeat(r/2+1)} `+e.slice(r):" - "+e.slice(r)}return ""}).join("\n")}function h(e,t){return t||(t={indent:"  "}),JSON.stringify(e,null,t.indent)}e.exports={json:function(e,t){return o.log("trace","formatToJson"),t||(t={}),e=o.pipe([()=>i(e,t),t.title?e=>({[t.title]:e}):o.noop,h])(e),e=t.console?`\n${e}\n`:e},markdown:function(e,t){return o.log("trace","formatToMarkdown"),o.pipe([()=>i(e,t),a,u,l,p,f,t.title?e=>`\n# ${t.title}${e}`:o.noop])(e,t)},yaml:function(e,t){return o.log("trace","formatToYaml",t),o.pipe([()=>i(e,t),a,u,l,t.title?e=>({[t.title]:e}):o.noop,p,t.console?s:o.noop])(e,t)}};},function(e,t,r){var n=r(57),o=r(58),i=r(62),s=["object","array"];e.exports=function(e,t){var r=o(t),a=r.colors,c=r.prefix,u=r.postfix,l=r.dateToString,p=r.errorToString,f=r.indent;function h(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:1,r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:0;if(0===Object.keys(e).length)return " {}";var o="\n",a=i(t,f);return Object.keys(e).forEach(function(c){var u=e[c],l=n(u),p=i(r,"  "),f=-1!==s.indexOf(l)?"":" ",h=y(l,u,t+1,r);o+=`${p}${a}${c}:${f}${h}\n`;}),o.substring(0,o.length-1)}function d(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:1,r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:0;if(0===e.length)return " []";var o="\n",s=i(t,f);return e.forEach(function(e){var a=n(e),c=i(r,"  "),u=y(a,e,t,r+1).toString().trimLeft();o+=`${c}${s}- ${u}\n`;}),o.substring(0,o.length-1)}function y(e,t,r,n){switch(e){case"array":return d(t,r,n);case"object":return h(t,r,n);case"string":return a.string(t);case"symbol":return a.symbol(t.toString());case"number":return a.number(t);case"boolean":return a.boolean(t);case"null":return a.null("null");case"undefined":return a.undefined("undefined");case"date":return a.date(l(t));case"error":return a.error(p(t));default:return t&&t.toString?t.toString():Object.prototype.toString.call(t)}}var m="";return "object"===n(e)&&Object.keys(e).length>0?m=h(e):"array"===n(e)&&e.length>0&&(m=d(e)),0===m.length?"":`${c}${m.slice(1)}${u}`};},function(e,t,r){e.exports=function(e){return Array.isArray(e)?"array":e instanceof Date?"date":e instanceof Error?"error":null===e?"null":"object"==typeof e&&"[object Object]"===Object.prototype.toString.call(e)?"object":typeof e};},function(e,t,r){var n=r(59),o=r(60),i=r(61),s=" ",a="\n",c="";function u(e,t){return void 0===e?t:e}e.exports=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};return {indent:u(e.indent,s),prefix:u(e.prefix,a),postfix:u(e.postfix,c),errorToString:e.errorToString||n,dateToString:e.dateToString||o,colors:Object.assign({},i,e.colors)}};},function(e,t,r){e.exports=function(e){return Error.prototype.toString.call(e)};},function(e,t,r){e.exports=function(e){return `new Date(${Date.prototype.toISOString.call(e)})`};},function(e,t,r){function n(e){return e}e.exports={date:n,error:n,symbol:n,string:n,number:n,boolean:n,null:n,undefined:n};},function(e,t,r){e.exports=function(){for(var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:1,t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"  ",r="",n=0;n<e;n+=1)r+=t;return r};},function(e,t){e.exports={defaults:{System:["OS","CPU","Memory","Container","Shell"],Binaries:["Node","Yarn","npm","Watchman"],Utilities:["CMake","Make","GCC","Git"],Servers:["Apache","Nginx"],Virtualization:["Docker","Parallels","VirtualBox","VMware Fusion"],SDKs:["iOS SDK","Android SDK"],IDEs:["Android Studio","Atom","Emacs","IntelliJ","NVim","Nano","PhpStorm","Sublime Text","VSCode","Vim","WebStorm","Xcode"],Languages:["Bash","Go","Elixir","Java","Perl","PHP","Python","Ruby","Rust","Scala"],Databases:["MongoDB","MySQL","PostgreSQL","SQLite"],Browsers:["Chrome","Chrome Canary","Edge","Firefox","Firefox Developer Edition","Firefox Nightly","Internet Explorer","Safari","Safari Technology Preview"],npmPackages:null,npmGlobalPackages:null},jest:{System:["OS","CPU"],Binaries:["Node","Yarn","npm"],npmPackages:["jest"]},"react-native":{System:["OS","CPU"],Binaries:["Node","Yarn","npm","Watchman"],SDKs:["iOS SDK","Android SDK"],IDEs:["Android Studio","Xcode"],npmPackages:["react","react-native"],npmGlobalPackages:["react-native-cli"]},webpack:{System:["OS","CPU"],Binaries:["Node","Yarn","npm"],npmPackages:"*webpack*",npmGlobalPackages:["webpack","webpack-cli"]},"styled-components":{System:["OS","CPU"],Binaries:["Node","Yarn","npm"],Browsers:["Chrome","Firefox","Safari"],npmPackages:"*styled-components*"},"create-react-app":{System:["OS","CPU"],Binaries:["Node","npm","Yarn"],Browsers:["Chrome","Edge","Internet Explorer","Firefox","Safari"],npmPackages:["react","react-dom","react-scripts"],npmGlobalPackages:["create-react-app"],options:{duplicates:!0,showNotFound:!0}},apollo:{System:["OS"],Binaries:["Node","npm","Yarn"],Browsers:["Chrome","Edge","Firefox","Safari"],npmPackages:"*apollo*",npmGlobalPackages:"*apollo*"},"react-native-web":{System:["OS","CPU"],Binaries:["Node","npm","Yarn"],Browsers:["Chrome","Edge","Internet Explorer","Firefox","Safari"],npmPackages:["react","react-native-web"],options:{showNotFound:!0}}};},function(e,t,r){var n=r(2),o=r(18),i=r(27),s=r(28),a=s(),c=r(78),u=Array.prototype.slice,l=function(e,t){return o.RequireObjectCoercible(e),a.apply(e,u.call(arguments,1))};n(l,{getPolyfill:s,implementation:i,shim:c}),e.exports=l;},function(e,t,r){var n=Object.prototype.hasOwnProperty,o=Object.prototype.toString,i=Array.prototype.slice,s=r(66),a=Object.prototype.propertyIsEnumerable,c=!a.call({toString:null},"toString"),u=a.call(function(){},"prototype"),l=["toString","toLocaleString","valueOf","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","constructor"],p=function(e){var t=e.constructor;return t&&t.prototype===e},f={$applicationCache:!0,$console:!0,$external:!0,$frame:!0,$frameElement:!0,$frames:!0,$innerHeight:!0,$innerWidth:!0,$outerHeight:!0,$outerWidth:!0,$pageXOffset:!0,$pageYOffset:!0,$parent:!0,$scrollLeft:!0,$scrollTop:!0,$scrollX:!0,$scrollY:!0,$self:!0,$webkitIndexedDB:!0,$webkitStorageInfo:!0,$window:!0},h=function(){if("undefined"==typeof window)return !1;for(var e in window)try{if(!f["$"+e]&&n.call(window,e)&&null!==window[e]&&"object"==typeof window[e])try{p(window[e]);}catch(e){return !0}}catch(e){return !0}return !1}(),d=function(e){var t=null!==e&&"object"==typeof e,r="[object Function]"===o.call(e),i=s(e),a=t&&"[object String]"===o.call(e),f=[];if(!t&&!r&&!i)throw new TypeError("Object.keys called on a non-object");var d=u&&r;if(a&&e.length>0&&!n.call(e,0))for(var y=0;y<e.length;++y)f.push(String(y));if(i&&e.length>0)for(var m=0;m<e.length;++m)f.push(String(m));else for(var g in e)d&&"prototype"===g||!n.call(e,g)||f.push(String(g));if(c)for(var v=function(e){if("undefined"==typeof window||!h)return p(e);try{return p(e)}catch(e){return !1}}(e),b=0;b<l.length;++b)v&&"constructor"===l[b]||!n.call(e,l[b])||f.push(l[b]);return f};d.shim=function(){if(Object.keys){if(!function(){return 2===(Object.keys(arguments)||"").length}(1,2)){var e=Object.keys;Object.keys=function(t){return s(t)?e(i.call(t)):e(t)};}}else Object.keys=d;return Object.keys||d},e.exports=d;},function(e,t,r){var n=Object.prototype.toString;e.exports=function(e){var t=n.call(e),r="[object Arguments]"===t;return r||(r="[object Array]"!==t&&null!==e&&"object"==typeof e&&"number"==typeof e.length&&e.length>=0&&"[object Function]"===n.call(e.callee)),r};},function(e,t,r){var n=Array.prototype.slice,o=Object.prototype.toString;e.exports=function(e){var t=this;if("function"!=typeof t||"[object Function]"!==o.call(t))throw new TypeError("Function.prototype.bind called on incompatible "+t);for(var r,i=n.call(arguments,1),s=Math.max(0,t.length-i.length),a=[],c=0;c<s;c++)a.push("$"+c);if(r=Function("binder","return function ("+a.join(",")+"){ return binder.apply(this,arguments); }")(function(){if(this instanceof r){var o=t.apply(this,i.concat(n.call(arguments)));return Object(o)===o?o:this}return t.apply(e,i.concat(n.call(arguments)))}),t.prototype){var u=function(){};u.prototype=t.prototype,r.prototype=new u,u.prototype=null;}return r};},function(e,t,r){e.exports=r(69);},function(e,t,r){var n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator,o=r(20),i=r(11),s=r(70),a=r(71);e.exports=function(e){if(o(e))return e;var t,r="default";if(arguments.length>1&&(arguments[1]===String?r="string":arguments[1]===Number&&(r="number")),n&&(Symbol.toPrimitive?t=function(e,t){var r=e[t];if(null!=r){if(!i(r))throw new TypeError(r+" returned for property "+t+" of object "+e+" is not a function");return r}}(e,Symbol.toPrimitive):a(e)&&(t=Symbol.prototype.valueOf)),void 0!==t){var c=t.call(e,r);if(o(c))return c;throw new TypeError("unable to convert exotic object to primitive")}return "default"===r&&(s(e)||a(e))&&(r="string"),function(e,t){if(null==e)throw new TypeError("Cannot call method on "+e);if("string"!=typeof t||"number"!==t&&"string"!==t)throw new TypeError('hint must be "string" or "number"');var r,n,s,a="string"===t?["toString","valueOf"]:["valueOf","toString"];for(s=0;s<a.length;++s)if(r=e[a[s]],i(r)&&(n=r.call(e),o(n)))return n;throw new TypeError("No default value")}(e,"default"===r?"number":r)};},function(e,t,r){var n=Date.prototype.getDay,o=Object.prototype.toString,i="function"==typeof Symbol&&"symbol"==typeof Symbol.toStringTag;e.exports=function(e){return "object"==typeof e&&null!==e&&(i?function(e){try{return n.call(e),!0}catch(e){return !1}}(e):"[object Date]"===o.call(e))};},function(e,t,r){var n=Object.prototype.toString;if(r(72)()){var o=Symbol.prototype.toString,i=/^Symbol\(.*\)$/;e.exports=function(e){if("symbol"==typeof e)return !0;if("[object Symbol]"!==n.call(e))return !1;try{return function(e){return "symbol"==typeof e.valueOf()&&i.test(o.call(e))}(e)}catch(e){return !1}};}else e.exports=function(e){return !1};},function(e,t,r){var n=commonjsGlobal.Symbol,o=r(73);e.exports=function(){return "function"==typeof n&&("function"==typeof Symbol&&("symbol"==typeof n("foo")&&("symbol"==typeof Symbol("bar")&&o())))};},function(e,t,r){e.exports=function(){if("function"!=typeof Symbol||"function"!=typeof Object.getOwnPropertySymbols)return !1;if("symbol"==typeof Symbol.iterator)return !0;var e={},t=Symbol("test"),r=Object(t);if("string"==typeof t)return !1;if("[object Symbol]"!==Object.prototype.toString.call(t))return !1;if("[object Symbol]"!==Object.prototype.toString.call(r))return !1;for(t in e[t]=42,e)return !1;if("function"==typeof Object.keys&&0!==Object.keys(e).length)return !1;if("function"==typeof Object.getOwnPropertyNames&&0!==Object.getOwnPropertyNames(e).length)return !1;var n=Object.getOwnPropertySymbols(e);if(1!==n.length||n[0]!==t)return !1;if(!Object.prototype.propertyIsEnumerable.call(e,t))return !1;if("function"==typeof Object.getOwnPropertyDescriptor){var o=Object.getOwnPropertyDescriptor(e,t);if(42!==o.value||!0!==o.enumerable)return !1}return !0};},function(e,t){e.exports=function(e){return null===e||"function"!=typeof e&&"object"!=typeof e};},function(e,t,r){var n=r(21),o=n("%Object%"),i=n("%TypeError%"),s=n("%String%"),a=r(22),c=r(23),u=r(25),l=r(26),p=r(11),f=r(76),h=r(3),d={ToPrimitive:f,ToBoolean:function(e){return !!e},ToNumber:function(e){return +e},ToInteger:function(e){var t=this.ToNumber(e);return a(t)?0:0!==t&&c(t)?u(t)*Math.floor(Math.abs(t)):t},ToInt32:function(e){return this.ToNumber(e)>>0},ToUint32:function(e){return this.ToNumber(e)>>>0},ToUint16:function(e){var t=this.ToNumber(e);if(a(t)||0===t||!c(t))return 0;var r=u(t)*Math.floor(Math.abs(t));return l(r,65536)},ToString:function(e){return s(e)},ToObject:function(e){return this.CheckObjectCoercible(e),o(e)},CheckObjectCoercible:function(e,t){if(null==e)throw new i(t||"Cannot call method on "+e);return e},IsCallable:p,SameValue:function(e,t){return e===t?0!==e||1/e==1/t:a(e)&&a(t)},Type:function(e){return null===e?"Null":void 0===e?"Undefined":"function"==typeof e||"object"==typeof e?"Object":"number"==typeof e?"Number":"boolean"==typeof e?"Boolean":"string"==typeof e?"String":void 0},IsPropertyDescriptor:function(e){if("Object"!==this.Type(e))return !1;var t={"[[Configurable]]":!0,"[[Enumerable]]":!0,"[[Get]]":!0,"[[Set]]":!0,"[[Value]]":!0,"[[Writable]]":!0};for(var r in e)if(h(e,r)&&!t[r])return !1;var n=h(e,"[[Value]]"),o=h(e,"[[Get]]")||h(e,"[[Set]]");if(n&&o)throw new i("Property Descriptors may not be both accessor and data descriptors");return !0},IsAccessorDescriptor:function(e){if(void 0===e)return !1;if(!this.IsPropertyDescriptor(e))throw new i("Desc must be a Property Descriptor");return !(!h(e,"[[Get]]")&&!h(e,"[[Set]]"))},IsDataDescriptor:function(e){if(void 0===e)return !1;if(!this.IsPropertyDescriptor(e))throw new i("Desc must be a Property Descriptor");return !(!h(e,"[[Value]]")&&!h(e,"[[Writable]]"))},IsGenericDescriptor:function(e){if(void 0===e)return !1;if(!this.IsPropertyDescriptor(e))throw new i("Desc must be a Property Descriptor");return !this.IsAccessorDescriptor(e)&&!this.IsDataDescriptor(e)},FromPropertyDescriptor:function(e){if(void 0===e)return e;if(!this.IsPropertyDescriptor(e))throw new i("Desc must be a Property Descriptor");if(this.IsDataDescriptor(e))return {value:e["[[Value]]"],writable:!!e["[[Writable]]"],enumerable:!!e["[[Enumerable]]"],configurable:!!e["[[Configurable]]"]};if(this.IsAccessorDescriptor(e))return {get:e["[[Get]]"],set:e["[[Set]]"],enumerable:!!e["[[Enumerable]]"],configurable:!!e["[[Configurable]]"]};throw new i("FromPropertyDescriptor must be called with a fully populated Property Descriptor")},ToPropertyDescriptor:function(e){if("Object"!==this.Type(e))throw new i("ToPropertyDescriptor requires an object");var t={};if(h(e,"enumerable")&&(t["[[Enumerable]]"]=this.ToBoolean(e.enumerable)),h(e,"configurable")&&(t["[[Configurable]]"]=this.ToBoolean(e.configurable)),h(e,"value")&&(t["[[Value]]"]=e.value),h(e,"writable")&&(t["[[Writable]]"]=this.ToBoolean(e.writable)),h(e,"get")){var r=e.get;if(void 0!==r&&!this.IsCallable(r))throw new TypeError("getter must be a function");t["[[Get]]"]=r;}if(h(e,"set")){var n=e.set;if(void 0!==n&&!this.IsCallable(n))throw new i("setter must be a function");t["[[Set]]"]=n;}if((h(t,"[[Get]]")||h(t,"[[Set]]"))&&(h(t,"[[Value]]")||h(t,"[[Writable]]")))throw new i("Invalid property descriptor. Cannot both specify accessors and a value or writable attribute");return t}};e.exports=d;},function(e,t,r){var n=Object.prototype.toString,o=r(20),i=r(11),s=function(e){var t;if((t=arguments.length>1?arguments[1]:"[object Date]"===n.call(e)?String:Number)===String||t===Number){var r,s,a=t===String?["toString","valueOf"]:["valueOf","toString"];for(s=0;s<a.length;++s)if(i(e[a[s]])&&(r=e[a[s]](),o(r)))return r;throw new TypeError("No default value")}throw new TypeError("invalid [[DefaultValue]] hint supplied")};e.exports=function(e){return o(e)?e:arguments.length>1?s(e,arguments[1]):s(e)};},function(e,t,r){var n=r(3),o=RegExp.prototype.exec,i=Object.getOwnPropertyDescriptor,s=Object.prototype.toString,a="function"==typeof Symbol&&"symbol"==typeof Symbol.toStringTag;e.exports=function(e){if(!e||"object"!=typeof e)return !1;if(!a)return "[object RegExp]"===s.call(e);var t=i(e,"lastIndex");return !(!t||!n(t,"value"))&&function(e){try{var t=e.lastIndex;return e.lastIndex=0,o.call(e),!0}catch(e){return !1}finally{e.lastIndex=t;}}(e)};},function(e,t,r){var n=r(2),o=r(28);e.exports=function(){var e=o();return n(Array.prototype,{includes:e},{includes:function(){return Array.prototype.includes!==e}}),e};},function(e,t,r){var n=r(2),o=r(29),i=r(31),s=r(81),a=i();n(a,{getPolyfill:i,implementation:o,shim:s}),e.exports=a;},function(e,t,r){var n=r(19),o=r(24),i=o(o({},n),{SameValueNonNumber:function(e,t){if("number"==typeof e||typeof e!=typeof t)throw new TypeError("SameValueNonNumber requires two non-number values of the same type.");return this.SameValue(e,t)}});e.exports=i;},function(e,t,r){var n=r(31),o=r(2);e.exports=function(){var e=n();return o(Object,{entries:e},{entries:function(){return Object.entries!==e}}),e};},function(e,t,r){var n=r(2),o=r(32),i=r(33),s=r(83),a=i();n(a,{getPolyfill:i,implementation:o,shim:s}),e.exports=a;},function(e,t,r){var n=r(33),o=r(2);e.exports=function(){var e=n();return o(Object,{values:e},{values:function(){return Object.values!==e}}),e};}]);
	});

	unwrapExports(envinfo);

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

	return usePkgVersionCli;

})));
