# Circuit Feedback

Circuit is a Next.js workspace for managing customer feedback across user-created business locations.

## Current product behavior

- Account access is handled by Supabase Auth.
- Each manager adds and manages their own locations.
- Reviews, actions, competitors, and connection status are isolated by account.
- Dashboard metrics and AI themes are calculated from stored reviews; the app does not seed example business data.
- Review analysis and competitor research call OpenAI only from server routes.
- Google Business Profile, delivery marketplaces, and Ovation + Toast appear as connection targets. They remain disconnected until provider authorization and credentials are available.
- CSV upload and prototype import data are not part of the product.

## Local setup

Copy `.env.example` to `.env.local` and configure the listed values. Then run:

```text
npm install
npm run dev
```

The app is available at `http://localhost:3000`.

## Checks

```text
npm run lint
npm test
npm run build
```

## Deployment

Production is deployed through Vercel. Database changes are versioned in `supabase/migrations` and applied to the existing linked Supabase project.
