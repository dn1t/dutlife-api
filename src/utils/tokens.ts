import type { Tokens } from '../types.d.ts';

const tokens: Tokens = {};

export async function getTokens(): Promise<Tokens> {
  const username = Deno.env.get('USERNAME');
  const password = Deno.env.get('PASSWORD');

  try {
    if (tokens.updated && Date.now() - tokens.updated <= 1000 * 60 * 60 * 3)
      return tokens;

    const res = await fetch('https://playentry.org');
    const html = await res.text();

    const __NEXT_DATA__ =
      /\<script id="__NEXT_DATA__".*\>((.|\n)+)\<\/script\>/.exec(html)?.[1];
    if (!__NEXT_DATA__) return tokens;

    const parsedData = JSON.parse(__NEXT_DATA__);

    const csrfToken = parsedData.props.initialProps.csrfToken;
    const xToken = parsedData.props.initialState.common.user?.xToken;

    if (!xToken) {
      const res = await fetch('https://playentry.org/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'csrf-token': csrfToken }),
        },
        body: JSON.stringify({
          query: `mutation ($username: String!, $password: String!) {
          signinByUsername(username: $username, password: $password) {
            id
            username
            nickname
          }
        }`,
          variables: { username, password },
        }),
      });
      if (!res.ok) return tokens;
      const json = await res.json();
      if (!json.data.signinByUsername) return tokens;
      return getTokens();
    }

    tokens.csrfToken = csrfToken;
    tokens.xToken = xToken;
    tokens.updated = Date.now();

    return tokens;
  } catch (_) {
    console.log(_);
    return tokens;
  }
}
