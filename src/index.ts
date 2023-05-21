import './fetch.ts';
import { load } from 'dotenv';
import { fetchRequestHandler } from 'npm:@trpc/server/adapters/fetch';
import { appRouter as router } from './router.ts';
import { getTokens } from './utils/tokens.ts';

if (!Deno.env.get('DENO_DEPLOYMENT_ID')) await load({ export: true });
const port = parseInt(Deno.env.get('PORT') ?? '4000');

await getTokens();

Deno.serve({ port }, (req) =>
  fetchRequestHandler({
    endpoint: '/trpc',
    req,
    router,
    createContext: () => ({}),
  }),
);
