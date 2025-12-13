import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm, FormProvider } from 'react-hook-form'
import { TextFormField } from '../form/fields/text-form-field'
import { TextareaFormField } from '../form/fields/textarea-form-field'
import { NumberFormField } from '../form/fields/number-form-field'

// Test form values interface
interface TestFormValues {
  textField: string
  emailField: string
  numberField: number
  textareaField: string
}

describe('TextFormField', () => {
  function renderTextFormField(props: { label?: string; placeholder?: string; disabled?: boolean; type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' } = {}) {
    const TestComponent = () => {
      const form = useForm<TestFormValues>({
        defaultValues: { textField: '' },
      })
      return (
        <FormProvider {...form}>
          <TextFormField
            form={form}
            name="textField"
            label={props.label ?? 'Test Label'}
            placeholder={props.placeholder}
            disabled={props.disabled}
            type={props.type}
          />
        </FormProvider>
      )
    }
    return render(<TestComponent />)
  }

  it('renders with label', () => {
    renderTextFormField({ label: 'Name' })
    expect(screen.getByText('Name')).toBeInTheDocument()
  })

  it('renders with placeholder', () => {
    renderTextFormField({ placeholder: 'Enter name' })
    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument()
  })

  it('accepts text input', async () => {
    renderTextFormField()
    const input = screen.getByRole('textbox')

    await userEvent.type(input, 'Hello World')

    expect(input).toHaveValue('Hello World')
  })

  it('can be disabled', () => {
    renderTextFormField({ disabled: true })
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('renders as email type', () => {
    renderTextFormField({ type: 'email' })
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')
  })

  it('renders as password type', () => {
    const TestComponent = () => {
      const form = useForm<TestFormValues>({
        defaultValues: { textField: '' },
      })
      return (
        <FormProvider {...form}>
          <TextFormField form={form} name="textField" label="Password" type="password" />
        </FormProvider>
      )
    }
    render(<TestComponent />)
    // Password fields don't have a role, query by label
    const input = screen.getByLabelText('Password')
    expect(input).toHaveAttribute('type', 'password')
  })
})

describe('TextareaFormField', () => {
  function renderTextareaFormField(props: { label?: string; placeholder?: string; disabled?: boolean; rows?: number } = {}) {
    const TestComponent = () => {
      const form = useForm<TestFormValues>({
        defaultValues: { textareaField: '' },
      })
      return (
        <FormProvider {...form}>
          <TextareaFormField
            form={form}
            name="textareaField"
            label={props.label ?? 'Description'}
            placeholder={props.placeholder}
            disabled={props.disabled}
            rows={props.rows}
          />
        </FormProvider>
      )
    }
    return render(<TestComponent />)
  }

  it('renders with label', () => {
    renderTextareaFormField()
    expect(screen.getByText('Description')).toBeInTheDocument()
  })

  it('renders with placeholder', () => {
    renderTextareaFormField({ placeholder: 'Enter description' })
    expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument()
  })

  it('accepts multiline text input', async () => {
    renderTextareaFormField()
    const textarea = screen.getByRole('textbox')

    await userEvent.type(textarea, 'Line 1{enter}Line 2')

    expect(textarea).toHaveValue('Line 1\nLine 2')
  })

  it('can be disabled', () => {
    renderTextareaFormField({ disabled: true })
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('renders with custom rows', () => {
    renderTextareaFormField({ rows: 5 })
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '5')
  })

  it('has default rows of 3', () => {
    renderTextareaFormField()
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '3')
  })
})

describe('NumberFormField', () => {
  function renderNumberFormField(props: { label?: string; disabled?: boolean; min?: number; max?: number; step?: string } = {}) {
    const TestComponent = () => {
      const form = useForm<TestFormValues>({
        defaultValues: { numberField: 0 },
      })
      return (
        <FormProvider {...form}>
          <NumberFormField
            form={form}
            name="numberField"
            label={props.label ?? 'Quantity'}
            disabled={props.disabled}
            min={props.min}
            max={props.max}
            step={props.step}
          />
        </FormProvider>
      )
    }
    return render(<TestComponent />)
  }

  it('renders with label', () => {
    renderNumberFormField()
    expect(screen.getByText('Quantity')).toBeInTheDocument()
  })

  it('renders as number input type', () => {
    renderNumberFormField()
    expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number')
  })

  it('accepts number input', async () => {
    renderNumberFormField()
    const input = screen.getByRole('spinbutton')

    fireEvent.change(input, { target: { value: '42' } })

    expect(input).toHaveValue(42)
  })

  it('can be disabled', () => {
    renderNumberFormField({ disabled: true })
    expect(screen.getByRole('spinbutton')).toBeDisabled()
  })

  it('respects min attribute', () => {
    renderNumberFormField({ min: 0 })
    expect(screen.getByRole('spinbutton')).toHaveAttribute('min', '0')
  })

  it('respects max attribute', () => {
    renderNumberFormField({ max: 100 })
    expect(screen.getByRole('spinbutton')).toHaveAttribute('max', '100')
  })

  it('respects step attribute', () => {
    renderNumberFormField({ step: '0.1' })
    expect(screen.getByRole('spinbutton')).toHaveAttribute('step', '0.1')
  })
})
