import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './_layout';

// Define the type for a pool
interface Pool {
  id: string;
  name: string;
  members: number;
  amountPerPerson: number;
  dueDate: string;
  organizer: string;
  description: string;
}

// Mock data for available pools
const mockPools: Pool[] = [
  {
    id: '1',
    name: 'Weekend Trip to Tahoe',
    members: 8,
    amountPerPerson: 150,
    dueDate: '2023-08-15',
    organizer: 'Alex Smith',
    description: 'Pool for our upcoming weekend trip including accommodation and activities.'
  },
  {
    id: '2',
    name: 'Birthday Gift for Sarah',
    members: 12,
    amountPerPerson: 25,
    dueDate: '2023-07-30',
    organizer: 'Mike Johnson',
    description: 'Collecting money for Sarah\'s surprise birthday gift.'
  },
  {
    id: '3',
    name: 'Office Holiday Party',
    members: 25,
    amountPerPerson: 50,
    dueDate: '2023-12-10',
    organizer: 'Jenny Williams',
    description: 'Annual office holiday party fund.'
  },
  {
    id: '4',
    name: 'Fantasy Football League',
    members: 14,
    amountPerPerson: 100,
    dueDate: '2023-09-01',
    organizer: 'Chris Davis',
    description: 'Buy-in for our fantasy football league this season.'
  },
  {
    id: '5',
    name: 'Team Building Event',
    members: 18,
    amountPerPerson: 75,
    dueDate: '2023-10-05',
    organizer: 'Rachel Green',
    description: 'Fund for the upcoming team building retreat.'
  }
];

// Mock pool terms text
const poolTermsText = `
# Pool Participation Agreement

## 1. Pool Participation

By joining this pool, you agree to contribute the specified amount by the due date. Your participation is binding once you accept these terms.

## 2. Payment Obligations

You are responsible for making your payment on time. Failure to do so may result in removal from the pool and potential forfeiture of any benefits.

## 3. Refund Policy

Refunds may be issued at the discretion of the pool organizer and are subject to the following conditions:
- Request made at least 7 days before the due date
- Approved by the pool organizer
- Subject to a processing fee of 5% of the contribution amount

## 4. Dispute Resolution

Any disputes regarding pool funds, distribution, or participation will be resolved through discussion with the pool organizer. If no resolution is reached, the matter may be escalated through Pool's dispute resolution process.

## 5. Pool Changes

The pool organizer reserves the right to modify pool details (including amount, due date, or purpose) with reasonable notice to all participants. Major changes require agreement from at least 75% of pool members.

## 6. Privacy and Data Collection

Information shared within the pool is considered private to pool members. The pool organizer will have access to your payment information and contribution status.

## 7. Communication

All official pool communications will be sent through the Pool app. You are responsible for keeping your contact information updated.

## 8. Termination

The pool organizer reserves the right to terminate the pool with appropriate notice and refund of contributions if necessary.

By accepting these terms, you acknowledge that you have read, understood, and agree to be bound by all conditions outlined above.
`;

export default function JoinPoolScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const themeClass = isDarkMode ? 'bg-pool-dark' : 'bg-white';
  const textClass = isDarkMode ? 'text-white' : 'text-pool-dark';
  const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';

  const handlePoolSelect = (pool: Pool) => {
    setSelectedPool(pool);
    setShowTerms(true);
    setTermsAccepted(false);
  };

  const handleAcceptTerms = () => {
    // In a real app, you would make an API call to join the pool here
    setShowTerms(false);
    setTermsAccepted(true);
    
    // Show success for a moment, then go back to pools
    setTimeout(() => {
      router.replace('/(tabs)/pools');
    }, 1500);
  };

  const handleDeclineTerms = () => {
    setShowTerms(false);
  };

  return (
    <SafeAreaView className={`flex-1 ${themeClass}`}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      {/* Header */}
      <View className={`flex-row items-center justify-between px-4 py-4 border-b ${borderClass}`}>
        <Pressable 
          onPress={() => router.back()} 
          className="p-2"
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? 'white' : '#1A2526'} />
        </Pressable>
        <Text className={`text-lg font-bold ${textClass}`}>Join a Pool</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Success message when terms are accepted */}
      {termsAccepted && (
        <View className="absolute z-10 top-0 left-0 right-0 bottom-0 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white p-6 rounded-lg w-4/5 items-center">
            <Ionicons name="checkmark-circle" size={60} color="#0074E4" />
            <Text className="text-pool-dark text-xl font-bold mt-4">Successfully Joined!</Text>
            <Text className="text-gray-600 text-center mt-2">
              You have successfully joined {selectedPool?.name}
            </Text>
          </View>
        </View>
      )}

      {/* Available pools list */}
      <View className="flex-1 px-4 py-4">
        <Text className={`text-lg font-semibold mb-4 ${textClass}`}>Available Pools</Text>
        
        <FlatList
          data={mockPools}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handlePoolSelect(item)}
              className={`p-4 mb-4 rounded-lg border ${borderClass}`}
            >
              <Text className={`text-lg font-bold ${textClass}`}>{item.name}</Text>
              <View className="flex-row justify-between mt-2">
                <Text className="text-gray-500">Organizer: {item.organizer}</Text>
                <Text className="text-gray-500">{item.members} members</Text>
              </View>
              <View className="flex-row justify-between mt-2">
                <Text className={`font-semibold ${textClass}`}>${item.amountPerPerson}/person</Text>
                <Text className="text-gray-500">Due: {item.dueDate}</Text>
              </View>
              <Text className={`mt-2 ${textClass}`}>{item.description}</Text>
            </Pressable>
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Pool terms modal */}
      <Modal
        visible={showTerms}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTerms(false)}
      >
        <View className="flex-1 justify-end">
          <View className={`h-5/6 rounded-t-3xl ${themeClass}`}>
            <View className={`px-4 py-4 border-b ${borderClass} flex-row justify-between items-center`}>
              <Text className={`text-lg font-bold ${textClass}`}>Pool Terms & Conditions</Text>
              <Pressable onPress={() => setShowTerms(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? 'white' : '#1A2526'} />
              </Pressable>
            </View>
            
            <View className="p-4">
              <Text className={`text-lg font-bold mb-2 ${textClass}`}>{selectedPool?.name}</Text>
              <Text className={`${textClass}`}>
                Amount: ${selectedPool?.amountPerPerson} per person
              </Text>
              <Text className={`mb-4 ${textClass}`}>
                Due by: {selectedPool?.dueDate}
              </Text>
            </View>
            
            <ScrollView className="flex-1 px-4">
              <Text style={styles.termsText} className={textClass}>
                {poolTermsText}
              </Text>
            </ScrollView>
            
            <View className="p-4 flex-row space-x-4">
              <Pressable 
                onPress={handleDeclineTerms}
                className="flex-1 py-3 rounded-full border border-red-500 items-center"
              >
                <Text className="text-red-500 font-semibold">Decline</Text>
              </Pressable>
              <Pressable 
                onPress={handleAcceptTerms}
                className="flex-1 py-3 rounded-full bg-pool-blue items-center"
              >
                <Text className="text-white font-semibold">Accept & Join</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  termsText: {
    lineHeight: 24,
  }
}); 