import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');

    console.log('Fetching leaderboard with limit:', limit);

    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('elo', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    const rankedPlayers = data?.map((player, index) => ({
      rank: index + 1,
      ...player,
    })) || [];

    console.log(`Leaderboard fetched: ${rankedPlayers.length} players`);

    return new Response(
      JSON.stringify({
        players: rankedPlayers,
        updated_at: new Date().toISOString(),
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in get-leaderboard:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
