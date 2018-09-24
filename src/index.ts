import { action, computed, IObservableArray, observable } from 'mobx'

export enum ControlStatusEnum {
  VALID = 'VALID',
  INVALID = 'INVALID',
  DISABLED = 'DISABLED'
}

export type ValidatorFn<FC> = (FormControl: FC) => null | IValidationError

export interface IValidationError {
  code: string
}

export abstract class AbstractControl {
  constructor(validators: ValidatorFn<AbstractControl>[]) {
    if (!Array.isArray(validators)) {
      throw new TypeError(`Expected array of validators. Got ${typeof validators}`)
    }
    this.validators = observable(validators)
  }

  @observable
  public value: any

  /**
   * The validation status of the control. There are four possible
   * validation statuses:
   *
   * * **VALID**:  control has passed all validation checks
   * * **INVALID**: control has failed at least one validation check
   * * **DISABLED**: control is exempt from validation checks
   *
   * These statuses are mutually exclusive, so a control cannot be
   * both valid AND invalid or invalid AND disabled.
   */
  @observable
  public status: ControlStatusEnum = ControlStatusEnum.VALID

  /**
   * The parent control.
   */
  @observable
  public parent: FormGroup | null = null

  /**
   * Returns any errors generated by failing validation. If there
   * are no errors, it will return null.
   */
  @observable
  public errors: { [key: string]: boolean } | null = null

  public validators: IObservableArray<ValidatorFn<any>> | null

  /**
   * A control is marked `touched` once the user has triggered
   * a `blur` event on it.
   */
  @observable
  public touched: boolean = false

  /**
   * A control is `untouched` if the user has not yet triggered
   * a `blur` event on it.
   */
  @computed
  public get untouched(): boolean {
    return !this.touched
  }

  /**
   * Marks the control as `touched`.
   *
   * This will also mark all direct ancestors as `touched` to maintain
   * the model.
   */
  @action
  public markAsTouched(onlySelf?: boolean): void {
    this.touched = true

    if (this.parent && !onlySelf) {
      this.parent._updateTouched(onlySelf)
    }
  }

  /**
   * Marks the control as `untouched`.
   *
   * If the control has any children, it will also mark all children as `untouched`
   * to maintain the model, and re-calculate the `touched` status of all parent
   * controls.
   */
  @action
  public markAsUntouched(onlySelf?: boolean): void {
    this.touched = false

    this._forEachChild((control: AbstractControl) => {
      control.markAsUntouched(true)
    })

    if (this.parent && !onlySelf) {
      this.parent._updateTouched(onlySelf)
    }
  }

  /**
   * A control is marked `pristine` unless the user has triggered
   * a `change` event on it.
   */
  @observable
  public pristine: boolean = true

  /**
   * A control is marked `pristine` once the user has triggered
   * a `change` event on it.
   */
  @computed
  get dirty(): boolean {
    return !this.pristine
  }

  /**
   * Marks the control as `touched`.
   *
   * This will also mark all direct ancestors as `touched` to maintain
   * the model.
   */
  @action
  public markAsPristine(onlySelf?: boolean): void {
    this.pristine = true

    this._forEachChild((control: AbstractControl) => {
      control.markAsPristine(true)
    })

    if (this.parent && !onlySelf) {
      this.parent._updateTouched(onlySelf)
    }
  }

  /**
   * Marks the control as `untouched`.
   *
   * If the control has any children, it will also mark all children as `untouched`
   * to maintain the model, and re-calculate the `touched` status of all parent
   * controls.
   */
  @action
  public markAsDirty(onlySelf?: boolean): void {
    this.pristine = false

    if (this.parent && !onlySelf) {
      this.parent.markAsDirty(onlySelf)
    }
  }

  /**
   * A control is `valid` when its `status === VALID`.
   *
   * In order to have this status, the control must have passed all its
   * validation checks.
   */

  @computed
  public get valid(): boolean {
    return this.status === ControlStatusEnum.VALID
  }

