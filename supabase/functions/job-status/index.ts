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

    const url = new URL(req.url)
    const orderId = url.searchParams.get('order_id')

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Missing order_id query parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Fetch Order status
    const { data: order, error: orderErr } = await supabaseClient
      .from('orders')
      .select('status, total_pages_to_print')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Fetch associated Print Job details
    const { data: job } = await supabaseClient
      .from('print_jobs')
      .select('status, pages_printed, pages_total')
      .eq('order_id', orderId)
      .maybeSingle()

    let status = order.status
    let pagesCompleted = 0
    let pagesTotal = order.total_pages_to_print

    if (job) {
      status = job.status
      pagesCompleted = job.pages_printed
      pagesTotal = job.pages_total
    }

    return new Response(
      JSON.stringify({
        orderStatus: order.status,
        jobStatus: status,
        pagesCompleted,
        pagesTotal,
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

