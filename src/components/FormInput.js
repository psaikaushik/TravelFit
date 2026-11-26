import React from 'react'
import { FormControl, Input, WarningOutlineIcon } from 'native-base'
import { Controller } from 'react-hook-form'

const FormInput = ({
  id,
  placeholder,
  control,
  validation,
  errors = {},
  type = 'text',
  variant = 'primary',
  disabled = false,
  ...rest
}) => (
  <FormControl isInvalid={!!errors[id]}>
    <Controller
      control={control}
      defaultValue=""
      render={({ field: { onChange, onBlur, value, name, ref } }) => (
        <Input
          {...rest}
          id={id}
          name={name}
          size="lg"
          ref={ref}
          variant={variant}
          type={type}
          placeholder={placeholder}
          isDisabled={disabled}
          value={value}
          onBlur={onBlur}
          onChangeText={(val) => onChange(val)}
        />
      )}
      name={id}
      rules={validation}
    />
    {!!errors[id] && (
      <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
        {errors[id].type === 'required' && 'Required field'}
        {errors[id].type !== 'required' && errors[id].message}
      </FormControl.ErrorMessage>
    )}
  </FormControl>
)

export default FormInput
