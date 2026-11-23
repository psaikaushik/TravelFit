import React, { useState } from 'react'
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native'
import {
  Box,
  Text,
  VStack,
  HStack,
  Flex,
  ScrollView,
  Pressable
} from 'native-base'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { getStepsNumAtDate, prettifyNum, stepsToDistance } from '../services/helpers'
import moment from 'moment'
import BackSVG from '../assets/icons/back.svg'

const TABS = ['Week', 'Month']

const fetchWeeklyData = async () => {
  const days = []
  const startDate = moment().subtract(6, 'days').startOf('day').toISOString()
  const results = await getStepsNumAtDate(startDate)

  for (let i = 6; i >= 0; i--) {
    const date = moment().subtract(i, 'days')
    const daySteps = (results || [])
      .filter((x) => date.isSame(x.startDate, 'day'))
      .reduce((sum, item) => sum + item.value, 0)
    days.push({
      date: date.toISOString(),
      label: date.format('ddd'),
      fullLabel: date.format('MMM D'),
      steps: daySteps,
      isToday: i === 0
    })
  }
  return days
}

const fetchMonthlyData = async () => {
  const weeks = []
  const startDate = moment().subtract(29, 'days').startOf('day').toISOString()
  const results = await getStepsNumAtDate(startDate)

  // Group into 4 weeks + remaining days
  for (let w = 0; w < 5; w++) {
    const weekStart = moment().subtract(29 - w * 7, 'days')
    const weekEnd = moment.min(moment(weekStart).add(6, 'days'), moment())
    let totalSteps = 0
    let dayCount = 0

    for (let d = 0; d < 7; d++) {
      const date = moment(weekStart).add(d, 'days')
      if (date.isAfter(moment())) break
      const daySteps = (results || [])
        .filter((x) => date.isSame(x.startDate, 'day'))
        .reduce((sum, item) => sum + item.value, 0)
      totalSteps += daySteps
      dayCount++
    }

    weeks.push({
      label: `${weekStart.format('MMM D')} - ${weekEnd.format('MMM D')}`,
      steps: totalSteps,
      avg: dayCount > 0 ? Math.round(totalSteps / dayCount) : 0,
      days: dayCount
    })
  }
  return weeks
}

