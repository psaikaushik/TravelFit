const Input = {
  variants: {
    primary: {
      h: '60px',
      w: '100%',
      bg: 'white',
      borderWidth: '1px',
      borderColor: 'gray.100',
      borderRadius: '12px',
      focusOutlineColor: 'primary.400',
      _focus: {
        borderColor: 'gray.300'
      }
    },
    input: {
      h: '60px',
      w: '100%',
      bg: 'gray.50',
      borderWidth: '1px',
      borderColor: 'gray.400',
      borderRadius: '12px',
      focusOutlineColor: 'primary.400',
      _focus: {
        bg: 'gray.100',
        borderColor: 'gray.600'
      }
    }
  }
}

export default Input
