import { AbstractControl, FormControl, FormGroup, IValidationError, ValidatorFn } from './index'

export const NOT_EMPTY_ERROR = 'EmptyError'
export const notEmpty: ValidatorFn<FormControl> = (control: AbstractControl) => {
  if (control.value == null || (typeof control.value === 'string' && control.value.length === 0)) {
    return {
      code: NOT_EMPTY_ERROR
    }
  }
  return null
}

export const ALL_CHILDREN_SAME_VALUE_ERROR = 'All child values must be same'
export const allChildControlsSameValue: ValidatorFn<FormGroup> = (
  group
): null | IValidationError => {
  const childrenKeys = Object.keys(group.controls)
  const children = childrenKeys.map(key => group.controls[key])
  if (children.some(child => child.invalid)) {
    return null
  }
  const uniqueValues = new Set(children.map(control => control.value))
  return uniqueValues.size === 1 ? null : { code: ALL_CHILDREN_SAME_VALUE_ERROR }
}

export const INVALIDATE_PLACEHOLDER_ERROR = 'Placeholder is invalid value'
export const invalidatePlaceholderValue: (
  placeholder: any
) => ValidatorFn<FormControl> = placeholderValue => control =>
  control.value === placeholderValue ? { code: INVALIDATE_PLACEHOLDER_ERROR } : null

export const EXPECTED_DIFFERENT_VALUE_ERROR = 'Different value was expected'
export const shouldMatchValue: (
  valueToMatch: any
) => ValidatorFn<FormControl> = valueToMatch => control => {
  return control.value !== valueToMatch ? { code: EXPECTED_DIFFERENT_VALUE_ERROR } : null
}

export const REGEXP_MATCH_ERROR = 'RegExp failed'
export const shouldMatchRegexp: (
  regexp: RegExp
) => ValidatorFn<FormControl> = regexp => control => {
  return regexp.test(control.value) ? null : { code: REGEXP_MATCH_ERROR }
}

const EMAIL_REGEXP = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
export const INVALID_EMAIL_ERROR = 'Invalid email'
export const isValidEmail: ValidatorFn<FormControl> = control => {
  return EMAIL_REGEXP.test(control.value) ? null : { code: INVALID_EMAIL_ERROR }
}

const PHONE_REGEXP = /^\+[1-9]\d{9,15}$/
export const INVALID_PHONE_ERROR = 'Invalid Phone'
export const isValidPhone: ValidatorFn<FormControl> = control => {
  return PHONE_REGEXP.test(control.value) ? null : { code: INVALID_PHONE_ERROR }
}
const TANGEM_CODE_REGEXP = /^[a-zA-Z0-9_-]{16}$/
export const INVALID_TANGEM_CODE_ERROR = 'Invalid Tangem Code'
export const isValidTangemCode: ValidatorFn<FormControl> = control => {
  return TANGEM_CODE_REGEXP.test(control.value) ? null : { code: INVALID_TANGEM_CODE_ERROR }
}

const POSITIVE_INTEGERS_REGEXP = /^[1-9][0-9]*$/
export const INVALID_POSITIVE_INTEGERS_ERROR = 'Invalid Value'
export const positiveIntegers: ValidatorFn<FormControl> = control => {
  return POSITIVE_INTEGERS_REGEXP.test(control.value)
    ? null
    : { code: INVALID_POSITIVE_INTEGERS_ERROR }
}

const POSITIVE_NUMBERS_REGEXP = /^(0*[1-9][0-9]*(\.[0-9]+)?|0+\.[0-9]*[1-9][0-9]*)$/
export const INVALID_POSITIVE_NUMBERS_ERROR = 'Invalid Value'
export const positiveNumbers: ValidatorFn<FormControl> = control => {
  return POSITIVE_NUMBERS_REGEXP.test(control.value)
    ? null
    : { code: INVALID_POSITIVE_NUMBERS_ERROR }
}
