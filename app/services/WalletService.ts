import { ethers } from 'ethers';
import firestore from '@react-native-firebase/firestore';

// Create a wallet for a user
export const createUserWallet = async (userId: string, email: string): Promise<string> => {
  try {
    console.log(`Creating wallet for user: ${userId}`);
    
    // Generate a new Ethereum wallet
    const wallet = ethers.Wallet.createRandom();
    
    
    const db = firestore();
    
    // Store wallet info in Firestore
    await db.collection('users').doc(userId).update({
      walletAddress: wallet.address,
      // this is simplified 
      encryptedWallet: JSON.stringify({
        address: wallet.address,
        // WARNING: this is just for demo
        privateKey: wallet.privateKey
      }),
      dropletBalance: 0,
      badges: []
    });
    
    console.log(`Wallet created for ${userId}: ${wallet.address}`);
    return wallet.address;
  } catch (error) {
    console.error('Error creating wallet:', error);
    
    return '';
  }
};

// Get user wallet address
export const getUserWalletAddress = async (userId: string): Promise<string> => {
  try {
    const db = firestore();
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      
      return '';
    }
    
    const userData = userDoc.data();
    
    return userData?.walletAddress || '';
  } catch (error) {
    console.error('Error getting wallet address:', error);
    
    return '';
  }
};

// Award droplets to a user
export const awardDroplets = async (userId: string, amount: number, reason: string): Promise<string> => {
  try {
    const db = firestore();
    // Get user data
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const currentBalance = userData?.dropletBalance || 0;
    
    // Update user balance
    await userRef.update({
      dropletBalance: currentBalance + amount,
      transactions: [...(userData?.transactions || []), {
        type: 'DROPLET_REWARD',
        amount,
        reason,
        timestamp: new Date().toISOString(),
        txHash: `simulated_${Date.now()}`
      }]
    });
    
    console.log(`Awarded ${amount} droplets to ${userId}`);
    return `simulated_${Date.now()}`;
  } catch (error) {
    console.error('Error awarding droplets:', error);
    
    return '';
  }
};

// Award badge to a user (simulated for Base Batches submission)
export const awardBadge = async (userId: string, badgeId: number, badgeName: string): Promise<string> => {
  try {
    const db = firestore();
    // Get user data
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const existingBadges = userData?.badges || [];
    
    // Check if user already has this badge
    if (existingBadges.some((badge: any) => badge.id === badgeId)) {
      console.log(`User ${userId} already has badge ${badgeId}`);

      return '';
    }
    
    // Add badge to user
    await userRef.update({
      badges: [...existingBadges, {
        id: badgeId,
        name: badgeName,
        awardedAt: new Date().toISOString()
      }]
    });
    
    console.log(`Awarded badge ${badgeId} to ${userId}`);
    return `simulated_${Date.now()}`;
  } catch (error) {
    console.error('Error awarding badge:', error);
    
    return '';
  }
};