import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Text, Pressable } from 'native-base'

const illustrations = {
  friends: { icon: '\u{1F91D}', bg: '#E8F5E9' },
  groups: { icon: '\u{1F46B}', bg: '#E3F2FD' },
  achievements: { icon: '\u{1F3C5}', bg: '#FFF3E0' },
  trips: { icon: '\u{1F30D}', bg: '#E8EAF0' },
  challenges: { icon: '\u{1F3AF}', bg: '#FCE4EC' },
  races: { icon: '\u{1F3C1}', bg: '#F3E5F5' },
  search: { icon: '\u{1F50D}', bg: '#E0F7FA' },
  notifications: { icon: '\u{1F514}', bg: '#FFFDE7' },
  default: { icon: '\u{1F4AD}', bg: '#F5F6FA' }
}

const EmptyState = ({
  type = 'default',
  title,
  message,
  actionLabel,
  onAction
}) => {
  const { icon, bg } = illustrations[type] || illustrations.default

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: bg }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <Pressable style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24
  },
  icon: {
    fontSize: 56
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2225',
    textAlign: 'center',
    marginBottom: 8
  },
  message: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22
  },
  actionButton: {
    backgroundColor: '#C4EB64',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginTop: 24
  },
  actionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2225'
  }
})

export default EmptyState
