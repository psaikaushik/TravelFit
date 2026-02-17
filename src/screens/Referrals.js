import React, { useState, useEffect, useCallback } from 'react'
import {
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Clipboard,
  RefreshControl
} from 'react-native'
import {
  Box,
  Text,
  VStack,
  HStack,
  Flex,
  Pressable,
  Button,
  Input,
  Badge
} from 'native-base'
import { useNavigation } from '@react-navigation/native'
import {
  getOrCreateReferralCode,
  getReferralStats,
  getReferralPremiumDetails,
  redeemReferralCode,
  shareReferralCode
} from '../services/referrals'
import BackSVG from '../assets/icons/back.svg'

const REWARD_DAYS = 7

const Referrals = () => {
  const { goBack } = useNavigation()
  const [myCode, setMyCode] = useState(null)
  const [stats, setStats] = useState(null)
  const [premiumDetails, setPremiumDetails] = useState(null)
  const [redeemCode, setRedeemCode] = useState('')
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [copied, setCopied] = useState(false)

  const loadData = useCallback(async () => {
    const [code, statsData, premium] = await Promise.all([
      getOrCreateReferralCode(),
      getReferralStats(),
      getReferralPremiumDetails()
    ])
    setMyCode(code)
    setStats(statsData)
    setPremiumDetails(premium)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [loadData])

  const handleCopyCode = () => {
    if (!myCode) return
    Clipboard.setString(myCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = () => {
    shareReferralCode()
  }

  const handleRedeem = async () => {
    if (!redeemCode.trim()) {
      Alert.alert('Enter a Code', 'Please enter a referral code to redeem.')
      return
    }

    setIsRedeeming(true)
    const result = await redeemReferralCode(redeemCode.trim())
    setIsRedeeming(false)

    if (result.success) {
      Alert.alert(
        'Referral Redeemed!',
        `You and ${result.referrerName} both get ${result.rewardDays} days of free Premium!`,
        [{ text: 'Awesome!', onPress: loadData }]
      )
      setRedeemCode('')
    } else {
      Alert.alert('Could Not Redeem', result.error || 'Invalid referral code.')
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F6FA' }}>
      <StatusBar barStyle="dark-content" />

      <HStack px="20px" py="8px" alignItems="center">
        <Pressable onPress={goBack} p="4px" mr="8px">
          <BackSVG />
        </Pressable>
        <Text fontSize="20px" fontWeight="700" color="primary.400">
          Invite Friends
        </Text>
      </HStack>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Card */}
        <Box bg="primary.400" borderRadius="24px" p="24px" mb="16px">
          <VStack alignItems="center" space="3">
            <Text fontSize="40px">
              {'\uD83C\uDF81'}
            </Text>
            <Text
              fontSize="22px"
              fontWeight="800"
              color="white"
              textAlign="center"
            >
              Give a Week, Get a Week
            </Text>
            <Text
              fontSize="14px"
              color="rgba(255,255,255,0.75)"
              textAlign="center"
              lineHeight="20px"
            >
              Share your code with a friend. When they join TravelFit using
              your code, you BOTH get {REWARD_DAYS} days of Premium free.
            </Text>

            {/* How it works steps */}
            <VStack w="100%" mt="8px" space="3">
              <HStack alignItems="center" space="3">
                <Flex
                  w="28px"
                  h="28px"
                  borderRadius="14px"
                  bg="secondary.400"
                  align="center"
                  justify="center"
                >
                  <Text fontSize="13px" fontWeight="800" color="primary.400">
                    1
                  </Text>
                </Flex>
                <Text fontSize="13px" fontWeight="600" color="white" flex="1">
                  Share your referral code with a friend
                </Text>
              </HStack>
              <HStack alignItems="center" space="3">
                <Flex
                  w="28px"
                  h="28px"
                  borderRadius="14px"
                  bg="secondary.400"
                  align="center"
                  justify="center"
                >
                  <Text fontSize="13px" fontWeight="800" color="primary.400">
                    2
                  </Text>
                </Flex>
                <Text fontSize="13px" fontWeight="600" color="white" flex="1">
                  They download TravelFit and enter your code
                </Text>
              </HStack>
              <HStack alignItems="center" space="3">
                <Flex
                  w="28px"
                  h="28px"
                  borderRadius="14px"
                  bg="secondary.400"
                  align="center"
                  justify="center"
                >
                  <Text fontSize="13px" fontWeight="800" color="primary.400">
                    3
                  </Text>
                </Flex>
                <Text fontSize="13px" fontWeight="600" color="white" flex="1">
                  You BOTH get {REWARD_DAYS} days of Premium free!
                </Text>
              </HStack>
            </VStack>
          </VStack>
        </Box>

        {/* Active Referral Premium Banner */}
        {premiumDetails && (
          <Box
            bg="secondary.400"
            borderRadius="16px"
            p="16px"
            mb="16px"
            borderWidth="2px"
            borderColor="secondary.600"
          >
            <HStack alignItems="center">
              <VStack flex="1">
                <HStack alignItems="center" space="2">
                  <Text fontSize="14px" fontWeight="700" color="primary.400">
                    Referral Premium Active
                  </Text>
                  <Badge
                    bg="primary.400"
                    rounded="full"
                    _text={{
                      fontSize: '10px',
                      color: 'white',
                      fontWeight: '700'
                    }}
                    px="6px"
                  >
                    FREE
                  </Badge>
                </HStack>
                <Text fontSize="12px" color="primary.300" mt="2px">
                  {premiumDetails.reason}
                </Text>
              </VStack>
              <VStack alignItems="center">
                <Text fontSize="28px" fontWeight="900" color="primary.400">
                  {premiumDetails.daysRemaining}
                </Text>
                <Text fontSize="10px" fontWeight="600" color="primary.300">
                  days left
                </Text>
              </VStack>
            </HStack>
          </Box>
        )}

        {/* Your Referral Code */}
        <Box
          bg="white"
          borderRadius="20px"
          p="20px"
          mb="16px"
          borderWidth="1px"
          borderColor="border"
        >
          <Text
            fontSize="13px"
            fontWeight="700"
            color="primary.100"
            mb="12px"
            textTransform="uppercase"
            letterSpacing="0.5px"
          >
            Your Referral Code
          </Text>

          <Pressable onPress={handleCopyCode}>
            <Box
              bg="primary.50"
              borderRadius="14px"
              py="16px"
              px="20px"
              alignItems="center"
              borderWidth="2px"
              borderColor={copied ? 'secondary.400' : 'border'}
              borderStyle="dashed"
            >
              <Text
                fontSize="32px"
                fontWeight="900"
                color="primary.400"
                letterSpacing="6px"
              >
                {myCode || '------'}
              </Text>
              <Text
                fontSize="12px"
                fontWeight="600"
                color={copied ? 'secondary.600' : 'primary.100'}
                mt="6px"
              >
                {copied ? 'Copied!' : 'Tap to copy'}
              </Text>
            </Box>
          </Pressable>

          <Button
            mt="14px"
            bg="secondary.400"
            borderRadius="14px"
            py="14px"
            onPress={handleShare}
            _text={{
              fontSize: '16px',
              fontWeight: '700',
              color: 'primary.400'
            }}
            _pressed={{ bg: 'secondary.600' }}
          >
            Share Invite Link
          </Button>
        </Box>

        {/* Redeem a Code */}
        <Box
          bg="white"
          borderRadius="20px"
          p="20px"
          mb="16px"
          borderWidth="1px"
          borderColor="border"
        >
          <Text
            fontSize="13px"
            fontWeight="700"
            color="primary.100"
            mb="12px"
            textTransform="uppercase"
            letterSpacing="0.5px"
          >
            Have a Referral Code?
          </Text>

          <HStack space="3">
            <Input
              flex="1"
              value={redeemCode}
              onChangeText={(text) => setRedeemCode(text.toUpperCase())}
              placeholder="Enter code"
              bg="primary.50"
              borderRadius="12px"
              borderColor="border"
              fontSize="16px"
              fontWeight="700"
              letterSpacing="2px"
              textAlign="center"
              h="50px"
              autoCapitalize="characters"
              maxLength={8}
              _focus={{ borderColor: 'secondary.400', bg: 'white' }}
            />
            <Button
              bg="accent.ocean"
              borderRadius="12px"
              px="20px"
              h="50px"
              onPress={handleRedeem}
              isLoading={isRedeeming}
              _text={{ fontSize: '14px', fontWeight: '700', color: 'white' }}
              _pressed={{ bg: 'accent.ocean', opacity: 0.8 }}
            >
              Redeem
            </Button>
          </HStack>
        </Box>

        {/* Referral Stats */}
        {stats && stats.totalReferrals > 0 && (
          <Box
            bg="white"
            borderRadius="20px"
            p="20px"
            mb="16px"
            borderWidth="1px"
            borderColor="border"
          >
            <Text
              fontSize="13px"
              fontWeight="700"
              color="primary.100"
              mb="14px"
              textTransform="uppercase"
              letterSpacing="0.5px"
            >
              Your Referral Stats
            </Text>

            <HStack justifyContent="space-around">
              <VStack alignItems="center">
                <Text fontSize="28px" fontWeight="900" color="primary.400">
                  {stats.totalReferrals}
                </Text>
                <Text fontSize="11px" fontWeight="600" color="primary.100">
                  Friends Joined
                </Text>
              </VStack>
              <VStack alignItems="center">
                <Text fontSize="28px" fontWeight="900" color="secondary.600">
                  {stats.totalRewardDays}
                </Text>
                <Text fontSize="11px" fontWeight="600" color="primary.100">
                  Days Earned
                </Text>
              </VStack>
            </HStack>

            {/* Recent referrals */}
            {stats.referrals.length > 0 && (
              <VStack mt="14px" space="2">
                <Text fontSize="12px" fontWeight="600" color="primary.100" mb="2px">
                  Recent
                </Text>
                {stats.referrals.slice(0, 5).map((ref) => (
                  <HStack
                    key={ref.id}
                    alignItems="center"
                    bg="primary.50"
                    borderRadius="10px"
                    px="12px"
                    py="8px"
                  >
                    <Flex
                      w="30px"
                      h="30px"
                      borderRadius="15px"
                      bg="secondary.400"
                      align="center"
                      justify="center"
                      mr="10px"
                    >
                      <Text
                        fontSize="13px"
                        fontWeight="700"
                        color="primary.400"
                      >
                        {(ref.inviteeName || 'U')[0].toUpperCase()}
                      </Text>
                    </Flex>
                    <Text
                      flex="1"
                      fontSize="13px"
                      fontWeight="600"
                      color="primary.400"
                    >
                      {ref.inviteeName}
                    </Text>
                    <Text fontSize="11px" color="secondary.600" fontWeight="600">
                      +{REWARD_DAYS} days
                    </Text>
                  </HStack>
                ))}
              </VStack>
            )}
          </Box>
        )}

        {/* Info: Rewards Stack */}
        <Box
          bg="white"
          borderRadius="20px"
          p="20px"
          borderWidth="1px"
          borderColor="border"
        >
          <Text
            fontSize="13px"
            fontWeight="700"
            color="primary.100"
            mb="10px"
            textTransform="uppercase"
            letterSpacing="0.5px"
          >
            How Rewards Work
          </Text>
          <VStack space="3">
            <HStack alignItems="flex-start">
              <Box
                w="6px"
                h="6px"
                borderRadius="3px"
                bg="secondary.400"
                mt="6px"
                mr="10px"
              />
              <Text fontSize="13px" color="primary.200" flex="1">
                Each successful referral gives both you and your friend{' '}
                {REWARD_DAYS} days of Premium for free
              </Text>
            </HStack>
            <HStack alignItems="flex-start">
              <Box
                w="6px"
                h="6px"
                borderRadius="3px"
                bg="accent.sky"
                mt="6px"
                mr="10px"
              />
              <Text fontSize="13px" color="primary.200" flex="1">
                Rewards stack — invite 3 friends and get 21 days of Premium
              </Text>
            </HStack>
            <HStack alignItems="flex-start">
              <Box
                w="6px"
                h="6px"
                borderRadius="3px"
                bg="accent.sunset"
                mt="6px"
                mr="10px"
              />
              <Text fontSize="13px" color="primary.200" flex="1">
                Premium unlocks unlimited routes, full stats, all curated
                routes, and more
              </Text>
            </HStack>
            <HStack alignItems="flex-start">
              <Box
                w="6px"
                h="6px"
                borderRadius="3px"
                bg="accent.coral"
                mt="6px"
                mr="10px"
              />
              <Text fontSize="13px" color="primary.200" flex="1">
                No limit on referrals — keep sharing and keep earning
              </Text>
            </HStack>
          </VStack>
        </Box>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Referrals
