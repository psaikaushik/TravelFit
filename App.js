import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, StatusBar, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Canvas from './components/Canvas';
import UserPanel from './components/UserPanel';
import ChatPanel from './components/ChatPanel';
import { generateUserId, generateUserColor } from './utils/userUtils';

export default function App() {
  const [user, setUser] = useState(null);
  const [canvasData, setCanvasData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    initializeUser();
    initializeCanvas();
  }, []);

  const initializeUser = async () => {
    try {
      let savedUser = await AsyncStorage.getItem('user');
      if (!savedUser) {
        const newUser = {
          id: generateUserId(),
          color: generateUserColor(),
          name: `Player${Math.floor(Math.random() * 1000)}`,
          score: 0,
          boxesClaimed: 0,
          lastClaimTime: 0,
        };
        await AsyncStorage.setItem('user', JSON.stringify(newUser));
        savedUser = JSON.stringify(newUser);
      }
      setUser(JSON.parse(savedUser));
    } catch (error) {
      console.error('Error initializing user:', error);
    }
  };

  const initializeCanvas = () => {
    // Create a 20x20 grid of unchecked boxes
    const grid = [];
    for (let i = 0; i < 20; i++) {
      const row = [];
      for (let j = 0; j < 20; j++) {
        row.push({
          id: `${i}-${j}`,
          checked: false,
          claimedBy: null,
          claimedAt: null,
          color: null,
        });
      }
      grid.push(row);
    }
    setCanvasData(grid);
    setIsLoading(false);
  };

  const handleBoxClaim = (rowIndex, colIndex) => {
    if (!user) return;

    const now = Date.now();
    const cooldownTime = 1000; // 1 second cooldown

    if (now - user.lastClaimTime < cooldownTime) {
      return; // Still in cooldown
    }

    const newCanvasData = [...canvasData];
    const box = newCanvasData[rowIndex][colIndex];

    if (!box.checked) {
      box.checked = true;
      box.claimedBy = user.id;
      box.claimedAt = now;
      box.color = user.color;

      // Update user stats
      const updatedUser = {
        ...user,
        score: user.score + 1,
        boxesClaimed: user.boxesClaimed + 1,
        lastClaimTime: now,
      };

      setUser(updatedUser);
      setCanvasData(newCanvasData);
      AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      // Check if canvas is complete
      const totalBoxes = 20 * 20;
      const claimedBoxes = newCanvasData.flat().filter(box => box.checked).length;
      
      if (claimedBoxes >= totalBoxes) {
        setTimeout(() => {
          alert('Canvas Complete! Starting new round...');
          initializeCanvas();
        }, 1000);
      }
    }
  };

  const addChatMessage = (message) => {
    const newMessage = {
      id: Date.now(),
      userId: user?.id,
      userName: user?.name,
      userColor: user?.color,
      message,
      timestamp: new Date().toLocaleTimeString(),
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Collaborative Canvas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <UserPanel 
        user={user} 
        onToggleChat={() => setShowChat(!showChat)}
        showChat={showChat}
      />
      
      <Canvas 
        data={canvasData} 
        onBoxClaim={handleBoxClaim}
        user={user}
      />
      
      {showChat && (
        <ChatPanel 
          messages={chatMessages}
          onSendMessage={addChatMessage}
          user={user}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
  },
});
