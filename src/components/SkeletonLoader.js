import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'

const SkeletonPulse = ({ width, height, borderRadius = 12, style }) => {
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true
        })
      ])
    )
    animation.start()
    return () => animation.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E8EAF0',
          opacity
        },
        style
      ]}
    />
  )
}

export const CardSkeleton = () => (
  <View style={styles.card}>
    <View style={styles.cardRow}>
      <SkeletonPulse width={48} height={48} borderRadius={24} />
      <View style={styles.cardContent}>
        <SkeletonPulse width="70%" height={16} borderRadius={8} />
        <SkeletonPulse
          width="45%"
          height={12}
          borderRadius={6}
          style={{ marginTop: 8 }}
        />
      </View>
    </View>
  </View>
)

export const ListSkeleton = ({ count = 4 }) => (
  <View style={styles.list}>
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </View>
)

export const ProgressSkeleton = () => (
  <View style={styles.progressContainer}>
    <View style={styles.progressHeader}>
      <SkeletonPulse width="60%" height={20} borderRadius={10} />
      <SkeletonPulse
        width="30%"
        height={14}
        borderRadius={7}
        style={{ marginTop: 8 }}
      />
    </View>
    <View style={styles.ringRow}>
      <SkeletonPulse width={88} height={88} borderRadius={44} />
      <View style={styles.ringContent}>
        <SkeletonPulse width={120} height={28} borderRadius={14} />
        <SkeletonPulse
          width={80}
          height={14}
          borderRadius={7}
          style={{ marginTop: 8 }}
        />
      </View>
      <SkeletonPulse width={60} height={72} borderRadius={16} />
    </View>
    <SkeletonPulse
      width="100%"
      height={70}
      borderRadius={35}
      style={{ marginTop: 16 }}
    />
    {Array.from({ length: 3 }).map((_, i) => (
      <View key={i} style={styles.statRow}>
        <SkeletonPulse width={70} height={70} borderRadius={12} />
        <View style={styles.statContent}>
          <SkeletonPulse width="50%" height={16} borderRadius={8} />
          <SkeletonPulse
            width="35%"
            height={12}
            borderRadius={6}
            style={{ marginTop: 6 }}
          />
        </View>
      </View>
    ))}
  </View>
)

export const GridSkeleton = ({ count = 4 }) => (
  <View style={styles.grid}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonPulse
        key={i}
        width="47%"
        height={180}
        borderRadius={16}
        style={{ margin: '1.5%', marginBottom: 12 }}
      />
    ))}
  </View>
)

export const ProfileSkeleton = () => (
  <View style={styles.profileContainer}>
    <SkeletonPulse width="100%" height={100} borderRadius={16} />
    <SkeletonPulse
      width="100%"
      height={120}
      borderRadius={16}
      style={{ marginTop: 16 }}
    />
    {Array.from({ length: 5 }).map((_, i) => (
      <SkeletonPulse
        key={i}
        width="100%"
        height={64}
        borderRadius={16}
        style={{ marginTop: 12 }}
      />
    ))}
  </View>
)

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 8
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardContent: {
    flex: 1,
    marginLeft: 12
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 12
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 16
  },
  progressHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16
  },
  ringRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  ringContent: {
    flex: 1,
    marginLeft: 16,
    marginRight: 16
  },
  statRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  statContent: {
    flex: 1,
    marginLeft: 16
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10
  },
  profileContainer: {
    paddingHorizontal: 20,
    paddingTop: 16
  }
})

export default SkeletonPulse
