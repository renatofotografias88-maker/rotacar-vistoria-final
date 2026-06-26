import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ikqkipacxemgxtqkvgdb.supabase.co';
const supabaseKey = 'sb_publishable_Nc0RC_qAiCOpoNR7cD0eXA_S5XFu55J';

export const supabase = createClient(supabaseUrl, supabaseKey);
