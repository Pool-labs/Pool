import { stripe } from "@/stripe-server";

export async function POST(request: Request) {
    
  const {email, name} = await request.json();

  const customer = await stripe.customers.create({
    email: email,
    name: name,
  });
  
  return Response.json({
    customer
  });
}