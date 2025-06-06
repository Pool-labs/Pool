import { stripe } from "@/stripe-server";

export async function GET(_req: Request, { id }: Record<string, string>) {
    const customer = await stripe.customers.retrieve(id);
    return Response.json(customer);
}
