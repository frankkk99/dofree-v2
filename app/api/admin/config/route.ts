import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ ok: false, settings: {}, sections: [], categories: [], movieLinks: [] });
  }

  const [settingsRes, sectionsRes, categoriesRes, linksRes] = await Promise.all([
    supabase.from('site_settings').select('key,label,value').order('key'),
    supabase.from('admin_sections').select('key,title_th,description,enabled,sort_order,settings').eq('enabled', true).order('sort_order'),
    supabase.from('admin_categories').select('slug,title_th,subtitle_th,enabled,autoplay,sort_order').eq('enabled', true).order('sort_order'),
    supabase.from('admin_movie_links').select('tmdb_id,media_type,title,title_th,watch_url,trailer_url,provider,is_active').eq('is_active', true),
  ]);

  const settings = Object.fromEntries((settingsRes.data || []).map((item: any) => [item.key, item.value]));

  return NextResponse.json({
    ok: true,
    settings,
    sections: sectionsRes.data || [],
    categories: categoriesRes.data || [],
    movieLinks: linksRes.data || [],
  });
}
