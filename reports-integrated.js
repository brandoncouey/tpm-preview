/* TPM integrated Reports — extends the existing overview-ops.html shell.
 * All presentation uses the same tabIntro / tabPanel shared by the production views.
 * Real report endpoints, data loaders, permissions and exports remain in Laravel/Vue.
 */
(function () {
  'use strict';
  if (typeof renderers === 'undefined' || !renderers.C || typeof navigate !== 'function') return;

  const origin = 'http://localhost:8000';
  const reports = [
    {id:'order-history',title:'Order History',category:'Jobs & orders',description:'Find orders by status, customer, mill and dates.',path:'/reports/order-history',filters:['Order status','Customer / mill','Date range'],headers:['Job #','Customer','Assigned mill','Status','Operator','Inspector','Ordered','Due','Shipped'],uses:['Order desk: find open jobs and deadlines.','Supervisors: review started and shipped work.','Quality: trace the inspector named on an order.'],definition:'Current job mill does not replace historical per-tube mill attribution. Some status presets require additional narrowing.'},
    {id:'mill-performance',title:'Mill Performance',category:'Production',description:'Compare mill output, scrap and time across a period.',path:'/reports/mill-performance',filters:['Mill','Period'],headers:['Mill','Period','Tubes','Recorded scrap','Timing'],uses:['Supervisors: compare output between mills.','Production leads: review work attributed to each mill.'],definition:'The production mill credited to each tube may differ from the job’s current mill assignment.'},
    {id:'shop-timing',title:'Shop Timing',category:'Production',description:'Review setup, running and idle time by period and employee.',path:'/reports/shop-timing',filters:['Period','Mill','Employee'],headers:['Period','Mill','Employee','Setup','Running','Idle'],uses:['Mill leads: inspect production and idle periods.','Supervisors: compare work across periods.','People: review source-attributed employee timing.'],definition:'Running uses the existing 20-minute gap threshold; attended uses 270 minutes and overlaps running. Elapsed is wall-clock time.'},
    {id:'scrap-events',title:'Scrap Events',category:'Scrap & quality',description:'Investigate recorded scrap by job, station, mill and reason.',path:'/mill-management/scrap?view=events',filters:['Period','Job','Station / mill'],headers:['Recorded at','Job','Mill','Station','Reason','Event','Loss'],uses:['Quality: investigate the source of exceptions.','Production: find the station where scrap occurred.','Supervisors: trace scrap back to recorded source events.'],definition:'Event count, distinct scrapped tubes and lost footage are different values. Do not interchange them.'},
    {id:'tube-scrap',title:'Tube Scrap Summary',category:'Scrap & quality',description:'Review tube and legacy footage scrap rates over time.',path:'/mill-management/scrap?view=tube',filters:['Period','Mill'],headers:['Period','Mill','Tube scrap','Footage lost','Rate'],uses:['Quality: review tube scrap patterns.','Supervisors: compare scrap over selected periods.'],definition:'Keep the existing legacy footage-rate headline selected for Q50; do not swap in the job-level tube-attempt rate.'},
    {id:'mesh-scrap',title:'Mesh Scrap Summary',category:'Scrap & quality',description:'Review recorded mesh scrap by PO and period.',path:'/mill-management/scrap?view=mesh',filters:['Purchase order','Period'],headers:['PO','Period','Recorded mesh scrap'],uses:['Quality: investigate mesh exceptions.','Materials: connect mesh scrap with PO records.'],definition:'Mesh allocations are not evidence of completed processing or consumed rolls.'},
    {id:'employee-report',title:'Employee Report',category:'People',description:'Review production and related activity attributed to an employee.',path:'/reports/employee',filters:['Employee','Period'],headers:['Employee','Period','Mill','Job','Production credit','Inspection','Scrap'],uses:['Supervisors: review credited production.','People: review employee-related shop activity.','Quality: trace inspection and scrap attribution.'],definition:'Use the live employee picker and real worker event attribution. Assignment alone is not completed production.'},
    {id:'inspection',title:'Inspection Pass Rates',category:'People',description:'Compare inspector-attributed passes and failures.',path:'/reports/inspection',filters:['Inspector','Period'],headers:['Inspector','Checked tubes','Passed','Failed','Reasons'],uses:['Quality: review inspection pass rates.','Supervisors: investigate reasons for failed checks.'],definition:'Inspector attribution is based on individual recorded events, not the job’s overall inspection count.'},
    {id:'training',title:'Training Report',category:'People',description:'Review personnel named on jobs for each work role.',path:'/reports/training',filters:['Employee','Period'],headers:['Employee','Job','Named role','Customer'],uses:['People: review role exposure across jobs.','Supervisors: validate named role history.'],definition:'Personnel named on an order can differ from employee-level tube completion credit.'},
    {id:'steel-receive',title:'Steel Receive Report',category:'Printouts & lists',description:'Review coil receiving records and available received steel.',path:'/reports/steel-receive',filters:['Receiving period','Coil / PO'],headers:['Receiving record','Coil','Heat','Specification','Received date','Quantity'],uses:['Receiving: review intake records.','Materials: trace coil availability before allocation.'],definition:'Receiving, allocation and production consumption are separate stages. Do not infer that received material was used.'},
    {id:'audit',title:'Audit Report',category:'Printouts & lists',description:'Review selected coils and their available steel specifications.',path:'/reports/audit',filters:['Audit selection'],headers:['Coil','Specification','Audit record'],uses:['Quality: inspect the selected coil audit information.','Materials: trace coil identifiers.'],definition:'Use the original audit report and its existing selection logic.'},
    {id:'standard-prices',title:'Standard Prices',category:'Printouts & lists',description:'Review standard customer prices for parts.',path:'/reports/standard-prices',filters:['Customer / part'],headers:['Customer','Part','Standard price'],uses:['Order desk: reference standard pricing.'],definition:'Customer and part pricing is supplied by the actual report, not by this public prototype.'}
  ];
  const order=['Jobs & orders','Production','Scrap & quality','People','Printouts & lists'];
  const byId = id => reports.find(r=>r.id===id);
  const esc = value => safe(value);
  const state={active:'reports'};
  const crumbs=document.querySelector('.c-crumbs');
  const previewFlag=document.querySelector('.mock-note');
  const originalCrumbs=crumbs?.innerHTML||'';
  const originalFlag=previewFlag?.innerHTML||'';

  const pageButton = r => '<button type="button" class="tpm-ir-item" data-report-page="'+esc(r.id)+'" data-ir-item data-ir-category="'+esc(r.category)+'">'+
    '<span class="tpm-ir-icon" aria-hidden="true">▤</span><span class="tpm-ir-item-copy"><strong>'+esc(r.title)+'</strong><small>'+esc(r.description)+'</small></span>'+
    '<span class="tpm-ir-item-next" aria-hidden="true">›</span></button>';

  function directory() {
    const sections=order.map((category,i)=>{
      const entries=reports.filter(r=>r.category===category);
      return '<div data-ir-section class="tpm-ir-section">'+
        tabPanel('side-bars',category,entries.length+' existing '+(entries.length===1?'report':'reports')+
          ' · select a report to view its layout.',
          '<div class="tpm-ir-list">'+entries.map(pageButton).join('')+'</div>',
          {flush:true,right:String(i+1).padStart(2,'0')})+'</div>';
    }).join('');
    return '<div class="tab-workspace tpm-integrated-reports">'+
      tabIntro('Reports / Shop-wide','Reports','Select an existing report. All new layouts share the original Orders and Production navigation and panel styling.','12 report destinations')+
      '<div class="tpm-ir-tools"><label for="tpm-ir-search">Find a report</label><input id="tpm-ir-search" type="search" placeholder="Search order, mill, timing, scrap, employee…" autocomplete="off"><span id="tpm-ir-count" role="status" aria-live="polite">12 reports</span></div>'+
      '<div class="tpm-ir-sections">'+sections+'</div>'+
      '<p class="tab-footline">This preview extends the original TPM shell. Actual shop-wide report rows, calculations, permissions and exports are only available in your Laravel/Vue application.</p>'+
    '</div>';
  }
  function reportPage(){
    const id=new URLSearchParams(location.search).get('report');
    const r=byId(id)||reports[0];
    const defs='<div class="tpm-ir-definition-grid">'+r.uses.map(x=>'<div><span aria-hidden="true">✓</span><p>'+esc(x)+'</p></div>').join('')+'</div>';
    const filterText='<div class="tpm-ir-filter-guide">'+r.filters.map(label=>'<span>'+esc(label)+'</span>').join('')+
      '</div><p class="tpm-ir-small">The original '+esc(r.title)+' Vue report supplies the real filter controls. No unrelated or nonfunctional mock filters have been added.</p>';
    const headers=r.headers.map(h=>'<th scope="col">'+esc(h)+'</th>').join('');
    const data='<div class="tpm-ir-table" role="region" tabindex="0" aria-label="'+esc(r.title)+' register preview"><table><thead><tr>'+headers+'</tr></thead>'+
      '<tbody><tr><td colspan="'+r.headers.length+'"><div class="tpm-ir-empty"><strong>No shop-wide database loaded</strong><p>Open the original TPM report for actual rows, filtering, sorting, and export actions. The design preview does not interpret missing data as zero.</p>'+
      '<a href="'+origin+r.path+'" target="_blank" rel="noopener noreferrer">Open in local TPM ↗</a></div></td></tr></tbody></table></div>';
    return '<div class="tab-workspace tpm-integrated-reports">'+
      tabIntro(r.category+' / Report',r.title,r.description,'Source-aligned layout')+
      '<div class="tpm-ir-actions"><button type="button" class="btn" data-report-directory>← All reports</button><a class="btn brand" target="_blank" rel="noopener noreferrer" href="'+origin+r.path+'">Open original report ↗</a></div>'+
      tabPanel('side-settings','Report controls','Original filters remain connected to the real TPM report.',filterText)+
      tabPanel('side-list','Report register','The same compact table presentation used across the original preview.',data,{flush:true})+
      tabPanel('check','How this report is used','Relevant questions for this part of the company.',defs)+
      '<p class="tab-footline">'+esc(r.definition)+' Full data, exports, permission checks and backend calculations remain unchanged in the original application.</p></div>';
  }
  function render(route){return route==='report-detail'?reportPage():directory();}
  function sync(route){
    const inReports=route==='reports'||route==='report-detail';
    document.body.classList.toggle('tpm-report-mode',inReports);
    state.active=route;
    const activeReport=inReports&&route==='report-detail'?(byId(new URLSearchParams(location.search).get('report'))||reports[0]):null;
    if(crumbs)crumbs.innerHTML=inReports?'<span>Reports</span><span class="crumb-mark">/</span><strong>'+esc(activeReport?.title||'All reports')+'</strong>':originalCrumbs;
    if(previewFlag)previewFlag.innerHTML=inReports?'<span class="mock-dot"></span> DESIGN PREVIEW <span class="mock-separator">·</span> NO LIVE REPORT DATA':originalFlag;
    const title=document.getElementById('tpm-report-hero-title');
    if(title)title.textContent=activeReport?.title||'Reports';
    const section=document.getElementById('tpm-report-hero-section');
    if(section)section.textContent=activeReport?.category||'Company-wide reports';
    document.querySelectorAll('[data-shell-nav="Orders"],[data-shell-nav="Reports"]').forEach(button=>{
      const match=button.dataset.shellNav===(inReports?'Reports':'Orders');
      button.classList.toggle('is-active',match);
      if(match)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
    });
    const parent=document.querySelector('[data-shell-nav="Reports"]');
    parent?.setAttribute('aria-expanded',String(inReports));
    for(const b of document.querySelectorAll('[data-report-page]')){
      const selected=!!activeReport&&b.dataset.reportPage===activeReport.id;
      if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
    }
    for(const b of document.querySelectorAll('[data-report-directory]')){
      if(route==='reports')b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
    }
    if(inReports)document.title=(activeReport?.title||'Reports')+' · TPM Preview';
    else document.title='TPM · Job #990100 · Preview';
  }
  function go(reportId){
    const url=new URL(location.href);
    if(reportId){url.searchParams.set('view','report-detail');url.searchParams.set('report',reportId);}
    else{url.searchParams.set('view','reports');url.searchParams.delete('report');}
    history.pushState(null,'',url);
    navigate(reportId?'report-detail':'reports');
    if(window.matchMedia('(max-width:930px)').matches){
      document.getElementById('tpm-layout')?.classList.remove('mobile-sidebar-open');
      document.querySelector('[data-shell-open]')?.setAttribute('aria-expanded','false');
    }
  }
  document.addEventListener('click',e=>{
    const report=e.target.closest('[data-report-page]');
    if(report){e.preventDefault();go(report.dataset.reportPage);return;}
    if(e.target.closest('[data-report-directory]')){e.preventDefault();go(null);}
  });
  document.addEventListener('input',e=>{
    if(e.target.id!=='tpm-ir-search')return;
    const words=e.target.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    let visible=0;
    document.querySelectorAll('[data-ir-section]').forEach(section=>{
      let count=0;
      section.querySelectorAll('[data-ir-item]').forEach(item=>{
        const show=words.every(word=>item.textContent.toLowerCase().includes(word));
        item.hidden=!show;if(show)count++;
      });
      section.hidden=!count;visible+=count;
    });
    const n=document.getElementById('tpm-ir-count');
    if(n)n.textContent=visible+' of '+reports.length+' reports';
  });
  window.TPMReportsShell={render,sync,go};
  const requested=new URLSearchParams(location.search).get('view');
  if(requested==='reports'||requested==='report-detail')navigate(requested);
  else sync(requested||'overview');
})();