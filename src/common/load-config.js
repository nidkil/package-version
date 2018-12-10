const cosmiconfig = require('cosmiconfig')

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
function loadConfig (startDir, moduleName, defaults = {}) {
  const explorer = cosmiconfig(moduleName)
  const { config = {} } = explorer.searchSync(startDir) || {}
  return Object.assign({}, defaults, config)
}

module.exports = loadConfig
