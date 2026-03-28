import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

Then add these two lines to `frontend/.env.local`:
```
REACT_APP_SUPABASE_URL=https://bjikmlvnxjfbsjmhwtbi.supabase.co
REACT_APP_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YL0d7N6xJXOioo-2de2LpA_3YEq6sV8