const WeeklyStats = () => {
  const { goBack } = useNavigation()
  const [activeTab, setActiveTab] = useState(0)

  const { data: weekData = [] } = useQuery(['weekly-stats'], fetchWeeklyData)
  const { data: monthData = [] } = useQuery(['monthly-stats'], fetchMonthlyData)

  const weekTotal = weekData.reduce((sum, d) => sum + d.steps, 0)
  const weekAvg = weekData.length > 0 ? Math.round(weekTotal / weekData.length) : 0
  const weekBest = weekData.reduce((best, d) => Math.max(best, d.steps), 0)

  const monthTotal = monthData.reduce((sum, w) => sum + w.steps, 0)
  const monthAvg = monthData.length > 0
    ? Math.round(monthTotal / monthData.reduce((sum, w) => sum + w.days, 0))
    : 0
  const monthBestWeek = monthData.reduce((best, w) => Math.max(best, w.steps), 0)

  const maxSteps = Math.max(...weekData.map((d) => d.steps), 1)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F3F6' }}>
      <StatusBar barStyle="dark-content" />

      <Flex direction="row" align="center" px="16px" py="12px">
        <Pressable onPress={goBack} p="4px" accessibilityLabel="Go back" accessibilityRole="button">
          <BackSVG />
        </Pressable>
        <Text fontSize="20px" fontWeight="700" ml="12px" accessibilityRole="header">
          Statistics
        </Text>
      </Flex>

      {/* Tab Switcher */}
      <HStack mx="20px" bg="white" borderRadius="12px" p="4px" mb="16px">
        {TABS.map((tab, i) => (
          <Pressable
            key={tab}
            flex="1"
            onPress={() => setActiveTab(i)}
            accessibilityLabel={`Show ${tab.toLowerCase()} stats`}
            accessibilityRole="tab"
          >
            <Box
              bg={activeTab === i ? 'primary.400' : 'transparent'}
              borderRadius="10px"
              py="10px"
              alignItems="center"
            >
              <Text
                fontSize="14px"
                fontWeight="600"
                color={activeTab === i ? 'white' : 'gray.500'}
              >
                {tab}
              </Text>
            </Box>
          </Pressable>
        ))}
      </HStack>

      <ScrollView flex="1" px="20px" showsVerticalScrollIndicator={false}>
        {/* Weekly View */}
        {activeTab === 0 && (
          <VStack space="4" pb="40px">
            {/* Summary Cards */}
            <HStack space="3">
              <Box flex="1" bg="white" borderRadius="16px" p="16px" alignItems="center">
                <Text fontSize="11px" color="gray.400" fontWeight="500">Total Steps</Text>
                <Text fontSize="20px" fontWeight="800" color="primary.400">
                  {prettifyNum(weekTotal)}
                </Text>
                <Text fontSize="11px" color="gray.400">{stepsToDistance(weekTotal)} km</Text>
              </Box>
              <Box flex="1" bg="white" borderRadius="16px" p="16px" alignItems="center">
                <Text fontSize="11px" color="gray.400" fontWeight="500">Daily Avg</Text>
                <Text fontSize="20px" fontWeight="800" color="secondary.900">
                  {prettifyNum(weekAvg)}
                </Text>
                <Text fontSize="11px" color="gray.400">steps/day</Text>
              </Box>
              <Box flex="1" bg="white" borderRadius="16px" p="16px" alignItems="center">
                <Text fontSize="11px" color="gray.400" fontWeight="500">Best Day</Text>
                <Text fontSize="20px" fontWeight="800" color="green.600">
                  {prettifyNum(weekBest)}
                </Text>
                <Text fontSize="11px" color="gray.400">steps</Text>
              </Box>
            </HStack>

            {/* Bar Chart */}
            <Box bg="white" borderRadius="16px" p="20px">
              <Text fontSize="16px" fontWeight="700" mb="16px" color="primary.400">
                This Week
              </Text>
              <HStack space="2" alignItems="flex-end" justifyContent="space-between" h="140px">
                {weekData.map((day) => {
                  const height = maxSteps > 0 ? Math.max((day.steps / maxSteps) * 120, 4) : 4
                  return (
                    <VStack key={day.date} flex="1" alignItems="center" justifyContent="flex-end">
                      <Text fontSize="9px" color="gray.500" mb="4px">
                        {prettifyNum(day.steps)}
                      </Text>
                      <View
                        style={[
                          styles.bar,
                          {
                            height,
                            backgroundColor: day.isToday ? '#25B025' : '#C4EB64'
                          }
                        ]}
                      />
                      <Text
                        fontSize="11px"
                        fontWeight={day.isToday ? '700' : '500'}
                        color={day.isToday ? 'primary.400' : 'gray.500'}
                        mt="6px"
                      >
                        {day.label}
                      </Text>
                    </VStack>
                  )
                })}
              </HStack>
            </Box>

            {/* Daily Breakdown */}
            <Box bg="white" borderRadius="16px" p="16px">
              <Text fontSize="16px" fontWeight="700" mb="12px" color="primary.400">
                Daily Breakdown
              </Text>
              <VStack space="2">
                {[...weekData].reverse().map((day) => (
                  <HStack
                    key={day.date}
                    justifyContent="space-between"
                    alignItems="center"
                    py="8px"
                    borderBottomWidth="1px"
                    borderBottomColor="gray.100"
                  >
                    <VStack>
                      <Text fontSize="14px" fontWeight={day.isToday ? '700' : '500'} color="primary.400">
                        {day.isToday ? 'Today' : day.fullLabel}
                      </Text>
                      <Text fontSize="12px" color="gray.400">{stepsToDistance(day.steps)} km</Text>
                    </VStack>
                    <Text fontSize="16px" fontWeight="700" color="primary.400">
                      {prettifyNum(day.steps)}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Box>
          </VStack>
        )}

        {/* Monthly View */}
        {activeTab === 1 && (
          <VStack space="4" pb="40px">
            {/* Summary Cards */}
            <HStack space="3">
              <Box flex="1" bg="white" borderRadius="16px" p="16px" alignItems="center">
                <Text fontSize="11px" color="gray.400" fontWeight="500">30-Day Total</Text>
                <Text fontSize="20px" fontWeight="800" color="primary.400">
                  {prettifyNum(monthTotal)}
                </Text>
                <Text fontSize="11px" color="gray.400">{stepsToDistance(monthTotal)} km</Text>
              </Box>
              <Box flex="1" bg="white" borderRadius="16px" p="16px" alignItems="center">
                <Text fontSize="11px" color="gray.400" fontWeight="500">Daily Avg</Text>
                <Text fontSize="20px" fontWeight="800" color="secondary.900">
                  {prettifyNum(monthAvg)}
                </Text>
                <Text fontSize="11px" color="gray.400">steps/day</Text>
              </Box>
            </HStack>

            {/* Weekly Breakdown */}
            <Box bg="white" borderRadius="16px" p="16px">
              <Text fontSize="16px" fontWeight="700" mb="12px" color="primary.400">
                Weekly Breakdown
              </Text>
              <VStack space="3">
                {monthData.map((week, i) => {
                  const barWidth = monthBestWeek > 0
                    ? Math.max((week.steps / monthBestWeek) * 100, 5)
                    : 5
                  return (
                    <VStack key={i} space="1">
                      <HStack justifyContent="space-between">
                        <Text fontSize="13px" color="gray.600" fontWeight="500">
                          {week.label}
                        </Text>
                        <Text fontSize="13px" fontWeight="700" color="primary.400">
                          {prettifyNum(week.steps)}
                        </Text>
                      </HStack>
                      <View style={styles.barBg}>
                        <View
                          style={[
                            styles.barFill,
                            { width: `${barWidth}%` }
                          ]}
                        />
                      </View>
                      <Text fontSize="11px" color="gray.400">
                        Avg: {prettifyNum(week.avg)} steps/day
                      </Text>
                    </VStack>
                  )
                })}
              </VStack>
            </Box>

            {/* Monthly Distance */}
            <Box bg="secondary.400" borderRadius="16px" p="20px" alignItems="center">
              <Text fontSize="13px" color="primary.300" fontWeight="500">
                Distance walked this month
              </Text>
              <Text fontSize="36px" fontWeight="900" color="primary.400" mt="4px">
                {stepsToDistance(monthTotal)} km
              </Text>
              <Text fontSize="13px" color="primary.300" mt="2px">
                {prettifyNum(monthTotal)} total steps
              </Text>
            </Box>
          </VStack>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    borderRadius: 6,
    minHeight: 4
  },
  barBg: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden'
  },
  barFill: {
    height: 8,
    backgroundColor: '#C4EB64',
    borderRadius: 4
  }
})

export default WeeklyStats
