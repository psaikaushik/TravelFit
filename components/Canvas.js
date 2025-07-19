import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Dimensions,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { calculateTerritoryBonus } from '../utils/userUtils';

const { width } = Dimensions.get('window');
const BOX_SIZE = Math.floor((width - 40) / 20); // 20 boxes per row with padding

const Canvas = ({ data, onBoxClaim, user }) => {
  const [animations, setAnimations] = useState({});

  const handleBoxPress = (rowIndex, colIndex) => {
    if (!user) return;

    const box = data[rowIndex][colIndex];
    if (box.checked) return;

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Create animation for the box
    const animationId = `${rowIndex}-${colIndex}`;
    const scaleAnim = new Animated.Value(1);
    
    setAnimations(prev => ({
      ...prev,
      [animationId]: scaleAnim
    }));

    // Animate the box
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Calculate territory bonus
    const bonus = calculateTerritoryBonus(data, rowIndex, colIndex, user.color);
    
    // Call the claim function
    onBoxClaim(rowIndex, colIndex, bonus);
  };

  const renderBox = (box, rowIndex, colIndex) => {
    const animationId = `${rowIndex}-${colIndex}`;
    const scaleAnim = animations[animationId] || new Animated.Value(1);

    const boxStyle = [
      styles.box,
      {
        backgroundColor: box.checked ? box.color : '#333333',
        borderColor: box.checked ? box.color : '#555555',
        transform: [{ scale: scaleAnim }],
      },
    ];

    if (box.checked) {
      boxStyle.push(styles.claimedBox);
    }

    return (
      <Animated.View key={box.id} style={boxStyle}>
        <TouchableOpacity
          style={styles.boxTouchable}
          onPress={() => handleBoxPress(rowIndex, colIndex)}
          activeOpacity={0.7}
          disabled={box.checked}
        >
          {box.checked && (
            <View style={[styles.checkmark, { backgroundColor: box.color }]}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderRow = (row, rowIndex) => (
    <View key={rowIndex} style={styles.row}>
      {row.map((box, colIndex) => renderBox(box, rowIndex, colIndex))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.canvasContainer}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          {data.map((row, rowIndex) => renderRow(row, rowIndex))}
        </ScrollView>
      </View>
      
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {data.flat().filter(box => box.checked).length} / {data.length * data[0].length} boxes claimed
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${(data.flat().filter(box => box.checked).length / (data.length * data[0].length)) * 100}%` 
              }
            ]} 
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  canvasContainer: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  box: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderWidth: 1,
    borderColor: '#555555',
    backgroundColor: '#333333',
    marginRight: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  claimedBox: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  boxTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    width: BOX_SIZE * 0.6,
    height: BOX_SIZE * 0.6,
    borderRadius: BOX_SIZE * 0.3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  checkmarkText: {
    color: '#000',
    fontSize: BOX_SIZE * 0.3,
    fontWeight: 'bold',
  },
  progressContainer: {
    padding: 20,
    backgroundColor: '#2a2a2a',
    borderTopWidth: 1,
    borderTopColor: '#444444',
  },
  progressText: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#444444',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 2,
  },
});

export default Canvas; 