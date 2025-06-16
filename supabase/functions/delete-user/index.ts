/// <reference types="deno" />
import { serve } from 'https://deno.land/std@0.203.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const { userId } = await req.json()
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  await supabase.from('clients').delete().eq('user_id', userId)
  await supabase.from('users').delete().eq('id', userId)
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 })
})