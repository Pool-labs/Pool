import { stripe } from "@/stripe-server";

export async function POST(request: Request) {
    
  const {email} = await request.json();

  const customer = await stripe.customers.create({
    email: email,
    name: 'Jane Doe',
    metadata: {
      app_user_id: 'user_123',
    }
  });
  
  return Response.json({
    customer: customer.id,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
}