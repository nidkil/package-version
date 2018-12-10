const fs = require('fs')
const path = require('path')

function getLineFromFile (filePath, lineNumber) {
  if (!fileExists(filePath)) {
    throw new Error('File does not exists: ' + filePath)
  }
  const data = fs.readFileSync(filePath).toString().split('\n')
  if (lineNumber <= data.length) {
    return data[lineNumber]
  }
  return ''
}

function addLineToFile (filePath, line, lineNumber = 0, emptyFile = false) {
  if (!fileExists(filePath)) {
    throw new Error('File does not exists: ' + filePath)
  }
  const data = emptyFile ? [] : fs.readFileSync(filePath).toString().split('\n')
  data.splice(lineNumber, 0, line)
  const content = data.join('\n')
  try {
    fs.writeFileSync(filePath, content)
    return true
  } catch (err) {
    console.error(err.message, err.stack)
    return false
  }
}

function createEmptyFile (filePath) {
  if (fileExists(filePath)) {
    throw new Error('File exists')
  }
  let fh = null
  try {
    fh = fs.openSync(filePath, 'w')
  } catch (err) {
    console.error('Error creating empty file:', filePath)
  } finally {
    if (fh) fs.closeSync(fh)
  }
}

function createDirectory (dirPath) {
  if (directoryExists(dirPath)) {
    throw new Error('Directory exists')
  } else {
    fs.mkdirSync(dirPath)
  }
}

function deleteDirectory (dirPath) {
  if (directoryExists(dirPath)) {
    rmdirRecursive(dirPath)
    return true
  }
  return false
}

function deleteFile (filePath) {
  if (fileExists(filePath)) {
    fs.unlinkSync(filePath)
    return true
  }
  return false
}

function directoryExists (dir) {
  return (fs.existsSync(dir) && fs.lstatSync(dir).isDirectory())
}

function fileExists (filePath) {
  return (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile())
}

// eslint-disable-next-line no-unused-vars
async function listDir (dirPath) {
  let result = []
  fs.readdirSync(dirPath).forEach(function (item) {
    const entry = path.join(dirPath, item)
    const stats = fs.statSync(entry)
    result.push({ entry, size: stats.size, type: stats.isDirectory() ? 'directory' : 'file' })
  })
  return result
}

/**
 * Remove directory even if it contains files or other directories. Comparable to Unix command 'rm -rf'.
 * @param {string} dirPath - Path to directory to remove including any directories or files it contains
 */
function rmdirRecursive (dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach(function (entry) {
      const curPath = path.join(dirPath, entry)
      if (fs.lstatSync(curPath).isDirectory()) {
        rmdirRecursive(curPath)
      } else {
        fs.unlinkSync(curPath)
      }
    })
    fs.rmdirSync(dirPath)
  }
}

module.exports = {
  addLineToFile,
  createDirectory,
  createEmptyFile,
  deleteDirectory,
  deleteFile,
  directoryExists,
  fileExists,
  getLineFromFile,
  rmdirRecursive
}
