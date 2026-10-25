/* Compatibility: retain the original storage key and historical record shapes. */
const STORAGE_KEY='yantu-study-desk-v1';
const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function dateKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
const parseDate=s=>new Date(`${s}T12:00:00`);
function validDate(s){const d=parseDate(s);return /^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(d)&&dateKey(d)===s;}
const num=n=>Math.max(0,Number(n)||0), hours=n=>`${Number(num(n).toFixed(1))}h`;
let storageError='';
function readState(){try{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return {};const data=JSON.parse(raw);if(!data||typeof data!=='object'||Array.isArray(data))throw Error();return data;}catch{storageError='无法读取原记录，当前修改不会覆盖原数据。请检查浏览器存储。';return {};}}
function prepareState(saved){
  const s=Object.assign({tasks:{},reviews:{},memos:[],quickMemos:{},words:{},english:{},examDate:'',dark:false,theme:'iris',subjects:[],onboardingDone:false,collapsed:false},saved);
  s.goal=Object.assign({school:'',major:'',stage:'按自己的节奏',startDate:dateKey()},s.goal);
  if(!Array.isArray(s.subjects))s.subjects=[];
  const names=new Set();
  Object.values(s.tasks).forEach(ts=>{if(Array.isArray(ts))ts.forEach(t=>{if(t.subject)names.add(t.subject);});});
  Object.values(s.reviews).forEach(r=>Object.keys(r.knowledge||{}).forEach(n=>names.add(n)));
  names.forEach(name=>{if(!s.subjects.some(x=>x.name===name||(x.aliases||[]).includes(name)))s.subjects.push({id:uid(),name,color:null,goal:0,archived:false,aliases:[name]});});
  if(!saved.schemaVersion&&Object.values(s.tasks).some(ts=>ts.length))s.onboardingDone=true;
  s.schemaVersion=2;return s;
}
const originalState=readState();
if(!storageError&&originalState.schemaVersion!==2&&Object.keys(originalState).length){try{if(!localStorage.getItem(`${STORAGE_KEY}-before-floral`))localStorage.setItem(`${STORAGE_KEY}-before-floral`,JSON.stringify(originalState));}catch{storageError='迁移备份未能保存，当前不会覆盖原记录。请释放浏览器存储空间。';}}
let state=prepareState(originalState),selectedDate=dateKey(),dateAnchor=new Date(),taskFilter='all',memoFilter='all',actualTaskId=null,modalReturnFocus=null;
let timer=Object.assign({total:5400,remaining:5400,running:false,endAt:null},state.timer);
function save(){if(storageError){toast(storageError);return false;}try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));return true;}catch{toast('保存失败：浏览器存储不可用或已满，请导出备份。');return false;}}
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),3000);}
const getTasks=(key=selectedDate)=>state.tasks[key]||[];
const activeSubjects=()=>state.subjects.filter(s=>!s.archived&&!s.deleted);
const subjectFor=t=>state.subjects.find(s=>t.subjectId?s.id===t.subjectId:s.name===t.subject||(s.aliases||[]).includes(t.subject));
const theme=()=>window.STUDY_THEMES[state.theme]||window.STUDY_THEMES.iris;
const subjectColor=(s,i=0)=>/^#[\da-f]{6}$/i.test(s?.color||'')?s.color:theme().palette[(s?state.subjects.indexOf(s):i)%theme().palette.length];

