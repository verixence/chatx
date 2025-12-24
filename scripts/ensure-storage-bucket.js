// Script to ensure storage bucket exists
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function ensureBucket() {
  const BUCKET_NAME = 'learnchat-files';
  
  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('Error listing buckets:', listError);
    return;
  }
  
  const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
  
  if (bucketExists) {
    console.log(`✅ Bucket "${BUCKET_NAME}" already exists`);
    return;
  }
  
  // Create bucket
  console.log(`Creating bucket "${BUCKET_NAME}"...`);
  const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
    public: false,
    fileSizeLimit: 100 * 1024 * 1024, // 100MB
    // Note: allowedMimeTypes might not be supported in all Supabase versions
    // If needed, configure via Supabase dashboard or migration
  });
  
  if (error) {
    console.error('Error creating bucket:', error);
    return;
  }
  
  console.log(`✅ Bucket "${BUCKET_NAME}" created successfully`);
}

ensureBucket().catch(console.error);
