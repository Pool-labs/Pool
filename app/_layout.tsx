import { Stack } from "expo-router";
import "../global.css";
import StripeProvider from "./components/stripe-provider";

export default function RootLayout() {
  return (
    <StripeProvider>
      <Stack />
    </StripeProvider>
  );
}
