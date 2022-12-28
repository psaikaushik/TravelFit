const Button = {
  variants: {
    primary: {
      h: '60px',
      w: '100%',
      bg: 'primary.400',
      borderWidth: '1px',
      borderColor: 'gray.100',
      borderRadius: '12px',
      _text: {
        color: 'white',
        fontWeight: '600'
      },
      _pressed: {
        bg: 'primary.200'
      }
    }
  },
  sizes: {
    md: {
      _text: {
        fontSize: '16px'
      }
    },
    lg: {
      _text: {
        fontSize: '18px'
      }
    }
  }
}

export default Button
