import { stripe } from "@/stripe-server";

export async function POST(request: Request) {
  const { customerId, amount, destination, description, paymentMethodId } = await request.json();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.floor(amount * 100),
      currency: "usd",
      customer: customerId,
      payment_method:paymentMethodId,
      payment_method_types: ["us_bank_account"],
      transfer_data: {
        destination: destination,
      },
      confirm: true,
      description: description,
    });

    return Response.json({
      paymentIntent
    });
  }