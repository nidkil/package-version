// Upper camel case AKA Pascal case means the initial word starts with uppercase letter and each subsequent word or
// abbreviation in the middle of the phrase begins with a uppercase letter, with no intervening spaces or punctuation,
// e.g. 'upper camel case' becomes 'UpperCamelCase'.
function upperCamelCase(str) {
  str = lowerCamelCase(str)
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Alias
const pascalCamelCase = upperCamelCase

// Lower camel case AKA camel case means the initial word starts with lowercase letter and each subsequent word or
// abbreviation in the middle of the phrase begins with a uppercase letter, with no intervening spaces or punctuation,
// e.g. 'camel case' becomes 'camelCase'.
function lowerCamelCase(str) {
  return str.replace(/^([A-Z])|[\s-_]+(\w)/g, function(match, p1, p2) {
    if (p2) return p2.toUpperCase();
    return p1.toLowerCase();
  })
}

// Alias
const camelCase = lowerCamelCase

module.exports = {
  camelCase,
  lowerCamelCase,
  pascalCamelCase,
  upperCamelCase
}
