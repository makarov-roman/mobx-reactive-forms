import { FormControl } from './index'

export interface IControlValueAccessor {
  /**
   * Form Control instance itself
   */
  formControl: FormControl

  /**
   * Registers a callback function that should be called when the control's value
   * changes in the UI.
   *
   * This is called by the forms API on initialization so it can update the form
   * model when values propagate from the view (view -> model).
   *
   * If you are implementing `registerOnChange` in your own value accessor, you
   * will typically want to save the given function so your class can call it
   * at the appropriate time.
   *
   */
  propagateChange(fn: any): void

  /**
   * Registers a callback function that should be called when the control receives
   * a blur event.
   *
   * This is called by the forms API on initialization so it can update the form model
   * on blur.
   *
   * If you are implementing `registerOnTouched` in your own value accessor, you
   * will typically want to save the given function so your class can call it
   * when the control should be considered blurred (a.k.a. 'touched').
   *
   */
  propagateTouch(fn: any): void

  /**
   * This function is called by the forms API when the control status changes to
   * or from 'DISABLED'. Depending on the value, it should enable or disable the
   * appropriate DOM element.
   */
}
