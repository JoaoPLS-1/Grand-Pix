import { createClient } from "@supabase/supabase-js"

const supabaseUrl = 'https://wfjxvvrpuwsbzuqsfrni.supabase.co'
const supabaseKey = 'sb_publishable_8WOfJw9OrTyDncBbHkaAaQ_d7sUYl7C'

export const supabase = createClient(supabaseUrl, supabaseKey)