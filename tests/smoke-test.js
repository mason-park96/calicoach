const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const rootDir=path.join(__dirname,'..');
const engine=require(path.join(rootDir,'coach-engine.js'));
assert.equal(engine.bodyAreas.length,9);
const p={name:'박무승',gender:'남성',birthdate:'1996-07-12',height:184,weight:92,targetWeight:80,level:'intermediate',pushups:12,days:3,minutes:30,focus:'balanced',adjustAreas:['back','foot']};
for(const level of ['beginner','intermediate','advanced'])for(const minutes of [20,30,45])for(const plan of ['A','B','C']){
 const selected=engine.selectRoutine({...p,level,minutes},plan,{});
 assert(selected.items.length>=4 && selected.items.length<=5);
 assert(selected.items.every(id=>engine.MOVES[id]),selected.items.join(','));
 assert.equal(new Set(selected.items).size,selected.items.length,'No duplicated movements');
 assert(selected.items.some(id=>engine.MOVES[id].category==='push'));
 assert(selected.items.some(id=>engine.MOVES[id].category==='pull'));
}
assert.equal(engine.nextPlan(2,3),'C');assert.equal(engine.nextPlan(2,2),'A');
assert.equal(engine.safeChoice('reverse',{adjustAreas:['foot']}),'split');
assert.equal(engine.safeChoice('plank',{adjustAreas:['wrist']}),'dead');
assert.equal(engine.safeChoice('split',{adjustAreas:['knee']}),'bridge');
assert.equal(engine.targetAmount('push',p,{}),8);
const steps=[0,1,2].map(i=>({id:'push',phase:'main',round:i+1,key:`main:${i+1}:push`}));
let progress={};for(let i=0;i<4;i++)progress=engine.applyFeedback(progress,steps,Object.fromEntries(steps.map(s=>[s.key,'easy'])));
assert(progress.push.tier===1,'Repeated easy sessions should promote tier');
progress=engine.applyFeedback(progress,steps,{[steps[0].key]:'hard'});assert(progress.push.easySessions===0);
const noKey=steps.map(({key,...other})=>other);const withoutKey=engine.applyFeedback({},noKey,Object.fromEntries(steps.map(s=>[s.key,'easy'])));assert.equal(withoutKey.push.bonus,1,'feedback must work with real buildSteps lacking key');
class Storage{constructor(){this.map={}}getItem(k){return this.map[k]??null}setItem(k,v){this.map[k]=String(v)}removeItem(k){delete this.map[k]}}
const guideContext={window:{}};vm.runInNewContext(fs.readFileSync(path.join(rootDir,'exercise-guides.js'),'utf8'),guideContext);
const code=fs.readFileSync(path.join(rootDir,'app.js'),'utf8').replace('  render();setInterval(tick,250);', '  globalThis.TEST={getState:()=>({view,data:structuredClone(data),html:root.innerHTML}),saveProfile,startSession,completeSession,planFor,buildSteps,render};render();setInterval(tick,250);');
function boot(local=new Storage(),tab=new Storage()){
 const handlers={};const root={innerHTML:'',addEventListener:(name,fn)=>{handlers[name]=fn}};
 const document={getElementById:id=>id==='app'?root:null,addEventListener:()=>{},querySelector:()=>null};
 const window={scrollTo:()=>{},addEventListener:()=>{},AudioContext:null,webkitAudioContext:null,CalicoachEngine:engine,CalicoachGuides:guideContext.window.CalicoachGuides};
 const ctx={console,localStorage:local,sessionStorage:tab,window,document,navigator:{},location:{protocol:'file:'},setInterval:()=>{},setTimeout:()=>{},Date,Math,Number,String,Boolean,Object,Array,JSON,RegExp,Error,Blob,URL,structuredClone,FormData:class{constructor(form){this.fields=form.fields}get(k){return this.fields[k]}getAll(k){return this.fields[k]||[]}has(k){return Boolean(this.fields[k])}},alert:()=>{}};
 ctx.globalThis=ctx;vm.runInNewContext(code,ctx,{timeout:2000});return {api:ctx.TEST,root,local,handlers};
}
function form(name,overrides={}){return {fields:{name,gender:'남성',birthdate:'1996-07-12',height:'184',weight:'92',targetWeight:'80',level:'intermediate',days:'3',minutes:'30',focus:'balanced',pushups:'12',area:['back','foot'],...overrides}}}
const one=boot();assert.equal(one.api.getState().view,'profile');
assert(one.root.innerHTML.includes('목·경추'));assert(one.root.innerHTML.includes('발바닥·발뒤꿈치'));
assert.equal(one.api.saveProfile(form('박무승')),true);
assert.equal(one.api.getState().data.profile.adjustAreas.length,2);
assert(one.root.innerHTML.includes('오늘의 운동 미리보기'));
assert(one.root.innerHTML.includes('프로필이 저장되었습니다.'));
assert(one.root.innerHTML.includes('동작 배우기'));
const click=(app,action,id)=>app.handlers.click({target:{closest:()=>({dataset:{action,id}})}});
click(one,'details','push');
assert(one.root.innerHTML.includes('실제 자세 사진'), 'verified exercise photo source link');
assert(one.root.innerHTML.includes('시작 자세'));
assert(one.root.innerHTML.includes('바닥을 밀어 올라오세요'));
click(one,'close-modal');
assert(!one.root.innerHTML.includes('guide-modal'));

