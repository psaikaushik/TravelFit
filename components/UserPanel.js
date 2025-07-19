import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const UserPanel = ({ user, onToggleChat, showChat }) => {
  if (!user) return null;

  return (
    <LinearGradient
      colors={['#2a2a2a', '#1a1a1a']}
      style={styles.container}
    >
      <View style={styles.userInfo}>
        <View style={styles.userColorContainer}>
          <View style={[styles.userColor, { backgroundColor: user.color }]} />
        </View>
        
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userStats}>
            Score: {user.score} • Boxes: {user.boxesClaimed}
          </Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.chatButton, showChat && styles.chatButtonActive]}
          onPress={onToggleChat}
        >
          <Text style={styles.chatButtonText}>
            {showChat ? '💬' : '💬'}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userColorContainer: {
    marginRight: 12,
  },
  userColor: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userStats: {
    color: '#cccccc',
    fontSize: 14,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#444444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  chatButtonActive: {
    backgroundColor: '#4ECDC4',
  },
  chatButtonText: {
    fontSize: 20,
  },
});

export default UserPanel; 