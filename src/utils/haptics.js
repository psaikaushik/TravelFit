import { Platform } from 'react-native'

// Lightweight haptic feedback utility
// Uses the built-in UIImpactFeedbackGenerator on iOS via react-native
// Falls back to no-op when unavailable

let ReactNativeHapticFeedback = null
try {
  // react-native-haptic-feedback is optional
  ReactNativeHapticFeedback = require('react-native-haptic-feedback').default
} catch (e) {
  // Not installed - use fallback
}

const trigger = (type = 'impactLight') => {
  if (Platform.OS !== 'ios') return
  try {
    if (ReactNativeHapticFeedback) {
      ReactNativeHapticFeedback.trigger(type, {
        enableVibrateFallback: false,
        ignoreAndroidSystemSettings: false
      })
    }
  } catch (e) {
    // silently fail
  }
}

const haptics = {
  light: () => trigger('impactLight'),
  medium: () => trigger('impactMedium'),
  heavy: () => trigger('impactHeavy'),
  success: () => trigger('notificationSuccess'),
  warning: () => trigger('notificationWarning'),
  error: () => trigger('notificationError'),
  selection: () => trigger('selection')
}

export default haptics
