// THEME
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  document.getElementById('toggleIcon').textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('ep_theme', isDark ? 'light' : 'dark');
}
(function() {
  const saved = localStorage.getItem('ep_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('toggleIcon').textContent = saved === 'dark' ? '🌙' : '☀️';
  });
})();

// STATE
let config = {}, checks = {}, subjects = [], subjectTopics = {}, selectedHours = '', plan = [];
const COLORS = ['c0','c1','c2','c3','c4','c5'];
let uploadedImages = [];

function save() {
  try { localStorage.setItem('ep_config', JSON.stringify(config)); localStorage.setItem('ep_checks', JSON.stringify(checks)); } catch(e) {}
}
function load() {
  try {
    const c = localStorage.getItem('ep_config'), ch = localStorage.getItem('ep_checks');
    if (c) config = JSON.parse(c); if (ch) checks = JSON.parse(ch);
  } catch(e) {}
}

// WIZARD
let currentStep = 1;
function updateDots() {
  const wrap = document.getElementById('stepDots'); wrap.innerHTML = '';
  for (let i = 1; i <= 4; i++) {
    const d = document.createElement('div');
    d.className = 'step-dot' + (i===currentStep?' active':i<currentStep?' done':'');
    wrap.appendChild(d);
  }
}
function goStep(n) {
  if (n > currentStep) {
    if (currentStep===1) {
      const v = document.getElementById('examDate').value;
      if (!v || new Date(v) <= new Date()) { document.getElementById('err1').style.display='block'; return; }
      document.getElementById('err1').style.display='none'; config.examDate = v;
    }
    if (currentStep===2) {
      if (!selectedHours) { document.getElementById('err2').style.display='block'; return; }
      document.getElementById('err2').style.display='none'; config.dailyHours = selectedHours;
    }
    if (currentStep===3) {
      if (subjects.length===0) { document.getElementById('err3').style.display='block'; return; }
      document.getElementById('err3').style.display='none'; buildTopicsUI();
    }
  }
  document.getElementById(`step${currentStep}`).classList.remove('active');
  currentStep = n;
  document.getElementById(`step${currentStep}`).classList.add('active');
  updateDots(); window.scrollTo(0,0);
}
function selectHours(btn, val) {
  document.querySelectorAll('#hoursOptions .option-btn').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected'); selectedHours = val;
}

// SUBJECTS
function renderSubjects() {
  const list = document.getElementById('subjectList'); list.innerHTML = '';
  subjects.forEach((s, i) => {
    const row = document.createElement('div'); row.className = 'subject-row';
    row.innerHTML = `<span class="sub-name">${s.name}</span>
      ${['weak','mid','strong'].map(l=>`<button class="sub-level ${s.level===l?l:''}" onclick="setLevel(${i},'${l}')">${l.charAt(0).toUpperCase()+l.slice(1)}</button>`).join('')}
      <button class="del-btn" onclick="removeSubject(${i})">×</button>`;
    list.appendChild(row);
  });
}
function addSubject() {
  const inp = document.getElementById('subjectInput'), name = inp.value.trim();
  if (!name || subjects.find(s=>s.name.toLowerCase()===name.toLowerCase())) { inp.value=''; return; }
  subjects.push({name, level:'mid'}); subjectTopics[name]=subjectTopics[name]||[]; inp.value=''; renderSubjects();
}
function removeSubject(i) { delete subjectTopics[subjects[i].name]; subjects.splice(i,1); renderSubjects(); }
function setLevel(i, level) { subjects[i].level=level; renderSubjects(); }

