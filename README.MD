 # Mobx Reactive Forms [![Build Status](https://travis-ci.org/makarov-roman/mobx-reactive-forms.svg?branch=master)](https://travis-ci.org/makarov-roman/mobx-reactive-forms)
 
 _Implementation of Angular Reactive forms for mobx applications_
 
 # Installation 
 `npm i mobx-reactive-forms`
 # Usage
 
 ## IControlValueAccessor
 Everything you need to do - is to wrap your input component with connectForm HOC and pass propagateChange and propagateTouch methods
 
 ```typescript jsx
 import * as React from 'react'
 import {observer} from 'mobx-react'
 import {IControlValueAccessor, connectForm} from 'mobx-reactive-form'
 
@observer
class ReactiveInputComponent extends React.Component<IControlValueAccessor> {
  public onChange = (event: SyntheticEvent<HTMLInputElement>) => {
    this.props.propagateChange(event.currentTarget.value)
  }

  public render() {
    const control: FormControl = this.props.formControl;
    return <input
      onChange={this.onChange}
      onBlur={this.props.propagateTouch}
      disabled={control.disabled}
      value={control.value}
    />
  }
}

export const ReactiveInput = connectForm(ReactiveInputComponent)
```

## Form
```typescript jsx
@observer
class ExampleForm extends React.Component {
  loginForm = new FormGroup({
    email: new FormControl('', [isValidEmail]),
    password: new FormControl('', [notEmpty])
  }) 
  render() {
    return <form>
      <ReactiveInput formControl={this.loginForm.get('email')} />
      <ReactiveInput formControl={this.loginForm.get('password')} />
    </form>
  }
}
```

## Not Implemented yet
1) AsyncValidators
2) FormArray

## Won't implement 
1) FormBuilder
