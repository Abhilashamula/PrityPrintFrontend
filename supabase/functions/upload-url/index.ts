import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { fileName, fileType, fileSize } = await req.json()

    if (!fileName) {
      return new Response(
        JSON.stringify({ error: 'Missing fileName parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Server-side size validation (max 20MB default)
    const MAX_SIZE_MB = 20
    if (fileSize && fileSize > MAX_SIZE_MB * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: `File exceeds maximum limit of ${MAX_SIZE_MB}MB` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate unique storage path
    const fileExt = fileName.split('.').pop()
    const filePath = `uploads/${crypto.randomUUID()}.${fileExt}`

    // Create signed upload URL (valid for 10 minutes)
    const { data, error } = await supabaseClient
      .storage
      .from('documents')
      .createSignedUploadUrl(filePath)

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({
        uploadUrl: data.signedUrl,
        filePath: filePath,
        token: data.token,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

