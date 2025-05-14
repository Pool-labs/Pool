import { StripeProvider } from "@stripe/stripe-react-native";
import * as Linking from "expo-linking";
export default function ExpoStripeProvider(props: Omit<React.ComponentProps<typeof StripeProvider>, 'publishableKey'| 'merchantIdentifier'>) {
  return <StripeProvider
   publishableKey={process.env.STRIPE_PUBLISHABLE_KEY!}
   merchantIdentifier={process.env.STRIPE_MERCHANT_ID!}
   urlScheme={Linking.createURL("/")?.split(":")[0]}
   {...props}
   />;
}

