const stripAnsi = require('strip-ansi')
const debug = require('debug')('stdout-stderr')

const g = global
if (!g['stdout-stderr']) {
  g['stdout-stderr'] = {
    stdout: process.stdout.write,
    stderr: process.stderr.write
  }
}

function bufToStr(buf) {
  if (typeof buf === 'string') return buf
  return buf.toString('utf8')
}

/**
 * Captures stdout or stderr output, so that it can be tested or stored.
 *
 * @example
 * // Capture the output of stdout
 * const { stdout } = require('stdout-stderr')
 * stdout.start()
 * console.log('Capture this standard output')
 * console.error('Do not capture this error output')
 * stdout.stop()
 * console.log(stdout.output)
 *
 * @example
 * // Capture the output of stderr
 * const { stderr } = require('stdout-stderr')
 * stderr.start()
 * console.log('Capture this error output')
 * console.error('Do not capture this standard output')
 * stderr.stop()
 * console.log(stderr.output)
 *
 * @example
 * // Capture the output AND send it to the console
 * const { stdout } = require('stdout-stderr')
 * stdout.print = true
 * stdout.start()
 * console.log('Capture this output and send it to the console')
 * stdout.stop()
 * console.log(stdout.output)
 *
 * To debug set the environment variable: DEBUG=stdout-stderr.
 * For more information see https://www.npmjs.com/package/debug#windows-command-prompt-notes
 *
 *
 * @param {string} stdType - The output type to capture, valid values: stdout, stderr
 * @returns {Object} A capture object of the specified output type
 */
function capture(stdType) {
  if (!['stdout', 'stderr'].includes(stdType)) {
    throw new Error(`stdType must be 'stdout' or 'stderr'`)
  }
  let writes = []
  return {
    stripColor: true,
    print: false,
    start() {
      debug('start', stdType)
      writes = []
      process[stdType].write = (data, ...args) => {
        writes.push(bufToStr(data))
        if (this.print) g['stdout-stderr'][stdType].apply(process[stdType], [data, ...args])
        return true
      }
    },
    stop() {
      process[stdType].write = g['stdout-stderr'][stdType]
      debug('stop', stdType)
    },
    get output() {
      let o = this.stripColor ? writes.map(stripAnsi) : writes
      return o.join('')
    },
  }
}

module.exports = {
  stdout: capture('stdout'),
  stderr: capture('stderr')
}
