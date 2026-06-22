import { NextRequest, NextResponse } from 'next/server';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const blockedPath = (path: string) =>
  !path.startsWith('/') || path.includes('..') || path.includes('://');

const readEnv = (...names: string[]) =>
  names.map((name) => process.env[name]?.trim()).find(Boolean);

const looksLikeReadAccessToken = (value?: string) =>
  Boolean(value && (value.startsWith('eyJ') || value.split('.').length >= 3));

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';

  if (blockedPath(path)) {
    return NextResponse.json({ error: 'Invalid TMDB path' }, { status: 400 });
  }

  const configuredToken = readEnv(
    'TMDB_ACCESS_TOKEN',
    'TMDB_READ_ACCESS_TOKEN',
    'TMDB_BEARER_TOKEN',
    'NEXT_PUBLIC_TMDB_ACCESS_TOKEN',
  );

  const explicitApiKey = readEnv(
    'TMDB_API_KEY',
    'NEXT_PUBLIC_TMDB_API_KEY',
    'VITE_TMDB_API_KEY',
  );

  const readAccessToken = looksLikeReadAccessToken(configuredToken) ? configuredToken : undefined;
  const apiKey = explicitApiKey || (!readAccessToken ? configuredToken : undefined);

  if (!readAccessToken && !apiKey) {
    return NextResponse.json(
      {
        error: 'TMDB credential is not configured',
        acceptedEnvNames: [
          'TMDB_ACCESS_TOKEN',
          'TMDB_READ_ACCESS_TOKEN',
          'TMDB_BEARER_TOKEN',
          'TMDB_API_KEY',
          'NEXT_PUBLIC_TMDB_API_KEY',
        ],
      },
      { status: 500 },
    );
  }

  const upstream = new URL(`${TMDB_BASE_URL}${path}`);
  searchParams.forEach((value, key) => {
    if (key !== 'path') upstream.searchParams.set(key, value);
  });

  if (apiKey) {
    upstream.searchParams.set('api_key', apiKey);
  }

  try {
    const response = await fetch(upstream.toString(), {
      headers: readAccessToken
        ? {
            Authorization: `Bearer ${readAccessToken}`,
            Accept: 'application/json',
          }
        : { Accept: 'application/json' },
      next: { revalidate: 1800 },
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Cache-Control': 's-maxage=1800, stale-while-revalidate=86400',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to fetch TMDB data' },
      { status: 500 },
    );
  }
}
