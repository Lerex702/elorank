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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { uuid, username, elo, kills, deaths, highest_elo, current_streak } = await req.json();

    console.log('Updating player:', { uuid, username, elo });

    // Calculate K/D ratio
    const kd_ratio = deaths > 0 ? kills / deaths : kills;

    // Upsert player data
    const { data, error } = await supabase
      .from('players')
      .upsert({
        uuid,
        username,
        elo,
        kills,
        deaths,
        kd_ratio: parseFloat(kd_ratio.toFixed(2)),
        highest_elo,
        current_streak,
        last_active: new Date().toISOString(),
      }, {
        onConflict: 'uuid'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Player updated successfully:', data);

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in update-player:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
