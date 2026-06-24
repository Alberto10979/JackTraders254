// Supabase Edge Function — M-Pesa Daraja STK Push
// Deploy with: supabase functions deploy mpesa-stk-push
//
// Required secrets (set via Supabase Dashboard > Edge Functions > Secrets):
//   MPESA_CONSUMER_KEY       — from Daraja portal
//   MPESA_CONSUMER_SECRET    — from Daraja portal
//   MPESA_PASSKEY            — from Daraja portal (Lipa na M-Pesa passkey)
//   MPESA_TILL_NUMBER        — your till number (Buy Goods)
//   MPESA_CALLBACK_URL       — public URL for callbacks (e.g. your Supabase function URL + /mpesa-callback)
//   MPESA_ENV                — "sandbox" or "production"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MPESA_ENV = Deno.env.get('MPESA_ENV') || 'sandbox'
const BASE_URL =
  MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke'

async function getAccessToken(): Promise<string> {
  const key = Deno.env.get('MPESA_CONSUMER_KEY')!
  const secret = Deno.env.get('MPESA_CONSUMER_SECRET')!
  const credentials = btoa(`${key}:${secret}`)

  const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  })
  const data = await res.json()
  return data.access_token
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, amount, orderId, reference } = await req.json()

    const tillNumber = Deno.env.get('MPESA_TILL_NUMBER')!
    const passKey = Deno.env.get('MPESA_PASSKEY')!
    const callbackUrl = Deno.env.get('MPESA_CALLBACK_URL')!

    // Generate timestamp: YYYYMMDDHHmmss
    const now = new Date()
    const timestamp = now
      .toISOString()
      .replace(/[-T:.Z]/g, '')
      .slice(0, 14)

    // Password = base64(ShortCode + PassKey + Timestamp)
    const password = btoa(`${tillNumber}${passKey}${timestamp}`)

    const token = await getAccessToken()

    const body = {
      BusinessShortCode: tillNumber,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerBuyGoodsOnline',
      Amount: Math.ceil(amount),
      PartyA: phone,         // customer phone: 254XXXXXXXXX
      PartyB: tillNumber,    // till number
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: reference,
      TransactionDesc: `JackTraders Order ${reference}`,
    }

    const stkRes = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const stkData = await stkRes.json()

    // Save CheckoutRequestID to the order for callback matching
    if (stkData.ResponseCode === '0' && stkData.CheckoutRequestID) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )
      await supabase
        .from('orders')
        .update({ mpesa_receipt: stkData.CheckoutRequestID })
        .eq('id', orderId)
    }

    return new Response(JSON.stringify(stkData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
