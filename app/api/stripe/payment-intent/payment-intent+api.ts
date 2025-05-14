import { stripe } from "@/stripe-server";

export async function POST(customerId: string) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000,
      currency: "usd",
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return Response.json({
      customer: customerId,
      paymentIntent: paymentIntent.client_secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  }