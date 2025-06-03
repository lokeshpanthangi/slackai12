
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vsslnffovgrjcrysfzml.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzc2xuZmZvdmdyamNyeXNmem1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MTk5NTcsImV4cCI6MjA2NDQ5NTk1N30.PZYs6oTdxsG-nW8CyXWCVGjWSlJstuqZPuPSeOrI0Jg'

export const supabase = createClient(supabaseUrl, supabaseKey)
