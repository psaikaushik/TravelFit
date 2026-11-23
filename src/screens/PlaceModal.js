import React from 'react'
import { Flex, Text } from 'native-base'

const PlaceModal = ({ route }) => {
  const { badge } = route?.params || {}
  const { name, vicinity } = badge || {}

  return (
    <Flex px="16px" pb="16px">
      <Text variant="place" mb="2px" numberOfLines={2}>
        {name}
      </Text>
      <Text variant="vicinity" numberOfLines={1}>
        {vicinity || 'Landmark'}
      </Text>
    </Flex>
  )
}

export default PlaceModal