// TOPICS
function buildTopicsUI() {
  const builder = document.getElementById('topicsBuilder'); builder.innerHTML='';
  subjects.forEach((s,si) => {
    const lc = {weak:'var(--pink)',mid:'var(--warning)',strong:'var(--mint)'};
    const block = document.createElement('div'); block.className='subject-topics-block'; block.id=`stb_${si}`;
    block.innerHTML=`<div class="stb-header"><span style="color:${lc[s.level]}">${s.name}</span><span style="font-size:0.68rem;color:var(--muted);font-weight:600;margin-left:4px">${s.level}</span></div>
      <div class="stb-topics" id="topicsList_${si}"></div>
      <div class="add-topic-row">
        <input type="text" class="input-field" id="topicInp_${si}" placeholder="Enter topic..." onkeydown="if(event.key==='Enter')addTopic(${si})">
        <button onclick="addTopic(${si})">+ Add</button>
      </div>`;
    builder.appendChild(block); renderTopics(si);
  });
}
function renderTopics(si) {
  const list=document.getElementById(`topicsList_${si}`); if(!list) return;
  const topics=subjectTopics[subjects[si].name]||[];
  list.innerHTML=topics.map((t,ti)=>`<div class="existing-topic"><span>› ${t}</span><button onclick="removeTopic(${si},${ti})">×</button></div>`).join('');
}
function addTopic(si) {
  const inp=document.getElementById(`topicInp_${si}`), val=inp.value.trim(); if(!val) return;
  const name=subjects[si].name; subjectTopics[name]=subjectTopics[name]||[]; subjectTopics[name].push(val); inp.value=''; renderTopics(si);
}
function removeTopic(si,ti) { subjectTopics[subjects[si].name].splice(ti,1); renderTopics(si); }

// AI SCAN
function handleImages(e) {
  const files=Array.from(e.target.files); if(!files.length) return;
  uploadedImages=[];
  const preview=document.getElementById('scanPreview'); preview.innerHTML=''; preview.style.display='flex';
  Promise.all(files.map((file,idx)=>new Promise(res=>{
    const r=new FileReader();
    r.onload=ev=>{
      uploadedImages.push({base64:ev.target.result.split(',')[1],type:file.type});
      const wrap=document.createElement('div'); wrap.style.cssText='position:relative;display:inline-block;';
      const img=document.createElement('img'); img.src=ev.target.result;
      const btn=document.createElement('button');
      btn.textContent='×'; btn.style.cssText='position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;background:#FF4D8D;color:#fff;border:none;cursor:pointer;font-size:12px;line-height:1;display:flex;align-items:center;justify-content:center;';
      btn.onclick=()=>removeImage(idx);
      wrap.appendChild(img); wrap.appendChild(btn); preview.appendChild(wrap); res();
    };
    r.readAsDataURL(file);
  }))).then(()=>{document.getElementById('btnScan').style.display='block';setStatus('','');});
}
function removeImage(idx) {
  uploadedImages.splice(idx,1);
  document.getElementById('syllabusUpload').value='';
  if(!uploadedImages.length){
    const preview=document.getElementById('scanPreview'); preview.innerHTML=''; preview.style.display='none';
    document.getElementById('btnScan').style.display='none';
  } else {
    document.getElementById('syllabusUpload').dispatchEvent(new Event('rerender'));
  }
}
function setStatus(type,msg) {
  const el=document.getElementById('scanStatus'); el.className='scan-status';
  if(!type){el.style.display='none';return;} el.classList.add(type); el.innerHTML=msg; el.style.display='block';
}
async function scanWithAI() {
  if(!uploadedImages.length) return;
  const btn=document.getElementById('btnScan'); btn.disabled=true;
  setStatus('loading','<span class="spin">⟳</span> AI is scanning your syllabus...');
  const subjectNames=subjects.map(s=>s.name).join(', ');
  const content=[
    {type:'text',text:`I am uploading ${uploadedImages.length} syllabus image(s). My exam subjects are: ${subjectNames}.\n\nExtract all study topics from the syllabus for each subject. Return ONLY valid JSON:\n{"SubjectName": ["topic1","topic2"]}\nRules: match subject names exactly, keep each topic under 10 words, include all units/subtopics, NO markdown, NO explanation.`},
    ...uploadedImages.map(img=>({type:'image',source:{type:'base64',media_type:img.type,data:img.base64}}))
  ];
  try {
    const res=await fetch('/api/claude',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'user',content}]})});
    const raw=data.content?.find(b=>b.type==='text')?.text||'';
    const parsed=JSON.parse(raw.replace(/```json|```/g,'').trim());
    let added=0;
    subjects.forEach(s=>{
      const key=Object.keys(parsed).find(k=>k.toLowerCase().includes(s.name.toLowerCase())||s.name.toLowerCase().includes(k.toLowerCase()));
      if(key&&Array.isArray(parsed[key])){const ex=subjectTopics[s.name]||[];const nw=parsed[key].filter(t=>!ex.includes(t));subjectTopics[s.name]=[...ex,...nw];added+=nw.length;}
    });
    subjects.forEach((_,si)=>renderTopics(si));
    setStatus('success',`✓ Done! Added ${added} topics. Review and edit below if needed.`);
  } catch(err) {
    setStatus('error','✗ Could not extract topics. Try a clearer photo or add manually.');
  }
  btn.disabled=false;
}

