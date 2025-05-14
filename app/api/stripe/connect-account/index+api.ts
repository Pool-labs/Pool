import { stripe } from "@/stripe-server";

export async function POST(request: Request) { //pools currently only supports ACH payments
  
  const connectAccount = await stripe.accounts.create({
    type: 'custom',
    country: 'US',
    email: 'admin@poolapp.co',
    business_type: 'individual',
    capabilities: {
      us_bank_account_ach_payments: { requested: true }, // App currently only supports ACH payments
      transfers: { requested: true }, // Withdrawals/payouts
      card_issuing: { requested: true }, // Card payments
    },
    business_profile: {
      name: 'Hawaii Trip',
    },
  });
    return Response.json({ connectAccount });
}