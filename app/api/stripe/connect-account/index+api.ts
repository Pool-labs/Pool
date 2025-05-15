import { stripe } from "@/stripe-server";
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) { //pools currently only supports ACH payments
  const { name } = await request.json();

  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim() || '0.0.0.0';

  const filePath = path.join(process.cwd(), 'assets/images/icon.png');
  const fileBuffer = fs.readFileSync(filePath);

  const file = await stripe.files.create({
    purpose: 'identity_document',
    file: {
    data: fileBuffer,
    name: 'icon.png',
    type: 'image/png',
    },
  });

  const connectAccount = await stripe.accounts.create({
    type: "custom",
    country: "US",
    email: "admin@poolapp.co", // 👈 new account email
    business_type: "individual",
    capabilities: {
      card_issuing: { requested: true },
      transfers: { requested: true },
      us_bank_account_ach_payments: { requested: true },
    },
    business_profile: {
      name: name, // 👈 new business name
      mcc: "5734", // Computer Software Stores
      url: "https://www.poolapp.co",
      estimated_worker_count: 15,
      annual_revenue:{
        amount: 1500000,
        currency: "usd",
        fiscal_year_end: "2025-01-01",
      },
    },
    external_account: {
      object: "bank_account",
      country: "US",
      currency: "usd",
      account_number: "000123456789", //test account number
      routing_number: "110000000" //test routing number
    },
    individual: {
      first_name: "Admin",
      last_name: "Pool",
      email: "admin@poolapp.co",
      phone: "+13145555555",
      id_number: "000000000",
      dob: {
        day: 15,
        month: 6,
        year: 1990,
      },
      address: {
        line1: "123 Main Street",
        city: "Los Angeles",
        state: "CA",
        postal_code: "90001",
        country: "US",
      },
      verification: {
        document: {
          front: file.id,
        },
      },
    },
    company: {
      phone: "+13145550000",
      name: "New Test Account",
      address: {
        line1: "123 Main Street",
        city: "Los Angeles",
        state: "CA",
        postal_code: "90001",
        country: "US",
      },
    },
    settings: {
      card_issuing: {
        tos_acceptance: {
          date: Math.floor(Date.now() / 1000),
          ip: "132.154.66.10",
        },
      },
    },
    tos_acceptance: {
      date: Math.floor(Date.now() / 1000),
      ip: "132.154.66.10",
      service_agreement: "full",
    }
  });

  const acct = await stripe.accounts.retrieve(connectAccount.id);
  console.log('Capabilities:', acct.capabilities);
  console.log('Requirements:', acct.requirements);
  console.log('ToS Acceptance:', acct.tos_acceptance);

  return Response.json({ connectAccount });
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  const connectAccount = await stripe.accounts.del(id);
  return Response.json({ connectAccount });
}

