import { IssuingCardParams } from "@/app/models/stripe/card-params";
import { stripe } from "@/stripe-server";

export async function POST(request: Request) {
  const { connectAccountId, type, spendingControls, shipping, name, poolName } = await request.json();

  const cardholder = await stripe.issuing.cardholders.create(
    {
      email: "admin@pool.co",
      name: name,
      billing: {
        address: {
          country: "US",
          state: "CA",
          city: "Los Angeles",
          line1: "123 Main Street",
          postal_code: "90001",
        },
      },
      individual: {
        first_name: name.split(' ')[0],
        last_name: name.split(' ').slice(1).join(' '),
        card_issuing: {
            user_terms_acceptance: {
              date: Math.floor(Date.now() / 1000),
              ip: '132.154.66.10'
            }
          }
      }
    },
    { stripeAccount: connectAccountId }
  );

// Create card with builder pattern
const cardParams = new IssuingCardParams(cardholder.id, type)
.withSpendingControls(spendingControls)
.withSecondLine(poolName)
.withShipping(shipping);

// Validate
const validationError = cardParams.validate();
if (validationError) {
return Response.json({ error: validationError }, { status: 400 });
}

// Create the card
const card = await stripe.issuing.cards.create(
cardParams.toJSON(),
{ stripeAccount: connectAccountId }
);

const card2 = await stripe.issuing.cards.create(
  cardParams.toJSON(),
  { stripeAccount: connectAccountId }
  );

return Response.json({card2});
}
