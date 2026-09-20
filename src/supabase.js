// src/supabase.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://nnsqcriusqfdggeqitlf.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_mGrSU0LQpAQPkw4MLKNJFQ_zFRTzK-1'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)