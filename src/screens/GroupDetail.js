import React, { useState, useEffect, useCallback } from 'react'
import { SafeAreaView, StatusBar, FlatList, Alert, RefreshControl } from 'react-native'
import {
  Box,
  Text,
  VStack,
  HStack,
  Flex,
  Pressable,
  Button,
  Modal
} from 'native-base'
import { useNavigation, useRoute } from '@react-navigation/native'
import auth from '@react-native-firebase/auth'
import {
  getGroupDetails,
  leaveGroup,
  inviteToGroup,
  getGroupActivity,
  postGroupActivity
} from '../services/groups'
import { getFriendsList } from '../services/friends'
import { prettifyNum } from '../services/helpers'
import BackSVG from '../assets/icons/back.svg'

const GroupDetail = () => {
  const { goBack, navigate } = useNavigation()
  const route = useRoute()
  const { groupId } = route.params || {}
  const [group, setGroup] = useState(null)
  const [friends, setFriends] = useState([])
  const [activity, setActivity] = useState([])
  const [showInvite, setShowInvite] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const uid = auth().currentUser?.uid

  const loadData = useCallback(async () => {
    const [groupData, friendsData, activityData] = await Promise.all([
      getGroupDetails(groupId),
      getFriendsList(),
      getGroupActivity(groupId)
    ])
    setGroup(groupData)
    setFriends(friendsData)
    setActivity(activityData)
  }, [groupId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [loadData])

  const handleLeave = () => {
    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave ${group?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            await leaveGroup(groupId)
            goBack()
          }
        }
      ]
    )
  }

  const handleInviteFriend = async (friend) => {
    await inviteToGroup(groupId, friend.id, friend.name)
    Alert.alert('Invited!', `${friend.name} has been invited to the group`)
    setShowInvite(false)
  }

  const handleCreateGroupRace = () => {
    navigate('Races', { groupId })
  }

  if (!group) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F6FA' }}>
        <StatusBar barStyle="dark-content" />
        <Flex flex="1" align="center" justify="center">
          <Text color="primary.100">Loading group...</Text>
        </Flex>
      </SafeAreaView>
    )
  }

  const members = group.membersList || []
  const isAdmin = group.creator === uid
  const invitableFriends = friends.filter(
    (f) => !members.find((m) => m.id === f.id)
  )

  const listData = [
    { type: 'header' },
    { type: 'section', title: `Members (${members.length})` },
    ...members.map((m) => ({ ...m, type: 'member' })),
    ...(activity.length > 0
      ? [{ type: 'section', title: 'Recent Activity' }]
      : []),
    ...activity.slice(0, 10).map((a) => ({ ...a, type: 'activity' }))
  ]

  const renderItem = ({ item }) => {
    if (item.type === 'header') {
      return (
        <Box bg="primary.400" borderRadius="20px" p="20px" mb="16px">
          <VStack alignItems="center">
            <Flex
              w="64px"
              h="64px"
              borderRadius="32px"
              bg="accent.lavender"
              align="center"
              justify="center"
              mb="12px"
            >
              <Text fontSize="28px" fontWeight="800" color="white">
                {(group.name || 'G')[0].toUpperCase()}
              </Text>
            </Flex>
            <Text fontSize="20px" fontWeight="800" color="white" textAlign="center">
              {group.name}
            </Text>
            {group.description ? (
              <Text
                fontSize="13px"
                color="rgba(255,255,255,0.7)"
                mt="4px"
                textAlign="center"
              >
                {group.description}
              </Text>
            ) : null}
            <HStack mt="12px" space="4">
              <VStack alignItems="center">
                <Text fontSize="22px" fontWeight="800" color="secondary.400">
                  {members.length}
                </Text>
                <Text fontSize="11px" color="secondary.100">Members</Text>
              </VStack>
              <VStack alignItems="center">
                <Text fontSize="22px" fontWeight="800" color="secondary.400">
                  {group.creatorName?.split(' ')[0]}
                </Text>
                <Text fontSize="11px" color="secondary.100">Created by</Text>
              </VStack>
            </HStack>

            <HStack mt="16px" space="3" w="100%">
              <Button
                flex="1"
                bg="secondary.400"
                borderRadius="12px"
                py="10px"
                onPress={() => setShowInvite(true)}
                _text={{ fontSize: '13px', fontWeight: '700', color: 'primary.400' }}
                _pressed={{ bg: 'secondary.600' }}
              >
                Invite Friends
              </Button>
              <Button
                flex="1"
                bg="accent.ocean"
                borderRadius="12px"
                py="10px"
                onPress={handleCreateGroupRace}
                _text={{ fontSize: '13px', fontWeight: '700', color: 'white' }}
                _pressed={{ bg: 'accent.ocean', opacity: 0.8 }}
              >
                Start Race
              </Button>
            </HStack>
          </VStack>
        </Box>
      )
    }

    if (item.type === 'section') {
      return (
        <Text
          fontSize="13px"
          fontWeight="700"
          color="primary.100"
          mb="8px"
          mt="8px"
          textTransform="uppercase"
          letterSpacing="0.5px"
        >
          {item.title}
        </Text>
      )
    }

    if (item.type === 'member') {
      const isMe = item.id === uid
      return (
        <HStack
          bg={isMe ? 'secondary.50' : 'white'}
          borderRadius="14px"
          px="16px"
          py="12px"
          mb="6px"
          alignItems="center"
          borderWidth="1px"
          borderColor={isMe ? 'secondary.400' : 'border'}
        >
          <Flex
            w="38px"
            h="38px"
            borderRadius="19px"
            bg={item.role === 'admin' ? 'accent.sunset' : 'accent.sky'}
            align="center"
            justify="center"
          >
            <Text fontSize="16px" fontWeight="700" color="white">
              {(item.name || 'U')[0].toUpperCase()}
            </Text>
          </Flex>
          <VStack flex="1" ml="10px">
            <HStack alignItems="center">
              <Text fontSize="14px" fontWeight="600" color="primary.400">
                {isMe ? 'You' : item.name}
              </Text>
              {item.role === 'admin' && (
                <Box
                  bg="accent.sunset"
                  borderRadius="4px"
                  px="6px"
                  py="1px"
                  ml="6px"
                >
                  <Text fontSize="9px" fontWeight="700" color="white">
                    ADMIN
                  </Text>
                </Box>
              )}
            </HStack>
          </VStack>
        </HStack>
      )
    }

    if (item.type === 'activity') {
      return (
        <HStack
          bg="white"
          borderRadius="12px"
          px="14px"
          py="10px"
          mb="4px"
          alignItems="center"
          borderWidth="1px"
          borderColor="border"
        >
          <Flex
            w="32px"
            h="32px"
            borderRadius="16px"
            bg="secondary.50"
            align="center"
            justify="center"
            mr="10px"
          >
            <Text fontSize="14px" fontWeight="700" color="secondary.900">
              {(item.userName || 'U')[0].toUpperCase()}
            </Text>
          </Flex>
          <VStack flex="1">
            <Text fontSize="13px" fontWeight="600" color="primary.400">
              {item.userName}
            </Text>
            <Text fontSize="12px" color="primary.100">
              {item.message || 'Updated progress'}
            </Text>
          </VStack>
        </HStack>
      )
    }

    return null
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F6FA' }}>
      <StatusBar barStyle="dark-content" />

      <HStack px="20px" py="8px" alignItems="center">
        <Pressable onPress={goBack} p="4px" mr="8px">
          <BackSVG />
        </Pressable>
        <Text fontSize="20px" fontWeight="700" color="primary.400" flex="1" numberOfLines={1}>
          {group.name}
        </Text>
      </HStack>

      <FlatList
        data={listData}
        keyExtractor={(item, index) => `${item.type}-${item.id || index}`}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* Leave Button */}
      <Pressable
        onPress={handleLeave}
        position="absolute"
        bottom="40px"
        left="20px"
        right="20px"
        bg="white"
        borderRadius="14px"
        py="14px"
        alignItems="center"
        borderWidth="1px"
        borderColor="accent.coral"
      >
        <Text fontSize="14px" fontWeight="600" color="accent.coral">
          Leave Group
        </Text>
      </Pressable>

      {/* Invite Modal */}
      <Modal isOpen={showInvite} onClose={() => setShowInvite(false)}>
        <Modal.Content maxW="400px" borderRadius="20px">
          <Modal.CloseButton />
          <Modal.Header borderBottomWidth="0">
            <Text fontSize="18px" fontWeight="700" color="primary.400">
              Invite Friends
            </Text>
          </Modal.Header>
          <Modal.Body>
            {invitableFriends.length === 0 ? (
              <Text fontSize="14px" color="primary.100" textAlign="center" py="20px">
                All your friends are already in this group, or you haven't added any friends yet.
              </Text>
            ) : (
              invitableFriends.map((friend) => (
                <Pressable key={friend.id} onPress={() => handleInviteFriend(friend)}>
                  <HStack
                    bg="white"
                    borderRadius="12px"
                    px="14px"
                    py="10px"
                    mb="6px"
                    alignItems="center"
                    borderWidth="1px"
                    borderColor="border"
                  >
                    <Flex
                      w="36px"
                      h="36px"
                      borderRadius="18px"
                      bg="accent.sky"
                      align="center"
                      justify="center"
                    >
                      <Text fontSize="15px" fontWeight="700" color="white">
                        {(friend.name || 'U')[0].toUpperCase()}
                      </Text>
                    </Flex>
                    <Text flex="1" ml="10px" fontSize="14px" fontWeight="600" color="primary.400">
                      {friend.name}
                    </Text>
                    <Text fontSize="12px" fontWeight="600" color="accent.ocean">
                      Invite
                    </Text>
                  </HStack>
                </Pressable>
              ))
            )}

            {/* Share Group Code */}
            <Box bg="primary.50" borderRadius="12px" p="14px" mt="12px">
              <Text fontSize="12px" fontWeight="600" color="primary.200" mb="4px">
                Group Code
              </Text>
              <Text fontSize="16px" fontWeight="700" color="primary.400" letterSpacing="1px">
                {groupId}
              </Text>
              <Text fontSize="11px" color="primary.100" mt="4px">
                Share this code with anyone to let them join
              </Text>
            </Box>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </SafeAreaView>
  )
}

export default GroupDetail
