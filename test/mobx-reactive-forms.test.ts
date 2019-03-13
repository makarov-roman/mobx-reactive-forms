/**
 * Dummy test
 */
import { FormControl } from '../src'
import { NOT_EMPTY_ERROR } from '../src/validators'

describe('Abstract control', () => {
  describe('Manual validation', () => {
    it('invalid if error was set', () => {
      const control = new FormControl('')
      control.setError({ code: NOT_EMPTY_ERROR })
      expect(control.invalid).toBeTruthy()
    })
    it('valid if only error was removed', () => {
      const control = new FormControl('')
      control.setError({ code: NOT_EMPTY_ERROR })
      control.removeError({ code: NOT_EMPTY_ERROR })
      expect(control.valid).toBeTruthy()
    })
  })
})
