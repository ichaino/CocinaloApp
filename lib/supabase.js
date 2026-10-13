import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://rtknrujysulexaxqqddz.supabase.co";

const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0a25ydWp5c3VsZXhheHFxZGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMTI0ODAsImV4cCI6MjA5NDg4ODQ4MH0.okZMaq0Z61QB4IIZeB5cO7Eji-JS9p-x-GGfY2XU1pI";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);