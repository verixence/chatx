import { supabaseAdmin } from '@/lib/db/supabase'

const BUCKET_NAME = 'learnchat-files'

/**
 * Initialize the storage bucket (run once)
 */
export async function initializeBucket() {
  // Check if bucket exists
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME)

  if (!bucketExists) {
    // Create bucket
    const { data, error } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
      public: false, // Private bucket
      fileSizeLimit: 100 * 1024 * 1024, // 100MB limit
      allowedMimeTypes: [
        'application/pdf',
        'text/plain',
        'video/mp4',
        'audio/mpeg',
        'audio/wav',
      ],
    })

    if (error) {
      console.error('Error creating bucket:', error)
      throw error
    }

    return data
  }

  return { name: BUCKET_NAME }
}

/**
 * Upload a file to Supabase storage
 */
export async function uploadFile(
  file: File | Buffer,
  path: string,
  options?: {
    contentType?: string
    cacheControl?: string
  }
): Promise<{ path: string; url: string }> {
  // Ensure bucket exists
  await initializeBucket()

  const fileBuffer = file instanceof Buffer 
    ? file 
    : Buffer.from(await (file as File).arrayBuffer())

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(path, fileBuffer, {
      contentType: options?.contentType || (file instanceof File ? file.type : 'application/octet-stream'),
      cacheControl: options?.cacheControl || '3600',
      upsert: true,
    })

  if (error) {
    console.error('Error uploading file:', error)
    throw error
  }

  // Get public URL (for private buckets, you'll need to generate signed URLs)
  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path)

  return {
    path: data.path,
    url: urlData.publicUrl,
  }
}

/**
 * Get a signed URL for private file access
 */
export async function getSignedUrl(
  path: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expiresIn)

  if (error) {
    console.error('Error creating signed URL:', error)
    throw error
  }

  return data.signedUrl
}

/**
 * Delete a file from storage
 */
export async function deleteFile(path: string): Promise<boolean> {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .remove([path])

  if (error) {
    console.error('Error deleting file:', error)
    return false
  }

  return true
}

/**
 * List files in a folder
 */
export async function listFiles(folder: string = ''): Promise<string[]> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .list(folder)

  if (error) {
    console.error('Error listing files:', error)
    return []
  }

  return data?.map(file => file.name) || []
}

/**
 * Get file metadata
 */
export async function getFileMetadata(path: string) {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .list(path.split('/').slice(0, -1).join('/'))

  if (error) {
    console.error('Error getting file metadata:', error)
    return null
  }

  const fileName = path.split('/').pop()
  return data?.find(file => file.name === fileName)
}

