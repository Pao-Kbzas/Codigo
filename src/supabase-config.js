// src/supabase-config.js (Este archivo debería estar en la raíz de src)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'TU_URL_DE_SUPABASE'
const supabaseKey = 'TU_API_KEY_DE_SUPABASE'

export const supabase = createClient(supabaseUrl, supabaseKey)
