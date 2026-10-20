/* TPM fictional manufacturing dataset: offline, deterministic, never a live query. */
(function(){
'use strict';
let seed=10202026;
const rnd=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
const mills=['Mill #1','Mill #2','Mill #3','Mill #4'];
const people=['J. Morales','T. Givens','A. Brooks','S. Taylor','D. West','R. Patel','K. Evans','M. Chen'];
const customers=['Atlas Filtration','Crescent Industrial','Summit Process','Piedmont Steel Works','Northline Water','Riverbend Fabrication','Heritage Screens'];
const causes=['Weld split','Length tolerance','Surface finish','Dimensional variation','Setup reject'];
const iso=d=>d.toISOString().slice(0,10);
const date=s=>new Date(s+'T12:00:00Z');
const shift=(d,n)=>new Date(d.getTime()+86400000*n);
const rows=[];
for(let d=date('2025-01-01'),i=0;iso(d)<='2026-10-19';d=shift(d,1),i++){
 for(let m=0;m<mills.length;m++){
  const work=d.getUTCDay()!==0&&(d.getUTCDay()!==6||i%3===0);
  const tubes=work?Math.round((210+m*41+rnd()*88+Math.sin(i/21+m)*19)*(1+Math.min(.18,i*.00022))):0;
  const inspected=work?Math.round(tubes*(.94+.035*rnd())):0;
  const failed=work?Math.round(inspected*(.012+.024*rnd()+(m===2?.006:0))):0;
  const scrapTubes=work?failed+Math.round(tubes*(.002+.004*rnd())):0;
  const events=work?scrapTubes+Math.round(rnd()*4):0;
  const feet=work?+(scrapTubes*(5.2+3.1*rnd())).toFixed(1):0;
  const run=work?+(4.7+2.6*rnd()).toFixed(2):0;
  const setup=work?+(.4+1.25*rnd()).toFixed(2):0;
  const idle=work?+(.22+1.7*rnd()).toFixed(2):0;
  const shipments=work?Math.round(rnd()*3)+1:0;
  const late=shipments&&rnd()<.22?1:0;
  const receipts=work&&rnd()>.52?1+Math.floor(rnd()*3):0;
  const receivedLb=receipts*Math.round(1500+rnd()*1400);
  const audits=work&&rnd()>.54?1+Math.round(rnd()):0;
  const worker=people[(i+m*2)%people.length],inspector=people[(i+m*3+5)%people.length];
  const customer=customers[Math.floor(rnd()*customers.length)];
  rows.push({date:iso(d),mill:mills[m],worker,inspector,customer,job:'99'+String(1000+((i*7+m*13)%7000)),
   reason:causes[(i+m)%causes.length],tubes,inspected,failed,passed:inspected-failed,scrapTubes,events,feet,
   producedFeet:tubes*8,run,setup,idle,shipments,late,receipts,receivedLb,audits,
   meshFeet:work&&rnd()>.73?+(2+rnd()*21).toFixed(1):0,training:work&&rnd()>.68?1:0,
   price:+(15+m*1.3+Math.floor(i/90)*.18+rnd()*.9).toFixed(2),orders:shipments+Number(work)});
 }
}
const fields=['tubes','inspected','failed','passed','scrapTubes','events','feet','producedFeet','run','setup','idle','shipments','late','receipts','receivedLb','audits','meshFeet','training','orders'];
const aggregate=a=>{const t={count:a.length,priceSum:0,priceWeight:0};for(const k of fields)t[k]=0;
 for(const r of a){for(const k of fields)t[k]+=r[k];if(r.tubes){t.priceSum+=r.tubes*r.price;t.priceWeight+=r.tubes;}}return t;};
const metrics={
 tubes:['Tubes milled','tubes',x=>x.tubes,0],
 orders:['Orders handled','orders',x=>x.orders,0],
 shipments:['Orders shipped','shipments',x=>x.shipments,0],
 ontime:['On-time shipments','%',x=>x.shipments?100*(x.shipments-x.late)/x.shipments:0,1],
 run:['Running time','hours',x=>x.run,1],
 idle:['Idle time','hours',x=>x.idle,1],
 setup:['Setup time','hours',x=>x.setup,1],
 events:['Scrap events','events',x=>x.events,0],
 scrapTubes:['Scrapped tubes','tubes',x=>x.scrapTubes,0],
 feet:['Lost steel footage','LF',x=>x.feet,1],
 scrapRate:['Illustrative footage scrap rate','%',x=>x.producedFeet?100*x.feet/x.producedFeet:0,2],
 meshFeet:['Mesh scrap footage','LF',x=>x.meshFeet,1],
 passRate:['Inspection first pass','%',x=>x.inspected?100*x.passed/x.inspected:0,1],
 failed:['Failed inspections','tubes',x=>x.failed,0],
 passed:['Passed inspections','tubes',x=>x.passed,0],
 receipts:['Steel receipts','receipts',x=>x.receipts,0],
 receivedLb:['Steel received','lb',x=>x.receivedLb,0],
 audits:['Coil audit checks','checks',x=>x.audits,0],
 training:['Training examples','records',x=>x.training,0],
 price:['Weighted example price','$/tube',x=>x.priceWeight?x.priceSum/x.priceWeight:0,2]
};
const questions={
 'order-history':[['How many orders are shipping?','shipments'],['Are shipments on time?','ontime'],['Is the order workload increasing?','orders']],
 'mill-performance':[['Which mills produce the most?','tubes'],['Is running time increasing?','run'],['Where is scrap footage highest?','feet']],
 'shop-timing':[['Where are mills sitting idle?','idle'],['Is running time improving?','run'],['How much time is setup?','setup']],
 'scrap-events':[['Are scrap incidents increasing?','events'],['How many tubes are scrapped?','scrapTubes'],['Where is footage being lost?','feet']],
 'tube-scrap':[['How much steel footage was lost?','feet'],['What is the illustrative footage rate?','scrapRate'],['How many tubes were scrapped?','scrapTubes']],
 'mesh-scrap':[['How much mesh was scrapped?','meshFeet'],['How many recorded shop scrap events?','events']],
 'employee-report':[['Who received production credit?','tubes'],['How many running hours?','run'],['How much scrap is associated?','scrapTubes']],
 'inspection':[['Is first-pass yield improving?','passRate'],['How many tubes failed?','failed'],['How many passed?','passed']],
 'training':[['How many training examples?','training'],['Where was production activity?','tubes']],
 'steel-receive':[['How much steel was received?','receivedLb'],['How many receiving records?','receipts']],
 'audit':[['How many coils were audited?','audits'],['How much steel was received?','receivedLb']],
 'standard-prices':[['How have example unit prices changed?','price'],['How many orders in the sample?','orders']]
};
const addPeriod=(d,g,n)=>g==='day'?shift(d,n):g==='week'?shift(d,n*7):
 g==='month'?new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+n,1,12)):
 new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+n*3,1,12));
const label=(d,g)=>g==='day'?d.toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'}):
 g==='week'?'Wk '+d.toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'}):
 g==='month'?d.toLocaleDateString('en-US',{month:'short',year:'2-digit',timeZone:'UTC'}):'Q'+(Math.floor(d.getUTCMonth()/3)+1)+' '+d.getUTCFullYear();
const anchors={day:'2026-10-19',week:'2026-10-12',month:'2026-09-01',quarter:'2026-07-01'};
const widths={day:14,week:12,month:12,quarter:6};
const periods=(g,offset=0)=>Array.from({length:widths[g]},(_,i)=>addPeriod(date(anchors[g]),g,i-widths[g]+1-widths[g]*offset));
window.TPMSampleData={rows,mills,people,aggregate,metrics,questions,iso,date,addPeriod,label,periods};
})();