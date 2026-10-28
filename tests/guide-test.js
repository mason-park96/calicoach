const fs=require('node:fs');const vm=require('node:vm');const assert=require('node:assert/strict');
const source=fs.readFileSync('exercise-guides.js','utf8');const context={window:{}};vm.runInNewContext(source,context);
const guides=context.window.CalicoachGuides.guides;
const ids=[...fs.readFileSync('sw.js','utf8').matchAll(/'\.\/media\/([a-z0-9]+)\.gif'/g)].map(x=>x[1]);
assert.equal(ids.length,29);
for(const id of ids){assert(guides[id],id+' guide missing');assert(guides[id].start&&guides[id].move&&guides[id].check,id+' insufficient instructions');if(guides[id].reference)assert(/^https:\/\//.test(guides[id].reference.url));}
const app=fs.readFileSync('app.js','utf8');const index=fs.readFileSync('index.html','utf8');
assert(app.includes('통증이 있으면 중단하세요.'));
assert(!app.includes('허리나 발바닥 통증이 뚜렷하게 심해지면'));
assert(app.includes('type="submit">확인</button>'));
assert(index.indexOf('exercise-guides.js') < index.indexOf('./app.js'));
assert(app.includes("if(data.active && data.active.mode!=='paused')togglePause()"));
console.log('PASS guide-test: '+ids.length+' guides, official links, confirmation, modal pause and loading order');
