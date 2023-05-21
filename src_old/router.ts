import routes from '~/routes.ts';
import { HandlerFunction } from './handler.ts';

async function router(req: Request) {
  const url = new URL(req.url);

  if (url.pathname in routes) {
    const res = await (routes as Record<string, HandlerFunction>)[url.pathname](
      req,
    );
    console.log(
      `\u001B[92m${req.method} ${url.pathname} ${res.status}\u001B[39m`,
    );
    return res;
  } else return new Response('Not Found', { status: 404 });
}

export default router;
