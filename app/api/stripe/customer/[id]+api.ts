import { stripe } from "@/stripe-server";

export async function GET(_req: Request, { id }: Record<string, string>) {
    const customer = await stripe.customers.retrieve(id);
    if (!customer) {
        return Response.json({ error: "Customer not found" }, { status: 404 });
    }
    return Response.json(customer);
}
