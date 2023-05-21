import '~/fetch.ts';
import { load } from 'dotenv';
import { getTokens } from '~/utils/tokens.ts';
import router from '~/router.ts';

if (!Deno.env.get('DENO_DEPLOYMENT_ID')) await load({ export: true });
const port = parseInt(Deno.env.get('PORT') ?? '4000');

await getTokens();

Deno.serve({ port }, router);
