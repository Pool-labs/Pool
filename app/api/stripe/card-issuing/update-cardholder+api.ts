import { stripe } from "@/stripe-server";

export async function POST(request: Request) {
  const { id, action } = await request.json();

  let cardholder;
  if (action === "activate") {
    cardholder = await stripe.issuing.cardholders.update(id, {
      status: "active"
    });
  } else if (action === "deactivate") {
    cardholder = await stripe.issuing.cardholders.update(id, {
      status: "inactive"
    });
  }
  return Response.json({ cardholder });
}