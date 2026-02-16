import React from 'react'
import { Box, Text, VStack, HStack, Pressable, Flex } from 'native-base'
import { useNavigation } from '@react-navigation/native'
import { PREMIUM_FEATURES_LIST } from '../services/freeTier'
import CloseSVG from '../assets/icons/close.svg'

const UpgradePrompt = ({ reason, onClose, inline = false }) => {
  const { navigate } = useNavigation()

  const handleUpgrade = () => {
    if (onClose) onClose()
    navigate('Subscription')
  }

  if (inline) {
    return (
      <Box bg="secondary.400" borderRadius="16px" p="20px" mx="20px" my="12px">
        <VStack space="3" alignItems="center">
          <Text fontSize="16px" fontWeight="700" color="primary.400" textAlign="center">
            Premium Feature
          </Text>
          <Text fontSize="14px" color="primary.300" textAlign="center">
            {reason || 'Upgrade to Premium to unlock this feature'}
          </Text>
          <Pressable
            onPress={handleUpgrade}
            bg="primary.400"
            borderRadius="12px"
            px="24px"
            py="12px"
            accessibilityLabel="Upgrade to premium"
            accessibilityRole="button"
          >
            <Text fontSize="15px" fontWeight="700" color="white">
              Upgrade to Premium
            </Text>
          </Pressable>
        </VStack>
      </Box>
    )
  }

  return (
    <Box
      position="absolute"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="rgba(0,0,0,0.6)"
      justifyContent="center"
      px="24px"
      zIndex={999}
    >
      <Box bg="white" borderRadius="20px" p="24px">
        <Flex direction="row" justify="flex-end" mb="8px">
          {onClose && (
            <Pressable onPress={onClose} p="4px" accessibilityLabel="Close" accessibilityRole="button">
              <CloseSVG width={20} height={20} />
            </Pressable>
          )}
        </Flex>

        <VStack space="4" alignItems="center">
          <Text fontSize="22px" fontWeight="800" color="primary.400" textAlign="center">
            Go Premium
          </Text>
          <Text fontSize="14px" color="gray.500" textAlign="center">
            {reason || 'Unlock all features with a Premium subscription'}
          </Text>

          <VStack space="2" w="100%" mt="8px">
            {PREMIUM_FEATURES_LIST.map((feature) => (
              <HStack key={feature} space="2" alignItems="center">
                <Text fontSize="14px" color="green.600" fontWeight="700">
                  {'✓'}
                </Text>
                <Text fontSize="14px" color="gray.700">
                  {feature}
                </Text>
              </HStack>
            ))}
          </VStack>

          <Pressable
            onPress={handleUpgrade}
            bg="primary.400"
            borderRadius="14px"
            w="100%"
            py="16px"
            mt="12px"
            alignItems="center"
            accessibilityLabel="Upgrade to premium"
            accessibilityRole="button"
          >
            <Text fontSize="17px" fontWeight="700" color="white">
              Upgrade Now
            </Text>
          </Pressable>

          {onClose && (
            <Pressable onPress={onClose} py="8px" accessibilityLabel="Maybe later" accessibilityRole="button">
              <Text fontSize="14px" color="gray.400" fontWeight="500">
                Maybe Later
              </Text>
            </Pressable>
          )}
        </VStack>
      </Box>
    </Box>
  )
}

export default UpgradePrompt
