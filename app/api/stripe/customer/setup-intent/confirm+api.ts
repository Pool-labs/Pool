import { stripe } from "@/stripe-server";

export async function POST(request: Request) {
    const { setupIntentId, paymentMethodId } = await request.json();
    const confirmSetupIntent = await stripe.setupIntents.confirm(
        setupIntentId,
        {
          payment_method: paymentMethodId,
          mandate_data:{
            customer_acceptance:{
              type: 'online',
              online:{
                ip_address: '132.154.66.10',
                user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              }
            }
          }
        }
      );

      const verifyMicrodeposits = await stripe.setupIntents.verifyMicrodeposits(
        setupIntentId,
        {
          descriptor_code:'SM11AA'
        }
      );
      return Response.json({ verifyMicrodeposits });
}