import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://fzzhbaldubfknizybprd.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6emhiYWxkdWJma25penlicHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNTY5MjAsImV4cCI6MjA3NzczMjkyMH0.BUR1fa3tt9lYtdEGgjajs2x_CF8PSRO5Oey9if74eIc"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
