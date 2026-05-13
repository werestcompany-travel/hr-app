import { supabase } from '../config/supabase.js';
import multer from 'multer';

// ── Multer config: in-memory, 5MB limit, images + PDFs only ─────────────────
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_FILE_TYPE'));
    }
  },
});

// ── Upload file to Supabase Storage ─────────────────────────────────────────
export async function uploadDocument(file, requestId, type) {
  const ext = file.originalname.split('.').pop().toLowerCase();
  const path = `${requestId}/${type}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('documents')
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) throw error;

  return path; // return the storage path; generate signed URLs on demand
}

// ── Get a 1-hour signed URL for viewing a file ───────────────────────────────
export async function getSignedUrl(storagePath) {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, 3600);

  if (error) throw error;
  return data.signedUrl;
}
