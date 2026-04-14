const fs = require('fs');
const path = require('path');

function check(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) { check(p); continue; }
    if (f.endsWith('.json')) {
      try { JSON.parse(fs.readFileSync(p, 'utf8')); console.log('✅', p); }
      catch(e) { console.log('❌', p, e.message); }
    }
  }
}
check('.');
console.log('\nDone! ' + fs.readdirSync('.').length + ' items in root');
