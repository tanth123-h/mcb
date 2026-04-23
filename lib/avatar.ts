/**
 * lib/avatar.ts
 * Avatar upload/management using Supabase Storage.
 * Bucket: "avatars" (public, 5MB limit, image/* only)
 *
 * Setup in Supabase:
 *   Storage → New bucket → name: "avatars" → Public: ON
 *   Policy: allow anon INSERT/SELECT/UPDATE/DELETE
 */

import { supabase } from './supabase';

const BUCKET  = 'avatars';
const MAX_MB  = 5;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export interface UploadResult {
  url:   string | null;
  error: string | null;
}

/**
 * Upload an avatar file for a personnel record.
 * Returns the public URL.
 */
export async function uploadAvatar(
  personnelId: string,
  file: File
): Promise<UploadResult> {
  // Validate
  if (!ALLOWED.includes(file.type)) {
    return { url: null, error: 'Invalid file type. Use JPEG, PNG, WebP, or GIF.' };
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    return { url: null, error: `File too large. Maximum ${MAX_MB}MB.` };
  }

  const ext      = file.name.split('.').pop() ?? 'jpg';
  const path     = `${personnelId}/avatar.${ext}`;

  // Upload (upsert to overwrite existing)
  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadErr) return { url: null, error: uploadErr.message };

  // Get public URL
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const url = data.publicUrl + `?v=${Date.now()}`; // cache bust

  // Update personnel record
  const { error: dbErr } = await supabase
    .from('personnel')
    .update({ avatar_url: url })
    .eq('id', personnelId);

  if (dbErr) return { url: null, error: dbErr.message };

  return { url, error: null };
}

/**
 * Delete avatar for a personnel record.
 */
export async function deleteAvatar(personnelId: string): Promise<{ error: string | null }> {
  // List files in folder
  const { data: files, error: listErr } = await supabase.storage
    .from(BUCKET)
    .list(personnelId);

  if (listErr) return { error: listErr.message };

  if (files && files.length > 0) {
    const paths = files.map(f => `${personnelId}/${f.name}`);
    const { error: delErr } = await supabase.storage.from(BUCKET).remove(paths);
    if (delErr) return { error: delErr.message };
  }

  // Clear from personnel record
  await supabase.from('personnel').update({ avatar_url: null }).eq('id', personnelId);

  return { error: null };
}

/**
 * Generate a deterministic placeholder avatar URL using DiceBear API.
 * No upload required — uses codename as seed.
 */
export function getAvatarPlaceholder(codename: string): string {
  const seed = encodeURIComponent(codename.toLowerCase());
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}&backgroundColor=0D1520&size=128`;
}