  /**
   * A control is `invalid` when its `status === INVALID`.
   *
   * In order to have this status, the control must have failed
   * at least one of its validation checks.
   */
  @computed
  public get invalid() {
    return this.status === ControlStatusEnum.INVALID
  }

  /**
   * A control is `disabled` when its `status === DISABLED`.
   *
   * Disabled controls are exempt from validation checks and
   * are not included in the aggregate value of their ancestor
   * controls.
   */
  @computed
  public get disabled() {
    return this.status === ControlStatusEnum.DISABLED
  }

  /**
   * A control is `enabled` as long as its `status !== DISABLED`.
   *
   * In other words, it has a status of `VALID`, `INVALID`, or
   * `PENDING`.
   */
  @computed
  public get enabled() {
    return this.status !== ControlStatusEnum.DISABLED
  }

  /**
   * Sets errors on a form control.
   *
   * This is used when validations are run manually by the user, rather than automatically.
   *
   */
  @action
  public setError(error: IValidationError) {
    if (!this.errors) {
      this.errors = {}
      this.errors[error.code] = true
    } else {
      this.errors[error.code] = true
    }
    this._updateStatus()
  }

  /**
   * Remove errors on a form control.
   *
   * This is used when validations are run manually by the user, rather than automatically.
   *
   */
  @action
  public removeError(error: IValidationError) {
    if (!this.errors && !this.errors[error.code]) return
    if (Object.keys(this.errors).length !== 1) {
      delete this.errors[error.code]
    } else {
      this.errors = null
    }
    this._updateStatus()
  }

  /**
   * Sets the synchronous validators that are active on this control.
   */
  @action
  public setValidators(validators: ValidatorFn<FormControl | FormGroup>[]) {
    if (this.validators) {
      this.validators.concat(validators)
    } else {
      this.validators = observable(validators)
    }
  }

  /**
   * Empties out the sync validator list.
   */
  @action
  public clearValidators(validatorsToClear?: ValidatorFn<FormControl | FormGroup>[]) {
    if (!this.validators) {
      return
    }
    if (Array.isArray(validatorsToClear)) {
      validatorsToClear.forEach((validator: ValidatorFn<FormControl | FormGroup>) => {
        ;(this.validators as IObservableArray<ValidatorFn<FormControl | FormGroup>>).remove(
          validator
        )
      })
    } else {
      this.validators = observable([])
    }
  }

  /**
   * Disables the control. This means the control will be exempt from validation checks and
   * excluded from the aggregate value of any parent. Its status is `DISABLED`.
   *
   * If the control has children, all children will be disabled to maintain the model.
   */
  @action
  public disable(onlySelf = false) {
    this.status = ControlStatusEnum.DISABLED
    this.errors = null
    this._forEachChild((control: AbstractControl) => {
      control.disable(true)
    })
    this._updateValue()
    this._updateAncestors(onlySelf)
  }

  /**
   * Enables the control. This means the control will be included in validation checks and
   * the aggregate value of its parent. Its status is re-calculated based on its value and
   * its validators.
   *
   * If the control has children, all children will be enabled.
   */
  @action
  public enable(onlySelf = false) {
    this.status = ControlStatusEnum.VALID
    this.errors = null
    this._forEachChild((control: AbstractControl) => {
      control.enable(true)
    })
    this.updateValueAndValidity(true)
    this._updateAncestors(onlySelf)
  }

  /**
   * Re-calculates the value and validation status of the control.
   *
   * By default, it will also update the value and validity of its ancestors.
   */
  @action
  public updateValueAndValidity(onlySelf = false) {
    this._setInitialStatus()
    this._updateValue()

    if (this.enabled) {
      const validationResult = this._runValidator()
      this.errors = validationResult ? validationResult : null
      this._updateStatus(true)
    }

    if (this.parent && !onlySelf) {
      this.parent.updateValueAndValidity()
    }
  }