// GENERATE PLAN
function generatePlan() {
  for(const s of subjects){if(!subjectTopics[s.name]||!subjectTopics[s.name].length){document.getElementById('err4').style.display='block';return;}}
  document.getElementById('err4').style.display='none';
  const examDate=new Date(config.examDate),today=new Date();today.setHours(0,0,0,0);examDate.setHours(0,0,0,0);
  const totalDays=Math.max(1,Math.floor((examDate-today)/86400000));
  const lo={weak:0,mid:1,strong:2};
  const sorted=[...subjects].sort((a,b)=>lo[a.level]-lo[b.level]);
  const revDays=Math.max(1,Math.floor(totalDays*0.25)),studyDays=totalDays-revDays;
  const wm={weak:3,mid:2,strong:1};
  const weights=sorted.map(s=>wm[s.level]*subjectTopics[s.name].length);
  const tw=weights.reduce((a,b)=>a+b,0);
  const dpS=sorted.map((s,i)=>Math.max(1,Math.round(studyDays*weights[i]/tw)));
  plan=[];let dayNum=1,datePtr=new Date(today);
  sorted.forEach((s,si)=>{
    const topics=subjectTopics[s.name],days=dpS[si],tpd=Math.ceil(topics.length/days);
    for(let d=0;d<days;d++){const start=d*tpd,end=Math.min(start+tpd,topics.length);if(start>=topics.length)break;
      plan.push({dayNum,date:datePtr.toLocaleDateString('en-IN',{month:'short',day:'numeric'}),dateObj:new Date(datePtr),subject:s.name,subjectIdx:si,level:s.level,topics:topics.slice(start,end),isRevision:false,hours:config.dailyHours});
      dayNum++;datePtr.setDate(datePtr.getDate()+1);}
  });
  const rS=sorted.map(s=>s.name);
  for(let r=0;r<revDays;r++){const subj=rS[r%rS.length];
    plan.push({dayNum,date:datePtr.toLocaleDateString('en-IN',{month:'short',day:'numeric'}),dateObj:new Date(datePtr),subject:`Revision – ${subj}`,subjectIdx:-1,level:'rev',topics:subjectTopics[subj].map(t=>`Revise: ${t}`),isRevision:true,hours:config.dailyHours});
    dayNum++;datePtr.setDate(datePtr.getDate()+1);}
  config.plan=plan;config.subjects=subjects;config.subjectTopics=subjectTopics;config.generated=true;
  save();showTracker();
}
function editPlan() {
  if(!confirm('Your progress will be saved. Continue to edit?')) return;
  config.generated=false; save();
  document.getElementById('tracker').style.display='none';
  document.getElementById('wizard').style.display='block';
  currentStep=1;
  document.getElementById('step1').classList.add('active');
  document.getElementById('step2').classList.remove('active');
  document.getElementById('step3').classList.remove('active');
  document.getElementById('step4').classList.remove('active');
  updateDots();
  setTimeout(()=>{
    document.getElementById('examDate').value=config.examDate||'';
    if(config.dailyHours){
      selectedHours=config.dailyHours;
      document.querySelectorAll('#hoursOptions .option-btn').forEach(b=>{
        if(b.textContent.trim()===config.dailyHours.replace(' hrs','').trim()||b.getAttribute('onclick')?.includes(config.dailyHours)) b.classList.add('selected');
      });
    }
    renderSubjects();
  },100);
}

