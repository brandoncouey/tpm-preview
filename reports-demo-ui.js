/* TPM Reports interactive ANALYTICS PREVIEW. No network, all figures fictional.
 * Table, comparisons, breakdown and chart are computed from the same sample rows.
 */
(function(){
'use strict';
const D=window.TPMSampleData;if(!D)return;
const fmt=(n,d=0)=>Number(n||0).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const format=(measure,v)=>measure[1]==='$/tube'?'$'+fmt(v,measure[3]):fmt(v,measure[3])+(measure[1]==='%'?'%':'');
const states={};
const start=id=>states[id]||(states[id]={grain:'week',question:0,mill:'all',person:'all',offset:0,focus:null,search:'',page:1,size:15});
function groups(s){
 const keys=D.periods(s.grain,s.offset);
 const first=D.iso(keys[0]),last=D.iso(D.addPeriod(keys[keys.length-1],s.grain,1));
 const source=D.rows.filter(row=>row.date>=first&&row.date<last&&(s.mill==='all'||row.mill===s.mill)&&
  (s.person==='all'||row.worker===s.person||row.inspector===s.person));
 const windows=keys.map(key=>{
  const from=D.iso(key),to=D.iso(D.addPeriod(key,s.grain,1));
  return {from,to,label:D.label(key,s.grain),rows:source.filter(r=>r.date>=from&&r.date<to)};
 });
 return {keys,windows,source};
}
function bars(windows,measure,selected){
 const values=windows.map(g=>measure[2](D.aggregate(g.rows)));
 const max=Math.max(1,...values);
 return '<div class="ra-chart" role="group" aria-label="Click a period to inspect its records">'+
  windows.map((w,i)=>{
   const h=Math.max(.6,values[i]/max*100);
   return '<button type="button" data-ra-bar="'+i+'" class="ra-bar-button'+(selected===i?' active':'')+'" aria-pressed="'+(selected===i)+'" title="'+esc(w.label+' — '+format(measure,values[i]))+'">'+
     '<span class="ra-bar-value">'+esc(format(measure,values[i]))+'</span><span class="ra-bar-track"><span class="ra-bar-fill" style="height:'+h+'%"></span></span>'+
     '<span class="ra-bar-label">'+esc(w.label)+'</span></button>';
  }).join('')+'</div>';
}
const card=(label,val,sub)=>'<article class="ra-metric"><span>'+esc(label)+'</span><strong>'+esc(val)+'</strong><small>'+esc(sub)+'</small></article>';
function render(report){
 const id=report.id,s=start(id),questions=D.questions[id]||D.questions['mill-performance'];
 s.question=Math.min(s.question,questions.length-1);
 const [question,metricId]=questions[s.question],m=D.metrics[metricId],g=groups(s);
 const len=g.windows.length,six=g.windows[len-1],prior=g.windows[len-2];
 const latest=D.aggregate(six.rows),previous=D.aggregate(prior.rows),whole=D.aggregate(g.source);
 const a=m[2](latest),b=m[2](previous);
 const change=m[1]==='%'||m[1]==='$/tube'?(a>=b?'+':'')+fmt(a-b,m[3])+(m[1]==='%'?' pp':' $/tube'):
   b?((a>=b?'+':'')+fmt((a-b)/Math.abs(b)*100,1)+'%'):'—';
 const focus=Math.max(0,Math.min(len-1,s.focus===null?len-1:s.focus)),selected=g.windows[focus];
 const today=selected.rows.filter(r=>{
  const term=s.search.trim().toLowerCase();
  return !term||[r.date,r.job,r.mill,r.worker,r.inspector,r.customer,r.reason].join(' ').toLowerCase().includes(term);
 }).sort((a,b)=>b.date.localeCompare(a.date)||b.job.localeCompare(a.job));
 const totalPages=Math.max(1,Math.ceil(today.length/s.size));s.page=Math.max(1,Math.min(s.page,totalPages));
 const detail=today.slice((s.page-1)*s.size,s.page*s.size);
 const divisions=new Map();
 for(const row of g.source){
  const division=id==='inspection'?row.inspector:['employee-report','training'].includes(id)?row.worker:row.mill;
  if(!divisions.has(division))divisions.set(division,[]);
  divisions.get(division).push(row);
 }
 const leaderboard=[...divisions].map(([name,rows])=>({name,val:m[2](D.aggregate(rows)),records:rows.length})).sort((a,b)=>b.val-a.val);
 const peopleOptions=D.people.map(p=>'<option value="'+esc(p)+'"'+(s.person===p?' selected':'')+'>'+esc(p)+'</option>').join('');
 const control='<div class="ra-control-grid">'+
  '<label class="ra-report-question">What do you want to know?<select data-ra-select="question">'+questions.map(([q],i)=>'<option value="'+i+'"'+(s.question===i?' selected':'')+'>'+esc(q)+'</option>').join('')+'</select></label>'+
  '<div class="ra-period-control"><strong>Compare</strong><div class="ra-granular" role="group" aria-label="Compare by time period">'+
  [['day','Day by day'],['week','Week by week'],['month','Month by month'],['quarter','Quarter by quarter']].map(([k,text])=>
    '<button type="button" data-ra-grain="'+k+'" aria-pressed="'+(s.grain===k)+'">'+text+'</button>').join('')+'</div></div>'+
  '<label>Mill<select data-ra-select="mill"><option value="all">All mills</option>'+D.mills.map(p=>'<option value="'+esc(p)+'"'+(s.mill===p?' selected':'')+'>'+esc(p)+'</option>').join('')+'</select></label>'+
  '<label>Employee / inspector<select data-ra-select="person"><option value="all">All employees</option>'+peopleOptions+'</select></label>'+
  '<div class="ra-window-buttons"><strong>Window</strong><div><button type="button" data-ra-offset="1">← Earlier</button><button type="button" data-ra-offset="-1"'+(s.offset===0?' disabled':'')+'>Later →</button><button type="button" data-ra-reset>Reset</button></div></div></div>';
 const range=D.label(g.keys[0],s.grain)+' to '+D.label(g.keys[len-1],s.grain);
 const kpis='<div class="ra-metrics" aria-label="Demo report key metrics">'+
  card(m[0],format(m,a),'Last complete '+s.grain+' · '+change+' vs previous')+
  card('Previous '+s.grain,format(m,b),prior.label)+
  card('Selected window',format(m,m[2](whole)),range)+
  card('Sample activity records',fmt(g.source.length),fmt(selected.rows.length)+' in selected period')+'</div>';
 const breakdown='<div class="ra-table-scroller" tabindex="0" role="region" aria-label="Performance breakdown"><table><thead><tr><th>Group</th><th>'+esc(m[0])+'</th><th>Records</th></tr></thead><tbody>'+
  leaderboard.map(x=>'<tr><td><strong>'+esc(x.name)+'</strong></td><td>'+esc(format(m,x.val))+'</td><td>'+fmt(x.records)+'</td></tr>').join('')+'</tbody></table></div>';
 const columns=['Date','Job','Mill','Operator','Inspector','Customer',m[0],'Scrap events'];
 const detailed='<div class="ra-table-scroller" tabindex="0" role="region" aria-label="Source-like fictional records"><table><thead><tr>'+
  columns.map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+
  (detail.length?detail.map(row=>'<tr><td>'+esc(row.date)+'</td><td><strong>'+esc(row.job)+'</strong></td><td>'+esc(row.mill)+'</td><td>'+esc(row.worker)+'</td><td>'+esc(row.inspector)+'</td><td>'+esc(row.customer)+'</td>'+
  '<td>'+esc(format(m,m[2](D.aggregate([row]))))+'</td><td>'+fmt(row.events)+'</td></tr>').join(''):
  '<tr><td colspan="'+columns.length+'">No records match this sample selection.</td></tr>')+'</tbody></table></div>';
 return '<div class="ra-dashboard" data-ra-root="'+esc(id)+'">'+
  '<div class="ra-disclaimer"><strong>FICTIONAL SAMPLE DATA</strong><span>'+fmt(D.rows.length)+' generated mill/day records from Jan 2025 through Oct 19, 2026. No live shop figures. Example rates are not production formulas.</span></div>'+
  '<section class="tab-panel"><div class="tab-panel-head"><div class="tab-panel-ident"><span class="tab-panel-icon">▤</span><div><h3>Run an example report</h3><p>Ask a real shop question and compare it across dates, mills and people.</p></div></div></div><div class="tab-panel-body">'+control+'</div></section>'+
  kpis+
  '<section class="tab-panel"><div class="tab-panel-head"><div class="tab-panel-ident"><span class="tab-panel-icon">↗</span><div><h3>'+esc(m[0])+' over time</h3><p>'+esc(question)+' · '+esc(range)+' · most recent completed '+esc(s.grain)+' periods</p></div></div></div>'+
  '<div class="tab-panel-body"><div class="ra-chart-head"><strong>'+esc(m[0])+'</strong><span>Select a bar to inspect sample records for that period</span></div>'+
  bars(g.windows,m,focus)+'<div class="ra-chart-foot">Selected: <strong>'+esc(selected.label)+'</strong> · '+fmt(selected.rows.length)+' source-like records</div></div></section>'+
  '<div class="ra-two-cols"><section class="tab-panel"><div class="tab-panel-head"><div class="tab-panel-ident"><span class="tab-panel-icon">▤</span><div><h3>Performance breakdown</h3><p>Grouped from the same filtered sample.</p></div></div></div><div class="tab-panel-body flush">'+breakdown+'</div></section>'+
  '<section class="tab-panel"><div class="tab-panel-head"><div class="tab-panel-ident"><span class="tab-panel-icon">✓</span><div><h3>Questions to investigate</h3><p>Choose another common report for this department.</p></div></div></div>'+
  '<div class="tab-panel-body ra-question-options">'+questions.map(([q],i)=>'<button data-ra-question="'+i+'" type="button"'+(s.question===i?' aria-current="true"':'')+'>'+esc(q)+' <span>↗</span></button>').join('')+'</div></section></div>'+
  '<section class="tab-panel"><div class="tab-panel-head"><div class="tab-panel-ident"><span class="tab-panel-icon">▤</span><div><h3>Detailed sample records</h3><p>Fictional job, customer, person and mill records for the selected chart period.</p></div></div><span class="tab-header-side">'+fmt(today.length)+' matching</span></div>'+
  '<div class="ra-table-toolbar"><label>Search records<input type="search" data-ra-search placeholder="Job, customer, mill, person…" value="'+esc(s.search)+'"></label>'+
  '<label>Page size<select data-ra-select="size">'+[10,15,25,50].map(x=>'<option value="'+x+'"'+(s.size===x?' selected':'')+'>'+x+'</option>').join('')+'</select></label></div>'+
  detailed+'<div class="ra-pagination"><span>Page '+s.page+' of '+totalPages+' · '+fmt(today.length)+' matching</span><div><button type="button" data-ra-page="-1"'+(s.page===1?' disabled':'')+'>← Previous</button>'+
  '<button type="button" data-ra-page="1"'+(s.page===totalPages?' disabled':'')+'>Next →</button></div></div></section>'+
  '<p class="tab-footline">Rates and trends here are demonstration calculations only. The real Laravel/Vue reports own historic attribution, scrap-rate definitions, employee permissions, shift timing, official data and exports.</p></div>';
}
function overview(){
 const keys=D.periods('week',0),first=D.iso(keys[0]),end=D.iso(D.addPeriod(keys[keys.length-1],'week',1));
 const rows=D.rows.filter(r=>r.date>=first&&r.date<end),a=D.aggregate(rows);
 return '<section class="ra-directory-pulse"><div><small>ILLUSTRATIVE SHOP PULSE · 12 COMPLETE WEEKS</small><strong>Explore reports with example activity</strong><p>Click a report below to compare day-by-day, weekly, monthly or quarterly patterns using the same fictional mill data.</p></div>'+
 '<div class="ra-pulse-values"><div><small>Produced tubes</small><strong>'+fmt(a.tubes)+'</strong></div><div><small>Scrap events</small><strong>'+fmt(a.events)+'</strong></div><div><small>Running hours</small><strong>'+fmt(a.run)+'</strong></div></div></section>';
}
function update(id,restoreSearch=false){
 const root=document.querySelector('[data-ra-root]');if(!root||root.dataset.raRoot!==id)return;
 root.outerHTML=render({id});
 if(restoreSearch){const e=document.querySelector('[data-ra-search]');e?.focus();e?.setSelectionRange(e.value.length,e.value.length);}
}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-ra-grain],[data-ra-offset],[data-ra-page],[data-ra-reset],[data-ra-question],[data-ra-bar]');
 if(!b)return;
 const root=b.closest('[data-ra-root]');if(!root)return;
 const id=root.dataset.raRoot,s=start(id);
 if(b.dataset.raGrain){s.grain=b.dataset.raGrain;s.offset=0;s.focus=null;s.page=1;}
 else if(b.hasAttribute('data-ra-offset')){s.offset=Math.min(25,Math.max(0,s.offset+Number(b.dataset.raOffset)));s.focus=null;s.page=1;}
 else if(b.hasAttribute('data-ra-page'))s.page+=Number(b.dataset.raPage);
 else if(b.hasAttribute('data-ra-question')){s.question=Number(b.dataset.raQuestion);s.page=1;}
 else if(b.hasAttribute('data-ra-bar')){s.focus=Number(b.dataset.raBar);s.page=1;}
 else if(b.hasAttribute('data-ra-reset'))states[id]={grain:'week',question:0,mill:'all',person:'all',offset:0,focus:null,search:'',page:1,size:15};
 update(id);
});
document.addEventListener('change',e=>{
 const control=e.target.closest('[data-ra-select]');if(!control)return;
 const root=control.closest('[data-ra-root]');if(!root)return;
 const id=root.dataset.raRoot,s=start(id),key=control.dataset.raSelect;
 s[key]=['size','question'].includes(key)?Number(control.value):control.value;
 s.page=1;s.focus=null;update(id);
});
document.addEventListener('input',e=>{
 if(!e.target.matches('[data-ra-search]'))return;
 const root=e.target.closest('[data-ra-root]');if(!root)return;
 const id=root.dataset.raRoot;safesearch(id,e.target.value);
});
function safesearch(id,value){const s=start(id);s.search=value;s.page=1;update(id,true);}
window.TPMDemoAnalytics={render,overview,rows:D.rows,metrics:D.metrics,groups,states};
})();