  /**
   * Retrieves a child control given the control's name or path.
   *
   * Paths can be passed in as an array or a string delimited by a dot.
   *
   * To get a control nested within a `person` sub-group:
   *
   * * `this.form.get('person.name');`
   *
   * -OR-
   *
   * * `this.form.get(['person', 'name']);`
   */
  public get(path: Array<string | number> | string): AbstractControl | null {
    return _find(this, path, '.')
  }

  /**
   * Returns error data if the control with the given path has the error specified. Otherwise
   * returns null or undefined.
   *
   * If no path is given, it checks for the error on the present control.
   */
  public getError(errorCode: string, path?: Array<string | number> | string): any {
    const control = path ? this.get(path) : this
    return control && control.errors ? control.errors[errorCode] : null
  }

  /**
   * Returns true if the control with the given path has the error specified. Otherwise
   * returns false.
   *
   * If no path is given, it checks for the error on the present control.
   */
  public hasError(errorCode: string, path?: Array<string | number> | string): boolean {
    return !!this.getError(errorCode, path)
  }

  public shouldShowError(errorCode: string, path?: Array<string | number> | string) {
    const control = path ? this.get(path) : this
    return control && control.touched && control.hasError(errorCode)
  }

  @action
  public setParent(parent: FormGroup): void {
    this.parent = parent
  }

  /**
   * Retrieves the top-level ancestor of this control.
   */
  get root(): AbstractControl {
    let x: AbstractControl = this

    while (x.parent) {
      x = x.parent
    }

    return x
  }

  /** @internal */
  _updateStatus(onlySelf?: boolean): void {
    this.status = this._calculateStatus()

    if (this.parent && !onlySelf) {
      this.parent._updateStatus()
    }
  }

  /** @internal */
  public _updateTouched(onlySelf?: boolean): void {
    this.touched = this._anyControlsTouched()

    if (this.parent && !onlySelf) {
      this.parent._updateTouched()
    }
  }

  /** @internal */
  public _anyControlsTouched(): boolean {
    return this._anyControls((control: AbstractControl) => control.touched)
  }

  /** @internal */
  public _anyControlsDirty(): boolean {
    return this._anyControls((control: AbstractControl) => control.dirty)
  }

  /** @internal */
  public _updatePristine(opts: { onlySelf?: boolean } = {}): void {
    this.pristine = !this._anyControlsDirty()

    if (this.parent && !opts.onlySelf) {
      this.parent._updatePristine(opts)
    }
  }

  /**
   * Sets the value of the control. Abstract method (implemented in sub-classes).
   */
  public abstract setValue(value: any, onlySelf?: boolean): void

  /**
   * Patches the value of the control. Abstract method (implemented in sub-classes).
   */
  public abstract patchValue(value: any, onlySelf?: boolean): void

  /** @internal */
  protected abstract _anyControls(condition: (control: AbstractControl) => boolean): boolean

  /** @internal */
  protected abstract _allControlsDisabled(): boolean

  /** @internal */
  protected abstract _updateValue(): void

  /** @internal */
  protected abstract _forEachChild(cb: (v: any, k: string) => void): void

  private _runValidator(): { [key: string]: boolean } | null {
    if (!Array.isArray(this.validators) || this.validators.length === 0) {
      return null
    }
    const validationsResult = this.validators.reduce(
      (errors: { [key: string]: boolean }, validator: ValidatorFn<AbstractControl>) => {
        if (typeof validator !== 'function') {
          throw new TypeError('Validator expected to be function')
        }
        const result = validator(this)
        if (result !== null && typeof result.code !== 'undefined') {
          errors[result.code] = true
        }
        return errors
      },
      {}
    )

    return Object.keys(validationsResult).length ? validationsResult : null
  }

  private _setInitialStatus() {
    ;(this as { status: string }).status = this._allControlsDisabled()
      ? ControlStatusEnum.DISABLED
      : ControlStatusEnum.VALID
  }

  private _updateAncestors(onlySelf = false) {
    if (this.parent) {
      this.parent.updateValueAndValidity(onlySelf)
    }
  }

