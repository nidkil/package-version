const fs = require('fs')
const path = require('path')
const update = require('@/commands/update.cmd.js')
const { addLineToFile, createDirectory, createEmptyFile, directoryExists, rmdirRecursive } = require('@/common/fs-helpers')

const verbose = false
const quiet = true
const testBasePath = path.join(__dirname, 'tmp')
const testFileTemplate = path.join(testBasePath , '{{test}}', 'test.file')
const testPackageTemplate = path.join(testBasePath , '{{test}}', 'package.json')

const contentsPackageFile = `{
  "version": "3.2.1"
}`
const contentsTestFile = `Replace the
version number: <strong>2.0.0</strong>
in this file
`
const expectedContentsTestFile = `Replace the
version number: <strong>3.2.1</strong>
in this file
`

const contentsReadmeFile = `{
  "version": "4.4.4"
}`
const contentsReadmeTestFile = `{
  "devDependencies": {
    "vue-build-helper": "^123.222.1000000000000"
  }
}
`
const expectedContentsReadmeTestFile = `{
  "devDependencies": {
    "vue-build-helper": "^4.4.4"
  }
}
`

const contentsPkgFile = `{
  "version": "7.7.7"
}`
const contentsPkgTestFile = `{
  "name": "test",
  "version": "^123.222.1000000000000",
  "devDependencies": {
    "vue-build-helper": "^123.222.1000000000000"
  }
}
`
const expectedContentsPkgTestFile = `{
  "name": "test",
  "version": "^7.7.7",
  "devDependencies": {
    "vue-build-helper": "^123.222.1000000000000"
  }
}
`

function createFile(path, contents) {
  createEmptyFile(path)
  addLineToFile(path, contents, 0, true)
}

function setupTestFiles(curTestDir, testFile = contentsTestFile, packageFile = contentsPackageFile) {
  testFilePath = testFileTemplate.replace('{{test}}', curTestDir)
  testPackagePath = testPackageTemplate.replace('{{test}}', curTestDir)
  const dir = path.join(testBasePath, curTestDir)
  if(!directoryExists(dir)) createDirectory(dir)
  createFile(testFilePath, testFile)
  createFile(testPackagePath, packageFile)
}

// There are issues on Windows deleting directories recursively, as a workaround each test gets it's own test
// structure :-(
let testCnt = 0
let curTestDir = null
let testFilePath = null
let testPackagePath = null

const stringClone = (str) => (' ' + str).slice(0)

describe('update version number in file using version number from package.json file', () => {
  beforeAll(() => {
    rmdirRecursive(testBasePath)
    createDirectory(testBasePath)
  })

  beforeEach(() => {
    curTestDir = 'test-' + testCnt++
    setupTestFiles(curTestDir)
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
        updateFile: testFilePath,
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
        updateFile: testFilePath,
        packageFile: testPackagePath,
        searchFor: 'invalid',
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
        updateFile: testFilePath,
        packageFile: testPackagePath,
        searchFor: 'invalid',
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
        updateFile: testFilePath,
        packageFile: testPackagePath,
        searchFor: '<strong>.*?</strong>',
        replaceWith: '<strong>{{version}}</strong>',
        verbose,
        quiet
      }
      update(options)
      const contents = fs.readFileSync(testFilePath)
      expect(contents.toString()).toBe(expectedContentsTestFile)
    })

    test('readme with correct regex, version number update', () => {
      curTestDir += 'b'
      setupTestFiles(curTestDir, contentsReadmeTestFile, contentsReadmeFile)
      const options = {
        updateFile: testFilePath,
        packageFile: testPackagePath,
        searchFor: '"vue-build-helper": "\\^[0-9]*?[.][0-9]*?[.][0-9]*?"',
        replaceWith: '"vue-build-helper": "^{{version}}"',
        verbose,
        quiet
      }
      update(options)
      const contents = fs.readFileSync(testFilePath)
      expect(contents.toString()).toBe(expectedContentsReadmeTestFile)
    })

    test('package.json with correct regex, version number update', () => {
      curTestDir += 'b'
      setupTestFiles(curTestDir, contentsPkgTestFile, contentsPkgFile)
      const options = {
        updateFile: testFilePath,
        packageFile: testPackagePath,
        searchFor: '"version": "\\^[0-9]*?\\.[0-9]*?\\.[0-9]*?"',
        replaceWith: '"version": "^{{version}}"',
        debug: true,
        verbose,
        quiet
      }
      update(options)
      const contents = fs.readFileSync(testFilePath)
      expect(contents.toString()).toBe(expectedContentsPkgTestFile)
    })

    test('incorrect regex, version number not updated', () => {
      const options = {
        updateFile: testFilePath,
        packageFile: testPackagePath,
        searchFor: '<straong>.*?</straong>',
        replaceWith: '<strong>{{version}}</strong>',
        verbose,
        quiet
      }
      update(options)
      const contents = fs.readFileSync(testFilePath)
      expect(contents.toString()).not.toBe(expectedContentsTestFile)
    })
  })

  describe('no updating', () => {
    test('test that dry run does not update anything', () => {
      const options = {
        updateFile: testFilePath,
        packageFile: testPackagePath,
        searchFor: '<strong>.*?</strong>',
        replaceWith: '<strong>{{version}}</strong>',
        verbose,
        quiet: true,
        dry: true
      }
      update(options)
      const contents = fs.readFileSync(testFilePath)
      expect(contents.toString()).not.toBe(expectedContentsTestFile)
    })
  })
})
