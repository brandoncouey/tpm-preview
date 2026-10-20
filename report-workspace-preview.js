/* Iteration 5 · Source-aligned presentation prototypes for two TPM reports.
 * No fake database records, PDF exports, or invented report results.
 * All live report filters and permissions stay in the Laravel/Vue report components.
 */
(function(){
 'use strict';
 const defs={
  'order-history':{
   eyebrow:'JOBS & ORDERS / ORDER DESK',name:'Order History',
   description:'Find the orders that need attention, track which mill handled them, and inspect the order-level people and dates.',
   audience:'Order desk · Supervisors',
   path:'/reports/order-history',
   tabs:[['queue','Order register'],['handoffs','Handoffs & checks'],['reference','Report definitions']],
   filters:[['Status',['All statuses','Open orders','In progress','Shipped']],['Mill',['All mills','Choose mill in live TPM']],['Date',['All dates','Use date filters in live TPM']]],
   headings:['Job #','Customer','Assigned mill','Order status','Operator','Inspector','Ordered','Due date','Shipped'],
   questions:[['Order desk','Which jobs are open, who owns them, and which dates need attention?'],['Shop supervisor','Which jobs have moved from open to production or shipment?'],['Quality','Where can I trace the inspector named on an order?']],
   note:'The archived Order History status-only presets for In progress and Shipped may need another filter under the existing controller validation. This layout does not silently rewrite that contract.',
   definitions:[['Job mill vs credited mill','An order’s current assigned mill is not necessarily the mill credited on historical tube events. Use Mill Performance for that attribution.'],['Open / started / shipped','Existing Order History statuses come from the real report. Any preset must retain the controller’s accepted query validation.'],['Report data','Customer, operator, inspector, mill, and dates are loaded by OrderHistory.vue and its service, not by this static preview.']]
  },
  'shop-timing':{
   eyebrow:'PRODUCTION / SUPERVISORS',name:'Shop Timing',
   description:'Review setup, run, and idle intervals by date and employee without confusing elapsed time with attended production time.',
   audience:'Mill leads · Supervisors · People',
   path:'/reports/shop-timing',
   tabs:[['queue','Time register'],['handoffs','Time definitions'],['reference','Implementation notes']],
   filters:[['Period',['Day','Week','Employee']],['Mill',['All mills','Choose mill in live TPM']],['Employee',['All employees','Choose employee in live TPM']]],
   headings:['Date / period','Mill','Employee','Setup','Run','Idle','Recorded activity'],
   questions:[['Mill lead','Which periods contain setup, production work or idle time?'],['Supervisor','Where do production gaps require investigation?'],['People team','Which employee is attributed to recorded mill activity?']],
   note:'Timing values are not calculated in the browser. Historical time reports use the existing MillTimeService; future shift-calendar behavior remains a separate decision.',
   definitions:[['Running','Gap-derived mill runtime uses the existing 20-minute idle threshold.'],['Attended','Gap-derived attended time uses the 270-minute threshold. It overlaps running time and should not be added to it.'],['Elapsed','Wall-clock span, including inactive periods; never label it as working hours.']]
  },
  'scrap-events':{
   eyebrow:'QUALITY / SCRAP INVESTIGATION',name:'Scrap Events',
   description:'Investigate where scrap was recorded, which job and station it relates to, and who was credited with the event.',
   audience:'Quality · Production · Supervisors',
   path:'/mill-management/scrap?view=events',
   tabs:[['queue','Event register'],['handoffs','Investigation workflow'],['reference','Scrap definitions']],
   filters:[['Scope',['All recorded events','Tube events','Mesh events']],['Station',['All stations','Choose station in live TPM']],['Period',['All available dates','Select period in live TPM']]],
   headings:['Event time','Job','Mill','Station','Person','Reason','Event count','Recorded loss'],
   questions:[['Quality','Where were exceptions recorded, and what reason was attributed?'],['Mill lead','Which stations recorded scrap against this job or time period?'],['Supervisors','Do event counts, distinct tubes and material loss tell different stories?']],
   note:'Scrap Events, Tube Scrap Summary, and Mesh Scrap Summary are separate live reports. The Q50 legacy footage-rate headline applies to Tube Scrap Summary; this event register must not silently compute or relabel it.',
   definitions:[['Events vs tubes','One tube may have multiple scrap events. Keep event count distinct from the number of affected tubes.'],['Loss vs rate','Recorded footage/weight loss is different from a scrap rate. Do not infer a rate from the unconnected preview.'],['Attribution','Use the event’s own job, mill, station and person data, rather than the job’s current assigned mill.']]
  },
  'steel-receive':{
   eyebrow:'MATERIALS / RECEIVING',name:'Steel Receive Report',
   description:'Review receiving records and trace received coils before they enter allocation or production workflows.',
   audience:'Materials · Receiving · Inventory',
   path:'/reports/steel-receive',
   tabs:[['queue','Receiving register'],['handoffs','Receiving checks'],['reference','Material definitions']],
   filters:[['Period',['All received dates','Set dates in live TPM']],['Record',['All receipts','Choose a coil in live TPM']],['Scope',['Received material','Review full report in TPM']]],
   headings:['Receiving record','Coil','Purchase order','Heat','Specification','Received date','Recorded quantity'],
   questions:[['Receiving','Which coils and documents were recorded as received?'],['Material allocation','Is a coil present in receiving before assigning it to an order?'],['Supervisors','Where should receiving discrepancies be traced?']],
   note:'Receiving, allocation and usage are separate source states. The report cannot prove a coil was consumed in production; that comes from actual usage history and the appropriate service.',
   definitions:[['Received','A receiving record is evidence of inventory intake; it is not a production completion event.'],['Allocated','Assigned to a job or use plan; allocation is not proof of footage consumed.'],['Used','Recorded material consumption belongs to job-level usage history and live source records.']]
  },
  'employee-report':{
   eyebrow:'PEOPLE / PRODUCTION ATTRIBUTION',name:'Employee Report',
   description:'Find source-attributed production, inspections, timing and scrap for a selected real employee.',
   audience:'People · Supervisors · Mill leads',
   path:'/reports/employee',
   tabs:[['queue','Employee register'],['handoffs','Attribution checks'],['reference','Employee definitions']],
   filters:[['Employee',['Choose employee in live TPM']],['Period',['All available dates','Set dates in live TPM']],['Scope',['All recorded activity','Production','Inspection','Scrap']]],
   headings:['Recorded date','Employee','Job','Mill','Station','Production credit','Inspection','Scrap'],
   questions:[['Supervisors','What work was attributed to the selected operator during this period?'],['People','Which person and station records support a training or performance conversation?'],['Quality','Were inspection and scrap events credited to the right worker?']],
   note:'The real Reports.vue employee picker looks up actual employee IDs. Do not invent identities or interpret a job assignment as an employee completing tube-stage work.',
   definitions:[['Assignment vs completed work','An operator assigned to a mill is not credited with tubes unless there are corresponding source events.'],['Inspector pass rate','Use inspector-attributed passed and failed tube events, not total job inspections divided by employee assignment.'],['Availability','The static preview cannot enumerate real employees or determine permissions; both stay in the original app.']]
  }
 };
 const param=new URLSearchParams(location.search);
 const selected=Object.prototype.hasOwnProperty.call(defs,param.get('report'))?param.get('report'):'order-history';
 const d=defs[selected],base='http://localhost:8000';
 const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const byId=id=>document.getElementById(id);
 let view='queue';
 const active='report-workspace-preview.html?report=';
 document.title='TPM · '+d.name+' · Design preview';
 byId('rwp-crumb').textContent=d.name;
 byId('rwp-hero').innerHTML='<div><span class="reports-eyebrow">'+safe(d.eyebrow)+'</span><h1>'+safe(d.name)+'</h1><p>'+safe(d.description)+'</p></div><span class="reports-hero-source">DESIGN PROTOTYPE · NO CONNECTED DATA</span>';
 byId('rwp-context').innerHTML='<div><strong>Built for</strong><span>'+safe(d.audience)+'</span></div><div><strong>Real report</strong><code>'+safe(d.path)+'</code></div><a href="'+base+d.path+'" target="_blank" rel="noopener noreferrer">Open live report ↗</a>';
 const switchLinks=Object.entries(defs).map(([key,val])=>'<a href="'+active+key+'" '+(key===selected?'aria-current="page"':'')+'>'+safe(val.name)+'</a>').join('');
 byId('rwp-switch').innerHTML=switchLinks;
 byId('rwp-switch-top').innerHTML=switchLinks;
 byId('rwp-filters').innerHTML=d.filters.map(([label,options],i)=>'<label>'+safe(label)+'<select data-rwp-filter="'+i+'">'+options.map(opt=>'<option>'+safe(opt)+'</option>').join('')+'</select></label>').join('')+
  '<div class="rwp-filter-actions"><button type="button" id="rwp-reset">Reset filters</button><a href="'+base+d.path+'" target="_blank" rel="noopener noreferrer">Open actual filters ↗</a></div>';
 const warning=()=>'<div class="rwp-preview-notice" role="status"><strong>No data is being generated for this preview.</strong><span>The selectors illustrate the intended layout only. Use the live TPM report for database-backed filtering, real totals, and exports.</span></div>';
 function draw(){
  byId('rwp-tabs').innerHTML=d.tabs.map(([id,title])=>'<button role="tab" type="button" tabindex="'+(id===view?'0':'-1')+'" aria-selected="'+(id===view)+'" data-rwp-tab="'+id+'">'+safe(title)+'</button>').join('');
  let body;
  if(view==='queue'){
   body='<div class="rwp-card"><div class="rwp-card-head"><div><h2>'+safe(d.name)+' register</h2><p>Source-controlled records appear here after connecting the real Vue report.</p></div><span>READ ONLY DESIGN</span></div>'+
    '<div class="rwp-table-scroll" role="region" tabindex="0" aria-label="'+safe(d.name)+' table layout"><table><thead><tr>'+d.headings.map(h=>'<th scope="col">'+safe(h)+'</th>').join('')+'</tr></thead>'+
    '<tbody><tr><td colspan="'+d.headings.length+'"><div class="rwp-empty"><strong>Open the report in TPM to see records</strong><p>This public prototype is not connected to customer orders, employees, jobs, or shop timing. Nothing shown here should be interpreted as zero production.</p><a href="'+base+d.path+'" target="_blank" rel="noopener noreferrer">Go to the actual report ↗</a></div></td></tr></tbody></table></div>'+
    '<footer class="rwp-table-foot">Filter results, pagination and exports remain in the existing Vue report. Do not infer missing data from this empty design.</footer></div>';
  }else if(view==='handoffs'){
    body='<section class="rwp-card"><div class="rwp-card-head"><div><h2>'+safe(d.tabs[1][1])+'</h2><p>Different teams should see the questions and definitions that matter to their workflow.</p></div></div><div class="rwp-question-grid">'+d.questions.map(([title,description])=>'<article><strong>'+safe(title)+'</strong><p>'+safe(description)+'</p></article>').join('')+'</div></section>';
  }else{
    body='<section class="rwp-card"><div class="rwp-card-head"><div><h2>'+safe(d.tabs[2][1])+'</h2><p>Definitions to retain when the presentation is merged into the actual report.</p></div></div><div class="rwp-definition-list">'+d.definitions.map(([name,meaning])=>'<div><strong>'+safe(name)+'</strong><p>'+safe(meaning)+'</p></div>').join('')+'</div></section>';
  }
  byId('rwp-body').innerHTML=warning()+body+'<aside class="rwp-source-note"><strong>Source parity note</strong><p>'+safe(d.note)+'</p></aside>';
 }
 draw();
 byId('rwp-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-rwp-tab]');if(b){view=b.dataset.rwpTab;draw();}});
 byId('rwp-tabs').addEventListener('keydown',e=>{
   if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;
   const keys=d.tabs.map(([k])=>k),idx=keys.indexOf(view);
   const next=e.key==='Home'?0:e.key==='End'?keys.length-1:e.key==='ArrowRight'?(idx+1)%keys.length:(idx-1+keys.length)%keys.length;
   view=keys[next];draw();byId('rwp-tabs').querySelector('[aria-selected="true"]')?.focus();e.preventDefault();
 });
 byId('rwp-reset').addEventListener('click',()=>byId('rwp-filters').querySelectorAll('select').forEach(el=>el.selectedIndex=0));
})();