/* TPM Production parity, first presentation iteration.
 * Source: real Vue JobProductionTab, JobTimingStrip, JobStageFunnel, JobPeopleList.
 * Pure UI: no writes or new calculated manufacturing metrics.
 */
(function () {
 'use strict';
 const htmlSafe = v => String(v == null ? '—' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const integer = v => v == null ? '—' : Number(v).toLocaleString('en-US');
 const calcPct = stage => {
   const raw=stage?.percent;
   if(raw===null || raw===undefined || !Number.isFinite(Number(raw))) return null;
   return Number(raw);
 };
 const stageModel=(stage,quantity)=>{
   const optional=stage?.applies===false;
   const progress=calcPct(stage);
   const bar=optional?null:progress===null?0:Math.min(100,Math.max(0,progress));
   const label=optional?'N/A':progress===null?'—':progress>100?'>100%':String(progress)+'%';
   const done=stage?.done===null||stage?.done===undefined?null:Number(stage.done);
   const left=(optional||done===null||!Number.isFinite(done)||!Number.isFinite(Number(quantity)))?null:Math.max(0,Number(quantity)-done);
   return {optional,progress,bar,label,done,left};
 };
 const fmtDate=(value,stamp)=>{
   if(!value)return '—';
   return stamp(value);
 };
 const caption=(stage,stamp,dur)=>{
   if(!stage.first_at)return 'No recorded stage timestamp';
   const first=fmtDate(stage.first_at,stamp),last=fmtDate(stage.last_at,stamp);
   const time=stage.elapsed_seconds==null?'':(' · '+dur(stage.elapsed_seconds));
   return first+' → '+last+time;
 };
 const renderStage=(stage,ctx)=>{
   const m=stageModel(stage,ctx.quantity),label=htmlSafe(stage.label||stage.key||'Stage');
   if(m.optional){
     return '<div class="prod-parity-stage prod-parity-stage-na" data-parity-stage="'+htmlSafe(stage.key)+'"><div class="prod-parity-stage-head"><strong>'+label+'</strong><span>Not applicable</span></div>'+
       '<div class="prod-parity-stage-na-main">N/A</div><p>Not required for this part. No unfinished work is implied.</p></div>';
   }
   const valid=typeof m.done==='number'&&Number.isFinite(m.done);
   const value=valid?integer(m.done):'—';
   return '<button type="button" class="prod-parity-stage prod-parity-stage-active '+(ctx.selected===stage.label?'is-current':'')+'" data-dept="'+htmlSafe(stage.label)+'" data-parity-stage="'+htmlSafe(stage.key)+'" aria-pressed="'+(ctx.selected===stage.label?'true':'false')+'">'+
     '<span class="prod-parity-stage-head"><strong>'+label+'</strong><span>'+htmlSafe(m.label)+'</span></span>'+
     '<span class="prod-parity-stage-count"><strong>'+value+'</strong> <small>of '+integer(ctx.quantity)+' tubes</small></span>'+
     '<span class="prod-parity-stage-track" aria-hidden="true"><span style="width:'+m.bar+'%"></span></span>'+
     '<span class="prod-parity-stage-details"><span>'+htmlSafe(caption(stage,ctx.stamp,ctx.dur))+'</span>'+
     '<em>'+htmlSafe(m.left===null?'Count not recorded':integer(m.left)+' remaining')+'</em></span></button>';
 };
 const stagePanel=function(ctx){
   const all=Array.isArray(ctx.stages)?ctx.stages:[];
   const required=all.filter(stage=>stage.applies!==false);
   const optional=all.filter(stage=>stage.applies===false);
   const lastTube=ctx.lastTubeAt?'<span class="prod-parity-last">Last tube milled '+htmlSafe(ctx.stamp(ctx.lastTubeAt))+'</span>':'';
   const choices={quantity:ctx.quantity,selected:ctx.selected,stamp:ctx.stamp,dur:ctx.dur};
   return '<div class="prod-parity-funnel" aria-label="Manufacturing stage progress">'+
    '<div class="prod-parity-section-header"><div><span class="prod-section-eyebrow">STAGE COMPLETION · SOURCE ROLL-UP</span>'+
    '<h3>Where the job got to</h3><p>Tube counts are from the complete job roll-up, not the sampled activity table. Select a required stage to filter its records.</p></div>'+lastTube+'</div>'+
    '<div class="prod-parity-stage-grid">'+(required.length?required.map(st=>renderStage(st,choices)).join(''):'<div class="prod-parity-empty">No required stage data supplied in this fixture.</div>')+'</div>'+
    (optional.length?'<details class="prod-parity-optional"><summary>Additional manufacturing stages <span>'+integer(optional.length)+' not required for this part</span></summary>'+
       '<div class="prod-parity-stage-grid">'+optional.map(st=>renderStage(st,choices)).join('')+'</div></details>':'')+
    '<p class="prod-parity-stage-foot">Only stages explicitly marked <code>applies: false</code> are shown as N/A. Missing applicability is not automatically interpreted as not required. Exact tube counts remain visible even above the order quantity.</p></div>';
 };
 const timingStrip=function(ctx){
   const t=ctx.timing;
   if(!t)return '<section class="prod-parity-timing"><div class="prod-parity-section-header"><div><h3>Production timing</h3><p>Timing has not been supplied for this job.</p></div></div></section>';
   const run=t.run||{},setup=t.setup||{},fmt=s=>s==null?'—':ctx.dur(Number(s));
   const threshold=x=>x==null?'Not recorded':('≤ '+fmt(Number(x)*60));
   const measures=[
     ['Since work began',fmt(t.elapsed_seconds),'Elapsed · '+(t.is_partial?'snapshot while open':'start to finish'),'Wall-clock span includes idle periods and is not the time spent making tubes.'],
     ['Making tubes',fmt(run.active_seconds),'Running · gaps '+threshold(run.idle_gap_minutes),'Tube-to-tube gaps within the specified running threshold.'],
     ['Attended',fmt(run.attended_seconds),'Gaps '+threshold(run.attended_gap_minutes),'Longer gap threshold; includes some time also counted as running.'],
     ['Setup',fmt(setup.changeover_seconds),'Start → tube 1','Available only when a source setup start was recorded.'],
     ['Ramp-up',fmt(setup.seconds),'Tube 1 → milled','Time from starting to the first good milled tube.'],
     ['Stops',run.pause_count==null?'—':integer(run.pause_count),'Gaps over '+threshold(run.idle_gap_minutes),'Inferred gaps, not independently logged pause or downtime reasons.']
   ];
   return '<section class="prod-parity-timing" aria-label="Job production timing">'+
      '<div class="prod-parity-section-header"><div><span class="prod-section-eyebrow">PRODUCTION TIMING</span><h3>Time on this job</h3><p>Different timing definitions describe the same job. Values must not be added together.</p></div><span class="prod-parity-source-pill">JOB ROLL-UP · STATIC SAMPLE</span></div>'+
      '<div class="prod-parity-timing-grid">'+measures.map(([name,value,note,definition])=>
         '<div class="prod-parity-time-cell" title="'+htmlSafe(definition)+'"><span>'+htmlSafe(name)+'</span><strong>'+htmlSafe(value)+'</strong><small>'+htmlSafe(note)+'</small></div>').join('')+'</div>'+
      '<details class="prod-parity-timing-definitions"><summary>How these six times are measured <span aria-hidden="true">⌄</span></summary><dl>'+
       measures.map(([name,,note,definition])=>'<div><dt>'+htmlSafe(name)+'</dt><dd>'+htmlSafe(definition)+'</dd></div>').join('')+
       '</dl><p>This is a frozen fixture. The real Vue Timing Strip advances elapsed time while an open job remains on screen; the preview does not simulate real time or updated API responses.</p></details></section>';
 };
 const workersSummary=function(ctx){
   const people=Array.isArray(ctx.people)?ctx.people:[];
   const recorded=people.filter(p=>!p.attached_only);
   const attached=people.filter(p=>!!p.attached_only);
   const sessions=recorded.reduce((total,p)=>total+(Array.isArray(p.departments)?p.departments.reduce((n,d)=>n+(Array.isArray(d.sessions)?d.sessions.length:0),0):0),0);
   const tubeCredits=recorded.reduce((total,p)=>total+(Number(p.tubes)||0),0);
   const scrap=recorded.reduce((total,p)=>total+(Number(p.scrap_events)||0),0);
   const cells=[['Workers with records',integer(recorded.length),'People with production activity'],
     ['Worker-stage tube credits',integer(tubeCredits),'May repeat across stations; not distinct tubes'],
     ['Work sessions',integer(sessions),'From source per-worker intervals'],
     ['Scrap events attributed',integer(scrap),'Not necessarily every job scrap event']];
   return '<section class="prod-parity-workers" aria-label="Worker production summary"><div class="prod-parity-worker-grid">'+
       cells.map(([title,val,sub])=>'<div><span>'+htmlSafe(title)+'</span><strong>'+htmlSafe(val)+'</strong><small>'+htmlSafe(sub)+'</small></div>').join('')+
       '</div>'+ (attached.length?'<p>'+integer(attached.length)+' office-assigned employee(s) with no tube activity are kept separate from workers who produced tubes.</p>':'')+
       '</section>';
 };
 window.TPMProductionParityV1={stageModel,timingStrip,stagePanel,workersSummary};
 if (new URLSearchParams(location.search).get('view')==='production' && typeof navigate==='function') navigate('production');
})();