  private _calculateStatus(): ControlStatusEnum {
    if (this._allControlsDisabled()) return ControlStatusEnum.DISABLED
    if (this.errors) return ControlStatusEnum.INVALID
    if (this._anyControlsHaveStatus(ControlStatusEnum.INVALID)) return ControlStatusEnum.INVALID
    return ControlStatusEnum.VALID
  }

  private _anyControlsHaveStatus(status: string): boolean {
    return this._anyControls((control: AbstractControl) => control.status === status)
  }
}

export class FormControl extends AbstractControl {
  constructor(initialValue?: any, validators: ValidatorFn<FormControl>[] = []) {
    super(validators)
    if (typeof initialValue !== 'undefined') {
      this.setValue(initialValue)
    }
    this.updateValueAndValidity(true)
  }

  /**
   * Set the value of the form control to `value`.
   *
   * If `onlySelf` is `true`, this change will only affect the validation of this `FormControl`
   * and not its parent component. This defaults to false.
   */
  @action
  public setValue(value: any, onlySelf = false): void {
    ;(this as { value: any }).value = value
    this.updateValueAndValidity(onlySelf)
  }

  /**
   * Patches the value of a control.
   *
   * This function is functionally the same as {@link FormControl#setValue setValue} at this level.
   * It exists for symmetry with {@link FormGroup#patchValue patchValue} on `FormGroups` and
   * `FormArrays`, where it does behave differently.
   */
  public patchValue(value: any, onlySelf = false): void {
    this.setValue(value, onlySelf)
  }

  /** @internal */
  protected _forEachChild(cb: any) {}

  /** @internal */
  protected _updateValue() {}

  /** @internal */
  protected _anyControls(condition: (control: AbstractControl) => boolean): boolean {
    return false
  }

  /** @internal */
  protected _allControlsDisabled(): boolean {
    return this.disabled
  }
}

interface IFormControls {
  [key: string]: AbstractControl
}

export class FormGroup extends AbstractControl {
  constructor(public controls: IFormControls = {}, validators: ValidatorFn<FormGroup>[] = []) {
    super(validators)
    this.updateValueAndValidity(true)
    this._setUpControls()
  }

  /**
   * Registers a control with the group's list of controls.
   *
   * This method does not update the value or validity of the control, so for most cases you'll want
   * to use {@link FormGroup#addControl addControl} instead.
   */

  @action
  public registerControl(name: string, control: AbstractControl): AbstractControl {
    if (this.controls[name]) return this.controls[name]
    this.controls[name] = control
    control.setParent(this)
    return control
  }

  /**
   * Add a control to this group.
   */
  @action
  public addControl(name: string, control: AbstractControl): void {
    this.registerControl(name, control)
    this.updateValueAndValidity()
  }

  /**
   * Replace an existing control.
   */
  @action
  public setControl(name: string, control: AbstractControl): void {
    delete this.controls[name]
    if (control) this.registerControl(name, control)
    this.updateValueAndValidity()
  }

  /**
   * Remove a control from this group.
   */
  @action
  public removeControl(name: string): void {
    delete this.controls[name]
    this.updateValueAndValidity()
  }

  /**
   * Check whether there is an enabled control with the given name in the group.
   *
   * It will return false for disabled controls. If you'd like to check for existence in the group
   * only, use {@link AbstractControl#get get} instead.
   */
  public contains(controlName: string): boolean {
    return this.controls.hasOwnProperty(controlName) && this.controls[controlName].enabled
  }

