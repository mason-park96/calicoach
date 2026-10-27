const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
let code=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
code=code.replace('  render();setInterval(tick,250);', '  globalThis.TEST={getState:()=>({userId:currentUserId,view,data:structuredClone(data),html:root.innerHTML}),signIn,signOut,saveProfile,startSession,doneStep,planFor,buildSteps,render,restore,load,migrateLegacy};render();setInterval(tick,250);');
class Storage{constructor(){this.map={}}getItem(k){return this.map[k]??null}setItem(k,v){this.map[k]=String(v)}removeItem(k){delete this.map[k]}key(i){return Object.keys(this.map)[i]||null}get length(){return Object.keys(this.map).length}}
const localStorage=new Storage(),sessionStorage=new Storage();
function boot(){
 const listeners={};
 const root={innerHTML:'',addEventListener:(name,fn)=>{listeners[name]=fn}};
 const document={getElementById:(id)=>id==='app'?root:null,addEventListener:()=>{},querySelector:()=>null};
 const context={console,localStorage,sessionStorage,window:{scrollTo:()=>{},addEventListener:()=>{},AudioContext:null,webkitAudioContext:null},document,navigator:{},location:{protocol:'file:'},setInterval:()=>{},Date,Math,Number,String,Boolean,Object,Array,JSON,RegExp,Error,Blob,URL,FormData:class{constructor(obj){this.fields=obj.fields}get(k){return this.fields[k]}has(k){return Boolean(this.fields[k])}},structuredClone,setTimeout:()=>{},alert:()=>{}};
 context.globalThis=context;
 vm.runInNewContext(code,context,{timeout:2000});
 return {api:context.TEST,listeners,root};
}
function setup(api,{birthdate,height,weight,targetWeight,level,days,minutes,focus='balanced',back=false,foot=false,pushups=''}){
 assert(api.saveProfile({fields:{birthdate,height:String(height),weight:String(weight),targetWeight:String(targetWeight),level,days:String(days),minutes:String(minutes),focus,back,foot,pushups}}));
}
function event(listeners,act){listeners.click({target:{closest:()=>({dataset:{action:act}})}})}
let {api,listeners,root}=boot();
assert.equal(api.getState().view,'login');
assert(root.innerHTML.includes('박무승')&&root.innerHTML.includes('이수희')&&root.innerHTML.includes('권승용'));
api.signIn('park',true);
assert.equal(api.getState().view,'profile');
assert(root.innerHTML.includes('name="birthdate" type="date" value=""')); // no personal DOB hard-coded
setup(api,{birthdate:'1990-01-01',height:175,weight:77,targetWeight:70,level:'intermediate',days:3,minutes:30,back:true,foot:true});
assert.equal(api.getState().view,'home');
assert(root.innerHTML.includes('박무승님의 맞춤형 운동 코스'));
assert.equal(api.getState().data.settings.rounds,3);
assert.deepEqual(Array.from(api.planFor('A').items),['push','squat','reverse','wraise','dead']);
api.startSession();
assert.equal(api.getState().data.active.steps[4].id,'push');
assert.equal(api.getState().data.active.steps.length,4+5*3+2+2);
api.signOut();
assert.equal(api.getState().view,'login');
assert(localStorage.getItem('calicoach.pwa.v2.user.park'));
api.signIn('lee',true);
assert.equal(api.getState().data.profile,null);
setup(api,{birthdate:'1992-01-23',height:165,weight:64,targetWeight:60,level:'beginner',days:2,minutes:20,focus:'loss'});
assert.equal(api.getState().data.settings.rounds,2);
assert.equal(api.getState().data.settings.rest,20);
assert.equal(api.planFor('A').items[0],'knee');
api.startSession();
assert.equal(api.getState().data.active.steps[4].id,'knee');
assert.equal(api.getState().data.active.steps.length,4+5*2+2+2);
assert(root.innerHTML.includes('준비운동'));
api.signOut();
api.signIn('park',true);
assert.equal(api.getState().data.profile.height,175);
assert.equal(api.getState().data.active.steps[4].id,'push');
api.signOut();
api.signIn('kwon',false);
assert.equal(localStorage.getItem('calicoach.pwa.v2.autoUser'),null);
assert.equal(sessionStorage.getItem('calicoach.pwa.v2.tabUser'),'kwon');
assert.equal(api.getState().data.profile,null);
setup(api,{birthdate:'1993-03-15',height:178,weight:85,targetWeight:82,level:'advanced',days:5,minutes:45,focus:'fitness'});
assert.equal(api.getState().data.settings.rounds,4);
assert.equal(api.getState().data.settings.rest,40);
assert.equal(api.planFor('A').items[0],'tempo');
assert.equal(api.getState().data.profile.gender,undefined);
// Same-device reload should remember selected user without confusing accounts
let next=boot();
assert.equal(next.api.getState().userId,'kwon');
assert.equal(next.api.getState().data.profile.height,178);
assert(next.root.innerHTML.includes('권승용님의 맞춤형 운동 코스'));
next.api.signOut();
assert.equal(next.api.getState().view,'login');
const parked=JSON.parse(localStorage.getItem('calicoach.pwa.v2.user.park'));
const leed=JSON.parse(localStorage.getItem('calicoach.pwa.v2.user.lee'));
assert.equal(parked.profile.height,175);
assert.equal(leed.profile.height,165);
assert.equal(parked.settings.targetWeight,70);
assert.equal(leed.settings.targetWeight,60);
console.log('PASS: 3 logins, auto/non-auto login, separate data, tailored plans, default profile, reload');
