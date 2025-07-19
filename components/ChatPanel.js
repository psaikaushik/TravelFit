import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const ChatPanel = ({ messages, onSendMessage, user }) => {
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef();

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim() && user) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const renderMessage = (message) => (
    <View key={message.id} style={styles.messageContainer}>
      <View style={styles.messageHeader}>
        <View style={[styles.userColor, { backgroundColor: message.userColor }]} />
        <Text style={styles.userName}>{message.userName}</Text>
        <Text style={styles.timestamp}>{message.timestamp}</Text>
      </View>
      <Text style={styles.messageText}>{message.message}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>Chat</Text>
        <Text style={styles.participantCount}>
          {messages.length > 0 ? `${new Set(messages.map(m => m.userId)).size} participants` : 'No messages yet'}
        </Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Start the conversation! 🎨
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Coordinate with other players or just chat while claiming boxes!
            </Text>
          </View>
        ) : (
          messages.map(renderMessage)
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor="#888888"
          multiline
          maxLength={200}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 300,
    backgroundColor: '#2a2a2a',
    borderTopWidth: 1,
    borderTopColor: '#444444',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  headerText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  participantCount: {
    color: '#888888',
    fontSize: 12,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  messageContainer: {
    marginVertical: 8,
    paddingVertical: 8,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  userName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  timestamp: {
    color: '#888888',
    fontSize: 12,
  },
  messageText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#444444',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#444444',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
    marginRight: 10,
    maxHeight: 80,
  },
  sendButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#666666',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ChatPanel; 