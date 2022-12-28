import { extendTheme } from 'native-base'
import colors from './colors'
import Text from './text'
import Input from './input'
import Button from './button'

const theme = {
  colors,
  components: {
    Text,
    Input,
    Button
  }
}

export default extendTheme(theme)
