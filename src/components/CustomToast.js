import Toast from 'react-native-toast-message'
import { View, Text, TouchableOpacity } from 'react-native'
import SuccessSVG from '../assets/icons/success.svg'
import BanSVG from '../assets/icons/ban.svg'
import CloseSVG from '../assets/icons/close.svg'

const ToastConfig = {
  success: ({ title, subtitle }) => (
    <View variant="toast" backgroundColor={'#48B07E'} borderColor={'#48B07E'}>
      <View flex={1} flexDirection="row" alignItems="center">
        <View>
          <SuccessSVG />
        </View>
        <View flex={1} marginLeft={12} justifyContent="center">
          <Text variant="infoMedium" fontFamily="GeneralSans-Medium">
            {title}
          </Text>
          {subtitle && (
            <Text
              variant="infoSmall"
              textAlign="left"
              color="#F4FFF8"
              flexWrap="wrap"
            >
              {subtitle}
            </Text>
          )}
        </View>
        <View>
          <TouchableOpacity onPress={() => Toast.hide()}>
            <CloseSVG width={12} height={12} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ),
  error: ({ title, subtitle }) => (
    <View variant="toast">
      <View flex={1} flexDirection="row" alignItems="center">
        <View>
          <BanSVG />
        </View>
        <View flex={1} marginLeft={12} justifyContent="center">
          <Text variant="infoMedium" fontFamily="GeneralSans-Medium">
            {title}
          </Text>
          {subtitle && (
            <Text
              variant="infoSmall"
              textAlign="left"
              color="#F4FFF8"
              flexWrap="wrap"
            >
              {subtitle}
            </Text>
          )}
        </View>
        <View>
          <TouchableOpacity onPress={() => Toast.hide()}>
            <CloseSVG width={12} height={12} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

export default ToastConfig

export const showToast = (type, title, subtitle) => {
  Toast.show({
    type,
    props: {
      title,
      subtitle
    }
  })
}
