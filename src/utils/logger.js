// Production-safe logger - only logs in development
const logger = {
  log: (...args) => {
    if (__DEV__) console.log(...args)
  },
  warn: (...args) => {
    if (__DEV__) console.warn(...args)
  },
  error: (...args) => {
    if (__DEV__) console.error(...args)
    // In production, send to crashlytics
    // crashlytics().recordError(new Error(args.join(' ')))
  }
}

export default logger
