import React from 'react'
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { KeyboardAwareView } from 'react-native-keyboard-aware-view'
import { Dimensions, ScrollView } from 'react-native'
import ArrowLeftIcon from '../assets/icons/arrow-left-icon.svg'
import CloseIcon from '../assets/icons/close.svg'
import { useNavigation } from '@react-navigation/native'

const BaseScreen = ({
  children,
  leftBtn,
  closeBtn,
  backBtn,
  title,
  subtitle,
  primaryBtn,
  secondaryBtn,
  footer,
  closeBtnAction,
  contentProps = {}
}) => {
  const { goBack } = useNavigation()
  const { height } = Dimensions.get('window')
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F6F6' }}>
      <KeyboardAwareView useNativeDriver={true} animated={true}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ minHeight: height - 80 }}
          keyboardShouldPersistTaps={'handled'}
          automaticallyAdjustContentInsets={false}
          scrollEventThrottle={200}
        >
          <View style={{ flex: 1 }}>
            <View variant="header">
              {leftBtn}
              {(!!closeBtn || !!backBtn) && (
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => {
                    if (closeBtnAction) closeBtnAction()
                    else goBack()
                  }}
                >
                  {!!closeBtn ? <CloseIcon /> : <ArrowLeftIcon stroke="#000" />}
                </TouchableOpacity>
              )}
              {(!!closeBtn || !!backBtn) && (
                <View style={styles.headExtraView} />
              )}
            </View>
            <View style={styles.content} {...contentProps}>
              {!!title && (
                <Text style={styles.H1} marginTop={40}>
                  {title}
                </Text>
              )}
              {!!subtitle && <Text variant="H3">{subtitle}</Text>}
              {children}
            </View>
            <View style={styles.footer}>
              <View>{primaryBtn}</View>
              <View>{secondaryBtn}</View>
              {footer}
            </View>
          </View>
        </ScrollView>
      </KeyboardAwareView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1
  },
  headExtraView: {
    width: 40
  },
  backBtn: {
    width: 44,
    height: 44
  },
  H1: {
    textTransform: 'capitalize',
    fontSize: 32,
    lineHeight: 32,
    fontWeight: '800',
    marginHorizontal: 20,
    marginBottom: 20,
    color: 'white'
  },
  footer: {
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center'
  }
})

export default BaseScreen
