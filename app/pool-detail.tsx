import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, StyleSheet, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTheme } from './_layout';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pool } from './models/firebase/pool';
import { Payment } from './models/firebase/payment';
import { getPoolById } from './services/firebase/poolService';
import { getPaymentsByPool } from './services/firebase/paymentService';
import { useStripeService } from './services/stripe/stripeService';

export default function PoolDetailScreen() {
  const { poolId } = useLocalSearchParams();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const textColor = isDarkMode ? 'text-white' : 'text-pool-dark';
  const themeClass = isDarkMode ? 'dark-mode' : 'light-mode';
  const bgColor = isDarkMode ? '#0A1121' : '#F5F7FA';
  const { createCard } = useStripeService();
  
  const [pool, setPool] = useState<Pool | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<Payment[]>([]);
  const [accountDetails, setAccountDetails] = useState<any>(null);
  
  // Modal states
  const [showMembersModalVisible, setShowMembersModalVisible] = useState(false);
  const [showCardModalVisible, setShowCardModalVisible] = useState(false);
  const [cardDetails, setCardDetails] = useState<any>(null);
  const [isLoadingCard, setIsLoadingCard] = useState(false);

  // Card gradient colors
  const cardGradient = ['#7558B2', '#5E70C4'];

  useEffect(() => {
    async function fetchPoolData() {
      if (!poolId) return;
      
      try {
        setIsLoading(true);
        // Fetch pool details
        const poolData = await getPoolById(poolId as string);
        setPool(poolData);
        
        if (poolData) {
          // Fetch connect account details
          await fetchConnectAccountDetails(poolData.stripeConnectAccountId);
          
          // Fetch pool activities
          const poolActivities = await getPaymentsByPool(poolData.id);
          setActivities(poolActivities);
        }
      } catch (error) {
        console.error("Error fetching pool details:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPoolData();
  }, [poolId]);

  const fetchConnectAccountDetails = async (connectAccountId: string) => {
    try {
      const response = await fetch(`/api/stripe/connect-account/${connectAccountId}`);
      if (response.ok) {
        const data = await response.json();
        setAccountDetails(data.connectAccount);
      }
    } catch (error) {
      console.error("Error fetching connect account details:", error);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  // Show members modal
  const handleShowMembers = () => {
    setShowMembersModalVisible(true);
  };

  // Show card details
  const handleShowCard = async () => {
    try {
      setIsLoadingCard(true);
      
      // Assuming the pool has a cardholderId or we can use the connectAccountId
      const cardholderId = pool?.stripeConnectAccountId || '';
      
      // Fetch card details from Stripe (usually you would retrieve existing cards,
      // but for this example we'll simulate retrieving a card)
      
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set mock card details - in a real app, you would get this from your Stripe API
      setCardDetails({
        brand: 'Visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2025,
        cardholderName: pool?.name || 'Pool Member',
        funding: 'credit',
        type: 'virtual',
        status: 'active',
        walletUrl: Platform.OS === 'ios' 
          ? 'https://apple.com/wallet' 
          : 'https://pay.google.com'
      });
      
      setShowCardModalVisible(true);
    } catch (error) {
      console.error("Error fetching card details:", error);
    } finally {
      setIsLoadingCard(false);
    }
  };

  // Add card to wallet
  const addToWallet = () => {
    // In a real implementation, you would use the appropriate native modules
    // to add cards to Apple Wallet or Google Wallet
    
    // For iOS, you would typically use PassKit: https://developer.apple.com/documentation/passkit
    // For Android, you would use the Google Wallet API: https://developers.google.com/wallet
    
    console.log(`Adding card to ${Platform.OS === 'ios' ? 'Apple' : 'Google'} Wallet`);
    
    // This would open the native wallet app
    // For demonstration, we'll just close the modal
    setShowCardModalVisible(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView className={`flex-1 ${themeClass}`} style={{ backgroundColor: bgColor }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDarkMode ? '#FFFFFF' : '#000000'} />
        </View>
      </SafeAreaView>
    );
  }

  if (!pool) {
    return (
      <SafeAreaView className={`flex-1 ${themeClass}`} style={{ backgroundColor: bgColor }}>
        <View className="flex-1 items-center justify-center p-4">
          <Text className={`${textColor} text-lg font-semibold mb-2`}>Pool Not Found</Text>
          <TouchableOpacity onPress={handleBackPress}>
            <Text className="text-pool-blue">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    backButton: {
      marginRight: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDarkMode ? '#FFFFFF' : '#000000',
    },
    cardContainer: {
      margin: 16,
      marginBottom: 28,
      borderRadius: 16,
      overflow: 'visible',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.75,
      shadowRadius: 24,
      elevation: 30,
      transform: [{ translateY: -4 }],
    },
    gradient: {
      padding: 24,
      borderRadius: 16,
      borderWidth: 0.5,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    membersInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    membersText: {
      color: 'white',
      fontSize: 16,
      marginLeft: 8,
    },
    adminBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 16,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    adminText: {
      color: 'white',
      fontSize: 14,
    },
    balanceContainer: {
      alignItems: 'center',
      marginVertical: 20,
    },
    balanceLabel: {
      color: 'white',
      fontSize: 16,
      opacity: 0.8,
      marginBottom: 8,
    },
    balanceAmount: {
      color: 'white',
      fontSize: 48,
      fontWeight: 'bold',
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
    },
    actionButton: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 8,
      marginHorizontal: 4,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 6,
    },
    buttonText: {
      color: 'white',
      marginLeft: 8,
      fontSize: 16,
    },
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 16,
      paddingHorizontal: 16,
    },
    actionOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: bgColor,
      borderRadius: 8,
      minWidth: 150,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 5,
    },
    actionOptionText: {
      color: isDarkMode ? '#FFFFFF' : '#000000',
      marginLeft: 8,
      fontSize: 14,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDarkMode ? '#FFFFFF' : '#000000',
      marginTop: 16,
      marginBottom: 8,
      paddingHorizontal: 16,
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: bgColor,
      marginHorizontal: 16,
      marginVertical: 6,
      padding: 16,
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
    blankActivityText: {
      color: '#9CA3AF',
      textAlign: 'center',
      padding: 20,
    }
  });

  return (
    <SafeAreaView className={`flex-1 ${themeClass}`} style={{ backgroundColor: bgColor }}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
        <Text style={styles.title}>{pool.name}</Text>
      </View>
      
      <ScrollView>
        {/* Pool Card */}
        <View style={styles.cardContainer}>
          <LinearGradient
            colors={cardGradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Card Header with Members */}
            <View style={styles.cardHeader}>
              <TouchableOpacity style={styles.membersInfo} onPress={handleShowMembers}>
                <Ionicons name="people" size={20} color="white" />
                <Text style={styles.membersText}>{pool.memberIds.length} members</Text>
              </TouchableOpacity>
              <View style={styles.adminBadge}>
                <Text style={styles.adminText}>Admin</Text>
              </View>
            </View>
            
            {/* Balance */}
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={styles.balanceAmount}>${pool.balance.toFixed(2)}</Text>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.actionButton} onPress={handleShowCard}>
                <Ionicons name="card-outline" size={20} color="white" />
                <Text style={styles.buttonText}>Card</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="add-circle-outline" size={20} color="white" />
                <Text style={styles.buttonText}>Top Off</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { paddingHorizontal: 10 }]}>
                <Ionicons name="refresh-outline" size={20} color="white" />
                <Text style={styles.buttonText}>Recurring</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
        
        {/* Pool Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionOption}>
            <Ionicons name="document-text-outline" size={20} color={isDarkMode ? 'white' : '#000000'} />
            <Text style={styles.actionOptionText}>View Pool Terms</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionOption}>
            <Ionicons name="share-social-outline" size={20} color={isDarkMode ? 'white' : '#000000'} />
            <Text style={styles.actionOptionText}>Share Pool</Text>
          </TouchableOpacity>
        </View>
        
        {/* Activity Section */}
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
          <Text style={styles.sectionTitle}>Pool Activity</Text>
          {activities.length === 0 ? (
            <Text style={styles.blankActivityText}>No activity yet</Text>
          ) : (
            activities.map((activity) => (
              <View key={activity.id} style={{
                ...styles.activityItem,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 6,
                elevation: 6,
              }}>
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
                    {new Date(activity.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
      </ScrollView>
      
      {/* Members Modal */}
      <Modal
        visible={showMembersModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMembersModalVisible(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}>
          <View style={{
            width: '90%',
            backgroundColor: isDarkMode ? '#141E2E' : '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 10,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#000000' }}>Pool Members</Text>
              <TouchableOpacity onPress={() => setShowMembersModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#000000'} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={pool?.memberIds || []}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                }}>
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#6363AB',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                    <Text style={{ color: 'white', fontSize: 16 }}>{item.substring(0, 2).toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 16, color: isDarkMode ? '#FFFFFF' : '#000000' }}>Member ID: {item.substring(0, 8)}...</Text>
                    {item === pool?.ownerId && (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="shield-checkmark" size={14} color="#6363AB" />
                        <Text style={{ color: '#6363AB', marginLeft: 4, fontSize: 14 }}>Admin</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <Text style={{ textAlign: 'center', color: '#9CA3AF', padding: 20 }}>No members found</Text>
              }
            />
          </View>
        </View>
      </Modal>
      
      {/* Card Modal */}
      <Modal
        visible={showCardModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCardModalVisible(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}>
          <View style={{
            width: '90%',
            backgroundColor: isDarkMode ? '#141E2E' : '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 10,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#000000' }}>Pool Card</Text>
              <TouchableOpacity onPress={() => setShowCardModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#000000'} />
              </TouchableOpacity>
            </View>
            
            {isLoadingCard ? (
              <ActivityIndicator size="large" color={isDarkMode ? '#FFFFFF' : '#000000'} />
            ) : cardDetails ? (
              <View>
                <LinearGradient
                  colors={cardGradient as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    padding: 20,
                    borderRadius: 12,
                    marginBottom: 20,
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 16, opacity: 0.8, marginBottom: 12 }}>
                    {cardDetails.brand}
                  </Text>
                  <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
                    •••• •••• •••• {cardDetails.last4}
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: 'white', fontSize: 14 }}>
                      Exp: {cardDetails.expMonth}/{cardDetails.expYear.toString().substring(2)}
                    </Text>
                    <Text style={{ color: 'white', fontSize: 14 }}>
                      {cardDetails.type.toUpperCase()}
                    </Text>
                  </View>
                </LinearGradient>
                
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 16, color: isDarkMode ? '#FFFFFF' : '#000000', marginBottom: 8 }}>
                    Cardholder: {cardDetails.cardholderName}
                  </Text>
                  <Text style={{ fontSize: 16, color: isDarkMode ? '#FFFFFF' : '#000000', marginBottom: 8 }}>
                    Status: <Text style={{ color: '#4CAF50' }}>{cardDetails.status}</Text>
                  </Text>
                  <Text style={{ fontSize: 16, color: isDarkMode ? '#FFFFFF' : '#000000' }}>
                    Type: {cardDetails.funding} card
                  </Text>
                </View>
                
                <TouchableOpacity
                  onPress={addToWallet}
                  style={{
                    backgroundColor: Platform.OS === 'ios' ? '#000000' : '#4285F4',
                    borderRadius: 8,
                    padding: 16,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons 
                    name={Platform.OS === 'ios' ? 'logo-apple' : 'logo-google'} 
                    size={20} 
                    color="white" 
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>
                    Add to {Platform.OS === 'ios' ? 'Apple' : 'Google'} Wallet
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={{ textAlign: 'center', color: '#9CA3AF', padding: 20 }}>No card information available</Text>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
} 