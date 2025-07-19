// Generate a unique user ID
export const generateUserId = () => {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Available colors for users
const userColors = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Mint
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Seafoam
  '#F7DC6F', // Gold
  '#BB8FCE', // Lavender
  '#85C1E9', // Sky Blue
  '#F8C471', // Orange
  '#82E0AA', // Green
  '#F1948A', // Coral
  '#85C1E9', // Light Blue
  '#F7DC6F', // Bright Yellow
  '#D7BDE2', // Light Purple
  '#A9DFBF', // Light Green
  '#FAD7A0', // Peach
  '#AED6F1', // Powder Blue
  '#F9E79F', // Cream
];

// Generate a random user color
export const generateUserColor = () => {
  const randomIndex = Math.floor(Math.random() * userColors.length);
  return userColors[randomIndex];
};

// Get all available colors (for color selection)
export const getAvailableColors = () => {
  return userColors;
};

// Calculate territory bonus for claiming adjacent boxes
export const calculateTerritoryBonus = (canvasData, rowIndex, colIndex, userColor) => {
  const adjacentPositions = [
    [rowIndex - 1, colIndex], // Top
    [rowIndex + 1, colIndex], // Bottom
    [rowIndex, colIndex - 1], // Left
    [rowIndex, colIndex + 1], // Right
  ];

  let bonus = 0;
  adjacentPositions.forEach(([row, col]) => {
    if (row >= 0 && row < canvasData.length && col >= 0 && col < canvasData[0].length) {
      const adjacentBox = canvasData[row][col];
      if (adjacentBox.checked && adjacentBox.color === userColor) {
        bonus += 1; // Bonus point for each adjacent same-color box
      }
    }
  });

  return bonus;
};

// Check if user can claim a box (cooldown and availability)
export const canClaimBox = (user, box) => {
  if (!user || box.checked) return false;
  
  const now = Date.now();
  const cooldownTime = 1000; // 1 second cooldown
  
  return now - user.lastClaimTime >= cooldownTime;
};

// Calculate user's territory size
export const calculateTerritorySize = (canvasData, userId) => {
  return canvasData.flat().filter(box => box.claimedBy === userId).length;
};

// Find largest contiguous territory for a user
export const findLargestContiguousTerritory = (canvasData, userId) => {
  const visited = new Set();
  let maxSize = 0;

  const dfs = (row, col) => {
    if (row < 0 || row >= canvasData.length || 
        col < 0 || col >= canvasData[0].length ||
        visited.has(`${row}-${col}`) ||
        canvasData[row][col].claimedBy !== userId) {
      return 0;
    }

    visited.add(`${row}-${col}`);
    let size = 1;

    // Check all 4 directions
    size += dfs(row - 1, col); // Top
    size += dfs(row + 1, col); // Bottom
    size += dfs(row, col - 1); // Left
    size += dfs(row, col + 1); // Right

    return size;
  };

  for (let i = 0; i < canvasData.length; i++) {
    for (let j = 0; j < canvasData[0].length; j++) {
      if (!visited.has(`${i}-${j}`) && canvasData[i][j].claimedBy === userId) {
        const territorySize = dfs(i, j);
        maxSize = Math.max(maxSize, territorySize);
      }
    }
  }

  return maxSize;
}; 