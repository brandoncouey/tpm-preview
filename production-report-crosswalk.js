/* Source-scoped Production to Reports context for the TPM static preview.
 * Pure presentation: real /reports remains in the Laravel/Vue app.
 * Called from the existing Production renderer on initial view and station refresh.
 */
(function(){
 'use strict';
 window.TPMProductionCrosswalk=function(ctx){
   var j=ctx.j,t=ctx.t,s=ctx.s,m=ctx.m,safe=ctx.safe,num=ctx.num,dur=ctx.dur;
   var totals=(s&&s.totals)||{};
   var run=(t&&t.run)||{};
   var val=function(value){return value===null||value===undefined?'Not recorded':value;};
   var stat=function(label,value,hint){
     return '<div class="prod-report-stat"><span>'+safe(label)+'</span><strong>'+safe(val(value))+'</strong><small>'+safe(hint)+'</small></div>';
   };
   var nav=function(label,route){
     return '<button type="button" class="prod-report-nav-link" data-route="'+route+'">'+safe(label)+' <span aria-hidden="true">↗</span></button>';
   };
   var steel=totals.feet===null||totals.feet===undefined?'Not recorded':Number(totals.feet).toFixed(1)+' LF';
   var eventCount=totals.events==null?'Not recorded':num(totals.events);
   var tubeCount=totals.tubes==null?'Not recorded':num(totals.tubes);
   var mesh=totals.mesh_feet===null||totals.mesh_feet===undefined?(s.has_mesh?'Not recorded':'Not applicable'):Number(totals.mesh_feet).toFixed(1)+' LF';
   return '<section class="prod-report-crosswalk" aria-label="Job reporting data and definitions">'+
     '<div class="prod-report-crosswalk-head"><div><span class="prod-section-eyebrow">SOURCE RECONCILIATION</span><h3>Production data & related reports</h3><p>Job-wide values stay constant when filtering a work center or employee.</p></div>'+
     '<span class="prod-report-source">SAMPLED JOB DATA · NOT LIVE</span></div>'+
     '<div class="prod-report-stat-grid">'+
       stat('Scrap events',eventCount,'Events, not unique tubes')+
       stat('Distinct scrap tubes',tubeCount,'Tube count, not event count')+
       stat('Steel scrapped',steel,'LF lost · not a scrap rate')+
       stat('Mesh scrapped',mesh,'Separate from steel loss')+
     '</div>'+
     '<div class="prod-report-nav"><span>Open job details</span>'+
       nav('Job report','report')+nav('Scrap & quality','scrap')+
       nav('Materials','materials')+nav('History','history')+
     '</div>'+
     '<details class="prod-report-explainer"><summary>How job figures relate to shop-wide Reports and conditional checks <span aria-hidden="true">⌄</span></summary>'+
     '<div class="prod-report-explainer-grid">'+
       '<div><h4>Shop Timing</h4><p>Running and attended are overlapping timestamp-derived measures. Elapsed is wall-clock duration. Never add them. The proposed shift-calendar method in Q38/Q49 is not applied to these source values.</p></div>'+
       '<div><h4>Mill Performance</h4><p>Historical production attribution must follow the tube’s recorded mill or the job’s assignment history. The job’s current mill is not the credited mill for every historical tube.</p></div>'+
       '<div><h4>Scrap Analysis</h4><p>This fixture has '+safe(eventCount)+' scrap events and '+safe(tubeCount)+' distinct scrap tubes. These are different measures. The legacy feet-based percentage selected for Tube Scrap Summary is a separate backend calculation.</p></div>'+
       '<div><h4>Inspection Pass Rates</h4><p>Stage completions cannot establish one inspector’s pass rate. Inspector reporting requires attributed inspections, failures, and applicable rework records from the real database.</p></div>'+
       '<div><h4>Allocated materials</h4><p>Coils and mesh assigned to a job do not prove footage consumed or sufficient material coverage. These require the actual Materials records and calculations.</p></div>'+
       '<div><h4>Conditional processes</h4><p>Tack welding, excluder rings, Geo Form rings and final inspection apply only when the part’s route requires them. This fixture cannot confirm their per-tube outcomes, so none are marked passed or missing.</p></div>'+
     '</div></details></section>';
 };
 if(new URLSearchParams(location.search).get('view')==='production' && typeof navigate==='function'){
   navigate('production');
 }
})();
