import { stripe } from "@/stripe-server";

export async function GET(_req: Request, { id }: Record<string, string>) {
  const connectAccount = await stripe.accounts.retrieve(id);
  return Response.json({ connectAccount });
}