one.api.startSession();assert.equal(one.api.getState().data.active.steps[4].id,'push');
click(one,'details','prep1');assert.equal(one.api.getState().data.active.mode,'paused','guide pauses active timed workout');
assert(one.root.innerHTML.includes('시작 자세'));
click(one,'close-modal');assert.equal(one.api.getState().data.active.mode,'paused','user must manually resume');
click(one,'pause');assert.equal(one.api.getState().data.active.mode,'work','resumes timer');

const repeat=boot(one.local);assert.equal(repeat.api.getState().view,'workout');
assert(repeat.root.innerHTML.includes('.gif'), 'Shows offline motion gif');
assert.equal(repeat.api.getState().data.profile.name,'박무승');
const other=boot();assert.equal(other.api.saveProfile(form('이수희',{gender:'여성',level:'beginner',days:'2',minutes:'20',area:[]})),true);
assert.equal(other.api.getState().data.settings.rounds,2);
assert.equal(other.api.getState().data.profile.name,'이수희');
assert.notEqual(JSON.stringify(one.api.getState().data.profile),JSON.stringify(other.api.getState().data.profile));
const current=one.api.getState().data;
assert(current.programIndex===0);
one.api.completeSession();const result=one.api.getState().data;
assert.equal(result.programIndex,1);assert.equal(result.workouts.length,1);
assert.equal(engine.nextPlan(result.programIndex,p.days),'B');
const legacyStore=new Storage();const oldDevice=JSON.parse(one.local.getItem('calicoach.pwa.v3.device'));delete oldDevice.programIndex;delete oldDevice.progress;legacyStore.setItem('calicoach.pwa.v3.device',JSON.stringify(oldDevice));
assert.equal(boot(legacyStore).api.getState().data.programIndex,1);
const index=fs.readFileSync(path.join(rootDir,'index.html'),'utf8');assert(index.includes('coach-engine.js'));
const sw=fs.readFileSync(path.join(rootDir,'sw.js'),'utf8');assert(sw.includes('calicoach-shell-v1.4.0'));
for(const id of [...Object.keys(engine.MOVES),'prep1','prep2','prep3','prep4','cool1','cool2'])assert(fs.existsSync(path.join(rootDir,'media',`${id}.gif`)),`missing media ${id}`);
console.log('PASS: 27 plan combinations, 9 area flags, no duplicates, feedback progression, local data migration, user isolation, all media present');
