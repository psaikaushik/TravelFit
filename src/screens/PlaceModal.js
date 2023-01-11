import React from 'react'
import { Flex, Image, Text } from 'native-base'

const PlaceModal = ({ route }) => {
  const { badge } = route?.params || {}
  const { name, vicinity, photos } = badge || {}

  return (
    <Flex px="16px">
      <Text variant="place" mb="2px" numberOfLines={2}>
        {name}
      </Text>
      <Text variant="vicinity" numberOfLines={1}>
        Tourist Attraction - {vicinity}
      </Text>
      <Image
        w="100%"
        my="16px"
        aspectRatio={1.3}
        borderRadius="16px"
        alt={photos[0].photo_reference}
        source={{
          uri: `https://maps.googleapis.com/maps/api/place/photo?photoreference=${photos[0].photo_reference}&sensor=false&maxheight=200&maxwidth=200&key=AIzaSyCe80iwSU9qzr-p5Zj8jQVfcjZFa9k_zHs`
        }}
      />
    </Flex>
  )
}

export default PlaceModal
