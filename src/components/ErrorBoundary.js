import React from 'react'
import { SafeAreaView, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, VStack, Box } from 'native-base'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    if (__DEV__) {
      console.error('ErrorBoundary caught:', error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <VStack space="6" alignItems="center" px="40px">
            <Text style={styles.icon}>{'⚠️'}</Text>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              The app encountered an unexpected error. Please try again.
            </Text>
            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </VStack>
        </SafeAreaView>
      )
    }

    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2225',
    alignItems: 'center',
    justifyContent: 'center'
  },
  icon: {
    fontSize: 64,
    textAlign: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center'
  },
  message: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24
  },
  button: {
    backgroundColor: '#C4EB64',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 20,
    marginTop: 12
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2225'
  }
})

export default ErrorBoundary
