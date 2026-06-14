import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Server belum dikonfigurasi.");
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
export const ALLOWED_DOCUMENTATION_MIME = ["image/jpeg", "image/png", "image/webp"];

export function assertSafeUpload(file: File) {
  if (file.size > MAX_UPLOAD_SIZE) throw new Error("Ukuran file melebihi batas 5 MB.");
  if (!ALLOWED_DOCUMENTATION_MIME.includes(file.type)) throw new Error("Tipe file tidak diizinkan.");
}
