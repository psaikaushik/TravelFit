import React, { useState, useEffect, useCallback } from 'react'
import { SafeAreaView, StatusBar } from 'react-native'
import {
  Box,
  Text,
  VStack,
  HStack,
  Switch,
  Flex,
  Pressable,
  ScrollView
} from 'native-base'
import { useNavigation } from '@react-navigation/native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import BackSVG from '../assets/icons/back.svg'
import {
  getNotificationPrefs,
  saveNotificationPrefs
} from '../services/notifications'

const NotificationSettings = () => {
  const { goBack } = useNavigation()
  const queryClient = useQueryClient()
  const [prefs, setPrefs] = useState(null)

  const { data: savedPrefs, isLoading } = useQuery(
    ['notification-prefs'],
    getNotificationPrefs
  )

  useEffect(() => {
    if (savedPrefs) {
      setPrefs(savedPrefs)
    }
  }, [savedPrefs])

  const updatePref = useCallback(
    async (key, value) => {
      const updated = { ...prefs, [key]: value }

      // When master toggle is turned off, disable all sub-toggles
      if (key === 'enabled' && !value) {
        updated.inactivityReminder = false
        updated.streakReminder = false
        updated.milestoneAlerts = false
        updated.dailyGoalReminder = false
      }

      // When master toggle is turned on, re-enable all sub-toggles
      if (key === 'enabled' && value) {
        updated.inactivityReminder = true
        updated.streakReminder = true
        updated.milestoneAlerts = true
        updated.dailyGoalReminder = true
      }

      setPrefs(updated)
      await saveNotificationPrefs(updated)
      queryClient.invalidateQueries(['notification-prefs'])
    },
    [prefs, queryClient]
  )

  const formatHour = (hour) => {
    if (hour === 0) return '12:00 AM'
    if (hour === 12) return '12:00 PM'
    if (hour > 12) return `${hour - 12}:00 PM`
    return `${hour}:00 AM`
  }

  if (isLoading || !prefs) return null

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F3F6' }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <Flex direction="row" align="center" px="16px" py="12px">
        <Pressable
          onPress={goBack}
          p="4px"
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <BackSVG />
        </Pressable>
        <Text
          fontSize="20px"
          fontWeight="700"
          ml="12px"
          accessibilityRole="header"
        >
          Notifications
        </Text>
      </Flex>

      <ScrollView flex="1" px="20px" showsVerticalScrollIndicator={false}>
        <VStack space="4" pb="40px">
          {/* Master Toggle */}
          <Box bg="white" borderRadius="16px" p="20px">
            <HStack justifyContent="space-between" alignItems="center">
              <VStack flex="1" mr="12px">
                <Text fontSize="16px" fontWeight="600">
                  All Notifications
                </Text>
                <Text fontSize="13px" color="gray.500" mt="2px">
                  Enable or disable all notifications
                </Text>
              </VStack>
              <Switch
                isChecked={prefs.enabled}
                onToggle={(value) => updatePref('enabled', value)}
                accessibilityLabel="Toggle all notifications"
              />
            </HStack>
          </Box>

          {/* Individual Toggles */}
          <Box
            bg="white"
            borderRadius="16px"
            p="20px"
            opacity={prefs.enabled ? 1 : 0.5}
          >
            <VStack space="5">
              {/* Inactivity Reminders */}
              <HStack justifyContent="space-between" alignItems="center">
                <VStack flex="1" mr="12px">
                  <Text fontSize="16px" fontWeight="600">
                    Inactivity Reminders
                  </Text>
                  <Text fontSize="13px" color="gray.500" mt="2px">
                    Remind you when inactive for more than 2 days
                  </Text>
                </VStack>
                <Switch
                  isChecked={prefs.inactivityReminder}
                  onToggle={(value) => updatePref('inactivityReminder', value)}
                  isDisabled={!prefs.enabled}
                  accessibilityLabel="Toggle inactivity reminders"
                />
              </HStack>

              {/* Streak Reminders */}
              <HStack justifyContent="space-between" alignItems="center">
                <VStack flex="1" mr="12px">
                  <Text fontSize="16px" fontWeight="600">
                    Streak Reminders
                  </Text>
                  <Text fontSize="13px" color="gray.500" mt="2px">
                    Daily reminder to keep your streak going
                  </Text>
                </VStack>
                <Switch
                  isChecked={prefs.streakReminder}
                  onToggle={(value) => updatePref('streakReminder', value)}
                  isDisabled={!prefs.enabled}
                  accessibilityLabel="Toggle streak reminders"
                />
              </HStack>

              {/* Milestone Alerts */}
              <HStack justifyContent="space-between" alignItems="center">
                <VStack flex="1" mr="12px">
                  <Text fontSize="16px" fontWeight="600">
                    Milestone Alerts
                  </Text>
                  <Text fontSize="13px" color="gray.500" mt="2px">
                    Notify when you are close to a milestone
                  </Text>
                </VStack>
                <Switch
                  isChecked={prefs.milestoneAlerts}
                  onToggle={(value) => updatePref('milestoneAlerts', value)}
                  isDisabled={!prefs.enabled}
                  accessibilityLabel="Toggle milestone alerts"
                />
              </HStack>

              {/* Daily Goal Reminders */}
              <HStack justifyContent="space-between" alignItems="center">
                <VStack flex="1" mr="12px">
                  <Text fontSize="16px" fontWeight="600">
                    Daily Goal Reminders
                  </Text>
                  <Text fontSize="13px" color="gray.500" mt="2px">
                    Afternoon reminder if daily goal not yet met
                  </Text>
                </VStack>
                <Switch
                  isChecked={prefs.dailyGoalReminder}
                  onToggle={(value) => updatePref('dailyGoalReminder', value)}
                  isDisabled={!prefs.enabled}
                  accessibilityLabel="Toggle daily goal reminders"
                />
              </HStack>
            </VStack>
          </Box>

          {/* Quiet Hours */}
          <Box
            bg="white"
            borderRadius="16px"
            p="20px"
            opacity={prefs.enabled ? 1 : 0.5}
          >
            <VStack space="3">
              <Text fontSize="16px" fontWeight="600">
                Quiet Hours
              </Text>
              <Text fontSize="13px" color="gray.500">
                No notifications will be sent during quiet hours
              </Text>
              <HStack
                justifyContent="space-between"
                alignItems="center"
                bg="#F3F3F6"
                borderRadius="12px"
                px="16px"
                py="14px"
                mt="4px"
              >
                <VStack alignItems="center" flex="1">
                  <Text fontSize="12px" color="gray.400" fontWeight="500">
                    From
                  </Text>
                  <Text fontSize="18px" fontWeight="700" color="primary.400">
                    {formatHour(prefs.quietHoursStart)}
                  </Text>
                </VStack>
                <Text fontSize="16px" color="gray.300" mx="8px">
                  -
                </Text>
                <VStack alignItems="center" flex="1">
                  <Text fontSize="12px" color="gray.400" fontWeight="500">
                    To
                  </Text>
                  <Text fontSize="18px" fontWeight="700" color="primary.400">
                    {formatHour(prefs.quietHoursEnd)}
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </Box>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  )
}

export default NotificationSettings
