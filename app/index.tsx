import { LinearGradient } from 'expo-linear-gradient';
import { Button, Pressable, ScrollView, Text, View } from "react-native";
import "../global.css";
import { signInWithGoogle } from './services/auth';
import { IssuingCardSpendingControls } from './models/stripe/spending-controls';
export default function Index() {

  async function fetchCustomer():Promise<{customer: string, ephemeralKey: string, paymentIntent: string}> {
    return await fetch("/api/stripe/customer",
      {
        method: "POST",
        body: JSON.stringify({email: "test@test.com", name: "Jim John" }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    ).then(res => res.json());
  }

  async function getCustomer():Promise<{customer: string, ephemeralKey: string, paymentIntent: string}> {
    return await fetch("/api/stripe/customer/cus_SJUSboQUQ4ZO3E",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    ).then(res => res.json());
  }

  async function createConnectAccount():Promise<{customer: string, ephemeralKey: string, paymentIntent: string}> {
    return await fetch("/api/stripe/connect-account",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "Dave's Hot Chicken" })
      }
    ).then(res => res.json());
  }

  async function deleteConnectAccount():Promise<{customer: string, ephemeralKey: string, paymentIntent: string}> {
    return await fetch("/api/stripe/connect-account",
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: "acct_1ROvt7Gdjtv6fqHm" }),
      }
    ).then(res => res.json());
  }

  async function getConnectAccount():Promise<{customer: string, ephemeralKey: string, paymentIntent: string}> {
    return await fetch("/api/stripe/connect-account/acct_1ROrcu2cx2jhBegh",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    ).then(res => res.json());
  }

  async function createPaymentIntent():Promise<{customer: string, ephemeralKey: string, paymentIntent: string}> {
    return await fetch("/api/stripe/payment-intent",
      {
        method: "POST",
        body: JSON.stringify({ customerId: "cus_SJUSboQUQ4ZO3E", amount: 1000, destination: "acct_1RP63jGbCgTvIQV1", description: "Initial payment", paymentMethodId: "pm_1ROrzLGf0znAb5Qzir6HVozZ" }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    ).then(res => res.json());
  }

  async function createCard():Promise<{customer: string, ephemeralKey: string, paymentIntent: string}> {
    return await fetch("/api/stripe/card-issuing",
      {
        method: "POST",
        body: JSON.stringify({ 
        connectAccountId: "acct_1RP63jGbCgTvIQV1", type: "virtual", spendingControls: undefined, shipping: null, address: null, name: "hussma conway", poolName: "Pool",
      }),
      }
    ).then(res => res.json());
  }

  return (
    <ScrollView className="flex-1 bg-white">

  <Button
      title="Google Sign-In"
      onPress={() => signInWithGoogle().then(() => console.log('Signed in with Google!'))}
    />

    <Button title="Create Customer" onPress={() => fetchCustomer().then((data)=>console.log(data))} />

      <Button title='Get Customer' onPress={() => getCustomer().then((data)=>console.log(data))} />

      <Button title='Create Connect Account' onPress={() => createConnectAccount().then((data)=>console.log(data))} />

      <Button title='Delete Connect Account' onPress={() => deleteConnectAccount().then((data)=>console.log(data))} />

        <Button title='get connect account' onPress={() => getConnectAccount().then((data)=>console.log(data))} />

          <Button title='Create Payment Intent' onPress={() => createPaymentIntent().then((data)=>console.log(data))} />
            <Button title='Create Card' onPress={() => createCard().then((data)=>console.log(data))} />

      {/* Header */}
      <View className="px-4 pt-12 pb-4">
        <Text className="text-2xl font-bold text-gray-800">Find your place</Text>
        <Text className="text-gray-500 mt-1">Discover the best places to stay</Text>
      </View>

      {/* Search Bar */}
      <View className="px-4 mb-6">
        <Pressable className="flex-row items-center bg-gray-100 p-4 rounded-full">
          <Text className="text-gray-500">Where to?</Text>
        </Pressable>
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mb-6">
        <View className="mr-4">
          <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center">
            <Text className="text-2xl">🏠</Text>
          </View>
          <Text className="text-center mt-2 text-gray-600">Houses</Text>
        </View>
        <View className="mr-4">
          <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center">
            <Text className="text-2xl">🏖️</Text>
          </View>
          <Text className="text-center mt-2 text-gray-600">Beach</Text>
        </View>
        <View className="mr-4">
          <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center">
            <Text className="text-2xl">🏔️</Text>
          </View>
          <Text className="text-center mt-2 text-gray-600">Mountain</Text>
        </View>
        <View className="mr-4">
          <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center">
            <Text className="text-2xl">🌆</Text>
          </View>
          <Text className="text-center mt-2 text-gray-600">City</Text>
        </View>
      </ScrollView>

      {/* Featured Listings */}
      <View className="px-4">
        <Text className="text-xl font-bold text-gray-800 mb-4">Featured Places</Text>
        <View className="space-y-4">
          {/* Listing Card 1 */}
          <View className="bg-white rounded-xl shadow-sm overflow-hidden">
            <View className="h-48 bg-gray-200">
              <Text className="text-center mt-20 text-gray-500">Image Placeholder</Text>
            </View>
            <LinearGradient
              colors={['#DBEAFE', '#C7D2FE']}
              className="p-4"
            >
              <Text className="font-bold text-gray-800">Luxury Villa</Text>
              <Text className="text-gray-500">Bali, Indonesia</Text>
              <Text className="text-gray-800 font-bold mt-2">$250/night</Text>
            </LinearGradient>
          </View>

          {/* Listing Card 2 */}
          <View className="bg-white rounded-xl shadow-sm overflow-hidden">
            <View className="h-48 bg-gray-200">
              <Text className="text-center mt-20 text-gray-500">Image Placeholder</Text>
            </View>
            <LinearGradient
              colors={['#FFF1F2', '#FFF7ED']}
              className="p-4"
            >
              <Text className="font-bold text-gray-800">Beach House</Text>
              <Text className="text-gray-500">Maldives</Text>
              <Text className="text-gray-800 font-bold mt-2">$350/night</Text>
            </LinearGradient>
          </View>

          {/* Listing Card 3 */}
          <View className="bg-white rounded-xl shadow-sm overflow-hidden">
            <View className="h-48 bg-gray-200">
              <Text className="text-center mt-20 text-gray-500">Image Placeholder</Text>
            </View>
            <LinearGradient
              colors={['#D1FAE5', '#A7F3D0']}
              className="p-4"
            >
              <Text className="font-bold text-gray-800">Mountain Cabin</Text>
              <Text className="text-gray-500">Swiss Alps</Text>
              <Text className="text-gray-800 font-bold mt-2">$280/night</Text>
            </LinearGradient>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}