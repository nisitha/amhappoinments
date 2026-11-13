import { supabase } from '../src/lib/supabaseClient';

async function main() {
  console.log('Testing Supabase connection...');
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

  const { data: batches, error: batchError } = await supabase.from('ho_batches').select('*');

  if (batchError) {
    if (batchError.code === 'PGRST205' || batchError.message.includes('Could not find')) {
      console.log('NOTICE: Supabase endpoint is online and authorized, but database tables have not yet been created in PostgreSQL.');
      console.log('Action: Copy and run `supabase/schema.sql` in the Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/hcsstgdtftmoeczzgghc/sql/new).');
    } else {
      console.log('Supabase query error:', batchError);
    }
  } else {
    console.log('SUCCESS: Supabase tables found and active!');
    console.log('Batches in DB:', batches);
  }
}

main().catch(console.error);
