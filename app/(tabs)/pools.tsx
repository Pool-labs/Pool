import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../_layout';
import { useAuth } from '@/app/context/AuthContext';
import { Pool } from '../models/firebase/pool';
import { getPoolsByMember } from '../services/firebase/poolService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Payment } from '../models/firebase/payment';
import { getPaymentsByUser, getRecentPayments } from '../services/firebase/paymentService';
import { GestureHandlerRootView, PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';

export default function PoolsScreen() {
  const { isDarkMode } = useTheme();
  const { user, userData } = useAuth();
  const router = useRouter();
  const themeClass = isDarkMode ? 'dark-mode' : 'light-mode';
  const textColor = isDarkMode ? 'text-white' : 'text-pool-dark';
  const bgColor = isDarkMode ? '#0A1121' : '#F5F7FA';
  
  const [pools, setPools] = useState<Pool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedPoolMembers, setSelectedPoolMembers] = useState<string[]>([]);
  const [recentActivities, setRecentActivities] = useState<Payment[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Predefined gradient sets for different cards
  const gradientSets = [
    ['#7558B2', '#5E70C4'], // Purple to blue (like the prototype)
    ['#4158D0', '#C850C0'], // Blue to purple
    ['#0093E9', '#80D0C7'], // Blue to teal
    ['#FF9A8B', '#FF6A88'], // Salmon to pink
    ['#FBAB7E', '#F7CE68'], // Orange to yellow
  ];

  useEffect(() => {
    async function fetchUserPools() {
      try {
        setIsLoading(true);
        
        // If no user ID is available, don't try to fetch data but still turn off loading state
        if (!userData?.id) {
          setIsLoading(false);
          return;
        }
        
        // Fetch pools the user is a member of
        const userPools = await getPoolsByMember(userData.id);
        setPools(userPools);
        
        // Fetch recent activities (payments) for the user
        const userPayments = await getPaymentsByUser(userData.id);
        setRecentActivities(userPayments);
      } catch (error) {
        console.error("Error fetching pool data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUserPools();
    
    // Add a safety timeout to ensure loading state is turned off
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 5000); // 5 second maximum loading time
    
    return () => clearTimeout(safetyTimer);
  }, [userData?.id]);

  // Function to get gradient colors based on pool index
  const getGradientColors = (index: number) => {
    return gradientSets[index % gradientSets.length];
  };
  
  // Navigation to hamburger menu
  const openMenu = () => {
    router.push('/menu' as any);
  };

  // Navigate to pool detail screen
  const navigateToPoolDetail = (poolId: string) => {
    router.push({
      pathname: '/pool-detail',
      params: { poolId }
    });
  };

  // Show members modal
  const handleShowMembers = (members: string[]) => {
    setSelectedPoolMembers(members);
    setShowMembersModal(true);
  };

  // Handle card navigation
  const navigateToNextCard = () => {
    if (activeCardIndex < pools.length - 1) {
      setActiveCardIndex(activeCardIndex + 1);
    }
  };

  const navigateToPreviousCard = () => {
    if (activeCardIndex > 0) {
      setActiveCardIndex(activeCardIndex - 1);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className={`flex-1 ${themeClass}`} style={{ backgroundColor: bgColor }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDarkMode ? '#fff' : '#000'} />
        </View>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    cardContainer: {
      borderRadius: 24,
      overflow: 'visible',
      marginBottom: 24,
      marginTop: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.7,
      shadowRadius: 20,
      elevation: 30,
      transform: [{ translateY: -2 }],
    },
    stackContainer: {
      height: 350,
      position: 'relative',
      paddingTop: 20,
      paddingBottom: 20,
      alignItems: 'center',
    },
    stackedCard: {
      position: 'absolute',
      width: '100%',
      borderRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.7,
      shadowRadius: 20,
      elevation: 30,
    },
    gradient: {
      padding: 24,
      borderRadius: 24,
      borderWidth: 0.5,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    poolName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 16,
    },
    balanceContainer: {
      alignItems: 'center',
      marginVertical: 16,
    },
    balanceLabel: {
      color: '#FFFFFF',
      fontSize: 16,
      opacity: 0.8,
      marginBottom: 4,
    },
    balanceAmount: {
      color: '#FFFFFF',
      fontSize: 36,
      fontWeight: 'bold',
    },
    membersContainer: {
      position: 'absolute',
      top: 16,
      right: 16,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    membersText: {
      color: '#FFFFFF',
      marginLeft: 4,
      fontSize: 14,
    },
    menuButton: {
      padding: 8,
    },
    headerContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
      zIndex: 10,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '80%',
      backgroundColor: isDarkMode ? '#1A2235' : '#FFFFFF',
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDarkMode ? '#FFFFFF' : '#000000',
      marginBottom: 16,
    },
    memberItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      width: '100%',
    },
    memberAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#6363AB',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    memberName: {
      color: isDarkMode ? '#FFFFFF' : '#000000',
      fontSize: 16,
    },
    closeButton: {
      marginTop: 16,
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: '#6363AB',
      borderRadius: 8,
    },
    closeButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDarkMode ? '#FFFFFF' : '#000000',
      marginTop: 24,
      marginBottom: 12,
      paddingHorizontal: 16,
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#1A2235' : '#FFFFFF',
      marginHorizontal: 16,
      marginVertical: 4,
      padding: 14,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    activityIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#6363AB',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    activityContent: {
      flex: 1,
    },
    activityTitle: {
      color: isDarkMode ? '#FFFFFF' : '#000000',
      fontSize: 16,
      fontWeight: '500',
    },
    activityDate: {
      color: '#9CA3AF',
      fontSize: 14,
    },
    activityAmount: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#E63946',
    },
    activityFee: {
      color: '#9CA3AF',
      fontSize: 12,
      textAlign: 'right',
    },
    noActivityText: {
      color: '#9CA3AF',
      textAlign: 'center',
      padding: 20,
    }
  });

  // Find pool name by ID for recent activities
  const getPoolNameById = (poolId: string): string => {
    const pool = pools.find(p => p.id === poolId);
    return pool ? pool.name : "Unknown Pool";
  };

  const handleGesture = (event: PanGestureHandlerGestureEvent) => {
    // Track vertical swipes for navigating cards
    const { translationY } = event.nativeEvent;
    
    if (event.nativeEvent.state === 5) { // END state
      if (translationY < -50 && activeCardIndex < pools.length - 1) {
        // Swipe up - go to next card
        navigateToNextCard();
      } else if (translationY > 50 && activeCardIndex > 0) {
        // Swipe down - go to previous card
        navigateToPreviousCard();
      }
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${themeClass}`} style={{ backgroundColor: bgColor }}>
      {/* Title */}
      <View className="px-4 pt-2 pb-0">
        <Text className={`${textColor} text-2xl font-bold`}>Your Pools</Text>
      </View>
      
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pt-2 pb-2">
          {pools.length > 0 ? (
            <GestureHandlerRootView style={styles.stackContainer}>
              <PanGestureHandler
                onGestureEvent={(e) => {
                  // Simple tracking during swipe
                }}
                onHandlerStateChange={handleGesture}
                activeOffsetY={[-20, 20]}
              >
                <View style={{ width: '100%', height: '100%' }}>
                  {pools.map((pool, index) => {
                    // Calculate the position of each card in the stack
                    const isActive = index === activeCardIndex;
                    
                    // Position each card with small offset to show stack
                    // Increase the offset to make the next card more visible behind the active one
                    const top = index > activeCardIndex ? (index - activeCardIndex) * 15 : undefined; 
                    const bottom = index < activeCardIndex ? (activeCardIndex - index) * 15 : undefined;
                    
                    // Active card always on top, hidden cards at back
                    const zIndex = isActive ? 100 : (10 - Math.abs(index - activeCardIndex));
                    
                    // Active card fully visible, others slightly faded
                    const opacity = isActive ? 1 : (Math.abs(index - activeCardIndex) <= 2 ? 0.9 : 0.5);
                    
                    // Scale down cards that aren't active
                    const scale = isActive ? 1 : 0.98;
                    
                    return (
                      <TouchableOpacity
                        key={pool.id}
                        activeOpacity={0.9}
                        style={[
                          styles.stackedCard,
                          {
                            top,
                            bottom,
                            zIndex,
                            opacity,
                            transform: [
                              { scale }
                            ],
                          },
                        ]}
                        onPress={() => {
                          if (isActive) {
                            navigateToPoolDetail(pool.id);
                          } else {
                            setActiveCardIndex(index);
                          }
                        }}
                      >
                        <LinearGradient
                          colors={getGradientColors(index) as any}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.gradient}
                        >
                          <Text style={styles.poolName}>{pool.name}</Text>
                          
                          <View style={styles.balanceContainer}>
                            <Text style={styles.balanceLabel}>Current Balance</Text>
                            <Text style={styles.balanceAmount}>${pool.balance.toFixed(2)}</Text>
                          </View>
                          
                          <TouchableOpacity 
                            style={styles.membersContainer}
                            onPress={(e) => {
                              e.stopPropagation(); // Prevent navigating to pool detail
                              handleShowMembers(pool.memberIds);
                            }}
                          >
                            <Ionicons name="people" size={18} color="white" />
                            <Text style={styles.membersText}>{pool.memberIds.length}</Text>
                          </TouchableOpacity>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  })}
                  
                  {/* Navigation dots for card stack */}
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    marginTop: 20,
                    position: 'absolute',
                    bottom: -30,
                    left: 0,
                    right: 0,
                  }}>
                    {pools.map((_, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => setActiveCardIndex(index)}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: activeCardIndex === index ? '#0074E4' : '#CCCCCC',
                          marginHorizontal: 4,
                        }}
                      />
                    ))}
                  </View>
                </View>
              </PanGestureHandler>
            </GestureHandlerRootView>
          ) : (
            <View style={{
              backgroundColor: isDarkMode ? '#141E2E' : '#EBEEF2',
              borderRadius: 16,
              padding: 24,
              marginVertical: 20,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDarkMode ? 0.4 : 0.15,
              shadowRadius: 10,
              elevation: 10,
            }}>
              <Ionicons 
                name="water-outline" 
                size={50} 
                color={isDarkMode ? '#5E70C4' : '#7558B2'} 
                style={{ marginBottom: 16 }}
              />
              <Text style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: isDarkMode ? '#FFFFFF' : '#000000',
                marginBottom: 8,
                textAlign: 'center'
              }}>
                No Pools Available
              </Text>
              <Text style={{
                fontSize: 16,
                color: isDarkMode ? '#A3BFFA' : '#6B7280',
                textAlign: 'center',
                marginBottom: 20
              }}>
                You&apos;re not a member of any pools yet. Create your first pool to get started!
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: '#0074E4',
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                onPress={() => router.push('/(tabs)/create')}
              >
                <Ionicons name="add-circle-outline" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>Create a Pool</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Recent Activities Section */}
        <View style={{
          backgroundColor: isDarkMode ? '#141E2E' : '#EBEEF2',
          borderRadius: 16,
          marginHorizontal: 12,
          paddingTop: 16,
          paddingBottom: 24,
          marginTop: 16,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDarkMode ? 0.4 : 0.15,
          shadowRadius: 10,
          elevation: 10,
        }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: isDarkMode ? '#FFFFFF' : '#000000',
            marginBottom: 16,
            paddingHorizontal: 16,
          }}>Recent Activities</Text>
          
          {recentActivities.length === 0 ? (
            <View style={{
              alignItems: 'center',
              paddingVertical: 24,
            }}>
              <Ionicons 
                name="time-outline" 
                size={40} 
                color={isDarkMode ? '#5E70C4' : '#7558B2'} 
                style={{ marginBottom: 12 }}
              />
              <Text style={{
                color: isDarkMode ? '#A3BFFA' : '#6B7280',
                textAlign: 'center',
                fontSize: 16,
                fontWeight: '500',
              }}>
                No recent activities
              </Text>
              <Text style={{
                color: isDarkMode ? '#8096B9' : '#9CA3AF',
                textAlign: 'center',
                fontSize: 14,
                marginTop: 4,
                paddingHorizontal: 20,
              }}>
                Your pool transactions will appear here
              </Text>
            </View>
          ) : (
            recentActivities.slice(0, 5).map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons 
                    name={activity.paymentMethod === 'bank_transfer' ? 'arrow-up' : 'restaurant'} 
                    size={20} 
                    color="white" 
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>
                    {activity.paymentMethod === 'bank_transfer' ? 'Withdrawal to bank' : 'Starbucks Coffee'}
                  </Text>
                  <Text style={styles.activityDate}>
                    {getPoolNameById(activity.poolId)} • {new Date(activity.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <View>
                  <Text style={styles.activityAmount}>-${activity.amount.toFixed(2)}</Text>
                  <Text style={styles.activityFee}>
                    Fee: ${(activity.amount * 0.03).toFixed(2)} (3%)
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
        
        <View style={{ 
          alignItems: 'center', 
          paddingVertical: 6,
          opacity: 0.5,
          marginBottom: 12
        }}>
          <Text style={{ 
            color: isDarkMode ? '#9CA3AF' : '#6B7280',
            fontSize: 12
          }}>
            Pool Financial • v1.0.0
          </Text>
        </View>
      </ScrollView>
      
      {/* Members Modal */}
      <Modal
        visible={showMembersModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMembersModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pool Members</Text>
            {selectedPoolMembers.map((memberId, index) => (
              <View key={memberId} style={styles.memberItem}>
                <View style={styles.memberAvatar}>
                  <Ionicons name="person" size={24} color="white" />
                </View>
                <Text style={styles.memberName}>Member {index + 1}</Text>
              </View>
            ))}
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowMembersModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
} 