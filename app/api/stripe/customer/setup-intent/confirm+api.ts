import { stripe } from "@/stripe-server";

export async function POST(request: Request) {
    const { setupIntentId, paymentMethodId } = await request.json();
    const confirmSetupIntent = await stripe.setupIntents.confirm(
        setupIntentId,
        {
          payment_method: paymentMethodId,
        }
      );
      return Response.json({ confirmSetupIntent });
}