/* TPM History preview iteration 2 — presentation aligned with real JobHistoryTab.vue.
 * JobJourney + JobKeyEvents always visible; Complete activity opt-in like real Vue.
 * Sample tube records are not a full backend report. No synthetic rows or fake exports.
 */
(function(){
 'use strict';
 if(typeof renderers==='undefined'||!renderers.C)return;
 const state={complete:false,query:'',category:'all',tubeQuery:''};
 const safe=v=>String(v===null||v===undefined?'—':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const n=v=>v===null||v===undefined?'—':Number(v).toLocaleString('en-US');
 const time=v=>v?stamp(v):'Not recorded';
 const evType=e=>e.type==='scrap'?'scrap':e.type==='production'?'production':'milestone';
 const groups=()=>Array.isArray(ke.groups)?ke.groups:[];
 const journey=()=>Array.isArray(ke.journey)?ke.journey:[];
 const groupList=()=>{
   const q=state.query.trim().toLowerCase().split(/\s+/).filter(Boolean);
   return groups().filter(e=>(state.category==='all'||evType(e)===state.category)&&
     q.every(word=>[e.title,e.reason,e.stage_label,e.type,e.first_at,e.last_at].join(' ').toLowerCase().includes(word)));
 };
 const tubeList=()=>{
   const records=Array.isArray(m.tube_data)?m.tube_data:[];
   const query=state.tubeQuery.trim().toLowerCase();
   return records.filter(x=>!query||[x.id,x.coil,x.mill_time,x.cutoff_time,x.insp_time].some(y=>String(y??'').toLowerCase().includes(query)));
 };
 const previewStatus=x=>x===1||x==='1'||x===true?'Recorded':'Not recorded';
 const facts=()=> {
   const done=journey().filter(e=>e.state==='done').length,pending=journey().filter(e=>e.state!=='done').length;
   const scrap=groups().filter(e=>e.type==='scrap').length;
   const latest=groups().map(e=>e.last_at).filter(Boolean).sort((a,b)=>new Date(b)-new Date(a))[0];
   return [['Recorded milestones',n(done),n(pending)+' pending'],
     ['Event groups',n(groups().length),'Grouped, not individual tube logs'],
     ['Scrap groups',n(scrap),'Not the count of scraped tubes'],
     ['Last recorded activity',latest?time(latest):'—','Source group timestamp']];
 };
 const section=(title,subtitle,inner,side='')=>'<section class="history-v2-panel"><header class="history-v2-panel-head"><div><h2>'+safe(title)+'</h2><p>'+safe(subtitle)+'</p></div>'+side+'</header>'+inner+'</section>';
 function journeyView(){
   const rows=journey();
   return section('Job journey','Milestones are marked complete only when the source records completion.',
     '<ol class="history-v2-journey">'+rows.map((step,i)=>{
       const done=step.state==='done';
       return '<li class="'+(done?'is-complete':'is-pending')+'"><span class="history-v2-step">'+(done?'✓':String(i+1))+'</span>'+
       '<div><strong>'+safe(step.label||'Job milestone')+'</strong><p>'+safe(step.detail||'Awaiting recorded milestone')+'</p></div>'+
       '<time>'+safe(step.at?time(step.at):'Pending')+'</time></li>';
     }).join('')+'</ol>',
     '<span class="history-v2-panel-count">'+n(rows.length)+' recorded stages</span>');
 }
 function digestRows(){
   const results=groupList();
   return '<div class="history-v2-event-list">'+(results.length?results.map(e=>{
     const kind=evType(e),name=kind==='scrap'?'Scrap / quality':kind==='production'?'Production':'Order milestone';
     return '<div class="history-v2-event history-v2-'+kind+'"><span class="history-v2-event-mark">'+(kind==='scrap'?'!':kind==='production'?'✓':'•')+'</span>'+
        '<div class="history-v2-event-main"><div><span class="history-v2-tag">'+name+'</span><strong>'+safe(e.title)+'</strong></div>'+
        '<p>'+safe(e.stage_label||'Order')+' · '+n(e.events)+' recorded '+(e.events===1?'event':'events')+
        (e.distinct_tubes!=null?' · '+n(e.distinct_tubes)+' distinct tubes':'')+
        (e.reason?' · '+safe(e.reason):'')+
        (e.lost_steel_lf!=null?' · '+n(e.lost_steel_lf)+' LF steel lost':'')+'</p></div>'+
        '<time>'+safe(time(e.last_at))+'</time></div>';
   }).join(''):'<div class="history-v2-empty">No source groups match these filters. Clear the search to see the recorded events.</div>')+'</div>'+
    '<div class="history-v2-event-foot">Showing '+n(results.length)+' of '+n(groups().length)+' source groups. These are aggregates, not the complete event feed.</div>';
 }
 function digestView(){
   return section('Key events & issues','Production batches, scrap and important office milestones, grouped for faster review.',
     '<div class="history-v2-filters"><label>Search the activity digest<input type="search" data-history-search placeholder="Search station, reason or event…" value="'+safe(state.query)+'" autocomplete="off"></label>'+
     '<label>Event type<select data-history-filter>'+
      [['all','All events'],['production','Production'],['scrap','Scrap / quality'],['milestone','Milestones']].map(([value,label])=>'<option value="'+value+'"'+(state.category===value?' selected':'')+'>'+label+'</option>').join('')+
     '</select></label></div><div id="history-v2-digest-results">'+digestRows()+'</div>',
     '<span class="history-v2-panel-count">'+n(groups().length)+' groups</span>');
 }
 const table=(cols,rows,empty)=>{
   return '<div class="history-v2-table-wrap" role="region" tabindex="0" aria-label="Scrollable source data"><table><thead><tr>'+
      cols.map(c=>'<th>'+safe(c)+'</th>').join('')+'</tr></thead><tbody>'+
      (rows.length?rows.map(row=>'<tr>'+row.map(v=>'<td>'+safe(v)+'</td>').join('')+'</tr>').join(''):
      '<tr><td colspan="'+cols.length+'" class="history-v2-cell-empty">'+safe(empty)+'</td></tr>')+
      '</tbody></table></div>';
 };
 function completeTubes(){
   const rows=tubeList();
   return '<div class="history-v2-subsection"><header><div><h3>Tube timeline · sampled source</h3><p>These are the '+n(m.tube_data?.length||0)+' tube snapshots supplied with the preview. The real app loads all job tube records only on demand.</p></div>'+
   '<label>Search sampled tubes<input type="search" data-history-tube-query placeholder="Tube or coil…" value="'+safe(state.tubeQuery)+'"></label></header>'+
   '<div id="history-v2-tubes">'+table(['Tube ID','Coil','Mill check','Mill time','Cutoff check','Cutoff time','Inspection check','Inspection time'],
     rows.map(row=>[row.id,row.coil,previewStatus(row.mill_check),time(row.mill_time),previewStatus(row.cutoff_check),time(row.cutoff_time),previewStatus(row.insp_check),time(row.insp_time)]),
     'No sampled tubes match the search.')+'</div></div>';
 }
 function completeView(){
   if(!state.complete)return '<div class="history-v2-closed">The full activity feed and per-tube tables are intentionally loaded on request in the real application, particularly for large jobs. Open below to inspect the available static preview records.</div>';
   const historyJob=j;
   const general=table(['Job','Customer','Part','Ordered','Due','Assigned mill','Quantity'],
     [[String(historyJob.job),historyJob.customer_name,historyJob.part,historyJob.ordered,historyJob.due,historyJob.device,n(historyJob.quantity)]],'No order details');
   const mesh=(m.allocated_mesh||[]);
   const meshSummary='<div class="history-v2-not-recorded"><strong>Mesh timeline not supplied</strong><p>'+n(mesh.length)+' mesh roll(s) allocated in the snapshot, but roll processing start/end times are not supplied. The real application has a separate mesh timeline — allocation is not proof of use or completion.</p></div>';
   const lost=groups().filter(g=>g.type==='scrap');
   const scrapEvents=table(['Source group','Station','Reason','Events','Distinct tubes','Last event','Steel LF'],lost.map(e=>[e.title,e.stage_label,e.reason,n(e.events),n(e.distinct_tubes),time(e.last_at),e.lost_steel_lf==null?'Not recorded':n(e.lost_steel_lf)]),'No grouped scrap events in snapshot.');
   const totals=(h.people||[]).flatMap(p=>(p.departments||[]).flatMap(d=>(d.sessions||[]).map(sess=>[p.person,d.name,time(sess.from),time(sess.to),n(sess.tubes),sess.seconds==null?'Not recorded':dur(sess.seconds)])));
   return '<div class="history-v2-complete-inner">'+
     '<div class="history-v2-export-note"><strong>Full CSV · Excel · Print remain in TPM.</strong> They belong to <code>JobTubeTables.vue</code> and are intentionally not simulated or exported from five sampled rows here.</div>'+
     '<div class="history-v2-subsection"><header><div><h3>Activity feed · sampled sessions</h3><p>'+n(totals.length)+' worker-session intervals are supplied; this is not the full event feed.</p></div></header>'+
       table(['Worker','Station','Started','Finished','Tube-stage credits','Recorded time'],totals,'No source sessions supplied.')+'</div>'+
     '<div class="history-v2-subsection"><header><div><h3>General information</h3><p>Job identity and scheduled order dates.</p></div></header>'+general+'</div>'+
     '<div class="history-v2-subsection"><header><div><h3>Mesh timeline</h3><p>The real History tab retains this section even if there are no source rows.</p></div></header>'+meshSummary+'</div>'+
     '<div class="history-v2-subsection"><header><div><h3>Scrap timeline · grouped source</h3><p>Not raw per-scrap records; inspect the Scrap tab for the job-level details.</p></div></header>'+scrapEvents+'</div>'+
     completeTubes()+
     '<p class="history-v2-source-note">In Laravel, this disclosure mounts the existing <code>JobHistoryFeed</code> and <code>JobTubeTables</code> lazily and preserves their server pagination, retry states, four tables, CSV, Excel and Print. This GitHub Pages view is only a source-limited presentation sample.</p>'+
     '</div>';
 }
 function fullActivityView(){
   return section('Complete activity','View the deeper history, employee sessions and source tube data only when needed.',
     '<div class="history-v2-complete-actions"><button type="button" class="history-v2-primary" data-history-toggle aria-expanded="'+state.complete+'" aria-controls="history-v2-complete-body">'+
     (state.complete?'Hide complete activity':'View complete activity')+' <span aria-hidden="true">'+(state.complete?'⌃':'⌄')+'</span></button>'+
     '<span>Original Vue loads the heavy records on first opening, then keeps them mounted.</span></div>'+
     '<div id="history-v2-complete-body">'+completeView()+'</div>');
 }
 function historyHtml(){
   const recent=facts();
   return '<div class="tab-workspace history-parity-v2">'+
     '<div class="history-v2-hero"><span class="history-v2-overline">ORDER HISTORY / JOB #'+safe(j.job)+'</span><h1>Job history & milestones</h1>'+
      '<p>Know where the job stands, see the important exceptions, and open full activity when investigating specific tubes or workers.</p>'+
      '<div class="history-v2-hero-actions"><button data-route="production" type="button">Production overview ↗</button><button data-route="scrap" type="button">Scrap & quality ↗</button><button data-route="report" type="button">Job report ↗</button></div></div>'+
     '<section class="history-v2-facts" aria-label="Recorded history totals">'+recent.map(([label,value,desc])=>
       '<div><span>'+safe(label)+'</span><strong>'+safe(value)+'</strong><small>'+safe(desc)+'</small></div>').join('')+'</section>'+
     journeyView()+digestView()+fullActivityView()+
     '<p class="history-v2-bottom-note">All figures come from the static sample #'+safe(j.job)+'. There are no fabricated production or scrap entries. The production application remains the system of record.</p></div>';
 }
 function redraw(){const view=document.getElementById('view');if(!view)return;const current=window.scrollY;view.innerHTML=historyHtml();window.scrollTo({top:current,behavior:'instant'});}
 renderers.C.history=historyHtml;
 document.addEventListener('click',e=>{
   const toggle=e.target.closest('[data-history-toggle]');if(!toggle)return;
   e.preventDefault();e.stopImmediatePropagation();
   state.complete=!state.complete;redraw();
 },true);
 document.addEventListener('input',e=>{
   const search=e.target.closest('[data-history-search], [data-history-tube-query]');
   if(!search)return;
   const isTube=search.hasAttribute('data-history-tube-query');
   if(isTube){state.tubeQuery=search.value;const region=document.getElementById('history-v2-tubes');if(region){
     const rows=tubeList();region.innerHTML=table(['Tube ID','Coil','Mill check','Mill time','Cutoff check','Cutoff time','Inspection check','Inspection time'],
       rows.map(row=>[row.id,row.coil,previewStatus(row.mill_check),time(row.mill_time),previewStatus(row.cutoff_check),time(row.cutoff_time),previewStatus(row.insp_check),time(row.insp_time)]),'No sampled tubes match the search.');}
   }else{state.query=search.value;const region=document.getElementById('history-v2-digest-results');if(region)region.innerHTML=digestRows();}
 },true);
 document.addEventListener('change',e=>{
  const filter=e.target.closest('[data-history-filter]');if(!filter)return;
  state.category=filter.value;const region=document.getElementById('history-v2-digest-results');if(region)region.innerHTML=digestRows();
 },true);
 if(new URLSearchParams(location.search).get('view')==='history' && typeof navigate==='function')navigate('history');
})();