const QUOTES=['花开有期，奔赴亦有期。','你不必在今天成为春天，认真生长的日子也自有风景。','允许自己慢一点，但别忘了为什么出发。','不是所有努力都急着开花，沉默的日子也正在积蓄力量。','愿你在漫长的备考时光里，仍然记得抬头看看天。','一页书，一点光。今天的生长，也值得被看见。','不必借别人的花期，丈量自己的春天。'];
function bindFlowerImage(image){
  const container=image.parentElement,fallback=$('.flower-fallback',container);
  const isCurrent=()=>image.isConnected&&$('img',container)===image;
  const loaded=()=>{if(!isCurrent())return;image.hidden=false;image.classList.add('is-loaded');container.classList.add('flower-loaded');container.classList.remove('flower-error');fallback.hidden=true;};
  const failed=()=>{if(!isCurrent())return;image.hidden=true;container.classList.remove('flower-loaded');container.classList.add('flower-error');fallback.hidden=false;};
  image.onload=loaded;image.onerror=failed;
  // Cached files may complete before listeners are attached; old theme requests are ignored.
  if(image.complete){if(image.naturalWidth>0)loaded();else failed();}
}
function applyTheme(){
  if(!window.STUDY_THEMES[state.theme])state.theme='iris';const t=theme();
  Object.entries(t.colors).forEach(([key,value])=>document.documentElement.style.setProperty(key,value));document.documentElement.style.setProperty('--theme-accent',t.colors['--green']);
  document.documentElement.dataset.theme=state.theme;document.body.classList.toggle('dark',state.dark);
  $('#themeToggle').textContent=state.dark?'☀':'☾';$('#currentTheme').textContent=`${t.name} · ${t.meaning}`;
  $('#themeCaption').textContent=`${t.english} · ${t.name} / ${t.meaning}`;
  const art=$('#botanicalArt');art.classList.remove('flower-loaded','flower-error');
  art.innerHTML=`<img class="hero-flower" src="${esc(t.asset.hero)}" alt="${esc(t.asset.alt)}" width="900" height="900" loading="eager" decoding="async" fetchpriority="high"><span class="flower-fallback" role="status" hidden>花卉暂未绽放，学习依然继续。</span>`;
  bindFlowerImage($('img',art));$('.brand-mark').innerHTML=window.STUDY_LOGO;
  $('meta[name="theme-color"]').content=t.colors['--bg'];$$('.theme-option').forEach(b=>b.setAttribute('aria-pressed',b.dataset.theme===state.theme));
  const parts=dateKey().split('-').map(Number),day=Math.floor(Date.UTC(parts[0],parts[1]-1,parts[2])/86400000);
  $('#dailyQuote').textContent=QUOTES[(day%QUOTES.length+QUOTES.length)%QUOTES.length];$('#sidebarQuote').textContent=t.quote;
}
function renderThemes(){
  $('#themeGrid').innerHTML=Object.entries(window.STUDY_THEMES).map(([key,t])=>`<button type="button" class="theme-option" data-theme="${key}" aria-pressed="${key===state.theme}"><div class="theme-preview" style="background:${t.colors['--bg']}"><img src="${esc(t.asset.thumb)}" alt="${esc(t.asset.alt)}" width="360" height="360" loading="lazy" decoding="async"><span class="flower-fallback" hidden>花卉图片暂不可用</span></div><strong>${t.name} · ${t.meaning}</strong><small>${t.quote}</small><div class="theme-swatch" aria-hidden="true">${t.palette.slice(0,4).map(c=>`<i style="background:${c}"></i>`).join('')}</div></button>`).join('');
  $$('.theme-preview img').forEach(bindFlowerImage);
  $$('.theme-option').forEach(b=>b.onclick=()=>{state.theme=b.dataset.theme;applyTheme();save();updateDashboard();renderTasks();toast(`已换上${theme().name}主题`);});
}
function updateDates(){const now=new Date();$('#todayWeek').textContent=now.toLocaleDateString('zh-CN',{weekday:'long'});$('#todayDate').textContent=now.toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric'});const h=now.getHours();$('#greeting').textContent=h<6?'夜深了':h<11?'早上好':h<14?'午安':h<18?'下午好':'晚上好';renderDateStrip();updateCountdown();}
function selectDate(key){selectedDate=key;dateAnchor=parseDate(key);renderDateStrip();renderForDate();}
function renderDateStrip(){
  const start=new Date(dateAnchor);start.setDate(start.getDate()+(start.getDay()===0?-6:1-start.getDay()));const strip=$('#dateStrip');strip.innerHTML='';
  for(let i=0;i<7;i++){const d=new Date(start);d.setDate(start.getDate()+i);const key=dateKey(d),b=document.createElement('button'),records=getTasks(key).length,today=key===dateKey();b.className=`date-chip${key===selectedDate?' active':''}${today?' today':''}`;b.setAttribute('aria-pressed',key===selectedDate);b.setAttribute('aria-label',`${d.toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'long'})}${today?'，今日':''}，${records} 项学习记录`);b.innerHTML=`<span>周${'日一二三四五六'[d.getDay()]}</span><strong>${d.getDate()}</strong>${today?'<small>今日</small>':records?'<small class="record-dot" aria-hidden="true"></small>':'<small aria-hidden="true"></small>'}`;b.onclick=()=>selectDate(key);strip.appendChild(b);}
  $('#dateInput').value=selectedDate;$$('.review-date-label').forEach(el=>el.textContent=selectedDate);
}
function updateCountdown(){
  const valid=validDate(state.examDate),days=valid?Math.round((parseDate(state.examDate)-parseDate(dateKey()))/86400000):null;
  $('#countdownDays').textContent=valid?Math.max(0,days):'—';$('#summaryCountdown').innerHTML=valid?(days<0?'已赴约':days===0?'就在今天':`${days} <em>天</em>`):'待你定义';
  $('#examSummary').textContent=valid?`${state.examDate} · ${days<0?'下一程也有风景':'按自己的节奏靠近'}`:'设置目标，让期待有迹可循';
  $('#stageLabel').textContent=state.goal.stage;$('#profileTarget').textContent=[state.goal.school,state.goal.major].filter(Boolean).join(' · ')||'每个人都有自己的花期';
  const from=validDate(state.goal.startDate)?parseDate(state.goal.startDate):new Date(),range=valid?parseDate(state.examDate)-from:0;
  $('#countdownProgress').style.width=`${range>0?Math.max(0,Math.min(100,(parseDate(dateKey())-from)/range*100)):0}%`;
}
function renderTasks(){
  const tasks=getTasks(),list=$('#taskList');list.innerHTML='';$('#onboardingCard').hidden=state.onboardingDone||tasks.length>0;
  const visible=tasks.filter(t=>taskFilter==='all'||(taskFilter==='done'?t.done:!t.done));
  if(!visible.length&&$('#onboardingCard').hidden)list.innerHTML='<div class="empty-state"><span aria-hidden="true">⌑</span><strong>给今天，留一点生长的空间。</strong><p>添加一个小任务，或在科目管理中整理你的计划。</p><button class="text-button" id="emptyTemplate">使用通用模板 ↗</button></div>';
  $('#emptyTemplate')?.addEventListener('click',useTemplate);
  visible.forEach(t=>{const s=subjectFor(t),row=document.createElement('div');row.className=`task-item${t.done?' completed':''}`;row.dataset.id=t.id;
    row.innerHTML=`<input class="task-check" type="checkbox" ${t.done?'checked':''} aria-label="完成：${esc(t.title)}"><div class="task-content"><strong>${esc(t.title)}${t.priority==='high'?'<span class="priority-dot" title="重要任务">·</span>':''}</strong><small><span>${esc(t.period)}</span><span>计划 ${hours(t.duration)}</span></small><button class="task-actual" title="记录实际学习时长">${t.actualDuration!=null?`实际 ${hours(t.actualDuration)}`:'＋ 记录实际用时'}</button></div><span class="subject-tag" style="--subject-color:${subjectColor(s)}">${esc(s?.name||t.subject||'未分类')}${s?.archived?' · 已归档':''}</span><div class="task-actions"><button class="task-edit icon-button" aria-label="编辑任务：${esc(t.title)}">✎</button><button class="task-delete" aria-label="删除任务：${esc(t.title)}">×</button></div>`;
    $('.task-check',row).onchange=e=>{t.done=e.target.checked;save();renderTasks();updateDashboard();renderDateStrip();};
    $('.task-actual',row).onclick=()=>{actualTaskId=t.id;$('#actualTaskName').textContent=t.title;$('#actualDuration').value=t.actualDuration??'';openModal('actualModal');};
    $('.task-edit',row).onclick=()=>openTask(t);$('.task-delete',row).onclick=()=>{if(confirm(`删除“${t.title}”？`)){state.tasks[selectedDate]=tasks.filter(x=>x.id!==t.id);save();renderForDate();renderDateStrip();toast('已删除任务');}};list.appendChild(row);
  });
  $('#taskSummary').textContent=`${selectedDate===dateKey()?'今天':selectedDate} · ${tasks.length} 项计划，${tasks.filter(t=>t.done).length} 项已完成`;
}
function updateDashboard(){
  const tasks=getTasks(),done=tasks.filter(t=>t.done).length,pct=tasks.length?Math.round(done/tasks.length*100):0;
  $('#progressPercent').textContent=`${pct}%`;$('#progressRing').style.setProperty('--progress',pct);$('#progressDetail').textContent=`${done} / ${tasks.length} 项已完成`;
  $('#progressTitle').textContent=pct===100&&tasks.length?'今天的认真，已被收藏。':pct>0?'每一步，都算数。':'慢慢展开今天的一页。';
  const planned=tasks.reduce((sum,t)=>sum+num(t.duration),0),actual=tasks.reduce((sum,t)=>sum+num(t.actualDuration),0),goal=activeSubjects().reduce((sum,s)=>sum+num(s.goal),0);
  $('#summaryGoal').innerHTML=`${Number((goal||planned).toFixed(1))} <em>h</em>`;$('#summaryGoalHint').textContent=goal?`来自 ${activeSubjects().length} 个科目的每日目标`:'来自当日计划时长';
  $('#summaryActual').innerHTML=`${Number(actual.toFixed(1))} <em>h</em>`;$('#summaryTodo').innerHTML=`${tasks.length-done} <em>项</em>`;$('#summaryCompleted').textContent=tasks.length?`已完成 ${done} / ${tasks.length}，不必和别人比较`:'从一件小事开始，也很好';$('#streakDays').textContent=streak('tasks');renderDonut();
}
function renderDonut(){
  const actual=$('#chartMode').value==='actual',totals=new Map();getTasks().forEach(t=>{const s=subjectFor(t),key=s?.id||t.subject||'未分类';if(!totals.has(key))totals.set(key,{name:s?.name||t.subject||'未分类',s,value:0});totals.get(key).value+=num(actual?t.actualDuration:t.duration);});
  const rows=[...totals.values()].filter(r=>r.value>0),total=rows.reduce((sum,r)=>sum+r.value,0);$('#chartModeLabel').textContent=actual?'实际':'计划';let offset=0;const r=63,c=2*Math.PI*r;
  const arcs=rows.map((row,i)=>{const portion=row.value/total,len=portion*c,text=`${row.name}：${hours(row.value)}，占 ${(portion*100).toFixed(1)}%`,arc=`<circle class="donut-segment" cx="85" cy="85" r="${r}" fill="none" stroke="${subjectColor(row.s,i)}" stroke-width="20" stroke-dasharray="${len} ${c-len}" stroke-dashoffset="${-offset}" transform="rotate(-90 85 85)" tabindex="0" role="img" aria-label="${esc(text)}"><title>${esc(text)}</title></circle>`;offset+=len;return arc;}).join('');
  $('#subjectBars').innerHTML=`<div class="donut-layout"><div class="donut-svg-wrap"><svg viewBox="0 0 170 170" class="donut-chart" aria-label="${actual?'实际':'计划'}学习时间分配"><circle cx="85" cy="85" r="63" fill="none" stroke="var(--line)" stroke-width="20"/>${arcs}</svg><div class="donut-center"><strong>${hours(total)}</strong><small>${actual?'实际记录':'计划投入'}</small></div></div><div class="donut-legend">${rows.length?rows.map((row,i)=>`<button class="legend-row" data-index="${i}"><i style="background:${subjectColor(row.s,i)}"></i><span class="legend-name">${esc(row.name)}</span><strong>${hours(row.value)}</strong><small>${(row.value/total*100).toFixed(1)}%</small></button>`).join(''):'<div class="chart-empty"><strong>时间，等你慢慢安排。</strong><p>'+(actual?'在任务中记录实际用时后显示。':'添加学习任务后显示科目分配。')+'</p></div>'}</div></div>`;
  const detail=i=>{const row=rows[i];$('#chartDetail').textContent=`${row.name} · ${actual?'实际':'计划'} ${hours(row.value)} · 占比 ${(row.value/total*100).toFixed(1)}%`;};
  $$('.legend-row').forEach((b,i)=>{b.onclick=()=>detail(i);b.onmouseenter=()=>detail(i);b.onfocus=()=>detail(i);});$$('.donut-segment').forEach((arc,i)=>{arc.onmouseenter=()=>detail(i);arc.onfocus=()=>detail(i);});$('#chartDetail').textContent=total?`共 ${rows.length} 个科目 · 轻触图例查看详情`:(actual?'尚无实际用时记录，不以完成状态推算。':'尚无计划数据，先为自己安排一小步。');
}
function streak(kind){let count=0,d=new Date();for(let i=0;i<366;i++){const x=state[kind][dateKey(d)],ok=kind==='tasks'?x?.length&&x.every(t=>t.done):x&&(x.wordsLearned>0||Object.values(x.checks||{}).some(Boolean));if(ok)count++;else if(i>0)break;d.setDate(d.getDate()-1);}return count;}
function renderForDate(){renderTasks();updateDashboard();$('#quickMemo').value=state.quickMemos[selectedDate]||'';$('#memoSaveHint').textContent='内容自动保存于当前日期';renderReview();renderEnglish();}
function renderSubjectOptions(task){const subjects=activeSubjects(),current=task&&subjectFor(task);if(current&&!subjects.includes(current))subjects.push(current);$('#taskSubject').innerHTML='<option value="">未分类</option>'+subjects.map(s=>`<option value="${s.id}">${esc(s.name)}${s.archived?'（已归档）':''}</option>`).join('');if(current)$('#taskSubject').value=current.id;}
function openTask(task=null){$('#taskForm').reset();$('#taskForm').dataset.editId=task?.id||'';renderSubjectOptions(task);$('#taskModal h3').textContent=task?'编辑学习任务':'添加学习任务';if(task){$('#taskTitle').value=task.title;$('#taskDuration').value=task.duration;$('#taskPeriod').value=task.period;$('#taskPriority').value=task.priority||'normal';}openModal('taskModal');}
function useTemplate(){
  if(getTasks().length&&!confirm('将通用模板追加到当前日期？已有任务会保留。'))return;
  const names=['英语','政治','专业课一','专业课二'];names.forEach(name=>{if(!state.subjects.some(s=>s.name===name&&!s.deleted))state.subjects.push({id:uid(),name,color:null,goal:1,archived:false,aliases:[name]});});
  const tasks=getTasks().slice();names.forEach((name,i)=>{const s=state.subjects.find(x=>x.name===name&&!x.deleted);if(s.archived)return;tasks.push({id:uid(),title:`${name} · 自定学习内容`,subject:name,subjectId:s.id,duration:1,period:i<2?'上午':'下午',priority:'normal',done:false});});state.tasks[selectedDate]=tasks;state.onboardingDone=true;save();renderForDate();renderDateStrip();toast('已添加通用模板，所有内容均可修改');
}
function renderSubjects(){
  const list=$('#subjectManagerList');list.innerHTML='';if(!state.subjects.filter(s=>!s.deleted).length)list.innerHTML='<p class="empty-state">还没有科目。为你的学习方向起个名字吧。</p>';
  state.subjects.filter(s=>!s.deleted).forEach(s=>{const row=document.createElement('form');row.className='subject-edit-row';row.innerHTML=`<label class="subject-color">颜色<input type="color" aria-label="${esc(s.name)}颜色" value="${subjectColor(s)}"></label><label class="subject-name">科目名称<input class="name-input" maxlength="24" required value="${esc(s.name)}"></label><label class="subject-goal">目标 h/天<input class="goal-input" type="number" min="0" max="24" step="0.1" required value="${num(s.goal)}"></label><div class="subject-actions"><button type="submit" class="text-button">保存</button><button type="button" class="text-button color-reset" title="恢复跟随花卉主题配色">随主题</button><button type="button" class="text-button archive">${s.archived?'恢复':'归档'}</button><button type="button" class="text-button delete">删除</button></div>`;
    $('input[type=color]',row).oninput=e=>{s.color=e.target.value;save();renderTasks();updateDashboard();};
    row.onsubmit=e=>{e.preventDefault();const name=$('.name-input',row).value.trim();if(!name){toast('请填写科目名称');return;}if(state.subjects.some(x=>x.id!==s.id&&!x.deleted&&(x.name===name||(x.aliases||[]).includes(name)))){toast('这个科目名称已存在，请换一个名字');return;}s.aliases=[...new Set([...(s.aliases||[]),s.name,name])];s.name=name;s.goal=num($('.goal-input',row).value);save();renderSubjects();renderForDate();toast('科目设置已保存');};
    $('.color-reset',row).onclick=()=>{s.color=null;save();renderSubjects();renderForDate();};$('.archive',row).onclick=()=>{s.archived=!s.archived;save();renderSubjects();renderForDate();};$('.delete',row).onclick=()=>{if(confirm(`删除科目“${s.name}”？历史任务和用时仍保留。`)){s.deleted=true;s.archived=true;save();renderSubjects();renderForDate();}};list.appendChild(row);
  });
}
const reviewForDate=()=>state.reviews[selectedDate]||{mood:'',score:7,win:'',block:'',tomorrow:'',knowledge:{}};
function updateReview(field,value){const r=reviewForDate();r[field]=value;state.reviews[selectedDate]=r;return save();}
function renderReview(){const r=reviewForDate();$$('#moodRow button').forEach(b=>b.classList.toggle('active',b.dataset.mood===r.mood));$$('.review-field').forEach(f=>f.value=r[f.dataset.field]||'');$('#scoreSlider').value=r.score;$('#scoreValue').textContent=r.score;
  const entries=new Map();activeSubjects().forEach(s=>{const key=Object.keys(r.knowledge||{}).find(k=>k===s.name||(s.aliases||[]).includes(k))||s.name;entries.set(s.id,{name:s.name,key});});
  Object.keys(r.knowledge||{}).forEach(key=>{const s=subjectFor({subject:key});entries.set(s?.id||key,{name:s?.name||key,key});});
  const box=$('#knowledgeSliders');box.innerHTML='';if(!entries.size)box.innerHTML='<p class="empty-state">添加学习科目后，在这里记录自己的掌握度。</p>';
  entries.forEach(({name,key})=>{const row=document.createElement('div');row.className='knowledge-row';const value=r.knowledge?.[key]??0;row.innerHTML=`<div><span>${esc(name)}</span><strong>${value}%</strong></div><input type="range" aria-label="${esc(name)}掌握度" min="0" max="100" step="10" value="${value}">`;const input=$('input',row);input.oninput=()=>{const record=reviewForDate();record.knowledge={...record.knowledge,[key]:Number(input.value)};state.reviews[selectedDate]=record;$('strong',row).textContent=`${input.value}%`;save();};box.appendChild(row);});
}
function renderMemos(){const query=$('#memoSearch').value.trim().toLowerCase(),notes=state.memos.filter(m=>(memoFilter==='all'||m.category===memoFilter)&&m.content.toLowerCase().includes(query)),grid=$('#memoGrid');grid.innerHTML='';if(!notes.length)grid.innerHTML='<div class="empty-memo">把一个念头，轻轻放在这里。<p>知识点、提醒、灵感，都有自己的位置。</p></div>';
  notes.sort((a,b)=>b.created-a.created).forEach(m=>{const card=document.createElement('article');card.className='memo-card';card.dataset.category=m.category;card.innerHTML=`<div class="memo-card-head"><span class="memo-category">${esc(m.category)}</span><div><button class="memo-edit text-button">编辑</button><button class="memo-delete" aria-label="删除便签">×</button></div></div><p>${esc(m.content)}</p><time>${new Date(m.created).toLocaleString('zh-CN',{month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'})}</time>`;$('.memo-delete',card).onclick=()=>{if(confirm('删除这张便签？')){state.memos=state.memos.filter(x=>x.id!==m.id);save();renderMemos();}};$('.memo-edit',card).onclick=()=>{$('#memoForm').dataset.editId=m.id;$('#memoContent').value=m.content;$('#memoCategory').value=m.category;$('#memoModal h3').textContent='编辑便签';openModal('memoModal');};grid.appendChild(card);});
}
const englishForDate=()=>state.english[selectedDate]||{wordsLearned:0,checks:{}};
function renderEnglish(){const e=englishForDate();$('#wordsLearned').textContent=e.wordsLearned||0;$$('[data-english-check]').forEach(c=>c.checked=!!e.checks?.[c.dataset.englishCheck]);const words=state.words[selectedDate]||[];$('#wordCount').textContent=`${words.length} 个词`;const list=$('#wordList');list.innerHTML='';if(!words.length)list.innerHTML='<div class="empty-state">今日生词本还是一张白纸，记下一个新发现吧。</div>';words.forEach(w=>{const item=document.createElement('div');item.className='word-item';item.innerHTML=`<div><strong>${esc(w.word)}</strong><small>${esc(w.meaning)}</small></div><button aria-label="删除生词 ${esc(w.word)}">×</button>`;$('button',item).onclick=()=>{state.words[selectedDate]=words.filter(x=>x.id!==w.id);save();renderEnglish();};list.appendChild(item);});$('#englishStreak').textContent=streak('english');}
function persistTimer(){state.timer={...timer};save();}
function updateTimer(){if(timer.running&&timer.endAt)timer.remaining=Math.max(0,Math.ceil((timer.endAt-Date.now())/1000));if(timer.running&&timer.remaining===0){timer.running=false;timer.endAt=null;persistTimer();toast('这一段专注已完成，给眼睛和自己一点休息。');}$('#bigTimer').textContent=[Math.floor(timer.remaining/3600),Math.floor(timer.remaining%3600/60),timer.remaining%60].map(n=>String(n).padStart(2,'0')).join(':');$('#timerProgress').style.width=`${(timer.total-timer.remaining)/timer.total*100}%`;$('#timerToggle').innerHTML=timer.running?'<span>Ⅱ</span> 暂停专注':timer.remaining===0?'<span>↻</span> 再次专注':'<span>▶</span> '+(timer.remaining===timer.total?'开始专注':'继续专注');}
function setTimer(minutes){timer={total:minutes*60,remaining:minutes*60,running:false,endAt:null};persistTimer();updateTimer();$$('.timer-presets button').forEach(b=>b.classList.toggle('active',Number(b.dataset.minutes)===minutes));}
function openModal(id){modalReturnFocus=document.activeElement;const el=$(`#${id}`);el.classList.add('open');el.setAttribute('aria-hidden','false');$('.modal-card',el).setAttribute('role','dialog');$('.modal-card',el).setAttribute('aria-modal','true');$('.modal-card',el).setAttribute('aria-label',$('h3',el).textContent);setTimeout(()=>{if(el.classList.contains('open'))$('input:not([type=hidden]),textarea,select,button',el)?.focus();},40);}
function closeModal(id){$(`#${id}`).classList.remove('open');$(`#${id}`).setAttribute('aria-hidden','true');modalReturnFocus?.focus();}
function closeSidebar(){const wasOpen=$('#sidebar').classList.contains('open');$('#sidebar').classList.remove('open');$('#sidebarMask').classList.remove('open');$('#menuButton').setAttribute('aria-expanded','false');if(wasOpen)$('#menuButton').focus();}
function switchPage(page){$$('.page').forEach(p=>p.classList.toggle('active',p.id===`page-${page}`));$$('.nav-item').forEach(n=>{n.classList.toggle('active',n.dataset.page===page);if(n.dataset.page===page)n.setAttribute('aria-current','page');else n.removeAttribute('aria-current');});closeSidebar();window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
function openGoals(){$('#examDateInput').value=state.examDate;$('#studyStartInput').value=state.goal.startDate;$('#schoolInput').value=state.goal.school;$('#majorInput').value=state.goal.major;$('#stageInput').value=state.goal.stage;openModal('goalModal');}
function exportData(){const blob=new Blob([JSON.stringify({format:'yanyouqi-backup',version:2,exportedAt:new Date().toISOString(),data:state},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`研有期-学习记录-${dateKey()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function validBackup(s){
  const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x),str=x=>typeof x==='string',id=x=>str(x)&&/^[\w-]+$/.test(x),nonnegative=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0,unique=xs=>new Set(xs.map(x=>x.id)).size===xs.length;
  return obj(s)&&['tasks','reviews','quickMemos','words','english'].every(k=>obj(s[k]))&&Array.isArray(s.memos)
    &&Object.values(s.tasks).every(ts=>Array.isArray(ts)&&unique(ts)&&ts.every(t=>obj(t)&&id(t.id)&&str(t.title)&&str(t.subject)&&str(t.period)&&nonnegative(t.duration)&&typeof t.done==='boolean'&&(t.actualDuration==null||nonnegative(t.actualDuration))&&(t.subjectId==null||id(t.subjectId))))
    &&Object.values(s.reviews).every(r=>obj(r)&&nonnegative(r.score)&&r.score<=10&&['win','block','tomorrow','mood'].every(k=>r[k]==null||str(r[k]))&&obj(r.knowledge)&&Object.values(r.knowledge).every(v=>nonnegative(v)&&v<=100))
    &&Object.values(s.quickMemos).every(str)&&Object.values(s.words).every(ws=>Array.isArray(ws)&&ws.every(w=>obj(w)&&id(w.id)&&str(w.word)&&str(w.meaning)))
    &&Object.values(s.english).every(e=>obj(e)&&nonnegative(e.wordsLearned)&&obj(e.checks)&&Object.values(e.checks).every(v=>typeof v==='boolean'))
    &&unique(s.memos)&&s.memos.every(m=>obj(m)&&id(m.id)&&str(m.content)&&['学习','提醒','灵感'].includes(m.category)&&nonnegative(m.created))
    &&(s.examDate==null||s.examDate===''||validDate(s.examDate))&&(s.theme==null||str(s.theme))
    &&(!s.subjects||Array.isArray(s.subjects)&&unique(s.subjects)&&s.subjects.every(x=>obj(x)&&id(x.id)&&str(x.name)&&nonnegative(x.goal)&&(x.color==null||/^#[\da-f]{6}$/i.test(x.color))&&(!x.aliases||Array.isArray(x.aliases)&&x.aliases.every(str))))
    &&(!s.goal||obj(s.goal)&&validDate(s.goal.startDate)&&['school','major','stage'].every(k=>str(s.goal[k])))
    &&(!s.timer||obj(s.timer)&&nonnegative(s.timer.total)&&s.timer.total>0&&nonnegative(s.timer.remaining)&&s.timer.remaining<=s.timer.total&&typeof s.timer.running==='boolean'&&(s.timer.endAt===null||nonnegative(s.timer.endAt)));
}
function bindEvents(){
  $$('.nav-item').forEach(b=>b.onclick=()=>switchPage(b.dataset.page));$$('[data-jump]').forEach(b=>b.onclick=()=>switchPage(b.dataset.jump));
  $('#menuButton').onclick=()=>{$('#sidebar').classList.add('open');$('#sidebarMask').classList.add('open');$('#menuButton').setAttribute('aria-expanded','true');$('#sidebarClose').focus();};$('#sidebarClose').onclick=$('#sidebarMask').onclick=closeSidebar;
  $('#collapseSidebar').onclick=()=>{state.collapsed=!state.collapsed;document.body.classList.toggle('sidebar-collapsed',state.collapsed);$('#collapseSidebar').setAttribute('aria-expanded',!state.collapsed);$('#collapseSidebar').setAttribute('aria-label',state.collapsed?'展开侧边栏':'折叠侧边栏');save();};
  $('#datePrev').onclick=()=>{dateAnchor.setDate(dateAnchor.getDate()-7);renderDateStrip();};$('#dateNext').onclick=()=>{dateAnchor.setDate(dateAnchor.getDate()+7);renderDateStrip();};$('#dateInput').onchange=e=>{if(validDate(e.target.value))selectDate(e.target.value);};$('#jumpToday').onclick=()=>selectDate(dateKey());
  $$('.filter-tabs button').forEach(b=>b.onclick=()=>{taskFilter=b.dataset.filter;$$('.filter-tabs button').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b);});renderTasks();});
  $('#addTaskTop').onclick=$('#addTaskInline').onclick=()=>openTask();$$('[data-close-modal]').forEach(b=>b.onclick=()=>closeModal(b.dataset.closeModal));
  $('#taskForm').onsubmit=e=>{e.preventDefault();const title=$('#taskTitle').value.trim();if(!title){toast('为任务起个名字吧');return;}const subject=state.subjects.find(s=>s.id===$('#taskSubject').value),id=e.target.dataset.editId,task={title,subject:subject?.name||'未分类',subjectId:subject?.id||null,duration:Number($('#taskDuration').value),period:$('#taskPeriod').value,priority:$('#taskPriority').value};if(id)Object.assign(getTasks().find(t=>t.id===id),task);else state.tasks[selectedDate]=[...getTasks(),{...task,id:uid(),done:false}];state.onboardingDone=true;save();closeModal('taskModal');renderForDate();renderDateStrip();toast(id?'任务已更新':'新的一步，已写入计划');};
  $('#actualForm').onsubmit=e=>{e.preventDefault();const t=getTasks().find(x=>x.id===actualTaskId);if(t){t.actualDuration=Number($('#actualDuration').value);save();renderForDate();}closeModal('actualModal');};
  $('#quickMemo').oninput=e=>{state.quickMemos[selectedDate]=e.target.value;$('#memoSaveHint').textContent=save()?'已自动保存':'尚未保存，请导出备份';};
  $('#editExamDate').onclick=$('#settingsButton').onclick=openGoals;
  $('#goalForm').onsubmit=e=>{e.preventDefault();const exam=$('#examDateInput').value,start=$('#studyStartInput').value;if(exam&&!validDate(exam)||!validDate(start)){toast('请填写有效日期');return;}if(exam&&start>exam){toast('备考起始日期不能晚于考试日期');return;}state.examDate=exam;state.goal={startDate:start,school:$('#schoolInput').value.trim(),major:$('#majorInput').value.trim(),stage:$('#stageInput').value};save();updateCountdown();closeModal('goalModal');toast('期待已记下，按自己的节奏靠近');};
  $('#themePicker').onclick=()=>openModal('themeModal');$('#themeToggle').onclick=()=>{state.dark=!state.dark;applyTheme();save();};
  $('#manageSubjects').onclick=()=>{renderSubjects();openModal('subjectModal');};$('#subjectForm').onsubmit=e=>{e.preventDefault();const name=$('#subjectName').value.trim();if(!name){toast('请填写科目名称');return;}if(state.subjects.some(s=>!s.deleted&&(s.name===name||(s.aliases||[]).includes(name)))){toast('科目已存在，可直接编辑或恢复');return;}state.subjects.push({id:uid(),name,goal:Number($('#subjectGoal').value),color:null,archived:false,aliases:[name]});save();e.target.reset();renderSubjects();renderForDate();toast('已创建学习科目');};
  $('#startBlank').onclick=()=>{state.onboardingDone=true;save();renderTasks();toast('这页空白，由你慢慢书写');};$('#useTemplate').onclick=useTemplate;$('#chartMode').onchange=renderDonut;
  $$('#moodRow button').forEach(b=>b.onclick=()=>{updateReview('mood',b.dataset.mood);renderReview();});$$('.review-field').forEach(f=>f.oninput=()=>{if(updateReview(f.dataset.field,f.value))$('#reviewSaveStatus').textContent='已自动保存';});$('#scoreSlider').oninput=e=>{updateReview('score',Number(e.target.value));$('#scoreValue').textContent=e.target.value;};$('#saveReview').onclick=()=>{state.reviews[selectedDate]=reviewForDate();if(save()){toast('今天的认真，已妥善收藏');$('#reviewSaveStatus').textContent='已保存当前日期的复盘';}};
  $('#copyReview').onclick=async()=>{const r=reviewForDate(),text=`【${selectedDate} 学习复盘】\n状态：${r.mood||'未选择'}｜评分：${r.score}/10\n做得最好：${r.win||'—'}\n遇到问题：${r.block||'—'}\n明日重点：${r.tomorrow||'—'}`;try{await navigator.clipboard.writeText(text);toast('复盘已复制');}catch{toast('浏览器未允许复制，可手动选中文字复制');}};
  $('#addMemo').onclick=()=>{$('#memoForm').reset();$('#memoForm').dataset.editId='';$('#memoModal h3').textContent='新建便签';openModal('memoModal');};$('#memoForm').onsubmit=e=>{e.preventDefault();const content=$('#memoContent').value.trim();if(!content)return;const id=e.target.dataset.editId;if(id)Object.assign(state.memos.find(m=>m.id===id),{content,category:$('#memoCategory').value});else state.memos.push({id:uid(),content,category:$('#memoCategory').value,created:Date.now()});save();closeModal('memoModal');renderMemos();toast('便签已保存');};$('#memoSearch').oninput=renderMemos;$$('[data-memo-filter]').forEach(b=>b.onclick=()=>{memoFilter=b.dataset.memoFilter;$$('[data-memo-filter]').forEach(x=>x.classList.toggle('active',x===b));renderMemos();});
  $('#timerToggle').onclick=()=>{updateTimer();if(timer.remaining===0)timer.remaining=timer.total;timer.running=!timer.running;timer.endAt=timer.running?Date.now()+timer.remaining*1000:null;persistTimer();updateTimer();};$('#timerReset').onclick=()=>setTimer(timer.total/60);$$('.timer-presets button').forEach(b=>b.onclick=()=>setTimer(Number(b.dataset.minutes)));
  $('#addWords').onclick=()=>{const e=englishForDate();e.wordsLearned=Math.min(999,num(e.wordsLearned)+10);state.english[selectedDate]=e;save();renderEnglish();};$$('[data-english-check]').forEach(c=>c.onchange=()=>{const e=englishForDate();e.checks={...e.checks,[c.dataset.englishCheck]:c.checked};state.english[selectedDate]=e;save();renderEnglish();});$('#wordForm').onsubmit=e=>{e.preventDefault();const word=$('#wordInput').value.trim(),meaning=$('#meaningInput').value.trim();if(!word||!meaning)return;state.words[selectedDate]=[...(state.words[selectedDate]||[]),{id:uid(),word,meaning}];save();e.target.reset();renderEnglish();};
  $('#exportData').onclick=exportData;$('#importData').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const parsed=JSON.parse(await file.text()),data=parsed.format==='yanyouqi-backup'?parsed.data:parsed;if(!validBackup(data))throw Error();if(!confirm('导入会替换当前学习记录，系统将先备份现有数据。是否继续？'))return;localStorage.setItem(`${STORAGE_KEY}-before-import`,JSON.stringify(state));state=prepareState(data);storageError='';if(save())location.reload();}catch{toast('导入失败，请选择完整的工作台 JSON 备份文件');}finally{e.target.value='';}};
  $('#resetData').onclick=()=>{if(confirm('重置全部记录？系统将先下载当前数据备份。')){exportData();localStorage.removeItem(STORAGE_KEY);location.reload();}};
  document.addEventListener('keydown',e=>{const modal=$('.modal.open');if(e.key==='Escape'){if(modal)closeModal(modal.id);else closeSidebar();}if(e.key==='Tab'){const scope=modal||($('#sidebar').classList.contains('open')?$('#sidebar'):null);if(!scope)return;const fs=$$('button,input:not([type=hidden]),textarea,select,[tabindex="0"]',scope).filter(el=>el.getClientRects().length&&!el.disabled),first=fs[0],last=fs.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}});
}
const ICONS={plan:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 11l2 2 4-4M9 17h6"/>',review:'<path d="M4 20h16M7 16v-5m5 5V6m5 10V3"/>',memo:'<path d="M14 4H5v16h14v-9M10 14l1-4 8-8 3 3-8 8-4 1Z"/>',english:'<path d="M12 5c-4-2-7-2-10-1v15c3-1 6-1 10 1m0-15c4-2 7-2 10-1v15c-3-1-6-1-10 1V5Z"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="m9 3 1-1h4l1 3 3 1 3 3-2 3 1 3-3 3-3-1-2 3-4-1-1-3-3-1-1-4 2-2V6l4-3Z"/>'};
function init(){
  $$('[data-icon]').forEach(el=>el.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[el.dataset.icon]}</svg>`);document.body.classList.toggle('sidebar-collapsed',state.collapsed);$('#collapseSidebar').setAttribute('aria-expanded',!state.collapsed);
  $$('.modal .icon-button').forEach(b=>b.setAttribute('aria-label','关闭对话框'));$$('.review-field').forEach(f=>f.setAttribute('aria-label',f.previousElementSibling.textContent));$('#scoreSlider').setAttribute('aria-label','今日学习评分');$('#memoSearch').setAttribute('aria-label','搜索便签');$('#wordInput').setAttribute('aria-label','英文生词');$('#meaningInput').setAttribute('aria-label','中文释义');$('#menuButton').setAttribute('aria-expanded','false');$('.nav-item.active').setAttribute('aria-current','page');
  bindEvents();renderThemes();applyTheme();updateDates();renderForDate();renderMemos();updateTimer();$$('.timer-presets button').forEach(b=>b.classList.toggle('active',Number(b.dataset.minutes)===timer.total/60));setInterval(updateTimer,1000);if(!storageError)save();else toast(storageError);
}
init();
