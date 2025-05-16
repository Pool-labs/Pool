import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Pressable, 
  ActivityIndicator, 
  ScrollView, 
  Switch, 
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../_layout';
import { useAuth } from '../context/AuthContext';
import { useStripeService } from '../services/stripe';
import { createPoolInFirestore } from '../services/firebase/poolService';
import { addPoolToUser } from '../services/firebase/userService';
import { createCardInFirestore } from '../services/firebase/cardService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

enum FormStep {
  BasicInfo = 0,
  Privileges = 1
}

export default function CreateScreen() {
  const { isDarkMode } = useTheme();
  const { user, userData } = useAuth();
  const { createConnectAccount, createCard } = useStripeService();
  const [currentStep, setCurrentStep] = useState<FormStep>(FormStep.BasicInfo);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const bgColor = isDarkMode ? '#0A1121' : '#F5F7FA';

  // Basic info form state
  const [poolName, setPoolName] = useState('');
  const [initialBalance, setInitialBalance] = useState('0');
  const [description, setDescription] = useState('');

  // Privileges form state
  const [allowMemberInvites, setAllowMemberInvites] = useState(true);
  const [allowMemberWithdrawals, setAllowMemberWithdrawals] = useState(false);
  const [autoApproveMembers, setAutoApproveMembers] = useState(false);
  const [minimumContribution, setMinimumContribution] = useState('0');

  // Form validation states
  const [poolNameError, setPoolNameError] = useState('');

  const handleNextStep = () => {
    // Validation for basic info step
    if (currentStep === FormStep.BasicInfo) {
      if (!poolName.trim()) {
        setPoolNameError('Pool name is required');
        return;
      }
      setPoolNameError('');
      setCurrentStep(FormStep.Privileges);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === FormStep.Privileges) {
      setCurrentStep(FormStep.BasicInfo);
    }
  };

  const handleCreatePool = async () => {
    if (!user || !userData) {
      console.log('Error: User must be logged in to create a pool');
      return;
    }

    if (!poolName.trim()) {
      setPoolNameError('Pool name is required');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create a Stripe Connect account
      console.log('Creating Stripe Connect account...');
      const connectResult = await createConnectAccount(poolName.trim());
      const stripeConnectAccountId = connectResult?.connectAccount?.id;
      
      if (!stripeConnectAccountId) {
        throw new Error('Failed to create Stripe Connect account');
      }


      // 3. Create pool in Firestore
      console.log('Creating pool in Firestore...');
      const newPool = await createPoolInFirestore(
        poolName.trim(),
        user.uid,
        stripeConnectAccountId,
        [user.uid], // Owner is automatically a member
        parseFloat(initialBalance) || 0
      );

      console.log("Adding pool to user's profile...");
      await addPoolToUser(user.uid, newPool.id);

      // 2. Create a virtual card for the pool creator
      console.log("Creating virtual card for pool creator...");
      const cardResult = await createCard(
        stripeConnectAccountId,
        `${userData.firstName} ${userData.lastName}`,
        poolName.trim(),
        'virtual'
      );
      
      if (cardResult?.card?.id) {
        console.log(`Card created successfully: ${cardResult.card.id}`);



      // 4. Add pool to user's poolIds
   
        
        // 5. Store card information in Firestore
        await createCardInFirestore(
          user.uid,
          newPool.id,
          cardResult.card.id,
          cardResult.card.exp_month && cardResult.card.exp_year
            ? `${cardResult.card.exp_month}/${cardResult.card.exp_year}`
            : '12/2030',
          cardResult.card.cvc,
          'virtual',
          'active'
        );
      } else {
        console.warn('Card was created but returned incomplete information');
      }

      // 5. Reset form and show success
      setPoolName('');
      setInitialBalance('0');
      setDescription('');
      setMinimumContribution('0');
      setCurrentStep(FormStep.BasicInfo);
      
      Alert.alert(
        'Success',
        `"${poolName.trim()}" pool has been created successfully with a virtual card for you!`,
        [{ 
          text: 'OK',
          onPress: () => {
            // Navigate to pools tab after dismissing the alert
            // Use the refreshKey parameter to force a refresh of the pools list
            router.replace({
              pathname: "/(tabs)/pools",
              params: { refresh: Date.now().toString() }
            });
          }
        }]
      );
    } catch (error) {
      console.error('Error creating pool:', error);
      // Silent error handling - don't show Alert
    } finally {
      setIsLoading(false);
    }
  };

  const renderBasicInfoStep = () => (
    <ScrollView>
      <View style={styles.formContainer}>
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>Create New Pool</Text>
        <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
          Set up your pool&apos;s basic information
        </Text>

        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>Pool Name*</Text>
          <TextInput
            style={[
              styles.input, 
              isDarkMode && styles.inputDark,
              poolNameError ? styles.inputError : null
            ]}
            placeholder="Enter pool name"
            placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
            value={poolName}
            onChangeText={(text) => {
              setPoolName(text);
              if (text.trim()) setPoolNameError('');
            }}
          />
          {poolNameError ? (
            <Text style={styles.errorText}>{poolNameError}</Text>
          ) : null}
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>Initial Balance</Text>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            placeholder="0.00"
            placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
            value={initialBalance}
            onChangeText={setInitialBalance}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>Description</Text>
          <TextInput
            style={[styles.textArea, isDarkMode && styles.inputDark]}
            placeholder="What is this pool for?"
            placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <Pressable
          style={styles.nextButton}
          onPress={handleNextStep}
        >
          <Text style={styles.buttonText}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </ScrollView>
  );

  const renderPrivilegesStep = () => (
    <ScrollView>
      <View style={styles.formContainer}>
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>Pool Privileges</Text>
        <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
          Set member privileges and requirements
        </Text>

        <View style={styles.switchGroup}>
          <View style={styles.switchLabelContainer}>
            <Text style={[styles.switchLabel, isDarkMode && styles.labelDark]}>
              Allow members to invite others
            </Text>
            <Text style={styles.switchDescription}>
              Members can invite new people to join the pool
            </Text>
          </View>
          <Switch
            value={allowMemberInvites}
            onValueChange={setAllowMemberInvites}
            trackColor={{ false: '#767577', true: '#0074E4' }}
          />
        </View>

        <View style={styles.switchGroup}>
          <View style={styles.switchLabelContainer}>
            <Text style={[styles.switchLabel, isDarkMode && styles.labelDark]}>
              Allow members to withdraw
            </Text>
            <Text style={styles.switchDescription}>
              Members can withdraw funds from the pool
            </Text>
          </View>
          <Switch
            value={allowMemberWithdrawals}
            onValueChange={setAllowMemberWithdrawals}
            trackColor={{ false: '#767577', true: '#0074E4' }}
          />
        </View>

        <View style={styles.switchGroup}>
          <View style={styles.switchLabelContainer}>
            <Text style={[styles.switchLabel, isDarkMode && styles.labelDark]}>
              Auto-approve new members
            </Text>
            <Text style={styles.switchDescription}>
              New members are approved automatically
            </Text>
          </View>
          <Switch
            value={autoApproveMembers}
            onValueChange={setAutoApproveMembers}
            trackColor={{ false: '#767577', true: '#0074E4' }}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>
            Minimum Contribution ($)
          </Text>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            placeholder="0.00"
            placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
            value={minimumContribution}
            onChangeText={setMinimumContribution}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.buttonContainer}>
          <Pressable
            style={styles.backButton}
            onPress={handlePreviousStep}
          >
            <Ionicons name="arrow-back" size={20} color="#0074E4" />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>

          <Pressable
            style={styles.createButton}
            onPress={handleCreatePool}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Create Pool</Text>
            )}
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={[
          styles.progressStep, 
          currentStep >= FormStep.BasicInfo && styles.activeProgressStep
        ]} />
        <View style={styles.progressLine} />
        <View style={[
          styles.progressStep, 
          currentStep >= FormStep.Privileges && styles.activeProgressStep
        ]} />
      </View>
      
      {/* Form steps */}
      {currentStep === FormStep.BasicInfo ? renderBasicInfoStep() : renderPrivilegesStep()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  containerDark: {
    backgroundColor: '#0A1121',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  progressStep: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#DDDDDD',
  },
  activeProgressStep: {
    backgroundColor: '#0074E4',
  },
  progressLine: {
    flex: 0.2,
    height: 2,
    backgroundColor: '#DDDDDD',
    marginHorizontal: 8,
  },
  formContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  titleDark: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
  },
  subtitleDark: {
    color: '#A3A3A3',
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
  labelDark: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    color: '#333333',
  },
  inputDark: {
    backgroundColor: '#2D3748',
    borderColor: '#4A5568',
    color: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
  textArea: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    height: 120,
    color: '#333333',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#666666',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  nextButton: {
    backgroundColor: '#0074E4',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  createButton: {
    flex: 1,
    backgroundColor: '#0074E4',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginLeft: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0074E4',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  backButtonText: {
    color: '#0074E4',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 