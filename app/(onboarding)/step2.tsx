import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useUserService } from '../services/firebase/userService';
import { useStripeService } from '../services/stripe';

// Test account info
const TEST_ACCOUNT = {
  accountNumber: '000123456789',
  routingNumber: '110000000',
  isTestAccount: true
};

export default function Step2Screen() {
  const { user, userData } = useAuth();
  const { createUser, updateUserData, createUserWithSpecificId } = useUserService();
  const { createCustomer, createBankAccountSetupIntent, confirmSetupIntent } = useStripeService();
  const router = useRouter();
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUseTestAccount = () => {
    setAccountNumber(TEST_ACCOUNT.accountNumber);
    setRoutingNumber(TEST_ACCOUNT.routingNumber);
  };

  const handleContinue = async () => {
    if (!accountNumber || !routingNumber || !userData?.firstName || !userData?.lastName) {
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create Stripe customer
      const name = `${userData.firstName} ${userData.lastName}`;
      const email = user?.email || userData.email || '';

      // Initialize Stripe data
      let customerId;
      let paymentMethodId;

      // Always create a new Stripe customer - we won't have one yet because we haven't saved to Firestore
      console.log('Creating Stripe customer...');
      const customerResult = await createCustomer(name, email);
      customerId = customerResult?.customer?.id;
      
      if (!customerId) {
        throw new Error('Failed to create Stripe customer');
      }

      // 2. Set up and verify bank account
      console.log('setting up bank account...');
      const bankResult = await createBankAccountSetupIntent(customerId, name);
      paymentMethodId = bankResult?.setupIntent?.payment_method;
      
      if (!paymentMethodId) {
        throw new Error('Failed bank account setup intent');
      }

      // 3. Confirm bank account
      console.log('confirming bank account...');
      const confirmResult = await confirmSetupIntent(bankResult?.setupIntent?.id, paymentMethodId);
      paymentMethodId = confirmResult?.verifyMicrodeposits?.payment_method;
      
      if (!paymentMethodId) {
        throw new Error('Failed to confirm bank account');
      }

      // 4. Only store user data in Firebase after all Stripe calls are successful
      if (user) {
        console.log('Storing user data in Firebase...');
        
        // Prepare complete user data
        const bankInfo = {
          accountNumber,
          routingNumber,
          isTestAccount: accountNumber === TEST_ACCOUNT.accountNumber && 
                        routingNumber === TEST_ACCOUNT.routingNumber
        };
        
        try {
          // Create user document with Firebase auth UID
          console.log(`Creating user document with UID: ${user.uid}`);
          await createUserWithSpecificId(
            user.uid,
            email,
            name,
            "TestWalletID", // Placeholder crypto wallet ID
            customerId,
            [], // Empty pool IDs array
            paymentMethodId
          );
          
          // Update with additional user data
          console.log(`Updating user document with additional data: ${user.uid}`);
          await updateUserData(user.uid, {
            firstName: userData.firstName,
            lastName: userData.lastName,
            bankInfo,
            onboardingStep: 2 // Mark that user has completed onboarding
          });
          
          console.log('User data stored successfully, navigating to pools tab');
          // Ensure a small delay to allow Firebase to complete operations
          setTimeout(() => {
            router.replace('/(tabs)/pools' as any);
          }, 500);
        } catch (error) {
          console.error('Error storing user data:', error);
          throw error; // Re-throw to be caught by the outer catch block
        }
      } else {
        // No user available, just navigate
        router.replace('/(tabs)/pools' as any);
      }
    } catch (error) {
      // Error already handled by the service
      console.error('Error handled by service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#4F46E5', '#0074E4']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Link Your Bank</Text>
        <Text style={styles.headerSubtitle}>Step 2 of 2</Text>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.title}>Bank Information</Text>
        <Text style={styles.subtitle}>Connect your bank account to send and receive money</Text>

        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Account Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your account number"
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Routing Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your routing number"
              value={routingNumber}
              onChangeText={setRoutingNumber}
              keyboardType="number-pad"
            />
          </View>

          <Pressable
            style={styles.testAccountButton}
            onPress={handleUseTestAccount}
          >
            <Text style={styles.testAccountButtonText}>Use Test Account</Text>
          </Pressable>
        </View>

        <View style={styles.buttonContainer}>
          <Pressable
            style={styles.button}
            onPress={handleContinue}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.securityNote}>
          <Text style={styles.securityNoteText}>
            🔒 Your financial information is securely encrypted and stored according to industry standards.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
  },
  form: {
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  testAccountButton: {
    padding: 12,
    alignItems: 'center',
    marginVertical: 10,
  },
  testAccountButtonText: {
    color: '#0074E4',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 12,
  },
  button: {
    backgroundColor: '#0074E4',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  securityNote: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0074E4',
  },
  securityNoteText: {
    color: '#333333',
    fontSize: 14,
    lineHeight: 20,
  },
}); 