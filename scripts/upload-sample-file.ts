import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucketName =
    process.env.SUPABASE_STORAGE_BUCKET ?? 'minecomplyapp-bucket';

  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL in environment.');
  }

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in environment.');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

  const fileName = `sample-data/sample-${new Date().toISOString()}-${randomUUID()}.txt`;
  const fileContent = `Sample file created at ${new Date().toISOString()} for MineComply storage validation.`;

  const { error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, Buffer.from(fileContent, 'utf8'), {
      contentType: 'text/plain; charset=utf-8',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload sample file: ${error.message}`);
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(fileName, 60 * 5);

  if (signedUrlError) {
    throw new Error(
      `File uploaded but failed to create signed URL: ${signedUrlError.message}`,
    );
  }

  console.log(
    `Sample file uploaded to bucket '${bucketName}' as '${fileName}'.`,
  );
  console.log('Temporary download URL (valid 5 minutes):');
  console.log(signedUrlData.signedUrl);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
