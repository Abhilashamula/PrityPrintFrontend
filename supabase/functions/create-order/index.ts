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

    const payload = await req.json()
    const {
      kioskId = 'kiosk_001',
      fileName,
      filePath,
      fileSize,
      pageCount,
      copies = 1,
      orientation = 'portrait',
      paperSize = 'A4',
      sides = 'single',
      colorMode = 'bw',
      pageRange = 'all',
      customPageRange = '',
      phone = '',
    } = payload

    if (!['A4', 'A6'].includes(paperSize)) {
      return new Response(
        JSON.stringify({ error: 'Unsupported paper size. Choose A4 or A6.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const paperDimensions = paperSize === 'A6'
      ? { width: 105, height: 148 }
      : { width: 210, height: 297 }

    if (!fileName || !pageCount) {
      return new Response(
        JSON.stringify({ error: 'Missing required file or page details' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Check paper availability at kiosk
    const { data: kiosk, error: kioskErr } = await supabaseClient
      .from('kiosks')
      .select('paper_count, status')
      .eq('id', kioskId)
      .single()

    if (kioskErr || !kiosk) {
      return new Response(
        JSON.stringify({ error: 'Kiosk machine not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (kiosk.paper_count <= 0 || kiosk.status === 'offline') {
      return new Response(
        JSON.stringify({ error: 'Kiosk is currently out of paper or offline. Order rejected.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Fetch server-side pricing configuration
    const { data: pricingRows } = await supabaseClient
      .from('pricing_config')
      .select('key, value')

    const pricingMap: Record<string, number> = {
      price_bw_per_page: 2.00,
      price_color_per_page: 10.00,
    }

    if (pricingRows) {
      for (const row of pricingRows) {
        pricingMap[row.key] = parseFloat(row.value)
      }
    }

    const unitPriceBw = pricingMap['price_bw_per_page'] || 2.00
    const unitPriceColor = pricingMap['price_color_per_page'] || 10.00
    const activeUnitPrice = colorMode === 'color' ? unitPriceColor : unitPriceBw

    // 3. Compute pages to print
    let totalPagesToPrint = pageCount
    if (pageRange === 'custom' && customPageRange) {
      // Calculate custom page count safely
      const parts = customPageRange.split(',')
      const set = new Set<number>()
      for (const p of parts) {
        const trimmed = p.trim()
        const m = trimmed.match(/^(\d+)-(\d+)$/)
        if (m) {
          const lo = Math.max(1, parseInt(m[1]))
          const hi = Math.min(pageCount, parseInt(m[2]))
          for (let i = lo; i <= hi; i++) set.add(i)
        } else {
          const n = parseInt(trimmed)
          if (!isNaN(n) && n >= 1 && n <= pageCount) set.add(n)
        }
      }
      totalPagesToPrint = set.size || pageCount
    }
    totalPagesToPrint = totalPagesToPrint * copies

    // Safety check against paper count
    if (totalPagesToPrint > kiosk.paper_count) {
      return new Response(
        JSON.stringify({ error: `Not enough paper in kiosk tray. Available: ${kiosk.paper_count} sheets.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const totalAmount = parseFloat((totalPagesToPrint * activeUnitPrice).toFixed(2))

    // 4. Create Razorpay order if Razorpay Key & Secret exist, otherwise generate mock ID
    let razorpayOrderId = `order_mock_${Date.now()}`
    const rzpKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    const rzpKeyId = Deno.env.get('RAZORPAY_KEY_ID')

    if (rzpKeyId && rzpKeySecret) {
      try {
        const auth = btoa(`${rzpKeyId}:${rzpKeySecret}`)
        const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(totalAmount * 100), // paise
            currency: 'INR',
            receipt: `rcpt_${Date.now()}`,
            notes: { kiosk_id: kioskId, file_name: fileName },
          })
        })
        if (rzpRes.ok) {
          const rzpData = await rzpRes.json()
          razorpayOrderId = rzpData.id
        }
      } catch (err) {
        console.error('Razorpay Order API call error:', err)
      }
    }

    // 5. Insert Order record into DB
    const { data: order, error: orderErr } = await supabaseClient
      .from('orders')
      .insert({
        kiosk_id: kioskId,
        phone: phone || null,
        file_name: fileName,
        file_storage_path: filePath || null,
        file_size: fileSize || null,
        page_count: pageCount,
        copies,
        orientation,
        paper_size: paperSize,
        paper_width_mm: paperDimensions.width,
        paper_height_mm: paperDimensions.height,
        sides,
        color_mode: colorMode,
        page_range: pageRange,
        custom_page_range: customPageRange || null,
        total_pages_to_print: totalPagesToPrint,
        unit_price_bw: unitPriceBw,
        unit_price_color: unitPriceColor,
        total_amount: totalAmount,
        status: 'pending',
        razorpay_order_id: razorpayOrderId,
      })
      .select('id, razorpay_order_id, total_amount')
      .single()

    if (orderErr || !order) {
      throw orderErr || new Error('Failed to record order')
    }

    return new Response(
      JSON.stringify({
        orderId: order.id,
        razorpayOrderId: order.razorpay_order_id,
        amount: order.total_amount,
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

