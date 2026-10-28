/* Calicoach planner v1.3: pure deterministic rules, no health diagnosis, no server */
(function(root,factory){const engine=factory();if(typeof module==='object'&&module.exports)module.exports=engine;root.CalicoachEngine=engine;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const bodyAreas=[
 ['neck','목·경추'],['shoulder','어깨'],['elbow','팔꿈치'],['wrist','손목·손'],
 ['back','허리·척추'],['hip','골반·고관절'],['knee','무릎'],['ankle','발목'],['foot','발바닥·발뒤꿈치']
];
const MOVES={
 wall:{name:'벽 푸시업',category:'push',level:0,amount:12,group:'wall'},
 incline:{name:'높은 지지대 푸시업',category:'push',level:1,amount:10,group:'incline',requires:'stableSurface'},
 knee:{name:'무릎 푸시업',category:'push',level:2,amount:9,group:'knee'},
 push:{name:'일반 푸시업',category:'push',level:3,amount:8,group:'push'},
 tempo:{name:'템포 푸시업',category:'push',level:4,amount:7,group:'push'},
 closepush:{name:'좁은 푸시업',category:'push',level:5,amount:6,group:'push'},
 chairsquat:{name:'의자 스쿼트',category:'squat',level:0,amount:12,group:'squat',requires:'stableChair'},
 squat:{name:'스쿼트',category:'squat',level:1,amount:14,group:'squat'},
 temposquat:{name:'천천히 스쿼트',category:'squat',level:2,amount:12,group:'squat'},
 split:{name:'스플릿 스쿼트',category:'squat',level:3,amount:8,group:'lunge',each:true},
 reverse:{name:'리버스 런지',category:'squat',level:3,amount:8,group:'lunge',each:true},
 bridge:{name:'글루트 브리지',category:'hinge',level:0,amount:14,group:'bridge'},
 singlebridge:{name:'한발 글루트 브리지',category:'hinge',level:2,amount:8,group:'bridge',each:true},
 clam:{name:'클램셸',category:'hinge',level:0,amount:12,group:'clam',each:true},
 hipabduct:{name:'옆으로 누워 다리 들기',category:'hinge',level:1,amount:12,group:'clam',each:true},
 wraise:{name:'W 레이즈',category:'pull',level:0,amount:12,group:'wraise'},
 traise:{name:'T 레이즈',category:'pull',level:1,amount:12,group:'wraise'},
 snowangel:{name:'리버스 스노우 엔젤',category:'pull',level:2,amount:10,group:'wraise'},
 bird:{name:'버드독',category:'core',level:1,amount:8,group:'bird',each:true},
 dead:{name:'데드버그',category:'core',level:0,amount:8,group:'dead',each:true},
 plank:{name:'플랭크',category:'core',level:2,amount:30,group:'plank',timed:true},
 sideleft:{name:'사이드 플랭크 · 왼쪽',category:'core',level:2,amount:25,group:'sideplank',timed:true},
 sideright:{name:'사이드 플랭크 · 오른쪽',category:'core',level:2,amount:25,group:'sideplank',timed:true}
};
const VERSION=2;
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const number=(v,fallback=0)=>v!==null&&v!==''&&Number.isFinite(Number(v))?Number(v):fallback;
const patterns={push:'horizontalPush',squat:'kneeDominant',hinge:'hipExtension',core:'trunkControl',scapular:'scapularAccessory',hipAbduction:'hipAbduction'};
for(const id of ['wraise','traise','snowangel'])MOVES[id].category='scapular';
for(const id of ['clam','hipabduct'])MOVES[id].category='hipAbduction';
for(const [id,m] of Object.entries(MOVES)){
 m.pattern=patterns[m.category];
 [m.min,m.max]=m.category==='push'?[6,12]:['split','reverse'].includes(id)?[6,10]:m.category==='squat'?[8,15]:id==='bridge'?[10,20]:id==='singlebridge'?[8,15]:['dead','bird'].includes(id)?[6,10]:id==='plank'?[20,40]:m.timed?[15,30]:[8,15];
}
function areas(p){const a=new Set((Array.isArray(p?.adjustAreas)?p.adjustAreas:[]).filter(x=>bodyAreas.some(([id])=>id===x)));if(p?.back)a.add('back');if(p?.foot)a.add('foot');return a;}
function safeChoice(id,p={}){
 const a=areas(p);
 if((a.has('wrist')||a.has('elbow')||a.has('shoulder'))&&MOVES[id]?.category==='push')id='wall';
 if((a.has('wrist')||a.has('elbow'))&&['plank','bird','sideleft','sideright'].includes(id))id='dead';
 if(a.has('shoulder')&&MOVES[id]?.category==='scapular')id='wraise';
 if(a.has('foot')&&id==='reverse')id='split';
 if((a.has('knee')||a.has('ankle'))&&['split','reverse','temposquat'].includes(id))id='squat';
 if(a.has('knee')&&['squat','chairsquat'].includes(id))return null;
 if((a.has('hip')||a.has('back'))&&id==='singlebridge')id='bridge';
 if(a.has('hip')&&['split','reverse'].includes(id))id='squat';
 if(id==='incline'&&!p.stableSurface)id='knee';
 if(id==='chairsquat'&&!p.stableChair)id='squat';
 return id;
}
function stateFor(progress,id){return progress?.version===VERSION?progress.exercises?.[id]||{}:{};}
function trainingLevel(p={}){return ['beginner','intermediate','advanced'].includes(p.level)?p.level:'intermediate';}
function levelProgress(p,progress){return progress?.mode==='manual-level'&&progress.level===trainingLevel(p)?progress:{};}
function targetAmount(id,p={},progress={}){
 const m=MOVES[id];if(!m)return null;
 const level=trainingLevel(p),offset=level==='advanced'?4:level==='intermediate'?2:0;
 const initial=m.min+(m.timed?(level==='advanced'?10:level==='intermediate'?5:0):offset);
 return Math.round(clamp(number(stateFor(levelProgress(p,progress),id).target,initial),1,m.max));
}
function prescription(id,p,progress){const m=MOVES[id];return {id,pattern:m.pattern,amount:targetAmount(id,p,progress),min:m.min,max:m.max,each:!!m.each,timed:!!m.timed};}
function pushSequence(p){return ['wall',...(p.stableSurface?['incline']:[]),'knee','push'];}

function easier(id,p){const m=MOVES[id],seq=m.category==='push'?pushSequence(p):m.category==='squat'?[...(p.stableChair?['chairsquat']:[]),'squat','split','reverse']:m.category==='hinge'?['bridge','singlebridge']:[];if(m.category==='core'&&id!=='dead')return 'dead';const i=seq.indexOf(id);return i>0?safeChoice(seq[i-1],p):null;}
function reducePrescription(step,p={},actual=step.amount){
 const m=MOVES[step.id];if(!m)return step;
 const lower=(actual<m.min||step.amount<=m.min)?easier(step.id,p):null;
 return {...step,...prescription(lower||step.id,p,{}),amount:lower?MOVES[lower].min:Math.max(1,Math.min(step.amount-2,actual-1)),adjusted:true};
}
function selectRoutine(p={},plan='A',progress={},context={}){
 const level=trainingLevel(p),intro=false,light=!!context.light,tracked=levelProgress(p,progress);
 const push=level==='beginner'?(p.stableSurface?'incline':'wall'):level==='intermediate'?'knee':'push';
 let squat=level==='beginner'&&p.stableChair?'chairsquat':level==='advanced'?'temposquat':'squat';if(plan==='B'&&p.singleLegReady&&level!=='beginner')squat='split';
 const raw=[squat,push,level==='advanced'?'singlebridge':'bridge',plan==='B'?'traise':plan==='C'?'snowangel':'wraise',plan==='B'&&p.sidePlankReady&&level!=='beginner'?'sideleft':level==='advanced'&&plan==='A'?'plank':plan==='C'?'bird':'dead'];
 const base=Number(p.minutes)<=20?[2,2,2,2,1]:level==='beginner'?(Number(p.minutes)>=45?[3,3,2,2,2]:[2,2,2,2,1]):level==='advanced'?(Number(p.minutes)>=45?[4,4,3,3,2]:[3,3,3,3,2]):Number(p.minutes)>=45?[3,3,3,3,2]:[3,3,2,2,2],slots=[],missing=[],seen=new Set();
 for(let i=0;i<raw.length;i++){
  const pattern=MOVES[raw[i]].pattern;
  let id=tracked.choices?.[pattern]||raw[i];if(!MOVES[id]||MOVES[id].pattern!==pattern||MOVES[id].level>MOVES[raw[i]].level)id=raw[i];
  id=safeChoice(id,p);
  if(!id||progress.version===VERSION&&progress.blocked?.[pattern]||seen.has(id)){missing.push(pattern);continue;}seen.add(id);
  let sets=clamp(base[i]+clamp(number(context.setAdjustment),-1,1)-(stateFor(tracked,id).reduceSets?1:0),1,4);
  if(light)sets=1;
  const slot={...prescription(id,p,progress),sets,slot:i};if(light||intro)slot.amount=Math.min(slot.amount,MOVES[id].min);if(id==='sideleft')slot.pair='sideright';slots.push(slot);
 }
 const rest=clamp(number(context.rest,60),45,180),longRest=clamp(number(context.longRest,90),60,180);
 const estimate=()=>{const sequence=[];for(const block of [[0,1],[2,3],[4]]){const group=slots.filter(s=>block.includes(s.slot));for(let r=1;r<=Math.max(0,...group.map(s=>s.sets));r++)for(const s of group)if(r<=s.sets){sequence.push({id:s.id,seconds:s.timed?s.amount:s.amount*(['tempo','temposquat'].includes(s.id)?4:3)*(s.each?2:1)});if(s.pair)sequence.push({id:s.pair,seconds:s.amount,pairOf:s.id});}}let seconds=420;for(let i=0;i<sequence.length;i++){const s=sequence[i];seconds+=s.seconds;if(i>0)seconds+=s.pairOf===sequence[i-1].id?15:s.id===sequence[i-1].id?longRest:rest;}return Math.ceil(seconds/60);};
 while(estimate()>number(p.minutes,30)){const s=[3,2,4,0,1].map(i=>slots.find(x=>x.slot===i&&x.sets>1)).find(Boolean);if(!s)break;s.sets--;}
 return {version:VERSION,level,items:slots.flatMap(s=>s.pair?[s.id,s.pair]:[s.id]),slots,missing,extra:[],rounds:Math.max(1,...slots.map(s=>s.sets)),totalSets:slots.reduce((n,s)=>n+s.sets,0),estimatedMinutes:estimate(),rest,longRest,intro,light,label:`${plan} 루틴`,subtitle:light?'회복 중심 · 각 1세트':`${{beginner:'초급 · 기초 동작',intermediate:'중급 · 기본 근력',advanced:'고급 · 높은 운동 강도'}[level]}`,note:'수준은 설정에서 직접 바꿀 수 있습니다. 맨몸 코스의 견갑 보조운동은 실제 등 당기기 부하를 충분히 대신하지 못합니다.'};
}
function buildSteps(definition,p={},progress={}){
 const result=['prep1','prep2','prep4'].map(id=>({id,phase:'warmup',round:0,amount:60}));
 for(const s of definition.slots.slice(0,2))result.push({...s,phase:'warmup',round:0,amount:Math.min(4,s.amount),practice:true});
 for(const block of [[0,1],[2,3],[4]]){const slots=definition.slots.filter(s=>block.includes(s.slot));for(let r=1;r<=Math.max(0,...slots.map(s=>s.sets));r++)for(const s of slots)if(r<=s.sets){result.push({...s,phase:'main',round:r,totalSets:s.sets,rest:definition.rest});if(s.pair)result.push({...prescription(s.pair,p,progress),amount:s.amount,phase:'main',round:r,totalSets:s.sets,rest:15,pairOf:s.id});}}
 result.push({id:'cool1',phase:'cooldown',round:0,amount:60},{id:'cool2',phase:'cooldown',round:0,amount:60});
 return result.map((s,i)=>({...s,key:`${s.phase}:${s.round}:${s.id}:${i}`}));
}
function nextPlan(index,days){const s=Number(days)>=3?['A','B','C']:['A','B'];return s[Math.max(0,number(index))%s.length];}
function applyFeedback(progress,steps,feedback,p={}){
 const tracked=levelProgress(p,progress);
 const next=tracked.version===VERSION?JSON.parse(JSON.stringify(tracked)):{version:VERSION,mode:'manual-level',level:trainingLevel(p),exercises:{},choices:{},blocked:{...(progress?.blocked||{})}};
 next.exercises=next.exercises||{};next.choices=next.choices||{};next.blocked=next.blocked||{};
 const groups={};for(const step of steps||[]){if(step.phase!=='main'||!MOVES[step.id])continue;const record=feedback?.[step.key||`${step.phase}:${step.round}:${step.id}`];if(!record||record==='skipped'||record.status==='skipped')continue;const r=typeof record==='string'?{vote:record}:record;(groups[step.id]??=[]).push({step,...r});}
 const limitedPatterns=new Set(Object.entries(groups).filter(([id,records])=>records.some(r=>['hard','pain'].includes(r.vote)||Number.isFinite(r.actual)&&r.actual<Math.min(r.step.amount??MOVES[id].min,MOVES[id].min))).map(([id])=>MOVES[id].pattern));
 for(const id of new Set((steps||[]).filter(s=>s.phase==='main'&&MOVES[s.id]).map(s=>s.id)))if(!groups[id]&&next.exercises[id])next.exercises[id].successes=0;
 for(const [id,records] of Object.entries(groups)){
  const m=MOVES[id],state={...stateFor(next,id)};
  if(records.some(r=>r.vote==='pain')){next.blocked[m.pattern]=true;state.successes=0;}
  else if(records.some(r=>r.vote==='hard'||Number.isFinite(r.actual)&&r.actual<Math.min(r.step.amount??m.min,m.min))){
   const r=records.find(r=>r.vote==='hard'||Number.isFinite(r.actual)&&r.actual<Math.min(r.step.amount??m.min,m.min)),adjusted=reducePrescription({...r.step,amount:r.step.amount??targetAmount(id,p,next)},p,Number.isFinite(r.actual)?r.actual:r.step.amount??m.min);
   state.target=adjusted.id===id?adjusted.amount:m.min;state.successes=0;state.hardSessions=(state.hardSessions||0)+1;state.reduceSets=state.hardSessions>=2;
   if(adjusted.id!==id){next.choices[m.pattern]=adjusted.id;next.exercises[adjusted.id]={...stateFor(next,adjusted.id),target:adjusted.amount,successes:0};}
  }else{
   const expected=(steps||[]).filter(s=>s.phase==='main'&&s.id===id).length;
   const complete=records.length===expected&&records.every(r=>Number.isFinite(r.actual)&&['easy','ok'].includes(r.vote));
   if(complete){state.hardSessions=0;state.reduceSets=false;const atTop=!limitedPatterns.has(m.pattern)&&records.every(r=>r.actual>=m.max&&number(r.rir,r.vote==='easy'?4:2)>=2);state.successes=atTop?(state.successes||0)+1:0;state.target=clamp(Math.min(...records.map(r=>r.actual))+(records.every(r=>r.vote==='easy')?1:0),1,m.max);state.successes=Math.min(2,state.successes);}
   else state.successes=0;
  }
  next.exercises[id]=state;
 }
 return next;
}
function recoveryStatus(workouts=[],now=new Date()){
 const dates=workouts.filter(w=>w?.completedAt&&!w.light).map(w=>new Date(w.completedAt)).filter(d=>!Number.isNaN(d.valueOf())).sort((a,b)=>b-a);if(!dates.length)return {ready:true};const localDay=d=>Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()),days=(localDay(now)-localDay(dates[0]))/86400000;return {ready:days>=2,days,last:dates[0].toISOString()};
}
function weeklySchedule(days=3){const n=Math.min(3,number(days,3));return ['A',number(days)>=4?'걷기':'회복',n===2?'회복':'B',n===2?'B':'회복',n===2?'회복':'C',number(days)>=5?'걷기':'회복','회복'];}
return {VERSION,bodyAreas,MOVES,areas,safeChoice,selectRoutine,nextPlan,targetAmount,applyFeedback,buildSteps,reducePrescription,recoveryStatus,weeklySchedule,trainingLevel};
});
