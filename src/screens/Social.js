import React, { useState, useEffect, useCallback } from 'react'
import { SafeAreaView, StatusBar, FlatList, Alert, RefreshControl } from 'react-native'
import {
  Box,
  Text,
  VStack,
  HStack,
  Flex,
  Pressable,
  Input,
  Button,
  Badge,
  Modal,
  FormControl
} from 'native-base'
import { useNavigation } from '@react-navigation/native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import TabScreen from '../components/TabScreen'
import {
  getFriendsList,
  getFriendRequests,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend
} from '../services/friends'
import {
  getMyGroups,
  createGroup,
  getGroupInvites,
  acceptGroupInvite,
  declineGroupInvite
} from '../services/groups'

const Social = () => {
  const { navigate } = useNavigation()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('friends')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupDesc, setGroupDesc] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const { data: friends = [], refetch: refetchFriends } = useQuery(
    ['friends'],
    getFriendsList
  )
  const { data: requests = [], refetch: refetchRequests } = useQuery(
    ['friend-requests'],
    getFriendRequests
  )
  const { data: groups = [], refetch: refetchGroups } = useQuery(
    ['my-groups'],
    getMyGroups
  )
  const { data: groupInvites = [], refetch: refetchGroupInvites } = useQuery(
    ['group-invites'],
    getGroupInvites
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([
      refetchFriends(),
      refetchRequests(),
      refetchGroups(),
      refetchGroupInvites()
    ])
    setRefreshing(false)
  }, [refetchFriends, refetchRequests, refetchGroups, refetchGroupInvites])

  const handleSearch = useCallback(async (text) => {
    setSearchQuery(text)
    if (text.length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    const results = await searchUsers(text)
    setSearchResults(results)
    setSearching(false)
  }, [])

  const handleSendRequest = async (user) => {
    await sendFriendRequest(user.id, user.name)
    Alert.alert('Request Sent', `Friend request sent to ${user.name}`)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleAcceptRequest = async (request) => {
    await acceptFriendRequest(request.fromUid)
    refetchFriends()
    refetchRequests()
  }

  const handleDeclineRequest = async (request) => {
    await declineFriendRequest(request.fromUid)
    refetchRequests()
  }

  const handleRemoveFriend = (friend) => {
    Alert.alert(
      'Remove Friend',
      `Remove ${friend.name} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeFriend(friend.id)
            refetchFriends()
          }
        }
      ]
    )
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return
    await createGroup({ name: groupName.trim(), description: groupDesc.trim() })
    setShowCreateGroup(false)
    setGroupName('')
    setGroupDesc('')
    refetchGroups()
  }

  const handleAcceptGroupInvite = async (invite) => {
    await acceptGroupInvite(invite.groupId)
    refetchGroups()
    refetchGroupInvites()
  }

  const handleDeclineGroupInvite = async (invite) => {
    await declineGroupInvite(invite.groupId)
    refetchGroupInvites()
  }

  const renderFriendItem = ({ item }) => (
    <Pressable onLongPress={() => handleRemoveFriend(item)}>
      <HStack
        bg="white"
        borderRadius="14px"
        px="16px"
        py="14px"
        mb="8px"
        alignItems="center"
        borderWidth="1px"
        borderColor="border"
      >
        <Flex
          w="42px"
          h="42px"
          borderRadius="21px"
          bg="secondary.400"
          align="center"
          justify="center"
        >
          <Text fontSize="18px" fontWeight="700" color="primary.400">
            {(item.name || 'U')[0].toUpperCase()}
          </Text>
        </Flex>
        <VStack flex="1" ml="12px">
          <Text fontSize="15px" fontWeight="600" color="primary.400">
            {item.name}
          </Text>
          <Text fontSize="12px" color="primary.100" mt="2px">
            Friend
          </Text>
        </VStack>
        <Pressable
          onPress={() => navigate('Races', { inviteFriendId: item.id, inviteFriendName: item.name })}
          bg="secondary.400"
          px="12px"
          py="6px"
          borderRadius="8px"
        >
          <Text fontSize="12px" fontWeight="600" color="primary.400">
            Race
          </Text>
        </Pressable>
      </HStack>
    </Pressable>
  )

  const renderRequestItem = ({ item }) => (
    <HStack
      bg="white"
      borderRadius="14px"
      px="16px"
      py="14px"
      mb="8px"
      alignItems="center"
      borderWidth="1px"
      borderColor="accent.sunset"
    >
      <Flex
        w="42px"
        h="42px"
        borderRadius="21px"
        bg="accent.sunset"
        align="center"
        justify="center"
      >
        <Text fontSize="18px" fontWeight="700" color="white">
          {(item.fromName || 'U')[0].toUpperCase()}
        </Text>
      </Flex>
      <VStack flex="1" ml="12px">
        <Text fontSize="15px" fontWeight="600" color="primary.400">
          {item.fromName}
        </Text>
        <Text fontSize="12px" color="primary.100">
          Wants to be your friend
        </Text>
      </VStack>
      <HStack space="2">
        <Pressable
          onPress={() => handleAcceptRequest(item)}
          bg="secondary.400"
          px="12px"
          py="6px"
          borderRadius="8px"
        >
          <Text fontSize="12px" fontWeight="600" color="primary.400">
            Accept
          </Text>
        </Pressable>
        <Pressable
          onPress={() => handleDeclineRequest(item)}
          bg="primary.50"
          px="10px"
          py="6px"
          borderRadius="8px"
        >
          <Text fontSize="12px" fontWeight="600" color="primary.200">
            Decline
          </Text>
        </Pressable>
      </HStack>
    </HStack>
  )

  const renderSearchItem = ({ item }) => (
    <HStack
      bg="white"
      borderRadius="14px"
      px="16px"
      py="14px"
      mb="8px"
      alignItems="center"
      borderWidth="1px"
      borderColor="border"
    >
      <Flex
        w="42px"
        h="42px"
        borderRadius="21px"
        bg="accent.ocean"
        align="center"
        justify="center"
      >
        <Text fontSize="18px" fontWeight="700" color="white">
          {(item.name || 'U')[0].toUpperCase()}
        </Text>
      </Flex>
      <Text flex="1" ml="12px" fontSize="15px" fontWeight="600" color="primary.400">
        {item.name}
      </Text>
      <Pressable
        onPress={() => handleSendRequest(item)}
        bg="accent.ocean"
        px="12px"
        py="6px"
        borderRadius="8px"
      >
        <Text fontSize="12px" fontWeight="600" color="white">
          Add
        </Text>
      </Pressable>
    </HStack>
  )

  const renderGroupItem = ({ item }) => (
    <Pressable onPress={() => navigate('GroupDetail', { groupId: item.id })}>
      <HStack
        bg="white"
        borderRadius="14px"
        px="16px"
        py="14px"
        mb="8px"
        alignItems="center"
        borderWidth="1px"
        borderColor="border"
      >
        <Flex
          w="42px"
          h="42px"
          borderRadius="21px"
          bg="accent.lavender"
          align="center"
          justify="center"
        >
          <Text fontSize="18px" fontWeight="700" color="white">
            {(item.name || 'G')[0].toUpperCase()}
          </Text>
        </Flex>
        <VStack flex="1" ml="12px">
          <Text fontSize="15px" fontWeight="600" color="primary.400">
            {item.name}
          </Text>
          <Text fontSize="12px" color="primary.100" mt="2px">
            {item.memberCount} member{item.memberCount !== 1 ? 's' : ''} · {item.role}
          </Text>
        </VStack>
        <Text fontSize="20px" color="primary.100">›</Text>
      </HStack>
    </Pressable>
  )

  const renderGroupInviteItem = ({ item }) => (
    <HStack
      bg="white"
      borderRadius="14px"
      px="16px"
      py="14px"
      mb="8px"
      alignItems="center"
      borderWidth="1px"
      borderColor="accent.lavender"
    >
      <VStack flex="1">
        <Text fontSize="15px" fontWeight="600" color="primary.400">
          {item.groupName}
        </Text>
        <Text fontSize="12px" color="primary.100">
          Invited by {item.invitedByName}
        </Text>
      </VStack>
      <HStack space="2">
        <Pressable
          onPress={() => handleAcceptGroupInvite(item)}
          bg="accent.lavender"
          px="12px"
          py="6px"
          borderRadius="8px"
        >
          <Text fontSize="12px" fontWeight="600" color="white">Join</Text>
        </Pressable>
        <Pressable
          onPress={() => handleDeclineGroupInvite(item)}
          bg="primary.50"
          px="10px"
          py="6px"
          borderRadius="8px"
        >
          <Text fontSize="12px" fontWeight="600" color="primary.200">
            Decline
          </Text>
        </Pressable>
      </HStack>
    </HStack>
  )

  const friendsData = [
    ...(requests.length > 0 ? [{ type: 'section', title: `Friend Requests (${requests.length})` }] : []),
    ...requests.map((r) => ({ ...r, type: 'request' })),
    ...(searchResults.length > 0 ? [{ type: 'section', title: 'Search Results' }] : []),
    ...searchResults.map((r) => ({ ...r, type: 'search' })),
    { type: 'section', title: `Friends (${friends.length})` },
    ...friends.map((f) => ({ ...f, type: 'friend' }))
  ]

  const groupsData = [
    ...(groupInvites.length > 0
      ? [{ type: 'section', title: `Group Invites (${groupInvites.length})` }]
      : []),
    ...groupInvites.map((i) => ({ ...i, type: 'group-invite' })),
    { type: 'section', title: `My Groups (${groups.length})` },
    ...groups.map((g) => ({ ...g, type: 'group' }))
  ]

  const renderItem = ({ item }) => {
    if (item.type === 'section') {
      return (
        <Text
          fontSize="13px"
          fontWeight="700"
          color="primary.100"
          mb="8px"
          mt="12px"
          textTransform="uppercase"
          letterSpacing="0.5px"
        >
          {item.title}
        </Text>
      )
    }
    if (item.type === 'request') return renderRequestItem({ item })
    if (item.type === 'search') return renderSearchItem({ item })
    if (item.type === 'friend') return renderFriendItem({ item })
    if (item.type === 'group') return renderGroupItem({ item })
    if (item.type === 'group-invite') return renderGroupInviteItem({ item })
    return null
  }

  return (
    <TabScreen>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F6FA' }}>
        <StatusBar barStyle="dark-content" />

        <VStack px="20px" pt="8px" pb="4px">
          <HStack alignItems="center" justifyContent="space-between">
            <Text fontSize="28px" fontWeight="800" color="primary.400">
              Social
            </Text>
            <Pressable
              onPress={() => navigate('Referrals')}
              bg="secondary.400"
              borderRadius="10px"
              px="12px"
              py="6px"
            >
              <HStack alignItems="center" space="1">
                <Text fontSize="14px">{'\uD83C\uDF81'}</Text>
                <Text fontSize="12px" fontWeight="700" color="primary.400">
                  Invite
                </Text>
              </HStack>
            </Pressable>
          </HStack>

          {/* Tab Switcher */}
          <HStack mt="12px" bg="white" borderRadius="12px" p="4px" borderWidth="1px" borderColor="border">
            <Pressable
              flex="1"
              onPress={() => setActiveTab('friends')}
              bg={activeTab === 'friends' ? 'primary.400' : 'transparent'}
              borderRadius="10px"
              py="8px"
              alignItems="center"
            >
              <HStack alignItems="center" space="1">
                <Text
                  fontSize="14px"
                  fontWeight="600"
                  color={activeTab === 'friends' ? 'white' : 'primary.200'}
                >
                  Friends
                </Text>
                {requests.length > 0 && (
                  <Badge
                    bg="accent.coral"
                    rounded="full"
                    _text={{ fontSize: '10px', color: 'white', fontWeight: '700' }}
                    px="6px"
                    py="0"
                  >
                    {requests.length}
                  </Badge>
                )}
              </HStack>
            </Pressable>
            <Pressable
              flex="1"
              onPress={() => setActiveTab('groups')}
              bg={activeTab === 'groups' ? 'primary.400' : 'transparent'}
              borderRadius="10px"
              py="8px"
              alignItems="center"
            >
              <HStack alignItems="center" space="1">
                <Text
                  fontSize="14px"
                  fontWeight="600"
                  color={activeTab === 'groups' ? 'white' : 'primary.200'}
                >
                  Groups
                </Text>
                {groupInvites.length > 0 && (
                  <Badge
                    bg="accent.lavender"
                    rounded="full"
                    _text={{ fontSize: '10px', color: 'white', fontWeight: '700' }}
                    px="6px"
                    py="0"
                  >
                    {groupInvites.length}
                  </Badge>
                )}
              </HStack>
            </Pressable>
          </HStack>

          {/* Search Bar (Friends tab only) */}
          {activeTab === 'friends' && (
            <Input
              mt="12px"
              placeholder="Search users to add..."
              value={searchQuery}
              onChangeText={handleSearch}
              bg="white"
              borderRadius="12px"
              borderColor="border"
              fontSize="14px"
              h="44px"
              px="16px"
              _focus={{ borderColor: 'secondary.400', bg: 'white' }}
            />
          )}

          {/* Create Group Button (Groups tab only) */}
          {activeTab === 'groups' && (
            <Pressable
              mt="12px"
              onPress={() => setShowCreateGroup(true)}
              bg="accent.lavender"
              borderRadius="12px"
              py="12px"
              alignItems="center"
            >
              <Text fontSize="14px" fontWeight="700" color="white">
                + Create Walking Group
              </Text>
            </Pressable>
          )}
        </VStack>

        <FlatList
          data={activeTab === 'friends' ? friendsData : groupsData}
          keyExtractor={(item, index) => `${item.type}-${item.id || index}`}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Flex align="center" justify="center" py="60px">
              <Text fontSize="16px" fontWeight="600" color="primary.100">
                {activeTab === 'friends'
                  ? 'Search for friends to get started!'
                  : 'Create a group to walk together!'}
              </Text>
            </Flex>
          }
        />

        {/* Create Group Modal */}
        <Modal isOpen={showCreateGroup} onClose={() => setShowCreateGroup(false)}>
          <Modal.Content maxW="400px" borderRadius="20px">
            <Modal.CloseButton />
            <Modal.Header borderBottomWidth="0">
              <Text fontSize="18px" fontWeight="700" color="primary.400">
                Create Walking Group
              </Text>
            </Modal.Header>
            <Modal.Body>
              <FormControl mb="3">
                <FormControl.Label _text={{ fontSize: '13px', fontWeight: '600' }}>
                  Group Name
                </FormControl.Label>
                <Input
                  value={groupName}
                  onChangeText={setGroupName}
                  placeholder="e.g., Morning Walkers"
                  borderRadius="12px"
                  fontSize="14px"
                />
              </FormControl>
              <FormControl>
                <FormControl.Label _text={{ fontSize: '13px', fontWeight: '600' }}>
                  Description (optional)
                </FormControl.Label>
                <Input
                  value={groupDesc}
                  onChangeText={setGroupDesc}
                  placeholder="What's this group about?"
                  borderRadius="12px"
                  fontSize="14px"
                  multiline
                />
              </FormControl>
            </Modal.Body>
            <Modal.Footer borderTopWidth="0">
              <Button
                flex="1"
                bg="accent.lavender"
                borderRadius="12px"
                onPress={handleCreateGroup}
                _text={{ fontWeight: '700' }}
                _pressed={{ bg: 'accent.lavender', opacity: 0.8 }}
              >
                Create Group
              </Button>
            </Modal.Footer>
          </Modal.Content>
        </Modal>
      </SafeAreaView>
    </TabScreen>
  )
}

export default Social
