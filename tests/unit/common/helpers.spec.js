const { camelCase, lowerCamelCase, pascalCamelCase, upperCamelCase } = require('@/common/helpers')

describe('helpers', () => {
  describe('lowerCamelCase AKA camelcase', () => {
    test('words separated by underscores', () => {
      const input = 'some_field_name'
      const expected = 'someFieldName'
      expect(camelCase(input)).toBe(expected)
      expect(lowerCamelCase(input)).toBe(expected)
    })

    test('words separated by dashes', () => {
      const input = 'some-field-name'
      const expected = 'someFieldName'
      expect(camelCase(input)).toBe(expected)
      expect(lowerCamelCase(input)).toBe(expected)
    })

    test('Normal sentence', () => {
      const input = 'Normal sentence case'
      const expected = 'normalSentenceCase'
      expect(camelCase(input)).toBe(expected)
      expect(lowerCamelCase(input)).toBe(expected)
    })

    test('Mixed', () => {
      const input = 'this-is-kebab-case with this_is_underscores with mixed_case-too and This is normal'
      const expected = 'thisIsKebabCaseWithThisIsUnderscoresWithMixedCaseTooAndThisIsNormal'
      expect(camelCase(input)).toBe(expected)
      expect(lowerCamelCase(input)).toBe(expected)
    })
  })

  describe('upperCamelCase AKA pascalCase', () => {
    test('words separated by underscores', () => {
      const input = 'some_field_name'
      const expected = 'SomeFieldName'
      expect(pascalCamelCase(input)).toBe(expected)
      expect(upperCamelCase(input)).toBe(expected)
    })

    test('words separated by dashes', () => {
      const input = 'some-field-name'
      const expected = 'SomeFieldName'
      expect(pascalCamelCase(input)).toBe(expected)
      expect(upperCamelCase(input)).toBe(expected)
    })

    test('Normal sentence', () => {
      const input = 'Normal sentence case'
      const expected = 'NormalSentenceCase'
      expect(pascalCamelCase(input)).toBe(expected)
      expect(upperCamelCase(input)).toBe(expected)
    })

    test('Mixed', () => {
      const input = 'this-is-kebab-case with this_is_underscores with mixed_case-too and This is normal'
      const expected = 'ThisIsKebabCaseWithThisIsUnderscoresWithMixedCaseTooAndThisIsNormal'
      expect(pascalCamelCase(input)).toBe(expected)
      expect(upperCamelCase(input)).toBe(expected)
    })
  })
})
