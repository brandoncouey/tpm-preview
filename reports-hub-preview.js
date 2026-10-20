/* Static Reports directory matching resources/js/pages/Reports.vue from TPM source.
 * Search, categories, legacy names, presets, and job validation run locally;
 * links intentionally target http://localhost:8000 (real TPM application).
 * Never fabricate report rows, metrics, employees, permissions or exports.
 */
(function(){
 'use strict';
 const origin='http://localhost:8000';
 const groups=[
  {key:'jobs',title:'Jobs & orders',question:'Where is a job, and what has the shop run?',label:'01',entries:[
   {title:'Order History',desc:'Every order with mill, customer, operator, inspector and dates. Narrow and total the records.',path:'/reports/order-history',former:['Mill Reports','Customer Reports','Mill Operator Reports','Mill Inspector Reports','Order Status'],presets:[
     ['Open orders','/reports/order-history?status=not_shipped&sort=customer'],
     ['In progress','/reports/order-history?status=has_started'],
     ['Shipped','/reports/order-history?status=has_shipped']
   ],note:'The In progress and Shipped presets may require a second narrowing filter in the real current code.'}
  ]},
  {key:'production',title:'Production',question:'What are the mills doing, and how did they do?',label:'02',entries:[
    {title:'Mill Performance',desc:'Compare mills over a selected range: tubes milled, scrap, timing, and who ran them.',path:'/reports/mill-performance',former:['Mill Reports']},
    {title:'Shop Timing',desc:'Setup, run and idle periods by day, week, and employee.',path:'/reports/shop-timing',former:['Mill Time']}
  ]},
  {key:'scrap',title:'Scrap',question:'What was scrapped, where, and how much?',label:'03',entries:[
    {title:'Scrap Events',desc:'Recorded scrap incidents with job, mill and person filters.',path:'/mill-management/scrap?view=events',former:[]},
    {title:'Tube Scrap Summary',desc:'Tube and legacy footage scrap rates over time, with PDF reporting.',path:'/mill-management/scrap?view=tube',former:['Scrap Report','Scrap Rate']},
    {title:'Mesh Scrap Summary',desc:'Mesh scrap totals by PO or period, with PDF reporting.',path:'/mill-management/scrap?view=mesh',former:[]}
  ]},
  {key:'people',title:'People',question:'Who ran what?',label:'04',entries:[
    {title:'Employee Report',desc:'Recorded production, mills, jobs, timing, inspection and scrap for a specific employee.',path:'/reports/employee',former:['Operator Report','Employee Production'],note:'The real TPM report has an employee picker with live employee IDs. This static preview cannot choose a real employee.'},
    {title:'Inspection Pass Rates',desc:'Compare inspectors and explore pass rate, failed tubes, reasons and jobs.',path:'/reports/inspection',former:[]},
    {title:'Training Report',desc:'See who was named on customer jobs as mill, cutoff, repair welder, or inspector.',path:'/reports/training',former:[],note:'This report uses order-named personnel, which may differ from individual tube attribution.'}
  ]},
  {key:'printouts',title:'Printouts & lists',question:'Something to print, or a list to check.',label:'05',entries:[
    {title:'Steel Receive Report',desc:'Review received coils and receiving records.',path:'/reports/steel-receive',former:[]},
    {title:'Audit Report',desc:'Coils chosen for audit, with available steel specifications.',path:'/reports/audit',former:[]},
    {title:'Standard Prices',desc:'Standard customer pricing by part.',path:'/reports/standard-prices',former:['Standard Prices Report']}
  ]}
 ];
 // PDF Generator is intentionally absent. Actual Reports.vue shows it to isAdmin users only.
 let active='all',query='',department='all';
 const departments=[
  {key:'all',title:'All teams'},
  {key:'orders',title:'Order desk'},
  {key:'production',title:'Production'},
  {key:'quality',title:'Quality'},
  {key:'materials',title:'Materials'},
  {key:'supervision',title:'Supervisors'},
  {key:'people',title:'People & training'}
 ];
 // These are suggested working areas, not role permissions or new report destinations.
 const reportAudiences={
   'Order History':['orders','supervision'],
   'Mill Performance':['production','supervision'],
   'Shop Timing':['production','supervision','people'],
   'Scrap Events':['quality','production','supervision'],
   'Tube Scrap Summary':['quality','supervision'],
   'Mesh Scrap Summary':['quality','materials'],
   'Employee Report':['people','supervision'],
   'Inspection Pass Rates':['quality','people'],
   'Training Report':['people'],
   'Steel Receive Report':['materials'],
   'Audit Report':['materials','quality'],
   'Standard Prices':['orders','supervision']
 };
 const reportLayoutLink={'Order History':'order-history','Shop Timing':'shop-timing'};
 const byId=id=>document.getElementById(id);
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function matchEntry(group,entry){
   const terms=query.toLowerCase().trim().split(/\s+/).filter(Boolean);
   const haystack=[entry.title,entry.desc,group.title,...(entry.former||[])].join(' ').toLowerCase();
   return (department==='all'||(reportAudiences[entry.title]||[]).includes(department))&&terms.every(term=>haystack.includes(term));
 }
 function matches(){return groups.map(g=>({...g,entries:g.entries.filter(e=>matchEntry(g,e))}));}
 const count=items=>items.reduce((n,g)=>n+g.entries.length,0);
 function renderDepartments(){
   const list=departments.map(d=>{
     const amount=groups.reduce((sum,g)=>sum+g.entries.filter(entry=>{
       const terms=query.toLowerCase().trim().split(/\s+/).filter(Boolean);
       const content=[entry.title,entry.desc,g.title,...(entry.former||[])].join(' ').toLowerCase();
       return (d.key==='all'||(reportAudiences[entry.title]||[]).includes(d.key))&&terms.every(word=>content.includes(word));
     }).length,0);
     return '<button type="button" data-reports-department="'+escape(d.key)+'" aria-pressed="'+(department===d.key)+'" '+(amount===0&&d.key!=='all'?'disabled':'')+'>'+escape(d.title)+' <span>'+amount+'</span></button>';
   }).join('');
   byId('reports-departments').innerHTML=list;
 }
 function renderTabs(filtered){
   const tabs=[{key:'all',title:'All reports',count:count(filtered)},...filtered.map(g=>({key:g.key,title:g.title,count:g.entries.length}))];
   byId('reports-tabs').innerHTML=tabs.map((t,i)=>
     '<button type="button" role="tab" data-reports-tab="'+escape(t.key)+'" aria-selected="'+(active===t.key)+'" aria-disabled="'+(t.count===0&&t.key!=='all')+'" '+
     (t.count===0&&t.key!=='all'?'disabled ':'')+'tabindex="'+(active===t.key?'0':'-1')+'">'+escape(t.title)+
     ' <span>'+t.count+'</span></button>'
   ).join('');
   byId('reports-side-groups').innerHTML=filtered.map(g=>
     '<button type="button" data-reports-tab="'+escape(g.key)+'" class="'+(active===g.key?'is-current':'')+'" '+(g.entries.length===0?'disabled':'')+
     '>'+escape(g.title)+' <span>'+g.entries.length+'</span></button>'
   ).join('');
 }
 function tile(entry){
   const href=origin+entry.path;
   return '<article class="reports-card"><div class="reports-card-top"><h3><a href="'+escape(href)+'" target="_blank" rel="noopener noreferrer">'+escape(entry.title)+' <span aria-hidden="true">↗</span></a></h3><span class="reports-card-context">IN LOCAL TPM</span></div>'+
     '<p>'+escape(entry.desc)+'</p>'+
     (reportLayoutLink[entry.title]?'<div class="reports-card-layout"><a href="./report-workspace-preview.html?report='+reportLayoutLink[entry.title]+'">Preview the report layout ↗</a><span>Design only</span></div>':'')+
     ((entry.former||[]).length?'<small class="reports-former">Previously: '+escape(entry.former.join(' · '))+'</small>':'')+
     (entry.note?'<small class="reports-card-note">'+escape(entry.note)+'</small>':'')+
     ((entry.presets||[]).length?'<div class="reports-card-presets"><span>Saved views</span><div>'+entry.presets.map(([title,path])=>
       '<a href="'+escape(origin+path)+'" target="_blank" rel="noopener noreferrer">'+escape(title)+' ↗</a>').join('')+'</div></div>':'')+
     '</article>';
 }
 function renderGroups(filtered){
   const visible=filtered.filter(g=>g.entries.length>0&&(active==='all'||active===g.key));
   const allCount=count(groups),shown=count(filtered);
   byId('reports-search-count').textContent=shown+' of '+allCount+' report destinations'+(query.trim()?' match':'');
   byId('reports-search-clear').hidden=!query;
   if(!visible.length){
     byId('reports-groups').innerHTML='<div class="reports-empty"><strong>No matching reports</strong><p>Try a keyword or select All teams to broaden the results.</p><button type="button" data-reports-clear>Clear search</button></div>';
     return;
   }
   byId('reports-groups').innerHTML=visible.map(g=>
     '<section class="reports-category" id="reports-group-'+escape(g.key)+'"><div class="reports-category-header">'+
     '<span class="reports-category-index">'+g.label+'</span><div><div class="reports-category-title"><h2>'+escape(g.title)+'</h2><span>'+g.entries.length+' '+(g.entries.length===1?'report':'reports')+'</span></div>'+
     '<p>'+escape(g.question)+'</p></div></div>'+
     '<div class="reports-grid">'+g.entries.map(tile).join('')+'</div>'+
     (g.key==='people'&&!query.trim()?'<div class="reports-people-note"><strong>Employee lookup lives in TPM.</strong> The live Reports page offers a searchable employee picker, based on real employee IDs and report availability. No employee list is invented in this prototype.</div>':'')+
     (g.key==='printouts'?'<div class="reports-people-note"><strong>PDF Generator:</strong> shown only to administrators in the real TPM Reports directory; it is not presented as a general-access tile here.</div>':'')+
     '</section>').join('');
 }
 function render(){
  const filtered=matches();
  renderDepartments();
  if(active!=='all'&&!filtered.some(g=>g.key===active&&g.entries.length))active='all';
  renderTabs(filtered);renderGroups(filtered);
 }
 const search=byId('reports-search');
 search.addEventListener('input',()=>{query=search.value;render()});
 byId('reports-search-clear').addEventListener('click',()=>{query='';search.value='';render();search.focus()});
 document.addEventListener('click',e=>{
  const team=e.target.closest('[data-reports-department]');
  if(team&&!team.disabled){department=team.dataset.reportsDepartment;active='all';render();return;}
  const b=e.target.closest('[data-reports-tab]');
  if(b&&!b.disabled){active=b.dataset.reportsTab;render();if(b.closest('.reports-tabs'))byId('reports-tabs').querySelector('[aria-selected="true"]')?.focus();return}
  if(e.target.closest('[data-reports-clear]')){query='';search.value='';active='all';department='all';render();search.focus();}
 });
 // Match the existing Vue report-tab arrow, Home/End behavior.
 byId('reports-tabs').addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
  const available=[...byId('reports-tabs').querySelectorAll('[role="tab"]:not(:disabled)')];
  const index=available.indexOf(document.activeElement);
  const target=e.key==='Home'?0:e.key==='End'?available.length-1:e.key==='ArrowRight'?(index+1)%available.length:(index-1+available.length)%available.length;
  if(available[target]){e.preventDefault();active=available[target].dataset.reportsTab;render();byId('reports-tabs').querySelector('[aria-selected="true"]')?.focus()}
 });
 const jobForm=byId('reports-open-job'),job=byId('reports-job-number'),help=byId('reports-job-help');
 job.addEventListener('input',()=>{help.classList.remove('is-error');help.textContent='Opens the real job hub on your local TPM server.'});
 jobForm.addEventListener('submit',e=>{
   e.preventDefault();
   const value=job.value.trim();
   if(!/^\d+$/.test(value)||value==='0'){
     help.classList.add('is-error');
     help.textContent=!value?'Type a job number to open.':'Job numbers use digits only, e.g. 9775.';
     job.focus();return;
   }
   window.open(origin+'/orders?job='+encodeURIComponent(value),'_blank','noopener,noreferrer');
 });
 render();
})();
