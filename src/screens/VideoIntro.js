import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, StatusBar } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Video from 'react-native-video'

const VideoIntro = () => {
  const { navigate } = useNavigation()
  const videoRef = useRef(null)

  useEffect(() => {
    StatusBar.setBarStyle('light-content', true)
    StatusBar.setBackgroundColor('#000', true)
  }, [])

  const handleVideoEnd = () => {
    navigate('Welcome')
  }

  const handleVideoLoad = () => {
    console.log('Video loaded successfully')
  }

  const handleVideoError = (error) => {
    console.log('Video error:', error)
    // If video fails to load, navigate to Welcome screen immediately
    navigate('Welcome')
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <Video
        ref={videoRef}
        source={{
          uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
        }}
        style={styles.video}
        resizeMode="cover"
        onLoad={handleVideoLoad}
        onEnd={handleVideoEnd}
        onError={handleVideoError}
        repeat={false}
        paused={false}
        playInBackground={false}
        playWhenInactive={false}
        ignoreSilentSwitch="ignore"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center'
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: '100%',
    height: '100%'
  }
})

export default VideoIntro