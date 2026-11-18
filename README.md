This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Supabase setup

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env`, then run the SQL in `supabase/migrations/20261118000000_create_marketplace_tables.sql` in the Supabase SQL Editor. This creates the listings and inquiries tables, public image bucket, and row-level security policies.

Listings and uploaded photos are public. Seller contact details are included in public listing records. Buyer inquiries can be submitted without an account but cannot be read through the public API.

### Sample listings

`supabase/sample-listings.json` contains 20 sample listing records, one for each marketplace category. Use the records to populate `public.listings` through the Supabase Table Editor or your preferred import workflow. The sample seller names, email addresses, addresses, and phone numbers are placeholders; replace them before using the records in a live marketplace. Sample photos use Unsplash URLs, while listings created in the app continue to use Supabase Storage.

### Email inquiries with Gmail

Enable 2-Step Verification on the Gmail account you want to send from, then create an App Password in your Google Account. Add the Gmail address and App Password as server-only variables in `.env` (do not prefix them with `NEXT_PUBLIC_`):

```bash
GMAIL_USER=youraddress@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password
```

Add the same variables to your deployment environment. The listing detail form sends buyer inquiries through `/api/listing-inquiries`; the API emails the listing's seller from this Gmail account, sets the buyer's email as `Reply-To`, and records the inquiry in Supabase. Email sending also requires the Supabase migration above. Never use your regular Gmail password or expose these variables in client-side code. Gmail imposes sending limits, so this setup is intended for low-volume marketplace messages, not bulk email.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
