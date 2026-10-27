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
class Storage{constructor(){this.map={}}get length(){return Object.keys(this.map).length}key(i){return Object.keys(this.map)[i]??null}getItem(k){return this.map[k]??null}setItem(k,v){this.map[k]=String(v)}removeItem(k){delete this.map[k]}}
const guideContext={window:{}};vm.runInNewContext(fs.readFileSync(path.join(rootDir,'exercise-guides.js'),'utf8'),guideContext);
const videoContext={window:{}};vm.runInNewContext(fs.readFileSync(path.join(rootDir,'video-catalog.js'),'utf8'),videoContext);
const code=fs.readFileSync(path.join(rootDir,'app.js'),'utf8').replace('  render();setInterval(tick,250);', '  globalThis.TEST={getState:()=>({view,data:structuredClone(data),html:root.innerHTML}),saveProfile,startSession,completeSession,planFor,buildSteps,render,saveWeight,weightChanges,monthlyWorkouts,shiftMonth};render();setInterval(tick,250);');
function boot(local=new Storage(),tab=new Storage()){
 const handlers={};const root={innerHTML:'',addEventListener:(name,fn)=>{handlers[name]=fn}};
 const document={getElementById:id=>id==='app'?root:null,addEventListener:()=>{},querySelector:()=>null};
 const window={scrollTo:()=>{},addEventListener:()=>{},AudioContext:null,webkitAudioContext:null,CalicoachEngine:engine,CalicoachGuides:guideContext.window.CalicoachGuides,CalicoachVideoCatalog:videoContext.window.CalicoachVideoCatalog};
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
assert(one.root.innerHTML.includes('exercise-preview-video'), 'Home preview uses actual footage');
const click=(app,action,id,extra={})=>app.handlers.click({target:{closest:()=>({dataset:{action,id,...extra}})}});
const sources=JSON.parse(fs.readFileSync(path.join(rootDir,'tools/video_sources.json'),'utf8')).sources;
assert.equal(Object.keys(videoContext.window.CalicoachVideoCatalog).length,sources.length);
for(const source of sources){
 const clip=videoContext.window.CalicoachVideoCatalog[source.exercise_id];
 assert.equal(clip.url,source.url);
 assert(fs.existsSync(path.join(rootDir,clip.file)),'Missing MP4 '+source.exercise_id);
 assert(fs.existsSync(path.join(rootDir,clip.poster)),'Missing poster '+source.exercise_id);
 click(one,'details',source.exercise_id);
 assert(one.root.innerHTML.includes(`src="${clip.file}"`),'Guide video '+source.exercise_id);
 assert(one.root.innerHTML.includes('0.5배속'));
 assert(one.root.innerHTML.includes(`${source.provider} 원본 영상`));
 assert(!one.root.innerHTML.includes(`src="./media/${source.exercise_id}.gif"`),'Guide must replace animation');
 click(one,'close-modal');
}
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
assert(repeat.root.innerHTML.includes('src="./media/videos/prep1.mp4"'), 'Restored workout shows real warm-up video');
click(repeat,'details','prep3');
assert(repeat.root.innerHTML.includes('src="./media/videos/prep3.mp4"'), 'Supplied seated exercise uses imported media');
assert(repeat.root.innerHTML.includes('앉아서 무릎 펴기'), 'Seated exercise matches the supplied knee extension');
click(repeat,'close-modal');
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
const sw=fs.readFileSync(path.join(rootDir,'sw.js'),'utf8');assert(sw.includes('calicoach-shell-v1.4.1'));
for(const id of [...Object.keys(engine.MOVES),'prep1','prep2','prep3','prep4','cool1','cool2'])assert(fs.existsSync(path.join(rootDir,'media',`${id}.gif`)),`missing media ${id}`);
console.log('PASS: 27 plan combinations, 9 area flags, no duplicates, feedback progression, local data migration, user isolation, all media present');

// Calendar boundaries, dated weight edits and destructive reset must use real persisted state.
const journalStore=new Storage(),journalTab=new Storage();
const fixture=JSON.parse(JSON.stringify(oldDevice));
fixture.active=null;
fixture.weights=[{date:'2024-01-31',weight:90},{date:'2024-02-29',weight:81},{date:'2024-03-03',weight:80}];
fixture.workouts=[
 {plan:'A',completedAt:new Date(2024,1,1,10).toISOString(),minutes:20,stepsCompleted:10,totalSteps:12},
 {plan:'B',completedAt:new Date(2024,1,29,11).toISOString(),minutes:30},
 {plan:'C',completedAt:new Date(2024,1,29,18).toISOString(),minutes:15},
 {plan:'A',completedAt:new Date(2024,2,1,0).toISOString(),minutes:40}
];
journalStore.setItem('calicoach.pwa.v3.device',JSON.stringify(fixture));
const journal=boot(journalStore,journalTab);
assert.equal(journal.api.shiftMonth('2024-01',-1),'2023-12');
assert.equal(journal.api.shiftMonth('2024-12',1),'2025-01');
assert.equal(journal.api.monthlyWorkouts('2024-02').length,3);
click(journal,'nav',undefined,{value:'history'});
click(journal,'month-step',undefined,{kind:'history',month:'2024-02'});
assert(journal.root.innerHTML.includes('data-date="2024-02-29"'));
assert(!journal.root.innerHTML.includes('data-date="2024-02-30"'));
assert(journal.root.innerHTML.includes('65<small>분</small>'),'Monthly total sums all three sessions');
click(journal,'history-day',undefined,{date:'2024-02-29'});
assert(journal.root.innerHTML.includes('B 루틴')&&journal.root.innerHTML.includes('C 루틴'));
assert(!journal.root.innerHTML.includes('20분 · 완료'));
click(journal,'history-all');
assert(journal.root.innerHTML.includes('20분 · 완료'));
const initialChanges=journal.api.weightChanges();
assert.equal(initialChanges[0].rate,null);
assert.equal(initialChanges[1].rate,-10);
assert(Math.abs(initialChanges[2].rate-((80-81)/81*100))<1e-10,'Rate uses previous measurement, including previous month');
click(journal,'nav',undefined,{value:'weight'});
click(journal,'month-step',undefined,{kind:'weight',month:'2024-02'});
assert(journal.root.innerHTML.includes('-10.00%'));
assert.equal(journal.api.saveWeight('2024-02-30',70),false);
assert.equal(journal.api.saveWeight('9999-01-01',70),false);
assert.equal(journal.api.saveWeight('2024-02-29',0),false);
journal.handlers.submit({target:{id:'weight-form',fields:{date:'2024-02-29',weight:'72'}},preventDefault(){}});
assert.equal(journal.api.getState().data.weights.filter(item=>item.date==='2024-02-29').length,1);
assert.equal(journal.api.getState().data.weights.find(item=>item.date==='2024-02-29').weight,72);
assert.equal(journal.api.getState().data.profile.weight,80,'Backdated edits preserve latest chronological weight');
assert.equal(boot(journalStore).api.weightChanges()[1].rate,-20,'Edits survive reload');
assert(journal.root.innerHTML.includes('-20.00%'));

const recordsStore=new Storage();recordsStore.setItem('calicoach.pwa.v3.device',JSON.stringify(fixture));
const recordsOnly=boot(recordsStore),originalProfile=JSON.stringify(recordsOnly.api.getState().data.profile);
const originalRecords=JSON.stringify(recordsOnly.api.getState().data);
click(recordsOnly,'nav',undefined,{value:'settings'});
assert(recordsOnly.root.innerHTML.includes('記録')===false);
assert(recordsOnly.root.innerHTML.includes('기록·설정 초기화')&&recordsOnly.root.innerHTML.includes('프로필 포함 전체 초기화'));
click(recordsOnly,'records-reset');
assert.equal(JSON.stringify(recordsOnly.api.getState().data),originalRecords,'Records reset requires its confirmation');
click(recordsOnly,'records-reset-confirm');
assert(recordsOnly.root.innerHTML.includes('확인 · 기록 초기화'));
click(recordsOnly,'reset');
assert.equal(JSON.stringify(recordsOnly.api.getState().data),originalRecords,'All-data reset cannot execute from records-only dialog');
click(recordsOnly,'close-modal');
assert.equal(JSON.stringify(recordsOnly.api.getState().data),originalRecords,'Cancel records-only reset preserves data');
click(recordsOnly,'records-reset-confirm');click(recordsOnly,'records-reset');
const partial=recordsOnly.api.getState().data;
assert.equal(JSON.stringify(partial.profile),originalProfile,'Records-only reset preserves the complete profile');
assert.equal(partial.workouts.length,0);assert.equal(partial.active,null);
assert.equal(Object.keys(partial.progress).length,0);assert.equal(partial.programIndex,0);
assert.equal(partial.weights.length,1);assert.equal(partial.weights[0].weight,partial.profile.weight);
assert.equal(recordsOnly.api.getState().view,'home');
assert.equal(JSON.stringify(boot(recordsStore).api.getState().data.profile),originalProfile,'Retained profile survives reload');

journalStore.setItem('calicoach.pwa.v1',JSON.stringify(fixture));
journalStore.setItem('calicoach.pwa.v2.user.park',JSON.stringify(fixture));
journalStore.setItem('calicoach.pwa.v2.autoUser','park');
journalTab.setItem('calicoach.pwa.v2.tabUser','park');
journalStore.setItem('unrelated.setting','keep');journalTab.setItem('unrelated.tab','keep');
const beforeReset=JSON.stringify(journal.api.getState().data);
click(journal,'reset');
assert.equal(JSON.stringify(journal.api.getState().data),beforeReset,'Cannot reset without confirmation dialog');
click(journal,'reset-confirm');
assert(journal.root.innerHTML.includes('확인 · 전체 초기화'));
assert.equal(JSON.stringify(journal.api.getState().data),beforeReset,'Opening dialog does not delete data');
click(journal,'close-modal');
assert.equal(JSON.stringify(journal.api.getState().data),beforeReset,'Cancel preserves profile and records');
click(journal,'reset-confirm');click(journal,'reset');
const resetData=journal.api.getState().data;
assert.equal(journal.api.getState().view,'profile');
assert.equal(resetData.profile,null);assert.equal(resetData.weights.length,0);assert.equal(resetData.workouts.length,0);
assert.equal(resetData.active,null);assert.equal(Object.keys(resetData.progress).length,0);
assert.equal(journalStore.getItem('calicoach.pwa.v1'),null);
assert.equal(journalStore.getItem('calicoach.pwa.v2.user.park'),null);
assert.equal(journalTab.getItem('calicoach.pwa.v2.tabUser'),null);
assert.equal(journalStore.getItem('unrelated.setting'),'keep');assert.equal(journalTab.getItem('unrelated.tab'),'keep');
assert.equal(boot(journalStore,journalTab).api.getState().data.profile,null,'Old profiles cannot migrate back after reset');
console.log('PASS: monthly calendar, leap day, year boundaries, dated weight upsert, change rates, reset confirmation/cancel and legacy cleanup');
