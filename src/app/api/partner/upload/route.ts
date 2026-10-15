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

// The browser-supplied Content-Type is attacker-controlled, so confirm the bytes really are the image type claimed.
function matchesImageSignature(mime: string, b: Buffer) {
  const ascii = (from: number, to: number) => b.subarray(from, to).toString('latin1');
  switch (mime) {
    case 'image/jpeg': return b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case 'image/png': return b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case 'image/webp': return b.length > 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP';
    case 'image/avif': return b.length > 12 && ascii(4, 8) === 'ftyp' && /^(avif|avis)$/.test(ascii(8, 12));
    default: return false;
  }
}

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
    if (!matchesImageSignature(file.type, buffer)) {
      return NextResponse.json({ error: 'That file is not a valid image' }, { status: 400 });
    }

    if (supabaseConfigured()) {
      try {
        const client = createAdminClient();
        const { error: uploadError } = await client.storage
          .from('turf-photos')
          .upload(storagePath, buffer, {
            contentType: file.type,
            upsert: false,
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

    // Local disk fallback is for development only; a deployed site must never write into public/
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Image storage is unavailable. Please try again.' }, { status: 503 });
    }
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'turfs');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    const localFilePath = path.join(uploadDir, filename);
    writeFileSync(localFilePath, buffer);
    const localUrl = `/uploads/turfs/${filename}`;

    return NextResponse.json({ ok: true, url: localUrl });
  } catch (err) {
    console.error('[upload] failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
