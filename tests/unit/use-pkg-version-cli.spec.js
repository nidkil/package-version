const updateCmd = require('@/commands/update.cmd')
const cli = require('@/use-pkg-version-cli')
const { stdout } = require('./helpers/stdout-stderr')

jest.mock('@/commands/update.cmd', () => {
  return jest.fn(() => true)
})

stdout.print = false

describe('test cli', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  test('no arguments displays help message', () => {
    process.argv = ['node', 'use-pkg-version-cli']
    stdout.start()
    cli()
    stdout.stop()
    expect(stdout.output).toEqual(expect.stringMatching(/^Usage: use-pkg-version-cli <command> \[options\]/))
  })

  test('display help message for command', () => {
    updateCmd.mockImplementation(() => true)
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {})
    process.argv = ['node', 'use-pkg-version-cli', 'update', '--help']
    stdout.start()
    cli()
    stdout.stop()
    expect(mockExit).toHaveBeenCalledWith(0)
    expect(stdout.output).toEqual(expect.stringMatching(/^Usage: update \[options\] <file>/))
  })

  test.skip('file does not exist', () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {})
    const filename = 'test.file'
    process.argv = ['node', 'use-pkg-version-cli', 'update', filename]
    stdout.start()
    cli()
    stdout.stop()
    expect(stdout.output).toEqual(expect.stringMatching(/File does not exist: /))
    expect(mockExit).toHaveBeenCalledWith(2)
  })
})
