import { createClient } from 'npm:@supabase/supabase-js@2'

const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
const fail = (status = 401) => new Response(JSON.stringify({ error: 'Invalid credentials' }), { status, headers })

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers })

  const { username, pin } = await request.json().catch(() => ({}))
  const cleanUsername = typeof username === 'string' ? username.trim().toLowerCase() : ''
  if (!/^\S{3,20}$/.test(cleanUsername) || !/^\d{4}$/.test(pin)) return fail()

  const url = Deno.env.get('SUPABASE_URL')!
  const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}')
  const serviceKey = secretKeys.default ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(url, serviceKey)

  const { data: attempts } = await admin.from('username_login_attempts').select('*').eq('username', cleanUsername).maybeSingle()
  if (attempts?.locked_until && new Date(attempts.locked_until) > new Date()) return fail(429)

  const recordFailure = async () => {
    const count = (attempts?.failed_attempts ?? 0) + 1
    await admin.from('username_login_attempts').upsert({
      username: cleanUsername,
      failed_attempts: count,
      locked_until: count >= 5 ? new Date(Date.now() + 15 * 60_000).toISOString() : null,
    })
  }

  const { data: profile } = await admin.from('user_profiles').select('user_id').eq('username', cleanUsername).maybeSingle()
  if (!profile) {
    await recordFailure()
    return fail()
  }

  const { data: userResult } = await admin.auth.admin.getUserById(profile.user_id)
  const email = userResult.user?.email
  if (!email) {
    await recordFailure()
    return fail()
  }

  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pin }),
  })
  if (!response.ok) {
    await recordFailure()
    return fail()
  }

  await admin.from('username_login_attempts').delete().eq('username', cleanUsername)
  return new Response(JSON.stringify(await response.json()), { headers })
})
