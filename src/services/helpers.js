import AppleHealthKit from 'react-native-health'

export const checkAppleHealth = () =>
  new Promise((resolve, reject) => {
    try {
      AppleHealthKit.getStepCount(
        {
          startDate: new Date(2021, 1, 1).toISOString()
        },
        (callbackError, results) => {
          if (callbackError) {
            console.log('checkAppleHealth Error', callbackError)
            resolve(null)
          } else {
            console.log('checkAppleHealth', results)
            resolve(results)
          }
        }
      )
    } catch (e) {
      console.log('checkAppleHealth', e)
      resolve(null)
    }
  })

export default { checkAppleHealth }
