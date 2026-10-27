/* Calisthenics Coach PWA v1.4.1 — reviewed video media support */
(() => {
  'use strict';
  // v1.2: 계정/로그인 없이 이 기기의 단일 프로필을 사용합니다.
  const LEGACY_KEY = 'calicoach.pwa.v1';
  const V2_PREFIX = 'calicoach.pwa.v2.user.';
  const V2_AUTO_KEY = 'calicoach.pwa.v2.autoUser';
  const V2_TAB_KEY = 'calicoach.pwa.v2.tabUser';
  const DEVICE_KEY = 'calicoach.pwa.v3.device';
  // 이전 버전의 계정 ID는 데이터 이전 때에만 사용합니다.
  const OLD_USERS = Object.freeze({
    park:{name:'박무승',gender:'남성'},
    lee:{name:'이수희',gender:'여성'},
    kwon:{name:'권승용',gender:'남성'}
  });
  function profileDraft(){
    return {name:'',gender:'',birthdate:'',height:'',weight:'',targetWeight:'',level:'intermediate',pushups:'',days:3,minutes:30,focus:'balanced',back:false,foot:false,adjustAreas:[]};
  }
  const DAY_NAMES = ['일','월','화','수','목','금','토'];
  const $ = (sel) => document.querySelector(sel);
  const root = document.getElementById('app');
  const dateStr = (date = new Date()) => {
    const y = date.getFullYear(), m = String(date.getMonth()+1).padStart(2,'0'), d = String(date.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  };
  const humanDate = d => {const p = String(d).split('-'); return `${Number(p[1])}월 ${Number(p[2])}일`;};
  const num = (value, low, high) => Math.min(high, Math.max(low, Number(value) || low));
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const DEFAULTS = () => ({
    profile:null,
    settings: {rounds:3, rest:25, longRest:55, sound:true, speech:false, targetWeight:0, reps:{}},
    weights:[], workouts:[], nextPlan:'A', programIndex:0, progress:{}, active:null
  });
  function normalizeData(raw){
    if(!raw || typeof raw!=='object')return DEFAULTS();
    const defaults=DEFAULTS();
    return {
      profile:raw.profile && typeof raw.profile==='object' ? raw.profile:null,
      settings:{...defaults.settings,...(raw.settings||{}),reps:raw.settings?.reps||{}},
      weights:Array.isArray(raw.weights)?raw.weights:[],
      workouts:Array.isArray(raw.workouts)?raw.workouts:[],
      nextPlan:['A','B','C'].includes(raw.nextPlan)?raw.nextPlan:'A',
      programIndex:Number.isInteger(raw.programIndex)?raw.programIndex:(raw.nextPlan==='B'?1:0),
      progress:raw.progress && typeof raw.progress==='object'?raw.progress:{},
      active:raw.active && typeof raw.active==='object'?raw.active:null
    };
  }
  function savedProfileValid(p){return p && typeof p.name==='string' && p.name.trim().length>0 && p.name.trim().length<=30 && Number(p.height)>=120 && Number(p.height)<=230;}
  function validLegacyProfile(id){
    try{
      const raw=JSON.parse(localStorage.getItem(V2_PREFIX+id));
      if(!raw || !raw.profile || !OLD_USERS[id])return null;
      const result=normalizeData(raw);
      result.profile={...result.profile,name:OLD_USERS[id].name,gender:OLD_USERS[id].gender};
      return savedProfileValid(result.profile)?result:null;
    }catch{return null;}
  }
  function loadDevice(){
    try{
      const existing=JSON.parse(localStorage.getItem(DEVICE_KEY));
      if(existing && savedProfileValid(existing.profile))return normalizeData(existing);
    }catch{}
    // 과거 3인 버전: 저장된 선택 정보가 있고 해당 사용자 프로필이 유효하면 우선합니다.
    const remembered=[sessionStorage.getItem(V2_TAB_KEY),localStorage.getItem(V2_AUTO_KEY)];
    for(const id of remembered){
      if(OLD_USERS[id]){
        const old=validLegacyProfile(id);
        if(old){try{localStorage.setItem(DEVICE_KEY,JSON.stringify(old));}catch{} return old;}
      }
    }
    // 한 기기에 과거 프로필이 하나뿐일 때만 자동 이전합니다.
    const found=Object.keys(OLD_USERS).map(id=>validLegacyProfile(id)).filter(Boolean);
    if(found.length===1){try{localStorage.setItem(DEVICE_KEY,JSON.stringify(found[0]));}catch{}return found[0];}
    return DEFAULTS();
  }
  let data=loadDevice();
  let view=!savedProfileValid(data.profile)?'profile':data.active?'workout':'home';
  let modal = null;
  let detailExerciseId = null;
  let profileAppliedMessage = false;
  let lastFinished = null;
  let audioContext = null;
  let wakeLock = null;
  let latestAnnouncement = '';
  const exercise = {
    knee: {title:'무릎 푸시업',glyph:'↗',type:'reps',amount:10,range:'8~12회',unit:'회',cue:'무릎을 바닥에 두고 어깨부터 무릎까지 곧게 유지하며 팔을 굽히세요.',tips:['손바닥은 어깨 바로 아래나 조금 바깥에 둡니다.','허리를 꺾지 않고 천천히 내려갑니다.','손목이 불편하면 높은 지지대에서 푸시업합니다.']},
    push: {title:'푸시업',glyph:'↗',type:'reps',amount:8,range:'6~12회',unit:'회',cue:'몸을 일직선으로 유지하고 허리가 꺾이지 않게 내려가세요.',tips:['손은 어깨보다 조금 넓게 짚습니다.','내려갈 때 숨을 들이쉬고 올라오며 내쉽니다.','정자세로 6회가 어렵다면 무릎 푸시업으로 바꿉니다.']},
    squat: {title:'맨몸 스쿼트',glyph:'↓',type:'reps',amount:14,range:'12~18회',unit:'회',cue:'엉덩이를 뒤로 보내고, 허리가 말리지 않는 깊이까지 앉으세요.',tips:['무릎과 발끝은 비슷한 방향을 향하게 합니다.','바닥에 발을 고르게 누르고 올라옵니다.','허리에 통증이 생기면 깊이를 줄입니다.']},
    reverse: {title:'리버스 런지',glyph:'⇣',type:'reps',amount:8,range:'좌우 각 8~10회',unit:'회씩',cue:'한 발씩 뒤로 보내며 천천히 내려갔다 올라오세요.',tips:['허리를 곧게 유지하고 상체를 과하게 숙이지 않습니다.','발바닥이 아프면 보폭과 내려가는 깊이를 줄입니다.','균형이 어렵다면 벽 가까이에서 실시합니다.'],each:true},
    wraise:{title:'W 레이즈',glyph:'W',type:'reps',amount:12,range:'12~15회',unit:'회',cue:'엎드려 팔을 W 모양으로 만들고 어깨뼈를 모으세요.',tips:['허리를 과하게 들어 올리지 않습니다.','상부 등과 어깨 뒤쪽의 움직임에 집중합니다.','허리가 불편하면 서서 W자 어깨뼈 모으기를 합니다.']},
    dead:{title:'데드버그',glyph:'✳',type:'reps',amount:8,range:'좌우 각 8~10회',unit:'회씩',cue:'반대쪽 팔과 다리를 천천히 뻗되 허리는 안정적으로 유지하세요.',tips:['숨을 참지 마세요.','허리가 바닥에서 크게 뜨지 않는 범위로 움직입니다.','어렵다면 다리만 번갈아 움직입니다.'],each:true},
    split:{title:'스플릿 스쿼트',glyph:'↕',type:'reps',amount:8,range:'좌우 각 8~12회',unit:'회씩',cue:'발을 앞뒤로 벌린 채 제자리에서 수직으로 내려가세요.',tips:['앞발은 바닥에 편안하게 붙입니다.','상체는 가급적 안정적으로 세웁니다.','발바닥에 통증이 생기면 일반 스쿼트로 대체합니다.'],each:true},
    tempo:{title:'템포 푸시업',glyph:'↘',type:'reps',amount:6,range:'6~10회',unit:'회',cue:'내려갈 때 3초, 올라올 때 1초. 반동 없이 실시하세요.',tips:['허리를 꺾지 않고 머리부터 발끝까지 일직선을 유지합니다.','너무 어렵다면 무릎을 대고 실시합니다.','개수보다 정확한 자세가 우선입니다.']},
    singlebridge:{title:'한발 글루트 브리지',glyph:'⌁',type:'reps',amount:8,range:'좌우 각 8~10회',unit:'회씩',cue:'골반이 한쪽으로 기울지 않도록 엉덩이 힘으로 들어 올리세요.',tips:['허리를 과하게 젖히지 않습니다.','허리 또는 지지 발뒤꿈치가 아프면 양발 브리지로 변경합니다.','좌우 모두 같은 횟수로 실시합니다.'],each:true},
    traise:{title:'T 레이즈',glyph:'T',type:'reps',amount:12,range:'12~15회',unit:'회',cue:'엎드려 팔을 양옆으로 벌려 어깨뼈를 부드럽게 모으세요.',tips:['가슴을 크게 들지 말고 팔만 작게 움직입니다.','등 위쪽과 어깨 뒤쪽에 집중합니다.','허리 불편 시 서서 가볍게 실시합니다.']},
    sideleft:{title:'사이드 플랭크 · 왼쪽',glyph:'◢',type:'timed',amount:25,range:'20~35초',unit:'초',cue:'왼쪽 팔꿈치를 바닥에 대고 몸통을 곧게 유지하세요.',tips:['골반이 바닥으로 처지지 않도록 합니다.','어렵다면 무릎을 바닥에 대고 실시합니다.','호흡을 계속합니다.']},
    sideright:{title:'사이드 플랭크 · 오른쪽',glyph:'◣',type:'timed',amount:25,range:'20~35초',unit:'초',cue:'오른쪽 팔꿈치를 바닥에 대고 몸통을 곧게 유지하세요.',tips:['골반이 바닥으로 처지지 않도록 합니다.','어렵다면 무릎을 바닥에 대고 실시합니다.','호흡을 계속합니다.']},
    bridge:{title:'글루트 브리지',glyph:'⌁',type:'reps',amount:14,range:'12~15회',unit:'회',cue:'엉덩이에 힘을 주며 골반을 들되 허리를 젖히지 마세요.',tips:['발은 골반 너비로 놓습니다.','엉덩이가 수축되는 지점까지만 들어 올립니다.','허리가 불편하면 동작을 줄입니다.']},
    plank:{title:'플랭크',glyph:'━',type:'timed',amount:30,range:'20~40초',unit:'초',cue:'배에 힘을 주고 허리를 처뜨리거나 과하게 들지 마세요.',tips:['어깨 아래 팔꿈치를 두고 호흡합니다.','허리가 아프면 시간을 줄이거나 무릎을 댑니다.','무조건 오래 버티는 것보다 자세가 중요합니다.']},
    prep1:{title:'어깨·팔 가볍게 풀기',glyph:'◌',type:'timed',amount:60,unit:'초',cue:'어깨를 천천히 돌리고 팔을 가볍게 앞뒤로 움직이세요.',tips:['어깨 힘을 빼고 편안하게 반복합니다.']},
    prep2:{title:'고관절 워밍업',glyph:'↔',type:'timed',amount:60,unit:'초',cue:'무릎을 조금 굽힌 채 골반과 고관절을 편안하게 움직이세요.',tips:['허리를 과하게 굽히거나 비틀지 않습니다.']},
    prep3:{title:'앉아서 무릎 번갈아 들기',glyph:'⇧',type:'timed',amount:60,unit:'초',cue:'의자에 앉아 무릎을 번갈아 가볍게 들어 올리세요.',tips:['발바닥 부담 없이 몸을 가볍게 데웁니다.']},
    prep4:{title:'복부 긴장·호흡',glyph:'◎',type:'timed',amount:60,unit:'초',cue:'편하게 서거나 누워서 숨을 쉬며 몸통에 가볍게 힘을 주세요.',tips:['호흡을 참지 않고 허리를 편안하게 유지합니다.']},
    cool1:{title:'종아리·발바닥 가볍게 풀기',glyph:'≈',type:'timed',amount:60,unit:'초',cue:'앉아서 발목과 발가락을 부드럽게 움직여 주세요.',tips:['늘어나는 느낌 정도로만, 아플 정도로 당기지 않습니다.']},
    cool2:{title:'호흡하며 마무리',glyph:'◯',type:'timed',amount:60,unit:'초',cue:'편안하게 호흡하며 몸의 긴장을 풀어 주세요.',tips:['운동 후 허리와 발바닥 상태를 확인합니다.']}
  };
  Object.assign(exercise,{
    wall:{title:'벽 푸시업',glyph:'↗',type:'reps',amount:12,unit:'회',cue:'벽에 손을 대고 몸통을 일직선으로 유지해 팔을 굽힙니다.',tips:['발은 미끄러지지 않게 세웁니다.','팔꿈치를 과하게 벌리지 않습니다.']},
    incline:{title:'높은 지지대 푸시업',glyph:'↗',type:'reps',amount:10,unit:'회',cue:'흔들리지 않는 튼튼한 지지대를 이용하세요.',tips:['의자나 움직이는 가구는 피하세요.','가슴과 몸통을 한 줄로 유지하세요.']},
    closepush:{title:'좁은 푸시업',glyph:'↗',type:'reps',amount:6,unit:'회',cue:'손을 어깨너비 안쪽으로 두고 팔꿈치를 가까이 유지합니다.',tips:['손목 통증이 생기면 일반 푸시업으로 돌아가세요.']},
    chairsquat:{title:'의자 스쿼트',glyph:'↓',type:'reps',amount:12,unit:'회',cue:'고정된 의자에 엉덩이가 살짝 닿을 정도로 앉았다 일어납니다.',tips:['의자는 벽에 붙여 움직이지 않게 합니다.']},
    temposquat:{title:'천천히 스쿼트',glyph:'↓',type:'reps',amount:12,unit:'회',cue:'3초 동안 내려간 뒤 반동 없이 올라옵니다.',tips:['허리가 말리기 직전에 멈춥니다.','발바닥을 바닥에 고르게 둡니다.']},
    clam:{title:'클램셸',glyph:'◔',type:'reps',amount:12,unit:'회씩',each:true,cue:'옆으로 누워 발을 붙인 채 위쪽 무릎을 들어 올립니다.',tips:['골반을 뒤로 돌리지 않습니다.','움직임보다 엉덩이 옆 자극에 집중합니다.']},
    hipabduct:{title:'옆으로 누워 다리 들기',glyph:'◔',type:'reps',amount:12,unit:'회씩',each:true,cue:'옆으로 누워 윗다리를 천천히 위로 들었다 내립니다.',tips:['골반이 뒤로 넘어가지 않게 유지합니다.']},
    snowangel:{title:'리버스 스노우 엔젤',glyph:'W',type:'reps',amount:10,unit:'회',cue:'엎드려 팔을 편안한 범위 안에서 호를 그리며 움직입니다.',tips:['가슴과 허리를 크게 들지 않습니다.','어깨에 통증이 있으면 동작 범위를 좁힙니다.']},
    bird:{title:'버드독',glyph:'✳',type:'reps',amount:8,unit:'회씩',each:true,cue:'네발기기 자세에서 반대쪽 팔과 다리를 천천히 뻗습니다.',tips:['허리가 흔들리지 않게 유지하세요.','손목이 불편하면 데드버그로 대체하세요.']}
  });
  const Guides=window.CalicoachGuides?.guides||{};
  const Coach=window.CalicoachEngine;
  if(!Coach)throw Error('운동 계획 엔진을 불러오지 못했습니다. 앱을 새로고침하세요.');
  const mediaSrc=id=>`./media/${encodeURIComponent(id)}.gif`;
  const VideoCatalog=window.CalicoachVideoCatalog||{};
  const SourceCandidates=window.CalicoachSourceCandidates||{};
  const videoSource=id=>VideoCatalog[id]?.file||null;
  function mediaHtml(id,small=false){
    const alt=escapeHtml(exercise[id]?.title||'운동');
    const gif=`<img src="${mediaSrc(id)}" alt="${alt} 동작 개념 애니메이션" class="${small?'exercise-preview-gif':'exercise-motion-gif'}" loading="${small?'lazy':'eager'}" />`;
    if(small||!videoSource(id))return gif;
    return `<video class="exercise-real-video" data-id="${id}" src="${escapeHtml(videoSource(id))}" poster="${mediaSrc(id)}" muted autoplay loop playsinline preload="metadata" aria-label="${alt} 실제 사람 동작 시연"></video>`;
  }
  const stepKey=step=>`${step.phase}:${step.round}:${step.id}`;
  const PLANS = {
    A:{label:'A 루틴',subtitle:'전신 근력 · 기본기',items:['push','squat','reverse','wraise','dead'],extra:['bridge','plank']},
    B:{label:'B 루틴',subtitle:'근력 + 코어 집중',items:['split','tempo','singlebridge','traise','sideleft','sideright'],extra:['dead','plank']},
    C:{label:'C 루틴',subtitle:'전신 근력 · 변형',items:['push','bridge','squat','wraise','plank'],extra:[]}
  };
  const PHASES = {warmup:'WARM UP · 준비운동',main:'MAIN SET · 본운동',bonus:'FINISHER · 보강운동',cooldown:'COOL DOWN · 마무리'};
  const icon = (id) => {
    const icons = {
      home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
      chart:'<path d="M4 19h16M7 16V9m5 7V4m5 12v-4"/>',
      settings:'<circle cx="12" cy="12" r="3"/><path d="m19.4 15 1 1.8-2.3 2.3-1.8-1a8.4 8.4 0 0 1-2.2 1l-.5 2.1h-3.2l-.5-2.1a8.4 8.4 0 0 1-2.2-1l-1.8 1-2.3-2.3 1-1.8a8.4 8.4 0 0 1-1-2.2l-2.1-.5V9.1l2.1-.5a8.4 8.4 0 0 1 1-2.2l-1-1.8 2.3-2.3 1.8 1a8.4 8.4 0 0 1 2.2-1l.5-2.1h3.2l.5 2.1a8.4 8.4 0 0 1 2.2 1l1.8-1 2.3 2.3-1 1.8a8.4 8.4 0 0 1 1 2.2l2.1.5v3.2l-2.1.5a8.4 8.4 0 0 1-1 2.2z" transform="translate(0 1.7) scale(.89)"/>',
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true" stroke-linecap="round" stroke-linejoin="round">${icons[id]}</svg>`;
  };
  function save() {
    if(!savedProfileValid(data.profile))return false;
    try{localStorage.setItem(DEVICE_KEY,JSON.stringify(data));return true;}
    catch(e){console.warn('저장 공간 사용 실패',e);return false;}
  }
  function recommendedRounds(profile){return profile?.minutes===20?2:profile?.minutes===45?4:3;}
  function planFor(plan){
    return Coach.selectRoutine(data.profile||profileDraft(),plan,data.progress||{});
  }
  function buildSteps(plan,rounds){
    const definition=planFor(plan),result=[];
    ['prep1','prep2','prep3','prep4'].forEach(id=>result.push({id,phase:'warmup',round:0}));
    for(let r=1;r<=rounds;r++)definition.items.forEach(id=>result.push({id,phase:'main',round:r}));
    definition.extra.forEach(id=>result.push({id,phase:'bonus',round:0}));
    ['cool1','cool2'].forEach(id=>result.push({id,phase:'cooldown',round:0}));
    return result;
  }
  const currentSteps=()=>data.active?(Array.isArray(data.active.steps)?data.active.steps:buildSteps(data.active.plan,data.active.rounds)):[];
  const currentStep=()=>currentSteps()[data.active?.index||0];
  const getAmount=id=>{
    const base=exercise[id].amount;
    const saved=Number(data.settings.reps[id]);
    if(Number.isFinite(saved)&&saved>0)return saved;
    const profile=data.profile||{};
    if(/^prep|^cool/.test(id))return base;
    const tuned=Coach.targetAmount(id,profile,data.progress||{});
    return tuned===null?base:tuned;
  };
  function weekdayMonday(date) {
    const d = new Date(date.getFullYear(),date.getMonth(),date.getDate());
    d.setDate(d.getDate() - (d.getDay()+6)%7); return d;
  }
  function weeklyWorkouts() {
    const monday = weekdayMonday(new Date());
    const nextMon = new Date(monday);nextMon.setDate(nextMon.getDate()+7);
    return data.workouts.filter(w => {const t = new Date(w.completedAt); return t>=monday && t<nextMon;});
  }
  const latestWeight=()=>[...data.weights].sort((a,b)=>a.date.localeCompare(b.date)).at(-1)?.weight ?? Number(data.profile?.weight||0);
  const goalWeight=()=>Number(data.profile?.targetWeight||data.settings.targetWeight||0);
  function profileAge(birthdate){
    if(!birthdate)return '미입력';
    const [year,month,day]=birthdate.split('-').map(Number),today=new Date();
    return today.getFullYear()-year-(today.getMonth()+1<month||(today.getMonth()+1===month&&today.getDate()<day)?1:0);
  }
  function formField(label,name,type,value,extra=''){
    return `<label class="profile-field"><span>${label}</span><input class="textinput" name="${name}" type="${type}" value="${escapeHtml(value??'')}" ${extra} required/></label>`;
  }
  function renderProfile(){
    const p=data.profile||profileDraft(),first=!savedProfileValid(data.profile);
    const option=(id,value,label)=>`<option value="${value}" ${String(p[id])===String(value)?'selected':''}>${label}</option>`;
    return `<div class="shell profile-shell">${header()}<div class="pageintro"><div class="eyebrow">PERSONAL TRAINING PROFILE</div><h1>${first?'운동 프로필 만들기':'내 신체정보 수정'}</h1><p class="subheading">입력 정보에 따라 루틴과 반복 횟수를 조정합니다.</p></div>
      ${first?'<p class="fineprint">처음 한 번만 정보를 입력하면 다음부터는 자동으로 운동 홈이 열립니다. 정보는 이 아이폰에만 저장됩니다.</p>':`<div class="profile-identity"><div class="user-avatar">${escapeHtml(p.name.slice(0,1))}</div><div><b>${escapeHtml(p.name)}</b><small>프로필 수정</small></div></div>`}
      <form id="profile-form" class="card formbox profile-form">
        <label class="profile-field"><span>이름</span><input class="textinput" name="name" type="text" value="${escapeHtml(p.name)}" placeholder="사용할 이름 입력" autocomplete="name" maxlength="30" required/></label>
        <label class="profile-field"><span>성별 (선택)</span><select class="textinput" name="gender">${option('gender','','선택하지 않음')}${option('gender','남성','남성')}${option('gender','여성','여성')}${option('gender','기타','기타')}</select></label>
        <div class="form-grid">${formField('생년월일','birthdate','date',p.birthdate,'min="1930-01-01" max="'+dateStr()+'"')}${formField('키 (cm)','height','number',p.height,'min="120" max="230" step="0.1"')}${formField('현재 체중 (kg)','weight','number',data.profile?latestWeight():p.weight,'min="30" max="250" step="0.1"')}${formField('목표 체중 (kg)','targetWeight','number',p.targetWeight,'min="30" max="250" step="0.1"')}</div>
        <label class="profile-field"><span>운동 경험</span><select class="textinput" name="level">${option('level','beginner','입문 · 최근 운동 경험 적음')}${option('level','intermediate','보통 · 기본 맨몸운동 가능')}${option('level','advanced','숙련 · 기본 동작을 쉽게 수행')}</select></label>
        <label class="profile-field"><span>연속 정자세 푸시업 최대 횟수 (선택)</span><input class="textinput" name="pushups" type="number" min="0" max="100" step="1" placeholder="미측정이면 비워두세요" value="${escapeHtml(p.pushups??'')}"/></label>
        <div class="form-grid"><label class="profile-field"><span>주당 운동 횟수</span><select class="textinput" name="days">${[2,3,4,5].map(n=>option('days',n,n+'회')).join('')}</select></label>
        <label class="profile-field"><span>1회 운동 시간</span><select class="textinput" name="minutes">${[20,30,45].map(n=>option('minutes',n,n+'분')).join('')}</select></label></div>
        <label class="profile-field"><span>우선 목표</span><select class="textinput" name="focus">${option('focus','loss','체중 감량 중심')}${option('focus','balanced','감량 + 근력 균형')}${option('focus','fitness','근력·체력 향상')}</select></label>
        <div class="profile-field"><span>운동 시 불편한 부위 (선택 · 복수 선택)</span>
          <div class="area-grid">${Coach.bodyAreas.map(([id,label])=>`<label class="check-row area-chip"><input type="checkbox" name="area" value="${id}" ${Coach.areas(p).has(id)?'checked':''}/>${label}</label>`).join('')}</div>
          <small class="field-description">선택 부위의 부담을 줄일 수 있는 대체 동작을 자동 제안합니다. 통증의 원인을 진단하는 기능은 아닙니다.</small>
        </div>
        <div class="profile-hint">아래 <b>확인</b>을 눌러야 입력 정보가 저장되고 다음 운동부터 적용됩니다. 매트만 사용하는 맨몸운동을 기본으로 구성합니다. 강도는 운동 경험과 수행 능력으로 결정하며 성별만으로 차등 적용하지 않습니다.</div>
        <p id="profile-error" class="form-error" role="alert" hidden></p>
        <button class="btn btn-primary btn-full" type="submit">확인</button>
        ${first?'':`<button class="btn btn-ghost btn-full" type="button" data-action="profile-back">취소</button>`}
      </form></div>`;
  }
  function saveProfile(form){
    const fd=new FormData(form),name=String(fd.get('name')||'').trim(),gender=String(fd.get('gender')||''),birthdate=String(fd.get('birthdate')||''),height=Number(fd.get('height')),weight=Number(fd.get('weight')),targetWeight=Number(fd.get('targetWeight'));
    const level=String(fd.get('level')||''),days=Number(fd.get('days')),minutes=Number(fd.get('minutes')),focus=String(fd.get('focus')||'');
    const rawPushups=String(fd.get('pushups')||'').trim(),pushups=rawPushups===''?'':Number(rawPushups);
    const err=document.getElementById('profile-error');
    function fail(msg){if(err){err.hidden=false;err.textContent=msg;}return false;}
    if(!name||name.length>30)return fail('이름은 1~30자로 입력해주세요.');
    if(!['','남성','여성','기타'].includes(gender))return fail('성별 항목을 확인해주세요.');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)||birthdate>dateStr()||birthdate<'1930-01-01'||Number.isNaN(Date.parse(birthdate)))return fail('생년월일을 확인해주세요.');
    if(!(height>=120&&height<=230&&weight>=30&&weight<=250&&targetWeight>=30&&targetWeight<=250))return fail('키 또는 체중을 입력 범위에 맞게 확인해주세요.');
    if(!['beginner','intermediate','advanced'].includes(level)||![2,3,4,5].includes(days)||![20,30,45].includes(minutes)||!['loss','balanced','fitness'].includes(focus))return fail('운동 설정을 확인해주세요.');
    if(pushups!==''&&(!Number.isInteger(pushups)||pushups<0||pushups>100))return fail('푸시업 횟수는 0~100회 사이로 입력해주세요.');
    const wasNew=!savedProfileValid(data.profile),previous=data.profile,initialWeight=wasNew?weight:Number(data.profile.initialWeight||weight);
    const adjustAreas=fd.getAll('area').map(String).filter(id=>Coach.bodyAreas.some(([key])=>key===id));
    data.profile={name,gender,birthdate,height,weight,targetWeight,initialWeight,level,pushups,days,minutes,focus,adjustAreas,back:adjustAreas.includes('back'),foot:adjustAreas.includes('foot')};
    data.settings.targetWeight=targetWeight;
    if(wasNew){data.settings.rounds=Coach.selectRoutine(data.profile,'A').rounds;}
    else if(Number(previous.minutes)!==minutes && data.settings.rounds===recommendedRounds(previous))data.settings.rounds=recommendedRounds(data.profile);
    if(wasNew || previous.focus!==focus){data.settings.rest=focus==='fitness'?40:focus==='loss'?20:25;data.settings.longRest=focus==='fitness'?70:55;}
    // 신체정보의 체중 수정은 당일 체중 기록에도 반영됩니다.
    if(wasNew || Math.abs(latestWeight()-weight)>.0001){data.weights=data.weights.filter(w=>w.date!==dateStr());data.weights.push({date:dateStr(),weight});}
    if(!save())return fail('기기 저장소에 저장할 수 없습니다. 브라우저의 저장 공간 및 개인정보 보호 설정을 확인해주세요.');
    profileAppliedMessage=true;view='home';window.scrollTo(0,0);render();return true;
  }
  function header(){return `<header class="topbar"><div class="brand">CALI<span class="brand-dot">.</span>COACH</div><div class="topright"><span class="status-dot"></span> ${data.profile?.name?escapeHtml(data.profile.name):'MY TRAINING SPACE'}</div></header>`;}
  function navigation(active) {
    return `<nav class="bottomnav" aria-label="하단 메뉴">${[['home','홈'],['history','기록'],['settings','설정']].map(([id,text])=>`<button class="tab ${active===id?'active':''}" data-action="nav" data-value="${id}" aria-label="${text}" ${active===id?'aria-current="page"':''}>${icon(id==='history'?'chart':id)}<span>${text}</span></button>`).join('')}</nav>`;
  }
  function renderHome() {
    const now = new Date();
    const titleDay = `${now.getMonth()+1}월 ${now.getDate()}일 ${DAY_NAMES[now.getDay()]}요일`;
    const weekly = weeklyWorkouts();
    const thisMonday = weekdayMonday(now);
    const daysDone = new Set(weekly.map(w => dateStr(new Date(w.completedAt))));
    const week = Array.from({length:7},(_,i)=>{const d=new Date(thisMonday);d.setDate(d.getDate()+i); const day=dateStr(d);return `<div class="weekbox ${daysDone.has(day)?'done':''} ${day===dateStr()?'today':''}"><strong>${['월','화','수','목','금','토','일'][i]}</strong><span class="mark">${daysDone.has(day)?'✓':d.getDate()}</span></div>`;}).join('');
    const upcoming=Coach.nextPlan(data.programIndex,data.profile?.days);
    const next = planFor(upcoming);
    const weight = latestWeight();
    const baseline=Number(data.profile?.initialWeight||weight);
    const goal=goalWeight();
    const progress=baseline!==goal?Math.max(0,Math.min(100,Math.abs((baseline-weight)/(baseline-goal))*100)):0;
    const incomplete = !!data.active;
    return `<div class="shell">${header()}
      ${profileAppliedMessage?'<div class="profile-applied" role="status">✓ 프로필이 저장되었습니다. 다음 운동부터 변경된 정보가 적용됩니다.</div>':''}
      <div class="eyebrow">YOUR PERSONAL FITNESS PLAN</div>
      <h1 class="display">오늘도 몸을<br>한 단계 더.</h1>
      <p class="subheading">${titleDay} · ${escapeHtml(data.profile.name)}님의 맞춤형 운동 코스</p>
      <button class="mini-profile" data-action="go-profile">${data.profile?.level==='beginner'?'입문':data.profile?.level==='advanced'?'숙련':'보통'} 난이도 · 주 ${data.profile?.days}회 · ${data.profile?.minutes}분 <span>신체정보 수정 ›</span></button>
      <section class="card hero" aria-label="오늘의 운동"><div class="hero-head"><span class="pill">● ${incomplete?'진행 중인 운동':'오늘의 추천 운동'}</span><span class="softpill">맞춤형 A / B / C</span></div>
      <h2>${incomplete?PLANS[data.active.plan]?.label||'진행 중':next.label}</h2><p>${incomplete?'중단한 단계부터 이어서 할 수 있어요.':next.subtitle}</p>
      <div class="hero-icons"><span>◷ ${data.profile?.minutes}분 목표</span><span>◈ ${data.profile?.focus==='loss'?'감량 중심':data.profile?.focus==='fitness'?'근력 중심':'전신 근력'}</span><span>⦿ 매트만 사용</span></div>
      <button class="btn btn-primary btn-full" data-action="${incomplete?'resume':'start'}">${incomplete?'운동 이어하기':'운동 시작하기'} &nbsp;→</button></section>
      <div class="sectionline"><div class="sectiontitle">오늘의 운동 미리보기</div><div class="smallhint">${next.items.length}가지 · ${data.profile?.minutes}분 목표</div></div>
      <div class="routine-preview">${next.items.map(id=>`<div class="routine-tile">${mediaHtml(id,true)}<div><b>${escapeHtml(exercise[id].title)}</b><small>${getAmount(id)}${exercise[id].unit}</small><button type="button" class="guide-preview-button" data-action="details" data-id="${id}">동작 배우기 ›</button></div></div>`).join('')}</div>
      <p class="fineprint">GIF는 동작 개념도입니다. 낯선 운동은 ‘동작 배우기’에서 시작 자세와 실제 자세 자료를 먼저 확인하세요. ${next.note}</p>
      <div class="sectionline"><div class="sectiontitle">이번 주 진행률</div><div class="smallhint">${weekly.length} / ${data.profile?.days||3}회 목표</div></div>
      <div class="weeklist">${week}</div>
      <div class="metrics"><div class="card metric"><div class="metric-label">이번 주 완료</div><div class="metric-value">${weekly.length}<small>회</small></div><div class="track"><div style="width:${Math.min(100,weekly.length/(data.profile?.days||3)*100)}%"></div></div></div><div class="card metric"><div class="metric-label">현재 체중 · 목표 ${goalWeight()}kg</div><div class="metric-value">${weight}<small>kg</small></div><div class="track"><div style="width:${progress}%"></div></div></div></div>
      <div class="note"><div class="note-icon">✦</div><div><strong>오늘의 코치 노트</strong><p>마지막 2~3회가 어렵게 느껴지는 강도가 목표예요. 통증이 발생하면 동작을 중단하고 강도를 조정하세요.</p></div></div>
    </div>${navigation('home')}`;
  }
  function chartHtml() {
    const records = [...data.weights].filter(x=>typeof x.weight==='number' && Number.isFinite(x.weight)).sort((a,b)=>a.date.localeCompare(b.date)).slice(-12);
    if(records.length<2) return `<div class="empty">체중을 두 번 이상 기록하면 추이 그래프가 나타납니다.</div>`;
    const values=records.map(r=>r.weight), min=Math.floor(Math.min(...values)-1),max=Math.ceil(Math.max(...values)+1), span=(max-min)||1;
    const xy=values.map((v,i)=>[22+i* (316/(values.length-1)), 125-(v-min)/span*99]);
    const points=xy.map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    return `<svg class="chart" viewBox="0 0 360 155" role="img" aria-label="최근 체중 변화 그래프"><path d="M22 26H338 M22 75H338 M22 125H338" stroke="#334450" stroke-dasharray="3,5" fill="none"/><polyline points="${points}" fill="none" stroke="#ccf374" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${xy.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4" fill="#ccf374"/>`).join('')}<text x="22" y="149" fill="#8b9eaa" font-size="11">${humanDate(records[0].date)}</text><text x="338" y="149" fill="#8b9eaa" font-size="11" text-anchor="end">${humanDate(records.at(-1).date)}</text><text x="338" y="19" fill="#8b9eaa" font-size="11" text-anchor="end">${max}kg</text></svg>`;
  }
  function renderHistory() {
    const sorted = [...data.workouts].sort((a,b)=>new Date(b.completedAt)-new Date(a.completedAt));
    return `<div class="shell">${header()}<div class="pageintro"><div class="eyebrow">YOUR PROGRESS</div><h1>쌓이는 운동 기록.</h1><p class="subheading">작은 반복이 몸을 바꿉니다.</p></div>
      <div class="card formbox"><div class="row-between"><div><div class="metric-label">현재 체중</div><div class="metric-value">${latestWeight()}<small>kg</small></div></div><span class="pill">목표 ${goalWeight()}kg</span></div>
      ${chartHtml()}<form id="weight-form"><label class="formlabel" for="weight">오늘 체중 추가 / 수정</label><div class="field"><input id="weight" name="weight" class="textinput" inputmode="decimal" type="number" min="30" max="250" step="0.1" value="${latestWeight()}" required aria-label="체중 킬로그램"/><button class="btn btn-primary" type="submit">저장</button></div></form></div>
      <div class="sectionline"><div class="sectiontitle">운동 히스토리</div><div class="smallhint">총 ${sorted.length}회 완료</div></div>
      <div class="card recordcard">${sorted.length ? sorted.slice(0,30).map(item=>`<div class="recorditem"><div><div class="date">${new Date(item.completedAt).toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'short'})}</div><div class="main">${escapeHtml(PLANS[item.plan]?.label||'운동 루틴')}</div></div><div class="mins">${Math.round(item.minutes)}분 · 완료</div></div>`).join(''):'<div class="empty">첫 운동을 완료하면 여기에 기록됩니다.</div>'}</div>
      <p class="fineprint">기록은 이 기기의 이 웹앱 저장 공간에만 보관됩니다. 브라우저 데이터 삭제 또는 앱 삭제로 기록이 사라질 수 있으니 설정에서 백업하세요.</p>
      </div>${navigation('history')}`;
  }
  function settingRow({name,desc,action,key,min,max,step=1,value,unit=''}) {
    return `<div class="settings-row"><div><strong>${name}</strong><p>${desc}</p></div><div class="numberstep"><button class="stepbtn" data-action="setting-step" data-key="${key}" data-delta="-${step}" ${value<=min?'disabled':''}>−</button><span class="stepvalue">${value}${unit}</span><button class="stepbtn" data-action="setting-step" data-key="${key}" data-delta="${step}" ${value>=max?'disabled':''}>+</button></div></div>`;
  }
  function renderSettings(){const s=data.settings;
    return `<div class="shell">${header()}<div class="pageintro"><div class="eyebrow">MAKE IT YOURS</div><h1>나만의 운동 설정.</h1><p class="subheading">최소한의 조작으로 내 몸에 맞게.</p></div>
    <div class="sectionline"><div class="sectiontitle">운동 강도</div></div><div class="card formbox">${settingRow({name:'본운동 라운드',desc:'처음에는 2라운드, 익숙해지면 3라운드',key:'rounds',min:1,max:4,value:s.rounds})}${settingRow({name:'운동 사이 휴식',desc:'일반 동작 완료 후 휴식 시간',key:'rest',min:10,max:90,step:5,value:s.rest,unit:'초'})}${settingRow({name:'라운드 사이 휴식',desc:'다음 라운드가 시작될 때',key:'longRest',min:20,max:150,step:5,value:s.longRest,unit:'초'})}</div>
    <div class="sectionline"><div class="sectiontitle">알림</div></div><div class="card formbox"><div class="settings-row"><div><strong>효과음</strong><p>타이머 종료와 단계 전환 시 소리 재생 시도</p></div><input class="toggle" type="checkbox" data-setting="sound" aria-label="효과음" ${s.sound?'checked':''}/></div><div class="settings-row"><div><strong>한국어 음성 안내</strong><p>지원되는 브라우저에서 다음 동작 읽기</p></div><input class="toggle" type="checkbox" data-setting="speech" aria-label="음성 안내" ${s.speech?'checked':''}/></div></div>
    <p class="setting-help">아이폰의 절전·화면 잠금·브라우저 정책에 따라 소리나 자동 안내가 재생되지 않을 수 있습니다. 운동 중에는 앱을 화면에 유지하세요. 아이폰 PWA에서는 진동이 지원되지 않을 수 있어 기능에서 제외했습니다.</p>
    <div class="sectionline"><div class="sectiontitle">내 신체정보</div></div><div class="card formbox"><div class="settings-row"><div><strong>${escapeHtml(data.profile?.name||'')} ${data.profile?.gender?'· '+escapeHtml(data.profile.gender):''}</strong><p>만 ${profileAge(data.profile?.birthdate)}세 · 키 ${data.profile?.height}cm · 목표 체중 ${goalWeight()}kg</p></div><button class="btn btn-outline" data-action="go-profile">수정</button></div></div>
        <div class="sectionline"><div class="sectiontitle">내 데이터</div></div><div class="card formbox"><button class="btn btn-outline btn-full" data-action="export">↓ 운동 기록 JSON 백업</button><div style="height:10px"></div><button class="btn btn-outline btn-full" data-action="import">↑ 백업 복원</button><input type="file" accept="application/json,.json" id="backup-file" class="hidden"/><div style="height:10px"></div><button class="btn btn-ghost btn-full" data-action="reset-confirm">모든 기록 초기화</button></div>
    ${localStorage.getItem(LEGACY_KEY)?'<div class="card formbox"><strong>이전 버전 기록 가져오기</strong><p class="setting-help">이 기기에 v1.0 기록이 남아 있다면 가져올 수 있습니다. 현재 기록을 대체하므로 먼저 JSON 백업하세요.</p><button class="btn btn-outline btn-full" data-action="migrate-legacy-confirm">v1.0 기록 가져오기</button></div>':''}
    <p class="fineprint">칼리코치 v1.4 · 로그인 없이 이 기기의 프로필을 자동으로 불러옵니다. 기록은 다른 아이폰과 동기화되지 않습니다. 공용 기기에서 사용하지 마세요.</p></div>${navigation('settings')}`;
  }
  const targetText = (step,amount,seconds) => exercise[step.id].type==='timed' ? `${seconds}` : `${amount}`;
  const remainingTime = (active) => Math.max(0,Math.ceil(((active.timerEndAt || Date.now())-Date.now())/1000));
  function renderWorkout(){
    const active = data.active; if(!active){view='home';return renderHome();}
    const steps=currentSteps();const step=steps[active.index];
    if(!step){view='home';data.active=null;save();return renderHome();}
    const e=exercise[step.id];
    const paused=active.mode==='paused';
    const rest=active.mode==='rest' || (paused && active.previousMode==='rest');
    const displayTime = paused ? Math.ceil(Math.max(0, active.remaining || 0)/1000) : remainingTime(active);
    const progress=Math.max(0,Math.min(100,(active.index/steps.length)*100));
    const controls = `<div class="action-secondary"><button data-action="prev" ${active.index===0?'disabled':''}>← 이전</button><button data-action="pause">${paused?'▶ 재개':'Ⅱ 일시정지'}</button><button data-action="${rest?'skip-rest':'skip-step'}">${rest?'휴식 건너뛰기':'이 동작 건너뛰기'} →</button></div>`;
    return `<div class="workout"><header class="workout-header"><div class="workout-brand">CALI<span class="brand-dot">.</span>COACH / ${active.plan}</div><button class="quit" data-action="quit-confirm">운동 종료 ×</button></header>
      <div class="progress-rail"><div style="width:${progress}%"></div></div>
      ${rest ? `<div class="reststage"><div class="eyebrow">RECOVER & RESET</div><h1 class="exercise-title">잠깐 숨 고르기</h1><div class="restbubble" style="margin-top:36px"><div class="restnumber" data-countdown>${displayTime}</div><div class="restsmall">초 후 다음 운동</div></div><div class="restnext">다음 동작<strong>${escapeHtml(e.title)}</strong></div><button type="button" class="guide-rest-button" data-action="details" data-id="${step.id}">다음 동작 미리 배우기 ›</button></div><div class="action-area"><button class="btn btn-primary btn-full" data-action="skip-rest">바로 다음 운동 →</button>${controls}</div>`:
      `<main class="workout-stage"><div class="stage-line"><span class="phasepill">${PHASES[step.phase]}</span><span class="stage-count">${active.index+1} / ${steps.length}</span></div>
        <h1 class="exercise-title">${escapeHtml(e.title)}</h1><p class="exercise-subtitle">${step.phase==='main'?`${step.round} / ${active.rounds} 라운드 · `:''}${escapeHtml(e.range || (e.type==='timed'?'시간 운동':'정확한 자세로 수행'))}</p>
        <div class="exercise-figure">${mediaHtml(step.id)}<div class="figure-number">${videoSource(step.id)?'실제 동작 시연':'간략 동작 개념도'} · ${step.phase.toUpperCase()}</div></div>
        <div class="targetcenter"><div><span class="target-value" ${e.type==='timed'?'data-countdown':''}>${e.type==='timed'?displayTime:getAmount(step.id)}</span><span class="target-unit">${e.unit}</span></div><div class="target-help">${e.type==='timed'?(paused?'일시정지됨':'시간이 끝나면 자동으로 넘어갑니다'):(e.each?'왼쪽·오른쪽 각각 수행하세요':'완료 후 아래 버튼을 누르세요')}</div>
          ${e.type==='reps'?`<div class="target-adjust"><button class="miniadjust" data-action="rep-minus" aria-label="횟수 줄이기">−</button><small>오늘의 목표 횟수 조절</small><button class="miniadjust" data-action="rep-plus" aria-label="횟수 늘리기">+</button></div>`:''}</div>
        <div class="tipbox"><span>✦</span><p>${escapeHtml(e.cue)} <button data-action="details" data-id="${step.id}" style="background:none;border:0;color:var(--accent);padding:0 0 0 3px;font-size:12px;font-weight:850">동작 배우기 ›</button></p></div>
        </main><div class="action-area"><button class="btn btn-primary btn-full" data-action="done" ${paused?'disabled':''}>${e.type==='timed'?'완료하고 다음으로 →':'했어요! 다음 동작 →'}</button>
        ${step.phase==='main'&&!paused?'<div class="rating-options"><button data-action="rate-easy">너무 쉬웠어요</button><button data-action="rate-hard">너무 어려웠어요</button></div>':''}${controls}</div>`}
    </div>`;
  }
  function renderFinish(){const h=lastFinished;
    return `<div class="workout"><div class="finished"><div class="finish-icon">✓</div><div class="eyebrow">WORKOUT COMPLETE</div><h1>오늘도 해냈어요.</h1><p>${escapeHtml(PLANS[h?.plan]?.label||'운동')} 완료! 한 번의 운동이 쌓였습니다.</p><div class="finishmetrics"><div><b>${h?.minutes ?? 0}</b><span>운동 시간 (분)</span></div><div><b>${h?.stepsCompleted ?? 0}</b><span>완료한 단계</span></div></div><div class="note" style="text-align:left"><div class="note-icon">✦</div><div><strong>내일의 몸 상태를 확인하세요.</strong><p>통증이 악화되지 않는다면 다음 운동도 계획대로 진행하면 됩니다. 충분히 쉬고, 수분과 단백질을 챙겨 주세요.</p></div></div></div><button class="btn btn-primary btn-full" data-action="finish-home">홈으로 돌아가기 →</button></div>`;
  }
  function modalHtml() {
    if(!modal)return '';
    if(modal==='details' && detailExerciseId && exercise[detailExerciseId]) {
      const id=detailExerciseId, detail=exercise[id], guide=Guides[id], ref=guide?.reference;
      return `<div class="modal-backdrop"><section class="modal guide-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(detail.title)} 동작 배우기">
        <div class="guide-header"><h2>${escapeHtml(detail.title)} · 동작 배우기</h2><button class="guide-close" data-action="close-modal" aria-label="닫기">×</button></div>
        <p class="guide-media-label">${videoSource(id)?'실제 사람의 운동 동작 시연 · 음소거 자동 반복':'개념 애니메이션 · 아래에서 실제 영상 후보를 확인하세요'}</p>${mediaHtml(id)}
        ${videoSource(id)?`<div class="video-controls"><button type="button" data-action="video-speed" data-speed="0.5">0.5배속</button><button type="button" data-action="video-speed" data-speed="1">1배속</button><span>영상을 눌러 일시정지/재생</span></div>`:''}
        <div class="guide-steps">
          ${[['01','시작 자세',guide?.start||detail.cue],['02','동작 수행',guide?.move||detail.cue],['03','자세 확인',guide?.check||detail.tips[0]]].map(([n,title,desc])=>`<div class="guide-step"><span class="guide-step-n">${n}</span><div><b>${title}</b><p>${escapeHtml(desc||'')}</p></div></div>`).join('')}
        </div>
        ${!videoSource(id) && SourceCandidates[id] ? `<a class="guide-reference" href="${escapeHtml(SourceCandidates[id].url)}" target="_blank" rel="noopener noreferrer">↗ 실제 사람이 시연하는 영상 후보 보기 <small>Pexels · 운동 일치 여부는 직접 확인해야 함</small></a>` : ''}
        ${ref ? `<a class="guide-reference" href="${escapeHtml(ref.url)}" target="_blank" rel="noopener noreferrer">↗ ${escapeHtml(ref.label)} 열기 <small>외부 교육 페이지 · 인터넷 필요</small></a>` : `<div class="guide-reference-note">이 동작의 검증된 실제 시연 링크는 아직 준비 중입니다. 설명을 익히고 어렵다면 건너뛰거나 더 쉬운 동작을 선택하세요.</div>`}
        <div class="alert">통증이 발생하면 동작을 중단하고 강도를 조정하세요.</div>
        <button class="btn btn-primary btn-full" data-action="close-modal">확인 · 운동으로 돌아가기</button>
      </section></div>`;
    }
    if(modal==='quit')return `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true"><h2>운동을 종료할까요?</h2><p>지금 종료하면 이번 회차는 완료 기록에 포함되지 않습니다. 앱을 닫아도 진행 상태는 남아 있습니다.</p><div class="modal-buttons"><button class="btn btn-outline" data-action="close-modal">계속 운동</button><button class="btn btn-primary" data-action="quit">종료</button></div></section></div>`;
    if(modal==='reset')return `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true"><h2>운동 기록을 초기화할까요?</h2><p>이 기기의 운동·체중 기록과 운동 설정이 초기화됩니다. 신체정보는 유지됩니다. 먼저 백업하는 것이 좋습니다.</p><div class="modal-buttons"><button class="btn btn-outline" data-action="close-modal">취소</button><button class="btn btn-primary" data-action="reset">초기화</button></div></section></div>`;
    if(modal==='legacy')return `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true"><h2>v1.0 기록 가져오기</h2><p>현재 운동·체중 기록을 이전 버전의 데이터로 교체합니다. 먼저 백업하세요. 이전 원본은 그대로 남습니다.</p><div class="modal-buttons"><button class="btn btn-outline" data-action="close-modal">취소</button><button class="btn btn-primary" data-action="migrate-legacy">가져오기</button></div></section></div>`;
    if(modal==='import')return `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true"><h2>백업을 복원할까요?</h2><p>현재 기기의 기록을 선택한 백업 파일로 덮어씁니다.</p><div class="modal-buttons"><button class="btn btn-outline" data-action="close-modal">취소</button><button class="btn btn-primary" data-action="import-confirm">복원</button></div></section></div>`;
    return '';
  }
  function render(){const html=view==='profile'?renderProfile():view==='workout'?renderWorkout():view==='finish'?renderFinish():view==='history'?renderHistory():view==='settings'?renderSettings():renderHome();root.innerHTML=html+modalHtml();document.title=`칼리코치 · ${view==='profile'?'신체정보':view==='workout'?'운동 중':'내 운동 앱'}`;}
  function ensureAudio(){if(!data.settings.sound)return;try {const Ctx = window.AudioContext||window.webkitAudioContext;if(Ctx){audioContext=audioContext||new Ctx();if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});}}catch{}}
  function beep(){if(!data.settings.sound || !audioContext || audioContext.state!=='running')return;try{const oscillator=audioContext.createOscillator(),volume=audioContext.createGain();oscillator.type='sine';oscillator.frequency.value=780;volume.gain.setValueAtTime(.0001,audioContext.currentTime);volume.gain.exponentialRampToValueAtTime(.085,audioContext.currentTime+.03);volume.gain.exponentialRampToValueAtTime(.0001,audioContext.currentTime+.22);oscillator.connect(volume);volume.connect(audioContext.destination);oscillator.start();oscillator.stop(audioContext.currentTime+.23);}catch{}}
  function speak(message) {
    if(!data.settings.speech||!('speechSynthesis' in window))return;
    try {window.speechSynthesis.cancel();const utterance = new SpeechSynthesisUtterance(message);utterance.lang='ko-KR';utterance.rate=1.04;utterance.volume=.9;window.speechSynthesis.speak(utterance);}catch{}
  }
  async function keepAwake(){if(!('wakeLock' in navigator)||!data.active || data.active.mode==='paused')return;try{wakeLock=await navigator.wakeLock.request('screen');}catch{}}
  function releaseWake(){try{wakeLock?.release().catch(()=>{});}catch{}wakeLock=null;}
  function activateCurrent(){
    const a=data.active; if(!a)return;
    const step=currentStep();if(!step)return;
    a.mode='work';a.previousMode=null;
    a.timerEndAt = exercise[step.id].type==='timed' ? Date.now()+getAmount(step.id)*1000 : null;
    a.remaining=null;
    save();
    beep();speak(`${exercise[step.id].title}. ${exercise[step.id].range||'시작'} .`);
    render();keepAwake();
  }
  function startSession(){
    if(data.active){view='workout';render();return;}
    const plan=Coach.nextPlan(data.programIndex,data.profile?.days);
    const rounds=num(data.settings.rounds,1,4);
    data.active={plan,rounds,steps:buildSteps(plan,rounds),index:0,completedSteps:0,feedback:{},mode:'work',previousMode:null,startedAt:Date.now(),timerEndAt:Date.now()+getAmount('prep1')*1000,remaining:null};
    view='workout';modal=null;save();ensureAudio();speak('준비운동 시작. 어깨와 팔을 가볍게 풀어주세요.');render();keepAwake();
  }
  function doneStep(isSkip=false){
    const a=data.active;if(!a || a.mode!=='work')return;
    const steps=currentSteps(); const prior=steps[a.index];
    if(!isSkip) a.completedSteps=(a.completedSteps||0)+1;
    a.index++;
    if(a.index>=steps.length){completeSession();return;}
    const next=steps[a.index];
    let rest=0;
    if(prior.phase==='main' && (next.phase==='main'||next.phase==='bonus'))rest=(next.phase==='main' && next.round!==prior.round)?num(data.settings.longRest,20,150):num(data.settings.rest,10,90);
    else if(prior.phase==='bonus'&& next.phase==='bonus')rest=20;
    if(rest>0){a.mode='rest';a.previousMode=null;a.timerEndAt=Date.now()+rest*1000;a.remaining=null;save();beep();render();}
    else activateCurrent();
  }
  function startFromRest(){if(!data.active||data.active.mode!=='rest')return;activateCurrent();}
  function togglePause(){const a=data.active;if(!a)return;
    if(a.mode==='paused'){a.mode=a.previousMode||'work';a.timerEndAt = a.remaining!==null && a.remaining!==undefined ? Date.now()+a.remaining : null;a.remaining=null;a.previousMode=null;save();render();keepAwake();}
    else {a.previousMode=a.mode;a.remaining=a.timerEndAt ? Math.max(0,a.timerEndAt-Date.now()):null;a.timerEndAt=null;a.mode='paused';save();render();releaseWake();}
  }
  function goBack(){const a=data.active;if(!a||a.index<1)return;a.index--;a.completedSteps=Math.max(0,(a.completedSteps||0)-1);activateCurrent();}
  function completeSession(){const a=data.active;if(!a)return;
    const steps=currentSteps();
    data.progress=Coach.applyFeedback(data.progress||{},steps,(a.feedback||{}));
    lastFinished={plan:a.plan,completedAt:new Date().toISOString(),minutes:Math.max(1,Math.round((Date.now()-a.startedAt)/60000)),stepsCompleted:a.completedSteps||0,totalSteps:currentSteps().length};
    data.workouts.push(lastFinished);data.programIndex=(data.programIndex||0)+1;data.nextPlan=Coach.nextPlan(data.programIndex,data.profile?.days);data.active=null;modal=null;view='finish';releaseWake();save();beep();speak('운동 완료. 오늘도 수고하셨습니다.');render();
  }
  function tick(){const a=data.active;if(!a||view!=='workout'||a.mode==='paused')return;
    if(a.timerEndAt && Date.now()>=a.timerEndAt){if(a.mode==='rest')startFromRest();else if(a.mode==='work'&&exercise[currentStep().id].type==='timed')doneStep();return;}
    const output=$('[data-countdown]');if(output && a.timerEndAt)output.textContent=String(remainingTime(a));
  }
  async function downloadBackup(){
    const blob=new Blob([JSON.stringify({app:'calicoach',version:4,exportedAt:new Date().toISOString(),data},null,2)],{type:'application/json'});
    const filename=`calicoach-backup-${dateStr()}.json`;
    if(typeof File!=='undefined'&&navigator.share&&navigator.canShare){
      try{const file=new File([blob],filename,{type:'application/json'});if(navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'칼리코치 개인 백업'});return;}}
      catch(err){if(err?.name==='AbortError')return;console.warn('공유 시트 사용 실패',err);}
    }
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),8000);
  }
  let importCandidate=null;
  async function handleImport(input){
    const file=input?.files?.[0];if(!file)return;
    try{
      if(file.size>4000000)throw new Error('백업 파일 크기가 너무 큽니다.');
      const obj=JSON.parse(await file.text());
      if(obj.app!=='calicoach'||![1,2,3,4].includes(obj.version)||!obj.data||!Array.isArray(obj.data.workouts)||!Array.isArray(obj.data.weights))throw new Error('올바른 칼리코치 백업이 아닙니다.');
      if(obj.data.workouts.length>10000||obj.data.weights.length>10000)throw new Error('기록 개수가 너무 많습니다.');
      if(obj.version===2 && !OLD_USERS[obj.userId])throw new Error('이전 버전 사용자 ID를 확인할 수 없습니다.');
      importCandidate=obj;modal='import';render();
    }catch(err){alert(`백업을 열 수 없습니다: ${err.message}`);}
  }
  function restore(){
    if(!importCandidate)return;
    const item=importCandidate.data,def=DEFAULTS();
    const safeWeights=item.weights.filter(w=>w&&/^\d{4}-\d{2}-\d{2}$/.test(w.date)&&Number.isFinite(Number(w.weight))&&Number(w.weight)>=30&&Number(w.weight)<=250).map(w=>({date:w.date,weight:Number(w.weight)}));
    const safeWorkouts=item.workouts.filter(w=>w&&['A','B'].includes(w.plan)&&!Number.isNaN(new Date(w.completedAt).valueOf())).map(w=>({plan:w.plan,completedAt:w.completedAt,minutes:num(w.minutes,1,999),stepsCompleted:num(w.stepsCompleted,0,500)}));
    const importedProfile=[3,4].includes(importCandidate.version) ? item.profile : importCandidate.version===2 ? {...(item.profile||{}),name:OLD_USERS[importCandidate.userId]?.name||data.profile?.name,gender:OLD_USERS[importCandidate.userId]?.gender||data.profile?.gender||''} : data.profile;
    // 버전 1에서는 프로필을 덮어쓰지 않으며, 현재 사용자 프로필을 유지합니다.
    const validProfile=savedProfileValid(importedProfile)?importedProfile:data.profile;
    data={profile:validProfile,settings:{...def.settings,rounds:num(item.settings?.rounds,1,4),rest:num(item.settings?.rest,10,90),longRest:num(item.settings?.longRest,20,150),sound:!!item.settings?.sound,speech:!!item.settings?.speech,targetWeight:Number(validProfile?.targetWeight||0),reps:{}},weights:safeWeights,workouts:safeWorkouts,nextPlan:['A','B','C'].includes(item.nextPlan)?item.nextPlan:'A',programIndex:Number.isInteger(item.programIndex)?item.programIndex:(item.nextPlan==='B'?1:0),progress:item.progress&&typeof item.progress==='object'?item.progress:{},active:null};
    for(const [k,v] of Object.entries(item.settings?.reps||{}))if(exercise[k]&&Number.isFinite(Number(v)))data.settings.reps[k]=num(v,1,80);
    view=savedProfileValid(data.profile)?'home':'profile';modal=null;importCandidate=null;save();render();alert('현재 사용자 기록으로 백업을 복원했습니다.');
  }
  function migrateLegacy(){

    try{
      const old=JSON.parse(localStorage.getItem(LEGACY_KEY));
      if(!old||!Array.isArray(old.workouts)||!Array.isArray(old.weights))throw new Error('기존 데이터를 찾을 수 없습니다.');
      importCandidate={app:'calicoach',version:1,data:old};restore();
    }catch(err){modal=null;render();alert(`이전 기록을 가져올 수 없습니다: ${err.message}`);}
  }
  root.addEventListener('click',event => {
    if(event.target?.tagName==='VIDEO' && event.target.classList?.contains('exercise-real-video')){
      const video=event.target;
      if(video.paused)video.play().catch(()=>{});else video.pause();
      return;
    }
    const button=event.target.closest('[data-action]');if(!button)return;
    const action=button.dataset.action;
    if(action==='video-speed'){
      const video=root.querySelector('.guide-modal .exercise-real-video');
      if(video){video.playbackRate=Number(button.dataset.speed)||1;}
      return;
    }
    if(action==='close-modal'){modal=null;render();return;}
    if(modal && !['quit','reset','import-confirm','migrate-legacy'].includes(action))return;
    if(action==='go-profile'){profileAppliedMessage=false;view='profile';window.scrollTo(0,0);render();return;}
    if(action==='profile-back'){view='settings';render();return;}
    if(action==='migrate-legacy-confirm'){modal='legacy';render();return;}
    if(action==='migrate-legacy'){migrateLegacy();return;}
    if(action==='nav'){profileAppliedMessage=false;view=button.dataset.value;window.scrollTo(0,0);render();return;}
    if(action==='start'||action==='resume'){ensureAudio();startSession();return;}
    if(action==='done'){if(data.active?.mode==='work'&&currentStep()?.phase==='main'){data.active.feedback=data.active.feedback||{};data.active.feedback[stepKey(currentStep())]='ok';}doneStep();return;}
    if(action==='rate-easy'||action==='rate-hard'){if(data.active?.mode!=='work'||currentStep()?.phase!=='main')return;data.active.feedback=data.active.feedback||{};data.active.feedback[stepKey(currentStep())]=action==='rate-easy'?'easy':'hard';doneStep();return;}
    if(action==='skip-step'){if(data.active?.mode==='paused')return;doneStep(true);return;}
    if(action==='skip-rest'){if(data.active?.mode==='paused' && data.active.previousMode==='rest') data.active.mode='rest';startFromRest();return;}
    if(action==='pause'){togglePause();return;}
    if(action==='prev'){goBack();return;}
    if(action==='details'){
      detailExerciseId=button.dataset.id||currentStep()?.id||null;
      if(!exercise[detailExerciseId])return;
      if(data.active && data.active.mode!=='paused')togglePause();
      modal='details';render();return;
    }
    if(action==='quit-confirm'){modal='quit';render();return;}
    if(action==='quit'){data.active=null;view='home';modal=null;save();releaseWake();render();return;}
    if(action==='finish-home'){lastFinished=null;view='home';render();return;}
    if(action==='setting-step'){
      const {key,delta}=button.dataset;
      const bounds={rounds:[1,4],rest:[10,90],longRest:[20,150]};if(!bounds[key])return;
      data.settings[key]=num(Number(data.settings[key])+Number(delta),...bounds[key]);save();render();return;
    }
    if(action==='rep-minus'||action==='rep-plus'){
      const step=currentStep();if(!step||exercise[step.id].type!=='reps')return;
      data.settings.reps[step.id]=num(getAmount(step.id)+(action==='rep-plus'?1:-1),1,80);save();render();return;
    }
    if(action==='export'){downloadBackup();return;}
    if(action==='import'){$('#backup-file')?.click();return;}
    if(action==='import-confirm'){restore();return;}
    if(action==='reset-confirm'){modal='reset';render();return;}
    if(action==='reset'){
      const oldProfile=data.profile;
      data=DEFAULTS();data.profile=oldProfile;
      data.settings.targetWeight=Number(oldProfile?.targetWeight||0);
      data.settings.rounds=recommendedRounds(oldProfile);
      data.weights=oldProfile?[{date:dateStr(),weight:Number(oldProfile.weight)}]:[];
      lastFinished=null;modal=null;view='home';save();render();return;
    }
  });
  root.addEventListener('error',event=>{
    if(event.target?.matches?.('video.exercise-real-video')){
      const video=event.target;
      const id=video.getAttribute('data-id');
      if(id && exercise[id])video.outerHTML=`<img src="${mediaSrc(id)}" class="exercise-motion-gif" alt="${escapeHtml(exercise[id].title)} 영상 재생 불가, 개념 애니메이션" />`;
    }
  },true);
  root.addEventListener('submit',event => {
    const form=event.target;if(!['profile-form','weight-form','target-form'].includes(form.id))return;event.preventDefault();
    if(form.id==='profile-form'){saveProfile(form);return;}
    if(form.id==='weight-form'){
      const weight=Number($('#weight')?.value);
      if(!Number.isFinite(weight)||weight<30||weight>250){alert('30~250kg 사이의 올바른 체중을 입력해주세요.');return;}
      data.weights=data.weights.filter(w=>w.date!==dateStr());data.weights.push({date:dateStr(),weight:Math.round(weight*10)/10});if(data.profile)data.profile.weight=Math.round(weight*10)/10;save();render();return;
    }
    const target=Number($('#target')?.value);
    if(!Number.isFinite(target)||target<30||target>250){alert('목표 체중은 30~250kg 범위에서 입력해주세요.');return;}
    data.settings.targetWeight=target;if(data.profile)data.profile.targetWeight=target;save();render();
  });
  root.addEventListener('change',event => {
    const target=event.target;
    if(target.matches('[data-setting]')) {data.settings[target.dataset.setting]=target.checked;save();}
    if(target.id==='backup-file')handleImport(target);
  });
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){tick();if(view==='workout')keepAwake();} else releaseWake();});
  window.addEventListener('pagehide',save);
  if('serviceWorker' in navigator && location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(err=>console.warn('오프라인 캐시 등록 실패:',err));
  render();setInterval(tick,250);
})();
