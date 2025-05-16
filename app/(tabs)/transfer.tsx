import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../_layout';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/app/context/AuthContext';
import { Pool } from '../models/firebase/pool';
import { getPoolsByMember } from '../services/firebase/poolService';
import { useRouter } from 'expo-router';
import { useStripeService } from '../services/stripe';
import { createCardInFirestore } from '../services/firebase/cardService';
import { addCardToUser } from '../services/firebase/userService';

// Define the tab modes for the transfer screen
enum TransferMode {
  PAY = 'pay',
  REQUEST = 'request'
}

// Define the request tab modes
enum RequestMode {
  MANUAL = 'manual',
  TRANSACTIONS = 'transactions'
}

// Payment method type
interface PaymentMethod {
  id: string;
  type: 'applepay' | 'googlepay' | 'card' | 'bank';
  label: string;
  icon: string;
  details?: string;
  isDefault?: boolean;
}

// Transaction type for the request tab
interface Transaction {
  id: string;
  description: string;
  date: string;
  amount: number;
  selected?: boolean;
}

// Contact type for splitting
interface Contact {
  id: string;
  name: string;
  selected?: boolean;
}

export default function TransferScreen() {
  const { isDarkMode } = useTheme();
  const { user, userData } = useAuth();
  const router = useRouter();
  const themeClass = isDarkMode ? 'dark-mode' : 'light-mode';
  const bgColor = isDarkMode ? '#0A1121' : '#F5F7FA';
  const textColor = isDarkMode ? 'text-white' : 'text-pool-dark';
  
  const [isLoading, setIsLoading] = useState(true);
  const [pools, setPools] = useState<Pool[]>([]);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [amount, setAmount] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [note, setNote] = useState('');
  const [showPoolSelector, setShowPoolSelector] = useState(false);
  const [transferMode, setTransferMode] = useState<TransferMode>(TransferMode.PAY);
  const [requestMode, setRequestMode] = useState<RequestMode>(RequestMode.MANUAL);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [totalSelected, setTotalSelected] = useState(0);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [addingToWallet, setAddingToWallet] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<'applepay' | 'googlepay' | null>(null);
  
  // Get Stripe service hooks
  const { createCard } = useStripeService();
  
  // Predefined gradient sets for different pools (same as in pools.tsx)
  const gradientSets = [
    ['#7558B2', '#5E70C4'], // Purple to blue
    ['#4158D0', '#C850C0'], // Blue to purple
    ['#0093E9', '#80D0C7'], // Blue to teal
    ['#FF9A8B', '#FF6A88'], // Salmon to pink
    ['#FBAB7E', '#F7CE68'], // Orange to yellow
  ];

  useEffect(() => {
    async function fetchUserPools() {
      try {
        setIsLoading(true);
        
        // If no user ID is available, don't try to fetch data
        if (!userData?.id) {
          setIsLoading(false);
          return;
        }
        
        // Fetch pools the user is a member of
        const userPools = await getPoolsByMember(userData.id);
        setPools(userPools);
        
        // Set the first pool as selected by default if available
        if (userPools.length > 0) {
          setSelectedPool(userPools[0]);
        }
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

  // Get gradient colors based on pool index
  const getGradientColors = (index: number) => {
    return gradientSets[index % gradientSets.length];
  };

  // Mock payment methods
  useEffect(() => {
    const mockPaymentMethods: PaymentMethod[] = [
      {
        id: '1',
        type: 'applepay',
        label: 'Apple Pay',
        icon: 'logo-apple',
        isDefault: true
      },
      {
        id: '2',
        type: 'googlepay',
        label: 'Google Pay',
        icon: 'logo-google'
      },
      {
        id: '3',
        type: 'card',
        label: 'Visa',
        icon: 'card',
        details: '•••• 4242 • Expires 04/25'
      }
    ];

    const mockTransactions: Transaction[] = [
      {
        id: 't1',
        description: 'Starbucks Coffee',
        date: '2023-04-12',
        amount: 24.99,
        selected: false
      },
      {
        id: 't2',
        description: 'Grocery Shopping',
        date: '2023-04-11',
        amount: 78.45,
        selected: false
      },
      {
        id: 't3',
        description: 'Movie Tickets',
        date: '2023-04-10',
        amount: 32.50,
        selected: false
      }
    ];

    const mockContacts: Contact[] = [
      {
        id: 'c1',
        name: 'John Smith',
        selected: true
      },
      {
        id: 'c2',
        name: 'Sarah Johnson',
        selected: false
      }
    ];

    setPaymentMethods(mockPaymentMethods);
    setTransactions(mockTransactions);
    setContacts(mockContacts);
    setSelectedPaymentMethod(mockPaymentMethods[0]);
    setIsLoading(false);
  }, []);

  // Calculate total selected amount for transactions
  useEffect(() => {
    const total = transactions
      .filter(t => t.selected)
      .reduce((sum, t) => sum + t.amount, 0);
    setTotalSelected(total);
  }, [transactions]);

  // Handle pay/transfer action
  const handlePay = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    if (!recipientEmail) {
      Alert.alert('Error', 'Please enter recipient email');
      return;
    }
    
    if (!selectedPaymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }
    
    Alert.alert(
      'Confirm Payment',
      `Pay $${amount} to ${recipientEmail} using ${selectedPaymentMethod.label}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Pay',
          onPress: () => {
            Alert.alert(
              'Success',
              `Payment of $${amount} to ${recipientEmail} was successful.`,
              [{ text: 'OK' }]
            );
            
            // Reset form
            setAmount('');
            setRecipientEmail('');
            setNote('');
          }
        }
      ]
    );
  };

  // Handle request action
  const handleRequest = () => {
    if (requestMode === RequestMode.MANUAL) {
      if (!amount || parseFloat(amount) <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }
      
      if (!recipientEmail) {
        Alert.alert('Error', 'Please enter recipient email');
        return;
      }
    } else {
      if (totalSelected <= 0) {
        Alert.alert('Error', 'Please select at least one transaction');
        return;
      }
      
      if (!contacts.some(c => c.selected)) {
        Alert.alert('Error', 'Please select at least one contact');
        return;
      }
    }
    
    const selectedContactNames = contacts
      .filter(c => c.selected)
      .map(c => c.name)
      .join(', ');
    
    Alert.alert(
      'Confirm Request',
      requestMode === RequestMode.MANUAL
        ? `Request $${amount} from ${recipientEmail}?`
        : `Request $${totalSelected.toFixed(2)} from ${selectedContactNames}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Request',
          onPress: () => {
            Alert.alert(
              'Success',
              requestMode === RequestMode.MANUAL
                ? `Request for $${amount} sent to ${recipientEmail}.`
                : `Request for $${totalSelected.toFixed(2)} sent to ${selectedContactNames}.`,
              [{ text: 'OK' }]
            );
            
            // Reset form
            if (requestMode === RequestMode.MANUAL) {
              setAmount('');
              setRecipientEmail('');
              setNote('');
            } else {
              setTransactions(transactions.map(t => ({ ...t, selected: false })));
            }
          }
        }
      ]
    );
  };

  // Toggle transaction selection
  const toggleTransaction = (id: string) => {
    setTransactions(transactions.map(t => 
      t.id === id ? { ...t, selected: !t.selected } : t
    ));
  };

  // Toggle contact selection
  const toggleContact = (id: string) => {
    setContacts(contacts.map(c => 
      c.id === id ? { ...c, selected: !c.selected } : c
    ));
  };

  // Render icon for payment method
  const renderPaymentIcon = (method: PaymentMethod) => {
    switch (method.type) {
      case 'applepay':
        return <Ionicons name="logo-apple" size={24} color="#FFFFFF" />;
      case 'googlepay':
        return <Ionicons name="logo-google" size={24} color="#FFFFFF" />;
      case 'card':
        return <Ionicons name="card-outline" size={24} color="#FFFFFF" />;
      case 'bank':
        return <Ionicons name="business-outline" size={24} color="#FFFFFF" />;
      default:
        return <Ionicons name="wallet-outline" size={24} color="#FFFFFF" />;
    }
  };

  // Transfer mode selector component
  const renderModeSelector = () => (
    <View style={styles.segmentedControlContainer}>
      <TouchableOpacity
        style={[
          styles.segmentTab, 
          transferMode === TransferMode.PAY && styles.segmentTabActive,
          { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }
        ]}
        onPress={() => setTransferMode(TransferMode.PAY)}
      >
        <Text 
          style={[
            styles.segmentText,
            transferMode === TransferMode.PAY && styles.segmentTextActive
          ]}
        >
          Pay
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.segmentTab,
          transferMode === TransferMode.REQUEST && styles.segmentTabActive,
          { borderTopRightRadius: 8, borderBottomRightRadius: 8 }
        ]}
        onPress={() => setTransferMode(TransferMode.REQUEST)}
      >
        <Text 
          style={[
            styles.segmentText,
            transferMode === TransferMode.REQUEST && styles.segmentTextActive
          ]}
        >
          Request
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Request mode selector component
  const renderRequestModeSelector = () => (
    <View style={[styles.segmentedControlContainer, { marginTop: 16 }]}>
      <TouchableOpacity
        style={[
          styles.segmentTab, 
          requestMode === RequestMode.MANUAL && styles.segmentTabActive,
          { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }
        ]}
        onPress={() => setRequestMode(RequestMode.MANUAL)}
      >
        <Text 
          style={[
            styles.segmentText,
            requestMode === RequestMode.MANUAL && styles.segmentTextActive
          ]}
        >
          Manual
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.segmentTab,
          requestMode === RequestMode.TRANSACTIONS && styles.segmentTabActive,
          { borderTopRightRadius: 8, borderBottomRightRadius: 8 }
        ]}
        onPress={() => setRequestMode(RequestMode.TRANSACTIONS)}
      >
        <Text 
          style={[
            styles.segmentText,
            requestMode === RequestMode.TRANSACTIONS && styles.segmentTextActive
          ]}
        >
          Transactions
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render payment method selection section
  const renderPaymentMethods = () => (
    <View style={styles.paymentMethodsContainer}>
      <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
        Select Payment Method
      </Text>
      
      {paymentMethods.map((method) => (
        <TouchableOpacity
          key={method.id}
          style={[
            styles.paymentMethodItem,
            selectedPaymentMethod?.id === method.id && styles.selectedPaymentMethod
          ]}
          onPress={() => setSelectedPaymentMethod(method)}
        >
          <View style={styles.paymentMethodIconContainer}>
            <Ionicons 
              name={method.type === 'applepay' ? 'logo-apple' : 
                    method.type === 'googlepay' ? 'logo-google' : 'card-outline'} 
              size={24} 
              color="white" 
            />
          </View>
          
          <View style={styles.paymentMethodInfo}>
            <Text style={[styles.paymentMethodLabel, isDarkMode && styles.paymentMethodLabelDark]}>
              {method.label}
            </Text>
            {method.details && (
              <Text style={styles.paymentMethodDetails}>
                {method.details}
              </Text>
            )}
          </View>
          
          {method.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Default</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
      
      {/* Add New Card Button */}
      <TouchableOpacity
        style={styles.addCardButton}
        onPress={() => setShowAddCardModal(true)}
      >
        <Ionicons name="add-circle-outline" size={22} color={isDarkMode ? '#FFFFFF' : '#0074E4'} style={{ marginRight: 8 }} />
        <Text style={[styles.addCardButtonText, isDarkMode && { color: '#FFFFFF' }]}>
          Add Card to Digital Wallet
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render transaction selection interface for request tab
  const renderTransactionSelection = () => (
    <View style={{ marginTop: 16 }}>
      <Text style={[styles.instructionText, isDarkMode && styles.instructionTextDark]}>
        Select transactions to request repayment:
      </Text>
      
      {transactions.map((transaction) => (
        <TouchableOpacity
          key={transaction.id}
          style={styles.transactionItem}
          onPress={() => toggleTransaction(transaction.id)}
        >
          <View style={styles.checkboxContainer}>
            <View style={[
              styles.checkbox,
              transaction.selected && styles.checkboxSelected
            ]}>
              {transaction.selected && (
                <Ionicons name="checkmark" size={16} color="white" />
              )}
            </View>
          </View>
          
          <View style={styles.transactionInfo}>
            <Text style={[styles.transactionTitle, isDarkMode && styles.transactionTitleDark]}>
              {transaction.description}
            </Text>
            <Text style={styles.transactionDate}>
              {transaction.date}
            </Text>
          </View>
          
          <Text style={[styles.transactionAmount, isDarkMode && styles.transactionAmountDark]}>
            ${transaction.amount.toFixed(2)}
          </Text>
        </TouchableOpacity>
      ))}
      
      <View style={styles.totalContainer}>
        <Text style={[styles.totalLabel, isDarkMode && styles.totalLabelDark]}>
          Total Selected:
        </Text>
        <Text style={[styles.totalAmount, isDarkMode && styles.totalAmountDark]}>
          ${totalSelected.toFixed(2)}
        </Text>
      </View>
      
      <View style={styles.splitContainer}>
        <Text style={[styles.splitLabel, isDarkMode && styles.splitLabelDark]}>
          Split with
        </Text>
        
        <View style={styles.splitButtonsContainer}>
          <TouchableOpacity style={styles.splitEquallyButton}>
            <Ionicons name="people-outline" size={16} color="white" style={{ marginRight: 6 }} />
            <Text style={styles.splitButtonText}>Split Equally</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.splitManuallyButton}>
            <Ionicons name="list-outline" size={16} color="#0074E4" style={{ marginRight: 6 }} />
            <Text style={styles.splitManuallyText}>Split Manually</Text>
          </TouchableOpacity>
        </View>
        
        {contacts.map((contact) => (
          <TouchableOpacity
            key={contact.id}
            style={styles.contactItem}
            onPress={() => toggleContact(contact.id)}
          >
            <View style={styles.checkboxContainer}>
              <View style={[
                styles.checkbox,
                contact.selected && styles.checkboxSelected
              ]}>
                {contact.selected && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
            </View>
            
            <Text style={[styles.contactName, isDarkMode && styles.contactNameDark]}>
              {contact.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render manual request form
  const renderManualRequestForm = () => (
    <View>
      <View style={styles.formGroup}>
        <Text style={[styles.label, isDarkMode && styles.labelDark]}>
          Amount ($)
        </Text>
        <View style={[styles.amountInputContainer, isDarkMode && styles.inputDark]}>
          <Text style={[styles.currencySymbol, isDarkMode && { color: '#FFFFFF' }]}>$</Text>
          <TextInput
            style={[styles.amountInput, isDarkMode && { color: '#FFFFFF' }]}
            placeholder="0.00"
            placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={[styles.label, isDarkMode && styles.labelDark]}>
          Recipient
        </Text>
        <View style={[styles.recipientInputContainer, isDarkMode && styles.inputDark]}>
          <Ionicons 
            name="person-outline" 
            size={20} 
            color={isDarkMode ? '#FFFFFF' : '#6B7280'} 
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={[styles.recipientInput, isDarkMode && { color: '#FFFFFF' }]}
            placeholder="Email, phone, or username"
            placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
            value={recipientEmail}
            onChangeText={setRecipientEmail}
            autoCapitalize="none"
          />
        </View>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={[styles.label, isDarkMode && styles.labelDark]}>
          Note (Optional)
        </Text>
        <TextInput
          style={[styles.noteInput, isDarkMode && styles.inputDark]}
          placeholder={transferMode === TransferMode.PAY ? "What's it for?" : "What's it for?"}
          placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />
      </View>
    </View>
  );

  // Handle adding a new card to wallet
  const handleAddCardToWallet = async () => {
    // Basic validation
    if (!cardNumber || cardNumber.length < 16) {
      Alert.alert('Error', 'Please enter a valid card number');
      return;
    }
    
    if (!cardExpiry || !cardExpiry.includes('/')) {
      Alert.alert('Error', 'Please enter a valid expiry date (MM/YY)');
      return;
    }
    
    if (!cardCVV || cardCVV.length < 3) {
      Alert.alert('Error', 'Please enter a valid CVV code');
      return;
    }
    
    if (!cardholderName) {
      Alert.alert('Error', 'Please enter the cardholder name');
      return;
    }
    
    if (!selectedWallet) {
      Alert.alert('Error', 'Please select a wallet to add your card to');
      return;
    }

    if (!userData?.id) {
      Alert.alert('Error', 'User data not available. Please try again later.');
      return;
    }
    
    try {
      setAddingToWallet(true);
      
      // Find the first pool to associate the card with (this is a simplification)
      // In a real app, you might want to let the user choose which pool
      if (pools.length === 0) {
        throw new Error('No pools available to associate with card');
      }
      const selectedPool = pools[0];
      
      // Step 1: Create a Stripe card through the API
      const cardResult = await createCard(
        selectedPool.stripeConnectAccountId,
        cardholderName,
        selectedPool.name,
        'virtual'
      );
      
      if (!cardResult?.card?.id) {
        throw new Error('Failed to create card in Stripe');
      }
      
      // Extract month and year from expiry date (MM/YY format)
      const [month, year] = cardExpiry.split('/');
      const formattedExpiry = `${month}/${year}`;
      
      // Step 2: Store card information in Firestore
      const card = await createCardInFirestore(
        userData.id,
        selectedPool.id,
        // Use the last 4 digits from the input card number, 
        // but in a real app you'd use the number from Stripe
        `**** **** **** ${cardNumber.replace(/\s/g, '').slice(-4)}`,
        formattedExpiry,
        cardCVV,
        'virtual',
        'active'
      );
      
      // Step 3: Associate the card with the user
      await addCardToUser(userData.id, card.id);
      
      // Step 4: Create a new payment method in the local state
      const walletMethod: PaymentMethod = {
        id: card.id,
        type: selectedWallet === 'applepay' ? 'applepay' : 'googlepay',
        label: selectedWallet === 'applepay' ? 'Apple Pay' : 'Google Pay',
        icon: selectedWallet === 'applepay' ? 'logo-apple' : 'logo-google',
        details: `•••• ${cardNumber.replace(/\s/g, '').slice(-4)} • Expires ${formattedExpiry}`,
        isDefault: false
      };
      
      // Add the new payment method to the list
      setPaymentMethods([...paymentMethods, walletMethod]);
      
      // Reset form and close modal
      setCardNumber('');
      setCardExpiry('');
      setCardCVV('');
      setCardholderName('');
      setSelectedWallet(null);
      setShowAddCardModal(false);
      
      Alert.alert(
        'Success',
        `Your card has been added to ${selectedWallet === 'applepay' ? 'Apple Pay' : 'Google Pay'}.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error adding card to wallet:', error);
      Alert.alert('Error', error.message || 'Failed to add card to wallet. Please try again.');
    } finally {
      setAddingToWallet(false);
    }
  };
  
  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };
  
  // Format card expiry date
  const formatCardExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    
    return v;
  };

  // Render card wallet selection modal
  const renderAddCardModal = () => (
    <Modal
      visible={showAddCardModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAddCardModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, isDarkMode && { backgroundColor: '#1A2235' }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isDarkMode && { color: '#FFFFFF' }]}>
              Add Card to Digital Wallet
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddCardModal(false)}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* Card Number Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>
                Card Number
              </Text>
              <View style={[styles.cardInputContainer, isDarkMode && styles.inputDark]}>
                <Ionicons 
                  name="card-outline" 
                  size={20} 
                  color={isDarkMode ? '#FFFFFF' : '#6B7280'} 
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  style={[styles.cardInput, isDarkMode && { color: '#FFFFFF' }]}
                  placeholder="XXXX XXXX XXXX XXXX"
                  placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
                  value={cardNumber}
                  onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                  keyboardType="number-pad"
                  maxLength={19} // 16 digits + 3 spaces
                />
              </View>
            </View>
            
            {/* Expiry and CVV Row */}
            <View style={styles.cardDetailsRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={[styles.label, isDarkMode && styles.labelDark]}>
                  Expiry Date
                </Text>
                <View style={[styles.cardInputContainer, isDarkMode && styles.inputDark]}>
                  <Ionicons 
                    name="calendar-outline" 
                    size={20} 
                    color={isDarkMode ? '#FFFFFF' : '#6B7280'} 
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    style={[styles.cardInput, isDarkMode && { color: '#FFFFFF' }]}
                    placeholder="MM/YY"
                    placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
                    value={cardExpiry}
                    onChangeText={(text) => setCardExpiry(formatCardExpiry(text))}
                    keyboardType="number-pad"
                    maxLength={5} // MM/YY
                  />
                </View>
              </View>
              
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={[styles.label, isDarkMode && styles.labelDark]}>
                  CVV
                </Text>
                <View style={[styles.cardInputContainer, isDarkMode && styles.inputDark]}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={20} 
                    color={isDarkMode ? '#FFFFFF' : '#6B7280'} 
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    style={[styles.cardInput, isDarkMode && { color: '#FFFFFF' }]}
                    placeholder="123"
                    placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
                    value={cardCVV}
                    onChangeText={setCardCVV}
                    keyboardType="number-pad"
                    maxLength={4}
                    secureTextEntry={true}
                  />
                </View>
              </View>
            </View>
            
            {/* Cardholder Name */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>
                Cardholder Name
              </Text>
              <View style={[styles.cardInputContainer, isDarkMode && styles.inputDark]}>
                <Ionicons 
                  name="person-outline" 
                  size={20} 
                  color={isDarkMode ? '#FFFFFF' : '#6B7280'} 
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  style={[styles.cardInput, isDarkMode && { color: '#FFFFFF' }]}
                  placeholder="JOHN SMITH"
                  placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
                  value={cardholderName}
                  onChangeText={setCardholderName}
                  autoCapitalize="characters"
                />
              </View>
            </View>
            
            {/* Wallet Selection */}
            <Text style={[styles.label, isDarkMode && styles.labelDark, { marginTop: 20 }]}>
              Select Digital Wallet
            </Text>
            
            <View style={styles.walletSelectionContainer}>
              <TouchableOpacity
                style={[
                  styles.walletOption,
                  selectedWallet === 'applepay' && styles.walletOptionSelected,
                  { marginRight: 12 }
                ]}
                onPress={() => setSelectedWallet('applepay')}
              >
                <Ionicons name="logo-apple" size={28} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                <Text style={[styles.walletOptionText, isDarkMode && { color: '#FFFFFF' }]}>
                  Apple Pay
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.walletOption,
                  selectedWallet === 'googlepay' && styles.walletOptionSelected
                ]}
                onPress={() => setSelectedWallet('googlepay')}
              >
                <Ionicons name="logo-google" size={28} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                <Text style={[styles.walletOptionText, isDarkMode && { color: '#FFFFFF' }]}>
                  Google Pay
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Add to Wallet Button */}
            <TouchableOpacity
              style={[styles.addToWalletButton, !selectedWallet && styles.addToWalletButtonDisabled]}
              onPress={handleAddCardToWallet}
              disabled={!selectedWallet || addingToWallet}
            >
              {addingToWallet ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="wallet-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.addToWalletButtonText}>
                    Add to {selectedWallet === 'applepay' ? 'Apple Pay' : selectedWallet === 'googlepay' ? 'Google Pay' : 'Wallet'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            <Text style={styles.walletSecurityNote}>
              Your card details are securely encrypted and stored only in your selected digital wallet.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={isDarkMode ? '#fff' : '#000'} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
          <View style={styles.container}>
            {/* Pay/Request Tab Selector */}
            {renderModeSelector()}
            
            {/* Request Mode Selector (Manual/Transactions) */}
            {transferMode === TransferMode.REQUEST && renderRequestModeSelector()}
            
            {/* Manual Form for Pay Tab or Manual Request */}
            {(transferMode === TransferMode.PAY || 
              (transferMode === TransferMode.REQUEST && requestMode === RequestMode.MANUAL)) && 
              renderManualRequestForm()}
            
            {/* Transaction Selection for Request Tab */}
            {transferMode === TransferMode.REQUEST && 
             requestMode === RequestMode.TRANSACTIONS && 
             renderTransactionSelection()}
            
            {/* Payment Methods Selection (only for Pay tab) */}
            {transferMode === TransferMode.PAY && renderPaymentMethods()}
            
            {/* Pay/Request Button */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                transferMode === TransferMode.REQUEST ? styles.requestButton : styles.payButton
              ]}
              onPress={transferMode === TransferMode.PAY ? handlePay : handleRequest}
            >
              <Ionicons 
                name={transferMode === TransferMode.PAY ? "paper-plane" : "cash-outline"} 
                size={20} 
                color="#FFFFFF" 
                style={{ marginRight: 8 }} 
              />
              <Text style={styles.actionButtonText}>
                {transferMode === TransferMode.PAY 
                  ? `Pay ${amount ? '$' + amount : ''}`
                  : requestMode === RequestMode.MANUAL
                    ? `Request ${amount ? '$' + amount : ''}`
                    : `Request $${totalSelected.toFixed(2)}`
                }
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Add Card Modal */}
      {renderAddCardModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  segmentedControlContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#0074E4',
    height: 46,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#0F172A',
  },
  segmentTabActive: {
    backgroundColor: '#0074E4',
  },
  segmentText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0074E4',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  formGroup: {
    marginTop: 24,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 10,
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
    backgroundColor: '#1F2937',
    borderColor: '#374151',
    color: '#FFFFFF',
  },
  poolSelector: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  poolSelectorDark: {
    backgroundColor: '#2D3748',
    borderColor: '#4A5568',
  },
  selectorText: {
    fontSize: 16,
    color: '#333333',
  },
  selectorTextDark: {
    color: '#FFFFFF',
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  dropdownDark: {
    backgroundColor: '#1A2235',
    borderColor: '#4A5568',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  selectedDropdownItem: {
    backgroundColor: '#F5F7FA',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
    marginLeft: 8,
  },
  dropdownTextDark: {
    color: '#FFFFFF',
  },
  selectedDropdownText: {
    fontWeight: '500',
    color: '#0074E4',
  },
  poolIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7558B2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPoolsMessage: {
    padding: 16,
    alignItems: 'center',
  },
  noPoolsText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  createPoolButton: {
    padding: 8,
    backgroundColor: '#0074E4',
    borderRadius: 8,
  },
  createPoolButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  amountInputContainer: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '500',
    color: '#333333',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    color: '#333333',
    padding: 0,
  },
  recipientInputContainer: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  recipientInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    padding: 0,
  },
  noteInput: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    minHeight: 80,
    color: '#333333',
  },
  paymentMethodsContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  sectionTitleDark: {
    color: '#FFFFFF',
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  selectedPaymentMethod: {
    borderColor: '#0074E4',
    borderWidth: 2,
  },
  paymentMethodIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0074E4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  paymentMethodLabelDark: {
    color: '#FFFFFF',
  },
  paymentMethodDetails: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  actionButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  payButton: {
    backgroundColor: '#0074E4',
  },
  requestButton: {
    backgroundColor: '#0074E4',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionText: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 16,
  },
  instructionTextDark: {
    color: '#FFFFFF',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3748',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#0074E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#0074E4',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  transactionTitleDark: {
    color: '#FFFFFF',
  },
  transactionDate: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  transactionAmountDark: {
    color: '#FFFFFF',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2D3748',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  totalLabelDark: {
    color: '#FFFFFF',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  totalAmountDark: {
    color: '#FFFFFF',
  },
  splitContainer: {
    marginTop: 24,
  },
  splitLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 12,
  },
  splitLabelDark: {
    color: '#FFFFFF',
  },
  splitButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  splitEquallyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0074E4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
  splitButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  splitManuallyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0074E4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  splitManuallyText: {
    color: '#0074E4',
    fontWeight: '500',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3748',
  },
  contactName: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  contactNameDark: {
    color: '#FFFFFF',
  },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#0074E4',
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  addCardButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0074E4',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 30,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  modalContent: {
    padding: 16,
  },
  cardInputContainer: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  cardInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    padding: 0,
  },
  cardDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  walletSelectionContainer: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 24,
  },
  walletOption: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletOptionSelected: {
    borderColor: '#0074E4',
    borderWidth: 2,
    backgroundColor: 'rgba(0, 116, 228, 0.05)',
  },
  walletOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginTop: 8,
  },
  addToWalletButton: {
    backgroundColor: '#0074E4',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  addToWalletButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  addToWalletButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  walletSecurityNote: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    marginBottom: 16,
  },
}); 