import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type IntakeFormData = {
  id?: string
  submission_id: string
  first_name: string
  last_name: string
  phone_number: string
  vehicle_year: string
  make: string
  model: string
  ownership: string
  created_at?: string
  updated_at?: string
}