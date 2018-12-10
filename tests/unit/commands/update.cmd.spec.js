const fs = require('fs')
const path = require('path')
const update = require('@/commands/update.cmd.js')
const { addLineToFile, createDirectory, createEmptyFile, rmdirRecursive } = require('@/common/fs-helpers')

const verbose = false
const quiet = true
const testBasePath = path.join(__dirname, 'tmp')
const testFileTemplate = path.join(testBasePath , '{{test}}', 'test.file')
const testPackageTemplate = path.join(testBasePath , '{{test}}', 'package.json')
const contentsTestFile = `Replace the
version number: <strong>2.0.0</strong>
in this file
`
const contentsPackageFile = `{
  "version": "3.2.1"
}`
const expectedContentsTestFile = `Replace the
version number: <strong>3.2.1</strong>
in this file
`

function createFile(path, contents) {
  createEmptyFile(path)
  addLineToFile(path, contents, 0, true)
}

// There are issues on Windows deleting directories recursively, as a workaround each test gets it's own test
// structure :-(
let testCnt = 0
let testFile = null
let testPackage = null

const stringClone = (str) => (' ' + str).slice(0)

describe('update version number in file using version number from package.json file', () => {
  beforeAll(() => {
    rmdirRecursive(testBasePath)
    createDirectory(testBasePath)
  })

  beforeEach(() => {
    const curTestDir = 'test-' + testCnt++
    testFile = testFileTemplate.replace('{{test}}', curTestDir)
    testPackage = testPackageTemplate.replace('{{test}}', curTestDir)
    createDirectory(path.join(testBasePath, curTestDir))
    createFile(testFile, contentsTestFile)
    createFile(testPackage, contentsPackageFile)
  })

  afterAll(() => {
    rmdirRecursive(testBasePath)
  })

  describe('options', () => {
    test('no update file specified', () => {
      const options = {
        verbose,
        quiet
      }
      const t = () => {
        update(options)
      }
      expect(t).toThrow('The file to update must be specified (updateFile)')
    })

    test('no package.json file specified', () => {
      const options = {
        updateFile: testFile,
        verbose,
        quiet
      }
      const t = () => {
        update(options)
      }
      expect(t).toThrow('The package.json file must be specified (packageFile)')
    })

    test('placeholder not specified in replaceWith', () => {
      const options = {
        updateFile: testFile,
        packageFile: testPackage,
        findRegex: 'invalid',
        replaceWith: 'new-value',
        verbose,
        quiet
      }
      const t = () => {
        update(options)
      }
      expect(t).toThrow('Version number placeholder \'{{version}}\' not specified in \'replaceWith\'')
    })

    test('placeholder changed', () => {
      const options = {
        updateFile: testFile,
        packageFile: testPackage,
        findRegex: 'invalid',
        replaceWith: 'new-value',
        placeholder: '>>test<<',
        verbose,
        quiet
      }
      const t = () => {
        update(options)
      }
      expect(t).toThrow('Version number placeholder \'>>test<<\' not specified in \'replaceWith\'')
    })
  })

  describe('updating', () => {
    test('correct regex, version number update', () => {
      const options = {
        updateFile: testFile,
        packageFile: testPackage,
        findRegex: '<strong>.*?</strong>',
        replaceWith: '<strong>{{version}}</strong>',
        verbose,
        quiet
      }
      update(options)
      const contents = fs.readFileSync(testFile)
      expect(contents.toString()).toBe(expectedContentsTestFile)
    })

    test('incorrect regex, version number not updated', () => {
      const options = {
        updateFile: testFile,
        packageFile: testPackage,
        findRegex: '<straong>.*?</straong>',
        replaceWith: '<strong>{{version}}</strong>',
        verbose,
        quiet
      }
      update(options)
      const contents = fs.readFileSync(testFile)
      expect(contents.toString()).not.toBe(expectedContentsTestFile)
    })
  })

  describe('no updating', () => {
    test('test that dry run does not update anything', () => {
      const options = {
        updateFile: testFile,
        packageFile: testPackage,
        findRegex: '<strong>.*?</strong>',
        replaceWith: '<strong>{{version}}</strong>',
        verbose,
        quiet: true,
        dry: true
      }
      update(options)
      const contents = fs.readFileSync(testFile)
      expect(contents.toString()).not.toBe(expectedContentsTestFile)
    })
  })
})
