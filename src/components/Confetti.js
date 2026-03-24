import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View, Dimensions } from 'react-native'

const { width, height } = Dimensions.get('window')

const COLORS = ['#C4EB64', '#FF6B6B', '#4ECDC4', '#FFB347', '#A78BFA', '#3B82F6']
const PARTICLE_COUNT = 24

const Particle = ({ delay, color, startX }) => {
  const translateY = useRef(new Animated.Value(-20)).current
  const translateX = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(1)).current
  const rotate = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const xDrift = (Math.random() - 0.5) * 200

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: height * 0.8,
          duration: 2200 + Math.random() * 800,
          useNativeDriver: true
        }),
        Animated.timing(translateX, {
          toValue: xDrift,
          duration: 2200 + Math.random() * 800,
          useNativeDriver: true
        }),
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true
          }),
          Animated.timing(scale, {
            toValue: 0.6 + Math.random() * 0.4,
            duration: 1800,
            useNativeDriver: true
          })
        ]),
        Animated.timing(rotate, {
          toValue: (Math.random() - 0.5) * 10,
          duration: 2500,
          useNativeDriver: true
        }),
        Animated.sequence([
          Animated.delay(1500),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true
          })
        ])
      ])
    ]).start()
  }, [delay, translateY, translateX, opacity, rotate, scale])

  const spin = rotate.interpolate({
    inputRange: [-5, 5],
    outputRange: ['-180deg', '180deg']
  })

  const size = 8 + Math.random() * 8
  const isCircle = Math.random() > 0.5

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          width: isCircle ? size : size * 1.5,
          height: size,
          borderRadius: isCircle ? size / 2 : 2,
          backgroundColor: color,
          opacity,
          transform: [{ translateY }, { translateX }, { rotate: spin }, { scale }]
        }
      ]}
    />
  )
}

const Confetti = ({ trigger }) => {
  if (!trigger) return null

  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <Particle
          key={i}
          delay={Math.random() * 400}
          color={COLORS[i % COLORS.length]}
          startX={Math.random() * width}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999
  },
  particle: {
    position: 'absolute',
    top: 0
  }
})

export default Confetti
