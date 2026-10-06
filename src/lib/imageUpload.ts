import imageCompression from 'browser-image-compression';
import { getSupabase } from './supabase';

export interface ImageUploadResult {
  url: string;
  sizeBytes?: number;
  error?: string;
}

/**
 * Compresses an image client-side to WebP and uploads it to Supabase Storage.
 * Keeps file sizes tiny (~150-250 KB) so the 1 GB free bucket lasts for 5,000+ photos.
 */
export async function compressAndUploadImage(file: File): Promise<ImageUploadResult> {
  try {
    // 1. Client-side WebP compression options
    const options = {
      maxSizeMB: 0.35, // Target max ~350 KB
      maxWidthOrHeight: 1920, // Full HD resolution
      useWebWorker: true,
      fileType: 'image/webp' as const,
    };

    let compressedFile: File;
    try {
      compressedFile = await imageCompression(file, options);
    } catch {
      // If compression fails (e.g. SVG or unsupported), use original
      compressedFile = file;
    }

    // 2. Upload to Supabase Storage
    const client = getSupabase();
    if (!client) {
      // Fallback to local DataURL if Supabase not configured
      const dataUrl = await fileToDataUrl(compressedFile);
      return { url: dataUrl, sizeBytes: compressedFile.size };
    }

    const cleanName = file.name
      .toLowerCase()
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-z0-9_-]/g, '-');
    const fileName = `${Date.now()}-${cleanName}.webp`;
    const filePath = `articles/${fileName}`;

    const { error: uploadError } = await client.storage
      .from('article-media')
      .upload(filePath, compressedFile, {
        contentType: 'image/webp',
        cacheControl: '31536000', // 1 year CDN cache
        upsert: false,
      });

    if (uploadError) {
      console.warn('Supabase storage upload error:', uploadError);
      // Fallback to DataURL
      const dataUrl = await fileToDataUrl(compressedFile);
      return { url: dataUrl, sizeBytes: compressedFile.size, error: uploadError.message };
    }

    const { data: publicUrlData } = client.storage
      .from('article-media')
      .getPublicUrl(filePath);

    return {
      url: publicUrlData.publicUrl,
      sizeBytes: compressedFile.size,
    };
  } catch (err: any) {
    console.error('Image compression and upload error:', err);
    return {
      url: '',
      error: err?.message || 'Failed to process image upload',
    };
  }
}

function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an audio narration / podcast file directly to Supabase Storage.
 */
export async function uploadAudioFile(file: File): Promise<{ url: string; error?: string }> {
  try {
    const client = getSupabase();
    if (!client) {
      return { url: '', error: 'Database is not connected.' };
    }

    const cleanName = file.name
      .toLowerCase()
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-z0-9_-]/g, '-');
    const ext = file.name.split('.').pop() || 'mp3';
    const filePath = `audio/${Date.now()}-${cleanName}.${ext}`;

    const { error: uploadError } = await client.storage
      .from('article-media')
      .upload(filePath, file, {
        contentType: file.type || 'audio/mpeg',
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) {
      return { url: '', error: uploadError.message };
    }

    const { data: publicUrlData } = client.storage
      .from('article-media')
      .getPublicUrl(filePath);

    return { url: publicUrlData.publicUrl };
  } catch (err: any) {
    return { url: '', error: err?.message || 'Failed to upload audio file.' };
  }
}

/**
 * Uploads a video file (.mp4, .webm, .mov) directly to Supabase Storage.
 */
export async function uploadVideoFile(file: File): Promise<{ url: string; error?: string }> {
  try {
    const client = getSupabase();
    if (!client) {
      // Local fallback
      const dataUrl = await fileToDataUrl(file);
      return { url: dataUrl };
    }

    const cleanName = file.name
      .toLowerCase()
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-z0-9_-]/g, '-');
    const ext = file.name.split('.').pop() || 'mp4';
    const filePath = `videos/${Date.now()}-${cleanName}.${ext}`;

    const { error: uploadError } = await client.storage
      .from('article-media')
      .upload(filePath, file, {
        contentType: file.type || 'video/mp4',
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) {
      console.warn('Video upload error:', uploadError);
      const dataUrl = await fileToDataUrl(file);
      return { url: dataUrl, error: uploadError.message };
    }

    const { data: publicUrlData } = client.storage
      .from('article-media')
      .getPublicUrl(filePath);

    return { url: publicUrlData.publicUrl };
  } catch (err: any) {
    return { url: '', error: err?.message || 'Failed to upload video file.' };
  }
}