// TRACKER
function showTracker() {
  document.getElementById('wizard').style.display='none';document.getElementById('tracker').style.display='block';
  const ed=new Date(config.examDate);
  document.getElementById('trackerSub').textContent=`Exam: ${ed.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})} · ${config.dailyHours}/day`;
  renderTracker();
}
function getTodayIdx() {
  const today=new Date();today.setHours(0,0,0,0);
  for(let i=0;i<plan.length;i++){const d=new Date(plan[i].dateObj);d.setHours(0,0,0,0);if(d.getTime()===today.getTime())return i;}
  for(let i=0;i<plan.length;i++){if((checks[`day${plan[i].dayNum}`]||[]).length<plan[i].topics.length)return i;}
  return plan.length-1;
}
function renderTracker() {
  const list=document.getElementById('daysList');list.innerHTML='';
  const ti=getTodayIdx();
  plan.forEach((d,idx)=>{
    const key=`day${d.dayNum}`,dc=(checks[key]||[]).length,total=d.topics.length,allDone=dc===total,isToday=idx===ti;
    const cc=d.isRevision?'rev-color':COLORS[d.subjectIdx%COLORS.length];
    const card=document.createElement('div');
    card.className=`day-card${isToday?' today-card open':''}${allDone&&!isToday?' done-card':''}`;
    card.innerHTML=`
      <div class="day-header" onclick="this.closest('.day-card').classList.toggle('open')">
        <div class="subj-badge ${cc}">${d.isRevision?'REV':d.subject.substring(0,4).toUpperCase()}</div>
        <div class="day-info">
          <div class="day-title">${isToday?'→ ':''}Day ${d.dayNum}: ${d.subject}</div>
          <div class="day-sub">${d.date}</div>
        </div>
        ${isToday?'<span class="today-tag">TODAY</span>':''}
        <div class="day-count ${allDone?'all-done':''}">${allDone?'✓':`${dc}/${total}`}</div>
        <div class="chevron">›</div>
      </div>
      <div class="topics-wrap">
        ${d.topics.map((t,ti2)=>{const ic=(checks[key]||[]).includes(ti2);return`<div class="topic-row${ic?' checked':''}" onclick="toggleTopic('${key}',${ti2})"><div class="chk">${ic?'✓':''}</div><div class="topic-label">${t}</div></div>`;}).join('')}
        <div class="hours-note">⏱ ${d.hours}/day</div>
      </div>`;
    list.appendChild(card);
  });
  updateProgress();updateBanner(ti);
}
function toggleTopic(key,ti) {
  if(!checks[key])checks[key]=[];
  const i=checks[key].indexOf(ti);if(i===-1)checks[key].push(ti);else checks[key].splice(i,1);
  save();renderTracker();
}
function updateProgress() {
  let total=0,done=0;
  plan.forEach(d=>{total+=d.topics.length;done+=(checks[`day${d.dayNum}`]||[]).length;});
  document.getElementById('progressLabel').textContent=`${done} / ${total} topics`;
  document.getElementById('progressFill').style.width=total?`${(done/total)*100}%`:'0%';
}
function updateBanner(todayIdx) {
  const d=plan[todayIdx];
  if(!d){document.getElementById('bannerText').innerHTML='<strong>All done! Go ace your exams! 🎉</strong>';return;}
  const key=`day${d.dayNum}`,rem=d.topics.length-(checks[key]||[]).length;
  document.getElementById('bannerText').innerHTML=rem===0
    ?`<strong>Today's tasks complete! 🎉</strong><br>Up next: <strong>${plan[todayIdx+1]?plan[todayIdx+1].subject:'Exams! You got this! 🚀'}</strong>`
    :`<strong>Today → Day ${d.dayNum}: ${d.subject}</strong><br>${rem} topic${rem>1?'s':''} left to cover · ${d.hours}/day`;
}
function resetAll() {
  if(!confirm('All data will be deleted. Are you sure?'))return;
  localStorage.removeItem('ep_config');localStorage.removeItem('ep_checks');location.reload();
}

// INIT
load();updateDots();
if(config.generated&&config.plan?.length){
  plan=config.plan;subjects=config.subjects||[];subjectTopics=config.subjectTopics||{};selectedHours=config.dailyHours;
  showTracker();
} else {
  const t=new Date();t.setDate(t.getDate()+1);
  document.getElementById('examDate').min=t.toISOString().split('T')[0];
}
