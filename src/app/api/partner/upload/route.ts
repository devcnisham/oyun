import 'server-only';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getPartnerContext } from '@/lib/partner-auth';
import { getSessionSubject } from '@/lib/session';
import { createAdminClient, supabaseConfigured } from '@/utils/supabase/admin';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

const EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

export async function POST(request: Request) {
  const partnerCtx = await getPartnerContext();
  const isAdmin = !partnerCtx ? Boolean(await getSessionSubject('admin')) : false;

  if (!partnerCtx && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string' || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Please choose an image file to upload' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, WebP, and AVIF images are supported' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Image size exceeds the 5 MB limit. Please compress or resize it.' },
        { status: 400 }
      );
    }

    const ext = EXTENSION_MAP[file.type] || 'jpg';
    const turfId = partnerCtx?.turf.id ?? 'admin';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
    const storagePath = `turfs/${turfId}/${filename}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (supabaseConfigured()) {
      try {
        const client = createAdminClient();
        const { error: uploadError } = await client.storage
          .from('turf-photos')
          .upload(storagePath, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (!uploadError) {
          const { data: { publicUrl } } = client.storage
            .from('turf-photos')
            .getPublicUrl(storagePath);
          return NextResponse.json({ ok: true, url: publicUrl });
        }
        console.warn('[upload] Supabase storage upload failed, attempting local fallback:', uploadError.message);
      } catch (err) {
        console.warn('[upload] Supabase client error:', err instanceof Error ? err.message : String(err));
      }
    }

    // Local disk fallback for local development without active Supabase storage
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'turfs');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    const localFilePath = path.join(uploadDir, filename);
    writeFileSync(localFilePath, buffer);
    const localUrl = `/uploads/turfs/${filename}`;

    return NextResponse.json({ ok: true, url: localUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
