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
const sequences={push:['wall','knee','push','tempo','closepush'],squat:['chairsquat','squat','temposquat','split'],hinge:['bridge','hipabduct','singlebridge'],pull:['wraise','traise','snowangel'],core:['dead','bird','plank']};
// Physical-activity screening isn't a medical assessment; swap common provocative patterns conservatively.
function areas(profile){const found=Array.isArray(profile?.adjustAreas)?profile.adjustAreas:[];const result=new Set(found.filter(s=>bodyAreas.some(([key])=>key===s)));if(profile?.back)result.add('back');if(profile?.foot)result.add('foot');return result;}
function safeChoice(id,profile){const a=areas(profile);if(a.has('wrist')||a.has('elbow')){if(MOVES[id]?.category==='push')id='wall';if(['plank','bird','sideleft','sideright'].includes(id))id='dead';}
 if(a.has('shoulder')){if(MOVES[id]?.category==='push')id='wall';if(['wraise','traise','snowangel'].includes(id))id='wraise';}
 if(a.has('foot')&&id==='reverse')id='split';
 if(a.has('knee')||a.has('ankle')){if(['split','reverse','temposquat'].includes(id))id='squat';if(a.has('knee')&&['squat','chairsquat'].includes(id))id='bridge';}
 if(a.has('hip')){if(['split','reverse','singlebridge'].includes(id))id='bridge';}
 if(a.has('back')){if(['singlebridge'].includes(id))id='bridge';}
 if((id==='incline'&&!profile?.stableSurface)||(id==='chairsquat'&&!profile?.stableChair))id=id==='incline'?'knee':'squat';
 return id;
}
function baseFor(category,p){const lv=p?.level||'beginner';const push=Number(p?.pushups);if(category==='push'){
 if(p?.pushups!==''&&p?.pushups!==null&&p?.pushups!==undefined&&Number.isFinite(push))return push>=22?3:push>=8?2:push>=3?1:0;
 return lv==='advanced'?3:lv==='intermediate'?2:1;
}
 const levels={beginner:0,intermediate:1,advanced:2};return levels[lv]??0;
}
function pick(cat,p,progress={},shift=0){const seq=sequences[cat],level=Math.max(0,Math.min(seq.length-1,baseFor(cat,p)+shift+(progress[cat]?.tier||0)));return safeChoice(seq[level],p);}
function selectRoutine(profile,plan,progress={}){
 const p=profile||{},days=Number(p.days)||3,mins=Number(p.minutes)||30;
 const list=plan==='B'?[
 pick('squat',p,progress,1),pick('push',p,progress,-1),pick('pull',p,progress,0),pick('hinge',p,progress,0),pick('core',p,progress,1)
 ]:plan==='C'?[
 pick('push',p,progress,0),pick('hinge',p,progress,1),pick('squat',p,progress,0),pick('pull',p,progress,1),pick('core',p,progress,0)
 ]:[pick('push',p,progress,0),pick('squat',p,progress,0),pick('pull',p,progress,0),pick('hinge',p,progress,0),pick('core',p,progress,0)];
 if(p.focus==='fitness' && plan==='A')list[0]=pick('push',p,progress,1);
 if(mins<=20)list.splice(4,1);
 // keep movement families balanced and preserve individually accessible exercise IDs
 const items=[];for(const id of list){if(!items.includes(id))items.push(id);else{const fallback=['dead','wraise','bridge','squat','wall'].find(x=>!items.includes(x));if(fallback)items.push(safeChoice(fallback,p));}}
 const rounds=mins<=20?2:mins>=45?3:3;
 return {items,extra:mins>=45?['plank']:[],rounds,label:`${plan} 루틴`,subtitle:p.focus==='fitness'?'근력 향상 중심':p.focus==='loss'?'전신 근력 · 감량 지원':'균형 있는 전신 근력',note:'기구 없이 등 당기기 훈련은 제한적입니다. 추후 저항 밴드 또는 철봉을 추가하면 보완할 수 있습니다.'};
}
function nextPlan(index,days){const schedule=Number(days)>=3?['A','B','C']:['A','B'];return schedule[Math.max(0,Number(index)||0)%schedule.length];}
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
function targetAmount(id,profile,progress={}){
 const meta=MOVES[id];if(!meta)return null;
 let n=meta.amount;const count=Number(profile?.pushups);
 if(meta.category==='push'&&profile?.pushups!==''&&Number.isFinite(count)&&count>0&&id==='push')n=Math.min(n,Math.max(4,Math.round(count*.7)));
 return clamp(n+(progress[meta.category]?.bonus||0),meta.timed?15:4,meta.timed?75:24);
}
function applyFeedback(progress,steps,feedback){const next=JSON.parse(JSON.stringify(progress||{}));
 const counts={};for(const step of steps||[]){if(step.phase!=='main')continue;const id=step.id,cat=MOVES[id]?.category;if(!cat)continue;const vote=feedback?.[step.key||`${step.phase}:${step.round}:${step.id}`]||'ok';if(!counts[cat])counts[cat]={easy:0,hard:0,ok:0};counts[cat][vote]=(counts[cat][vote]||0)+1;}
 for(const [cat,count] of Object.entries(counts)){
   const p=next[cat]||{tier:0,bonus:0,easySessions:0};
   if(count.hard>0){p.bonus=clamp((p.bonus||0)-2,0,6);p.easySessions=0;}
   else if(count.easy>=Math.max(1,count.ok+count.hard) && count.easy>=2){p.easySessions=(p.easySessions||0)+1;p.bonus=clamp((p.bonus||0)+1,0,6);
     if(p.easySessions>=3 && p.bonus>=4){p.tier=clamp((p.tier||0)+1,0,2);p.bonus=0;p.easySessions=0;}
   }else{p.easySessions=0;}
   next[cat]=p;
 }
 return next;
}
return {bodyAreas,MOVES,areas,safeChoice,selectRoutine,nextPlan,targetAmount,applyFeedback};
});
