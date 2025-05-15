import { stripe } from "@/stripe-server";

export async function POST(request: Request) {
  const { customerId, name } = await request.json();
  const setupIntent = await stripe.setupIntents.create({
    confirm: true,
    customer: customerId,
    mandate_data: {
      customer_acceptance: {
        type: "offline"
      }
    },
    payment_method_data: {
      billing_details: {
        name: name
      },
      type: "us_bank_account",
      us_bank_account: {
        account_holder_type: "individual",
        account_number: "000123456789", //test account number
        routing_number: "110000000" //test routing number
      }
    },
    payment_method_types: [
      "us_bank_account"
    ]
  });
  return Response.json({ setupIntent });
}