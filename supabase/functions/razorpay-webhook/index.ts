import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { hmac } from 'https://deno.land/x/hmac@v2.0.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
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

    const signature = req.headers.get('x-razorpay-signature')
    const rawBody = await req.text()
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')

    // 1. Verify Webhook Signature if secret is configured
    if (webhookSecret) {
      if (!signature) {
        return new Response(
          JSON.stringify({ error: 'Missing Razorpay signature header' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const expectedSignature = hmac('sha256', webhookSecret, rawBody, 'utf8', 'hex').toString()
      if (expectedSignature !== signature) {
        return new Response(
          JSON.stringify({ error: 'Invalid Razorpay signature' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const event = JSON.parse(rawBody)
    const eventId = event.event_id || `evt_${Date.now()}`
    const eventType = event.event

    // 2. Deduplicate Webhook Event
    const { data: existingEvent } = await supabaseClient
      .from('webhook_events')
      .select('id')
      .eq('id', eventId)
      .maybeSingle()

    if (existingEvent) {
      return new Response(
        JSON.stringify({ status: 'already_processed', eventId }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Save event for audit & deduplication
    await supabaseClient.from('webhook_events').insert({
      id: eventId,
      event_type: eventType,
      payload: event,
    })

    // 3. Handle Payment Success Event
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = event.payload.payment?.entity || event.payload.order?.entity
      const razorpayOrderId = paymentEntity?.order_id || paymentEntity?.id
      const razorpayPaymentId = paymentEntity?.id || null

      if (razorpayOrderId) {
        // Fetch matching order
        const { data: order } = await supabaseClient
          .from('orders')
          .select('id, kiosk_id, total_pages_to_print, status')
          .eq('razorpay_order_id', razorpayOrderId)
          .maybeSingle()

        if (order && order.status !== 'paid' && order.status !== 'done') {
          // Update order status to paid
          await supabaseClient
            .from('orders')
            .update({
              status: 'paid',
              razorpay_payment_id: razorpayPaymentId,
            })
            .eq('id', order.id)

          -- IMMEDIATELY queue the print job in print_jobs table (NO OTP STEP!)
          await supabaseClient
            .from('print_jobs')
            .insert({
              order_id: order.id,
              kiosk_id: order.kiosk_id,
              status: 'queued',
              pages_printed: 0,
              pages_total: order.total_pages_to_print,
            })
        }
      }
    } else if (eventType === 'payment.failed') {
      const paymentEntity = event.payload.payment?.entity
      const razorpayOrderId = paymentEntity?.order_id
      if (razorpayOrderId) {
        await supabaseClient
          .from('orders')
          .update({ status: 'failed' })
          .eq('razorpay_order_id', razorpayOrderId)
      }
    }

    return new Response(
      JSON.stringify({ status: 'success', eventType }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Webhook Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

