import { NextRequest, NextResponse } from 'next/server';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const blockedPath = (path: string) =>
  !path.startsWith('/') || path.includes('..') || path.includes('://');

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';

  if (blockedPath(path)) {
    return NextResponse.json({ error: 'Invalid TMDB path' }, { status: 400 });
  }

  const readAccessToken = process.env.TMDB_ACCESS_TOKEN;
  const apiKey = process.env.TMDB_API_KEY;

  if (!readAccessToken && !apiKey) {
    return NextResponse.json(
      { error: 'TMDB_ACCESS_TOKEN or TMDB_API_KEY is not configured' },
      { status: 500 },
    );
  }

  const upstream = new URL(`${TMDB_BASE_URL}${path}`);
  searchParams.forEach((value, key) => {
    if (key !== 'path') upstream.searchParams.set(key, value);
  });

  if (!readAccessToken && apiKey) {
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
  } catch (error) {
    return NextResponse.json(
      { error: 'Unable to fetch TMDB data' },
      { status: 500 },
    );
  }
}
