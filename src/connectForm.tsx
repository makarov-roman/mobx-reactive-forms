import * as React from 'react';
import {IControlValueAccessor} from './ControlValueAccessor'
import {FormControl} from './index'

interface IExternal {
  formControl: FormControl
}

type Injected = IControlValueAccessor
export const connectForm = <IOriginalProps extends {}>
(ChildComponent: React.ComponentType<IOriginalProps & Injected>) => {
  type resultProps = IOriginalProps & IExternal
  return class FormConnector extends React.Component<resultProps> {
    public childProps: IControlValueAccessor
    public propagateChange = (value: any) => {
      this.props.formControl.setValue(value)
    }
    public propagateTouch = () => {
      this.props.formControl.markAsTouched()
    }

    constructor(props: resultProps) {
      super(props)
      if (props.formControl == null) {
        throw new Error('FormControl is not defined')
      }
      this.childProps = {
        formControl: props.formControl,
        propagateChange: this.propagateChange,
        propagateTouch: this.propagateTouch,
      }
    }

    public render() {
      return <ChildComponent {...this.props} {...this.childProps} />
    }
  }
}
