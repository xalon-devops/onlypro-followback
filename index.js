const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runAutomation() {
  const { data: sessions, error } = await supabase
    .from('onlyfans_sessions')
    .select('*')
    .eq('status', 'connected')
    .limit(1);

  if (error || !sessions.length) {
    console.log('No valid sessions');
    await supabase.from('followback_logs').insert([{
      user_id: null,
      status: 'error',
      message: 'No valid sessions found'
    }]);
    return;
  }

  const session = sessions[0];
  const cookie = JSON.parse(session.cookie_data);

  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setCookie(...cookie);

    await page.goto('https://onlyfans.com/my/chats/fans', { waitUntil: 'networkidle0' });

    await page.evaluate(() => {
      document.querySelectorAll('button.follow').forEach(btn => btn.click());
    });

    await browser.close();
    console.log('Follow-back run complete ✅');

    await supabase.from('followback_logs').insert([{
      user_id: session.user_id || null,
      status: 'success',
      message: 'Followed back fans successfully'
    }]);

  } catch (err) {
    console.error('Automation error:', err.message);
    await supabase.from('followback_logs').insert([{
      user_id: session.user_id || null,
      status: 'error',
      message: err.message
    }]);
  }
}

runAutomation();
