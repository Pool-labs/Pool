import { stripe } from "@/stripe-server";

export async function POST(request: Request) {
  const { customerId, amount } = await request.json();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.floor(amount * 100),
      currency: "usd",
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
      confirm: true,
    });

    return Response.json({
      paymentIntent
    });
  }