  /**
   *  Sets the value of the `FormGroup`. It accepts an object that matches
   *  the structure of the group, with control names as keys.
   *
   *  ### Example
   *
   *  ```
   *  const form = new FormGroup({
   *     first: new FormControl(),
   *     last: new FormControl()
   *  })
   *  console.log(form.value)   // {first: null, last: null}
   *
   *  form.setValue({first: 'Nancy', last: 'Drew'})
   *  console.log(form.value)   // {first: 'Nancy', last: 'Drew'}
   *
   *  ```
   * @throws This method performs strict checks, so it will throw an error if you try
   * to set the value of a control that doesn't exist or if you exclude the
   * value of a control.
   */
  @action
  public setValue(value: { [key: string]: any }): void {
    this._checkAllValuesPresent(value)
    Object.keys(value).forEach(name => {
      this._throwIfControlMissing(name)
      this.controls[name].setValue(value[name])
    })
    this.updateValueAndValidity()
  }

  /**
   *  Patches the value of the `FormGroup`. It accepts an object with control
   *  names as keys, and will do its best to match the values to the correct controls
   *  in the group.
   *
   *  It accepts both super-sets and sub-sets of the group without throwing an error.
   *
   *  ### Example
   *
   *  ```
   *  const form = new FormGroup({
   *     first: new FormControl(),
   *     last: new FormControl()
   *  })
   *  console.log(form.value)   // {first: null, last: null}
   *
   *  form.patchValue({first: 'Nancy'})
   *  console.log(form.value)   // {first: 'Nancy', last: null}
   *
   *  ```
   */
  public patchValue(value: { [key: string]: any }): void {
    Object.keys(value).forEach(name => {
      if (this.controls[name]) {
        this.controls[name].patchValue(value[name])
      }
    })
    this.updateValueAndValidity()
  }

  protected _throwIfControlMissing(name: string): void {
    if (!Object.keys(this.controls).length) {
      throw new Error(`
        There are no form controls registered with this group yet.`)
    }
    if (!this.controls[name]) {
      throw new Error(`Cannot find form control with name: ${name}.`)
    }
  }

  /** @internal */
  protected _setUpControls(): void {
    this._forEachChild((control: AbstractControl) => {
      control.setParent(this)
    })
  }

  /** @internal */
  protected _updateValue(): void {
    ;(this as { value: any }).value = this._reduceValue()
  }

  /** @internal */
  protected _anyControls(condition: (control: AbstractControl) => boolean): boolean {
    let res = false
    this._forEachChild((control: AbstractControl, name: string) => {
      res = res || (this.contains(name) && condition(control))
    })
    return res
  }

  /** @internal */
  protected _reduceValue() {
    return this._reduceChildren(
      {},
      (acc: { [k: string]: AbstractControl }, control: AbstractControl, name: string) => {
        if (control.enabled || this.disabled) {
          acc[name] = control.value
        }
        return acc
      }
    )
  }

  /** @internal */
  protected _reduceChildren(initValue: any, fn: any) {
    let res = initValue
    this._forEachChild((control: AbstractControl, name: string) => {
      res = fn(res, control, name)
    })
    return res
  }

  /** @internal */
  protected _allControlsDisabled(): boolean {
    for (const controlName of Object.keys(this.controls)) {
      if (this.controls[controlName].enabled) {
        return false
      }
    }
    return Object.keys(this.controls).length > 0 || this.disabled
  }

  /** @internal */
  protected _checkAllValuesPresent(value: any): void {
    this._forEachChild((control: AbstractControl, name: string) => {
      if (value[name] === undefined) {
        throw new Error(`Must supply a value for form control with name: '${name}'.`)
      }
    })
  }

  /** @internal */
  protected _forEachChild(cb: (v: any, k: string) => void): void {
    Object.keys(this.controls).forEach(k => cb(this.controls[k], k))
  }
}

function _find(control: AbstractControl, path: Array<string | number> | string, delimiter: string) {
  if (path == null) return null

  if (!(path instanceof Array)) {
    path = (path as string).split(delimiter)
  }
  if (path instanceof Array && path.length === 0) return null

  return (path as Array<string | number>).reduce((v: AbstractControl, name) => {
    if (v instanceof FormGroup) {
      return v.controls[name] || null
    }

    // if (v instanceof FormArray) {
    //   return v.at(<number>name) || null;
    // }

    return null
  }, control)
}
