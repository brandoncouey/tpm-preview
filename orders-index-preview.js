/* TPM Orders index design-preview. Vue/Laravel-independent: mock actions never write to TPM. */
(() => {
  'use strict';
  if (typeof navigate !== 'function' || typeof j === 'undefined') return;
  const view = document.getElementById('view');
  const top = document.querySelector('.tpm-workspace > .c-top');
  if (!view || !top) return;
  const originalNavigate = navigate;
  const esc = value => safe(value);
  const formatInt = n => num(n);
  const localDate = value => {
    if (!value) return 'Not set';
    const date = new Date(String(value).slice(0, 10) + 'T12:00:00');
    return Number.isNaN(+date) ? String(value) : date.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  };
  const statuses = [
    ['all','All orders'], ['not_started','Not started'],
    ['started','Started'], ['completed','Completed'], ['shipped','Shipped']
  ];
  const customers = [
    'Pinnacle Filtration','Arbor Industrial','Eastwood Supply','Horizon Process',
    'Meridian Metals','Summit Equipment','Oakline Manufacturing','Riverbend Fabrication',
    'Northpoint Components','Crescent Flow Systems','Highland Industrial','Clearwater Process'
  ];
  const parts = ['AF-1250-083','AF-1000-075','AF-1500-092','FS-800-046','PF-2000-104','RF-0650-083'];
  const mills = ['Mill #1','Mill #2','Mill #3','Mill #4','Mill #5'];
  const sample = [{
    id:String(j.job), customer:j.customer_name, po:j.po, part:j.part, description:j.part_description,
    quantity:Number(j.quantity), unitPrice:Number(j.price||0), status:'started', progress:Number(h.stages[2].done||0),
    due:String(j.due||''), ordered:String(j.ordered||''), mill:j.device, source:true, priority:false
  }];
  for (let i=0;i<63;i++) {
    const id=String(990101+i);
    const status=['started','not_started','completed','shipped','started','started','completed'][i%7];
    const quantity=220+((i*137)%2300);
    const completion=status==='shipped'||status==='completed'?quantity:status==='not_started'?0:Math.floor(quantity*(0.18+((i*19)%76)/100));
    const date=new Date(2026,9,10+(i*3)%52);
    const orderDate=new Date(2026,8,26+(i*2)%30);
    sample.push({id,customer:customers[i%customers.length],po:'PO-'+(44800+i*7),part:parts[i%parts.length],
      description:'Demo manufacturing order',quantity,unitPrice:16+(i%9)*4,
      status,progress:Math.min(quantity,completion),
      due:date.toISOString().slice(0,10),ordered:orderDate.toISOString().slice(0,10),
      mill:mills[i%mills.length],source:false,priority:i%11===0});
  }
  const ordersState={
    status:'all',search:'',mill:'all',sort:'due',page:1,pageSize:10,onlyPriority:false,
    selected:new Set(),flags:new Set(sample.filter(o=>o.priority).map(o=>o.id))
  };

  /* New Order: browser-only proof of the form; source Laravel validation is not represented. */
  const createdStorageKey='tpm-preview-created-orders-v1';
  const createdOrders=[];
  try{
    const saved=JSON.parse(localStorage.getItem(createdStorageKey)||'[]');
    if(Array.isArray(saved)){
      for(const item of saved.slice(0,100)){
        if(!item||!/^[0-9]{6,9}$/.test(String(item.id||''))||sample.some(x=>x.id===String(item.id)))continue;
        const clean={
          id:String(item.id),customer:String(item.customer||'').slice(0,150),
          po:String(item.po||'').slice(0,90),part:String(item.part||'').slice(0,90),
          description:String(item.description||'').slice(0,280),
          quantity:Math.max(1,Number(item.quantity)||1),
          unitPrice:Math.max(0,Number(item.unitPrice)||0),status:'not_started',progress:0,
          ordered:String(item.ordered||''),due:String(item.due||''),mill:String(item.mill||'Unassigned'),
          source:false,created:true,priority:false,
          shipDate:String(item.shipDate||''),millOp:String(item.millOp||''),
          cutoffOp:String(item.cutoffOp||''),inspector:String(item.inspector||''),
          repairWelder:String(item.repairWelder||''),die:String(item.die||''),
          millWeldSpec:String(item.millWeldSpec||''),repairWeldSpec:String(item.repairWeldSpec||''),
          shipMethod:String(item.shipMethod||''),containerType:String(item.containerType||''),
          notes:String(item.notes||'').slice(0,4000),
          materialGrade:String(item.materialGrade||''),partDimension:String(item.partDimension||''),
          gage:String(item.gage||''),stripWidth:String(item.stripWidth||''),pattern:String(item.pattern||''),
          holeSize:String(item.holeSize||''),centers:String(item.centers||''),
          finishedLength:String(item.finishedLength||''),cutoffLength:String(item.cutoffLength||''),
          odTolerancePlus:String(item.odTolerancePlus||''),odToleranceMinus:String(item.odToleranceMinus||''),
          finishedTolerancePlus:String(item.finishedTolerancePlus||''),
          finishedToleranceMinus:String(item.finishedToleranceMinus||''),
          ringMin:String(item.ringMin||''),ringMax:String(item.ringMax||''),
          idDrift:String(item.idDrift||''),materialAngle:String(item.materialAngle||''),
          millAmps:String(item.millAmps||''),millVolts:String(item.millVolts||''),
          millSpeed:String(item.millSpeed||''),repairAmps:String(item.repairAmps||''),
          repairVolts:String(item.repairVolts||''),repairSpeed:String(item.repairSpeed||''),
          requiredBlankLF:String(item.requiredBlankLF||''),requiredPerforatedLF:String(item.requiredPerforatedLF||''),
          requiredMeshLF:String(item.requiredMeshLF||''),meshRequired:String(item.meshRequired||'no'),
          setupNotes:String(item.setupNotes||'').slice(0,4000),
          allocatedCoils:Array.isArray(item.allocatedCoils)?item.allocatedCoils.map(String):[],
          allocatedMesh:Array.isArray(item.allocatedMesh)?item.allocatedMesh.map(String):[],
          materialsConfirmed:!!item.materialsConfirmed,setupConfirmed:!!item.setupConfirmed
        };
        sample.push(clean);createdOrders.push(clean);
      }
    }
  }catch(error){/* Private browsing or disabled storage: session still works. */}
  const persistPreviewCreated=()=>{try{localStorage.setItem(createdStorageKey,JSON.stringify(createdOrders))}catch(error){/* session-only */}};
  const todayDate=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
  const freshDraft=()=>({
    customer:'',po:'',part:'',description:'',quantity:'',unitPrice:'',
    ordered:todayDate(),due:'',shipDate:'',mill:'',millOp:'',cutoffOp:'',inspector:'',
    repairWelder:'',die:'',millWeldSpec:'',repairWeldSpec:'',shipMethod:'',
    containerType:'',notes:'',
    materialGrade:'',partDimension:'',gage:'',stripWidth:'',pattern:'',holeSize:'',centers:'',
    finishedLength:'',cutoffLength:'',odTolerancePlus:'',odToleranceMinus:'',
    finishedTolerancePlus:'',finishedToleranceMinus:'',ringMin:'',ringMax:'',idDrift:'',
    millAmps:'',millVolts:'',millSpeed:'',repairAmps:'',repairVolts:'',repairSpeed:'',
    materialAngle:'',requiredBlankLF:'',requiredPerforatedLF:'',
    meshRequired:'no',requiredMeshLF:'',setupNotes:''
  });
  const freshNewOrder=()=>({
    draft:freshDraft(),step:'edit',errors:{},dirty:false,
    allocatedCoils:new Set(),allocatedMesh:new Set(),
    materialKind:'coil',materialSearch:'',materialType:'all',materialRole:'all',
    materialCompatible:false,materialPage:1,materialPageSize:8,
    materialsConfirmed:false,setupConfirmed:false
  });
  let newOrder=freshNewOrder();
  const newOptionList=(items,value,placeholder)=>'<option value="">'+esc(placeholder)+'</option>'+items.map(label=>
    '<option value="'+esc(label)+'" '+(label===value?'selected':'')+'>'+esc(label)+'</option>'
  ).join('');
  function newOrderField(key,title,{type='text',placeholder='',required=false,note='',choices=null,min='',step='',wide=false}={}){
    const value=newOrder.draft[key]??'';
    const error=newOrder.errors[key];
    const id='new-order-'+key;
    const attrs='id="'+id+'" name="'+key+'" data-new-order-field="'+key+'" '+(required?'required ':'')+
      (min!==''?'min="'+min+'" ':'')+(step!==''?'step="'+step+'" ':'');
    const control=choices?'<select '+attrs+'>'+newOptionList(choices,String(value),placeholder||'Select an option')+'</select>':
      '<input '+attrs+' type="'+type+'" value="'+esc(value)+'" placeholder="'+esc(placeholder)+'" autocomplete="off" '+(key==='customer'?'list="new-order-customers"':key==='part'?'list="new-order-parts"':'')+'>';
    return '<div class="new-order-field '+(wide?'new-order-field-wide ':'')+(error?'new-order-field-error':'')+'"><label for="'+id+'">'+esc(title)+(required?' <em>*</em>':'')+'</label>'+
      control+(error?'<span class="new-order-error" role="alert">'+esc(error)+'</span>':note?'<span class="new-order-help">'+esc(note)+'</span>':'')+'</div>';
  }
  function newOrderNotes(){
    return '<div class="new-order-field new-order-field-wide"><label for="new-order-notes">Manufacturing instructions / notes</label>'+
      '<textarea id="new-order-notes" data-new-order-field="notes" rows="5" maxlength="4000" placeholder="Special handling, shop-floor instructions, customer requirements…">'+esc(newOrder.draft.notes)+'</textarea>'+
      '<span class="new-order-help">Stored in this browser preview only. Do not enter private production information.</span></div>';
  }
  const newFieldValue=key=>String(newOrder.draft[key]??'').trim();
  function validateNewOrder(){
    const errors={};
    if(!newFieldValue('customer'))errors.customer='Choose or enter a customer.';
    if(!newFieldValue('po'))errors.po='Enter a purchase order reference.';
    if(!newFieldValue('part'))errors.part='Enter a part number.';
    if(!newFieldValue('description'))errors.description='Enter a part description.';
    const q=Number(newOrder.draft.quantity),price=Number(newOrder.draft.unitPrice);
    if(!newFieldValue('quantity')||!Number.isInteger(q)||q<1||q>10000000)errors.quantity='Enter a whole number of tubes greater than zero.';
    if(!newFieldValue('unitPrice')||!Number.isFinite(price)||price<0)errors.unitPrice='Enter a nonnegative unit price.';
    if(!/^\d{4}-\d{2}-\d{2}$/.test(newFieldValue('ordered')))errors.ordered='Choose a valid order date.';
    if(!/^\d{4}-\d{2}-\d{2}$/.test(newFieldValue('due')))errors.due='Choose a due date.';
    if(!errors.ordered&&!errors.due&&newFieldValue('due')<newFieldValue('ordered'))errors.due='Due date must be on or after the order date.';
    if(newFieldValue('shipDate')&&newFieldValue('shipDate')<newFieldValue('ordered'))errors.shipDate='Planned ship date cannot be before the order date.';
    if(newFieldValue('shipDate')&&newFieldValue('due')&&newFieldValue('shipDate')>newFieldValue('due'))errors.shipDate='Planned ship date cannot be after the due date.';
        for(const key of ['requiredBlankLF','requiredPerforatedLF','requiredMeshLF']){
      const raw=newFieldValue(key);
      if(raw&&(lfNumber(raw)===null||lfNumber(raw)>100000000))errors[key]='Enter a valid nonnegative length in LF.';
    }
    for(const key of ['stripWidth','gage','finishedLength','cutoffLength']){
      const raw=newFieldValue(key);
      if(raw&&(lfNumber(raw)===null||lfNumber(raw)===0))errors[key]='Enter a positive measurement.';
    }
    const r=newRequirements();
    if(newFieldValue('mill')&&!r.setupReady)errors.mill='Complete the setup and allocation checklist before assigning a mill.';
    newOrder.errors=errors;
    return !Object.keys(errors).length;
  }
  function newOrderSummary(){
    const d=newOrder.draft,q=Number(d.quantity)||0,p=Number(d.unitPrice)||0,r=newRequirements();
    const moneyValue=Number.isFinite(q*p)?money(q*p):'—';
    const filled=[!!newFieldValue('customer'),!!newFieldValue('po'),!!newFieldValue('part'),
      !!newFieldValue('description'),!!newFieldValue('quantity'),!!newFieldValue('unitPrice'),
      !!newFieldValue('ordered'),!!newFieldValue('due')];
    const complete=filled.filter(Boolean).length;
    const coverage=(r.requested.blank||0)+(r.requested.perforated||0);
    const allocatedSteel=r.allocated.blank+r.allocated.perforated;
    return '<div class="new-order-aside-top"><span class="new-order-mini">ORDER & SETUP SUMMARY</span><h3>Draft details</h3><p>Live form values and material readiness.</p></div>'+
      '<div class="new-order-summary-list">'+[
        ['Customer',d.customer||'Not selected'],['Part',d.part||'Not selected'],
        ['Quantity',q?formatInt(q)+' tubes':'Not entered'],
        ['Unit price',newFieldValue('unitPrice')?money(p):'Not entered'],
        ['Estimated order total',newFieldValue('quantity')&&newFieldValue('unitPrice')?moneyValue:'—'],
        ['Required steel LF',coverage>0?fmtLF(coverage):'Not entered'],
        ['Selected steel LF',fmtLF(allocatedSteel)],
        ['Mesh',r.meshRequired?'Required · '+r.mesh.length+' selected':'Not required'],
        ['Setup',r.setupReady?'Confirmed in preview':'Not ready for mill assignment'],
        ['Assigned mill',d.mill||'Unassigned'],
        ['Due date',d.due?localDate(d.due):'Not set']
      ].map(([label,value],i)=>'<div class="'+(i===4?'new-order-summary-emph':'')+'"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong></div>').join('')+'</div>'+
      '<div class="new-order-completion"><div><strong>'+complete+' of 8 order fields</strong><span>'+Math.round(complete/8*100)+'%</span></div><div class="new-order-completion-track"><span style="width:'+Math.round(complete/8*100)+'%"></span></div></div>'+
      '<div class="new-order-aside-note"><strong>Preview only · Not started</strong><p>Required steel footage must be entered; the browser cannot calculate real shortage/weight from TPM. Mill assignment is unlocked after materials and setup are acknowledged.</p></div>';
  }
  function newOrderSection({number,title,description,content}){
    return '<section class="new-order-section" id="new-order-section-'+number+'">'+
      '<header class="new-order-section-head"><span class="new-order-section-number">'+number+'</span><div><h2>'+title+'</h2><p>'+description+'</p></div></header>'+
      '<div class="new-order-section-body">'+content+'</div></section>';
  }

  // Reuse the exact *fictional* inventory pool already displayed in this preview's Materials tab.
  // Never borrow the allocation assignments belonging to sample Job #990100.
  const newMaterialCatalog=kind=>{
    try{
      const rows=kind==='coil'?matCoilPool:matMeshPool;
      return Array.isArray(rows)?rows:[];
    }catch(e){return []}
  };
  const lfNumber=v=>{const n=Number(v);return v!==''&&v!==null&&v!==undefined&&Number.isFinite(n)&&n>=0?n:null};
  const sameMeasurement=(a,b)=>Math.abs(Number(a)-Number(b))<0.0001;
  const fmtLF=v=>Number(v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})+' LF';
  const newAllocRows=kind=>{
    const ids=kind==='coil'?newOrder.allocatedCoils:newOrder.allocatedMesh;
    return newMaterialCatalog(kind).filter(row=>ids.has(row.id));
  };
  const newAllocSum=(rows,key)=>rows.reduce((sum,r)=>sum+(Number(r[key])||0),0);
  const newRequirements=()=>{
    const d=newOrder.draft,coil=newAllocRows('coil'),mesh=newAllocRows('mesh');
    const blank=coil.filter(x=>x.type==='Blank'),perforated=coil.filter(x=>x.type==='Perforated');
    const requested={blank:lfNumber(d.requiredBlankLF),perforated:lfNumber(d.requiredPerforatedLF),mesh:lfNumber(d.requiredMeshLF)};
    const allocated={blank:newAllocSum(blank,'lf'),perforated:newAllocSum(perforated,'lf'),mesh:newAllocSum(mesh,'length')};
    const meshRequired=d.meshRequired==='yes';
    const needsSteel=!!((requested.blank||0)+(requested.perforated||0));
    const steelSatisfied=needsSteel &&
      (requested.blank===null||allocated.blank>=requested.blank)&&
      (requested.perforated===null||allocated.perforated>=requested.perforated)&&
      coil.every(newCompatibility);
    const meshSatisfied=!meshRequired||(requested.mesh!==null&&requested.mesh>0&&allocated.mesh>=requested.mesh&&mesh.every(newCompatibility));
    const numericSpecifications=['stripWidth','gage','finishedLength','cutoffLength'].every(k=>lfNumber(d[k])>0);
    const specsReady=!!d.materialGrade.trim()&&!!d.partDimension.trim()&&!!d.die.trim()&&numericSpecifications;
    const coverageReady=needsSteel&&steelSatisfied&&meshSatisfied;
    const approved=specsReady&&coverageReady&&newOrder.materialsConfirmed;
    const setupReady=approved&&newOrder.setupConfirmed;
    return {coil,mesh,blank,perforated,requested,allocated,needsSteel,
      steelSatisfied,meshSatisfied,meshRequired,specsReady,coverageReady,approved,setupReady};
  };
  const newMaterialStatusText=(needed,allocated)=>{
    if(needed===null)return 'Requirement not entered';
    if(needed===0)return 'Not requested';
    const short=Math.max(0,needed-allocated);
    return short>0?fmtLF(short)+' to allocate':'Requirement covered in preview';
  };
  function newMaterialSummary(){
    const d=newOrder.draft,r=newRequirements();
    const requirements=[
      ['Blank steel',r.requested.blank,r.allocated.blank],
      ['Perforated steel',r.requested.perforated,r.allocated.perforated],
      ['Mesh'+(r.meshRequired?' · required':' · not required'),r.meshRequired?r.requested.mesh:0,r.allocated.mesh]
    ];
    return '<div class="new-material-summary">'+requirements.map(([title,need,have])=>
      '<div class="new-material-summary-card"><span>'+esc(title)+'</span>'+
      '<strong>'+fmtLF(have)+' <small>allocated</small></strong>'+
      '<p>Needed: '+(need===null?'Not entered':fmtLF(need))+'</p>'+
      '<small class="'+(need>0&&have<need?'new-material-short':'')+'">'+esc(newMaterialStatusText(need,have))+'</small></div>'
    ).join('')+'</div><p class="new-material-meaning">Requirements are manually entered planning references; allocation is summed from the selected fictional inventory. TPM-only weight, compatibility, and shortage calculations are not available in this preview.</p>';
  }
  function newMaterialRows(){
    const kind=newOrder.materialKind,cols=kind==='coil';
    let rows=newMaterialCatalog(kind);
    if(cols&&newOrder.materialType!=='all')rows=rows.filter(x=>x.type.toLowerCase()===newOrder.materialType);
    if(!cols&&newOrder.materialRole!=='all')rows=rows.filter(x=>x.role===newOrder.materialRole);
    if(newOrder.materialCompatible){
      const width=lfNumber(newOrder.draft.stripWidth);
      const gage=lfNumber(newOrder.draft.gage);
      rows=rows.filter(x=>(width!==null&&width>0&&sameMeasurement(x.width,width))&&
        (!cols||gage===null||gage===0||sameMeasurement(x.gage,gage)));
    }
    const term=newOrder.materialSearch.trim().toLowerCase();
    if(term)rows=rows.filter(r=>JSON.stringify(r).toLowerCase().includes(term));
    return rows;
  }
  const newCompatibility=row=>{
    const d=newOrder.draft,sw=lfNumber(d.stripWidth),gage=lfNumber(d.gage);
    if(sw!==null&&sw>0&&!sameMeasurement(row.width,sw))return false;
    if(row.gage&&gage!==null&&gage>0&&!sameMeasurement(row.gage,gage))return false;
    return true;
  };
  function newMaterialCatalogHtml(){
    const kind=newOrder.materialKind,steel=kind==='coil',all=newMaterialRows(),pageSize=newOrder.materialPageSize;
    const pages=Math.max(1,Math.ceil(all.length/pageSize));
    newOrder.materialPage=Math.min(pages,Math.max(1,newOrder.materialPage));
    const items=all.slice((newOrder.materialPage-1)*pageSize,newOrder.materialPage*pageSize);
    const selection=steel?newOrder.allocatedCoils:newOrder.allocatedMesh;
    const selectables=items.filter(newCompatibility);
    const checkedAll=selectables.length>0&&selectables.every(x=>selection.has(x.id));
    const filter=steel?'<label>Steel type<select data-new-material-filter="materialType">'+
      [['all','All types'],['blank','Blank'],['perforated','Perforated']].map(([k,label])=>
        '<option value="'+k+'" '+(newOrder.materialType===k?'selected':'')+'>'+label+'</option>').join('')+'</select></label>':
      '<label>Mesh layer<select data-new-material-filter="materialRole">'+
      ['all','Top Filter','Bottom Filter','Inner Drainage','Outer Drainage'].map(k=>
        '<option value="'+k+'" '+(newOrder.materialRole===k?'selected':'')+'>'+(k==='all'?'All roles':k)+'</option>').join('')+'</select></label>';
    const head=steel?'<th>Coil / heat</th><th>Width / gage</th><th>Type / pattern</th><th>Available LF</th>':
      '<th>Mesh / heat</th><th>Mesh / role</th><th>Width / type</th><th>Available LF</th>';
    const cells=x=>steel?'<td><strong>'+esc(x.id)+'</strong><small>'+esc(x.heat)+'</small></td>'+
      '<td>'+esc(x.width)+' in <small>'+esc(x.gage)+' gage</small></td>'+
      '<td>'+esc(x.type)+' <small>'+esc(x.pattern)+'</small></td>'+
      '<td class="new-material-numeric">'+fmtLF(x.lf)+'</td>':
      '<td><strong>'+esc(x.id)+'</strong><small>'+esc(x.heat)+'</small></td>'+
      '<td>'+esc(x.mesh)+' <small>'+esc(x.role)+'</small></td>'+
      '<td>'+esc(x.width)+' in <small>'+esc(x.type)+'</small></td>'+
      '<td class="new-material-numeric">'+fmtLF(x.length)+'</td>';
    return '<div class="new-material-manager"><div class="new-material-toolbar"><div class="new-material-kind" role="group" aria-label="Materials catalog">'+
      '<button type="button" data-new-material-kind="coil" aria-pressed="'+steel+'">Steel coils <small>'+newOrder.allocatedCoils.size+' selected</small></button>'+
      '<button type="button" data-new-material-kind="mesh" aria-pressed="'+(!steel)+'">Mesh rolls <small>'+newOrder.allocatedMesh.size+' selected</small></button></div>'+
      '<span class="new-material-origin">Sample inventory · selection is preview-only</span></div>'+
      '<div class="new-material-filters"><label class="new-material-search">Search material<input data-new-material-search type="search" placeholder="Coil #, heat, mesh, width…" value="'+esc(newOrder.materialSearch)+'" autocomplete="off"></label>'+
      filter+'<label class="new-material-compat"><input type="checkbox" data-new-material-compatible '+(newOrder.materialCompatible?'checked':'')+'> Match part width'+(steel?' / gage':'')+'</label></div>'+
      '<div class="new-material-table-scroll" role="region" tabindex="0" aria-label="New order material selection"><table class="new-material-table"><thead><tr>'+
      '<th><input type="checkbox" data-new-material-select-page '+(checkedAll?'checked':'')+' aria-label="Select compatible materials on visible page"></th>'+
      head+'</tr></thead><tbody>'+(items.length?items.map(x=>'<tr class="'+(selection.has(x.id)?'is-allocated':'')+'">'+
        '<td><input type="checkbox" data-new-material-check="'+esc(x.id)+'" aria-label="Allocate '+esc(x.id)+'" '+(selection.has(x.id)?'checked':'')+
        (!newCompatibility(x)&&!selection.has(x.id)?'disabled title="Width or gage does not match entered part"':'')+'></td>'+
        cells(x)+'</tr>').join(''):'<tr><td colspan="5" class="new-material-empty">No matching material entries. Adjust filters or part specifications.</td></tr>')+
      '</tbody></table></div><div class="new-material-pagination"><span>Showing '+(all.length?(newOrder.materialPage-1)*pageSize+1:0)+'–'+Math.min(all.length,newOrder.materialPage*pageSize)+' of '+all.length+' mock inventory records</span>'+
      '<div><button type="button" data-new-material-page="prev" '+(newOrder.materialPage===1?'disabled':'')+'>← Prev</button>'+
      '<span>Page '+newOrder.materialPage+' / '+pages+'</span>'+
      '<button type="button" data-new-material-page="next" '+(newOrder.materialPage===pages?'disabled':'')+'>Next →</button></div></div>'+
      '<p class="new-material-manager-foot">Checking an item adds its entire listed length to this draft allocation. Type and width/gage screening is illustrative; actual material compatibility must be verified in TPM. Existing job allocations are untouched.</p></div>';
  }
  function newMaterialsWorkspace(){
    return newMaterialSummary()+'<div class="new-material-confirm">'+
      '<label><input type="checkbox" data-new-material-confirm '+(newOrder.materialsConfirmed?'checked':'')+
      (!(newRequirements().specsReady&&newRequirements().coverageReady)?' disabled':'')+
      '> I have checked the part specification, required footage, and selected material compatibility for this preview.</label>'+
      '<small>This acknowledgment is not a real material approval, inventory reservation, or stock availability check.</small></div>'+
      newMaterialCatalogHtml();
  }
  const newSetupStatus=()=>{
    const r=newRequirements();
    const steps=[
      ['Part specification entered',r.specsReady],
      ['Required steel coverage met',r.steelSatisfied],
      ['Required mesh coverage met',r.meshSatisfied],
      ['Material selection reviewed',newOrder.materialsConfirmed],
      ['Setup checklist confirmed',newOrder.setupConfirmed]
    ];
    return '<div class="new-setup-progress"><div><strong>Setup readiness</strong><span class="'+(r.setupReady?'new-setup-ready':'new-setup-pending')+'">'+(r.setupReady?'Ready for mill assignment':'Not ready for assignment')+'</span></div>'+
      '<ul>'+steps.map(([label,done])=>'<li class="'+(done?'is-done':'')+'"><span>'+(done?'✓':'○')+'</span>'+esc(label)+'</li>').join('')+'</ul>'+
      '<p>Mill assignment becomes available after the part is specified, manually entered material requirements are covered in the sample inventory, and both checks are confirmed. The order may still be saved as an unassigned Not Started draft.</p></div>';
  };
  function newSetupWorkspace(){
    const readiness=newRequirements(),enabled=readiness.setupReady;
    return '<div class="new-setup-approval">'+newSetupStatus()+
      '<label class="new-setup-checkbox"><input type="checkbox" data-new-setup-confirm '+(newOrder.setupConfirmed?'checked':'')+
      (!readiness.approved?' disabled':'')+'> Confirm part setup is ready for mill assignment (preview only)</label></div>'+
      '<div class="new-setup-assignment '+(!enabled?'is-locked':'')+'"><div class="new-setup-assignment-head"><h3>Mill assignment</h3><p>'+
      (enabled?'Setup prerequisites acknowledged. Assign a mill and optional operator.':
        'Complete material readiness and confirm setup before assigning the order to a mill.')+'</p></div>'+
      '<div class="new-order-fields"><div class="new-order-field"><label for="new-order-mill">Assigned mill</label>'+
      '<select id="new-order-mill" data-new-order-field="mill" '+(!enabled?'disabled':'')+'>'+
      newOptionList(mills,newOrder.draft.mill,'Not assigned')+'</select></div>'+
      newOrderField('millOp','Mill operator',{placeholder:'Assign after mill selection'})+'</div>'+
      '<p class="new-setup-fineprint">Assigning the mill does not automatically start production. Only the real application can validate work-center availability and authorization.</p></div>';
  }
  function refreshMaterialOnly(opts={}){
    const material=document.getElementById('new-order-material-workspace');
    const setup=document.getElementById('new-order-setup-workspace');
    const summary=document.getElementById('new-order-summary');
    const original=window.scrollY,active=document.activeElement,isSearch=active?.hasAttribute('data-new-material-search');
    const cursor=isSearch?active.selectionStart:null;
    if(material)material.innerHTML=newMaterialsWorkspace();
    if(setup)setup.innerHTML=newSetupWorkspace();
    if(summary)summary.innerHTML=newOrderSummary();
    if(isSearch){
      const search=document.querySelector('[data-new-material-search]');
      if(search){search.focus({preventScroll:true});if(cursor!==null)search.setSelectionRange(cursor,cursor)}
    }
    if(opts.keepScroll)window.scrollTo({top:original,behavior:'instant'});
  }
  function syncNewOrderInputs(){
    if(!document.querySelector('.new-order-page'))return;
    let changedCritical=false;
    const critical=new Set(['materialGrade','stripWidth','gage','partDimension','die',
      'finishedLength','cutoffLength','requiredBlankLF','requiredPerforatedLF',
      'meshRequired','requiredMeshLF']);
    document.querySelectorAll('[data-new-order-field]').forEach(el=>{
      const key=el.dataset.newOrderField;
      if(!Object.prototype.hasOwnProperty.call(newOrder.draft,key))return;
      if(newOrder.draft[key]!==el.value){
        newOrder.draft[key]=el.value;newOrder.dirty=true;
        if(critical.has(key))changedCritical=true;
      }
    });
    if(changedCritical)invalidateNewSetup(true);
  }
  function invalidateNewSetup(materialChanged=false){
    if(materialChanged)newOrder.materialsConfirmed=false;
    newOrder.setupConfirmed=false;
    newOrder.draft.mill='';
  }

  function newOrderEdit(){
    const d=newOrder.draft;
    const customerNames=[j.customer_name,...customers.filter(x=>x!==j.customer_name)];
    return '<div class="new-order-form-grid"><datalist id="new-order-customers">'+customerNames.map(x=>'<option value="'+esc(x)+'"></option>').join('')+'</datalist><datalist id="new-order-parts">'+parts.map(x=>'<option value="'+esc(x)+'"></option>').join('')+'</datalist>'+
      newOrderSection({number:'01',title:'Customer & order details',description:'Identify the customer, purchase order, part, quantity, and commercial terms.',
        content:'<div class="new-order-fields">'+
          newOrderField('customer','Customer',{required:true,placeholder:'Customer name'})+
          newOrderField('po','Customer PO / reference',{required:true,placeholder:'e.g. PO-44850'})+
          newOrderField('part','Part number',{required:true,placeholder:'e.g. AF-1250-083'})+
          newOrderField('description','Part description',{required:true,placeholder:'What is being manufactured?',wide:true})+
          newOrderField('quantity','Ordered quantity',{type:'number',required:true,min:'1',step:'1',placeholder:'Tubes'})+
          newOrderField('unitPrice','Sales price per unit',{type:'number',required:true,min:'0',step:'0.01',placeholder:'0.00',note:'Preview total = quantity × unit price.'})+
        '</div><p class="new-order-section-footnote">In Laravel, customer and part should resolve to real records. This demo allows text entry only.</p>'})+
      newOrderSection({number:'02',title:'Part specifications & setup',description:'Enter the manufactured tube specification before checking material compatibility.',
        content:'<div class="new-order-fields">'+
          newOrderField('materialGrade','Material grade',{choices:['304 stainless','316 stainless','316L stainless','Other / see notes'],placeholder:'Select material grade',note:'Required before mill assignment.'})+
          newOrderField('partDimension','Nominal tube diameter / OD',{placeholder:'e.g. 1.250 in',note:'Match the approved part drawing.'})+
          newOrderField('gage','Gage / wall thickness',{type:'number',min:'0.001',step:'0.001',placeholder:'e.g. 0.083',note:'Inches · used for catalog screening.'})+
          newOrderField('stripWidth','Strip width',{type:'number',min:'0.001',step:'0.001',placeholder:'e.g. 4.625',note:'Inches · required for assignment screening.'})+
          newOrderField('finishedLength','Finished tube length',{type:'number',min:'0.001',step:'0.01',placeholder:'e.g. 96.00',note:'Inches · finished part target.'})+
          newOrderField('cutoffLength','Cutoff setup length',{type:'number',min:'0.001',step:'0.01',placeholder:'e.g. 96.00',note:'Inches · machine setup reference.'})+
          newOrderField('pattern','Perforation pattern',{placeholder:'e.g. 60° staggered / Blank'})+
          newOrderField('holeSize','Hole diameter',{placeholder:'e.g. 0.125 in'})+
          newOrderField('centers','Hole center spacing',{placeholder:'e.g. 0.1875 in'})+
          newOrderField('die','Die number',{placeholder:'e.g. D-14'})+
          newOrderField('millWeldSpec','Mill weld specification',{placeholder:'WPS / mill weld procedure'})+
          newOrderField('repairWeldSpec','Repair weld specification',{placeholder:'Only if required'})+
          newOrderField('setupNotes','Setup / tooling notes',{placeholder:'Tooling, first article or specialty instructions…',wide:true})+
        '</div><details class="new-order-advanced"><summary>Additional technical setup · tolerances, ring checks, welding parameters</summary><div class="new-order-fields">'+
          newOrderField('materialAngle','Material angle',{placeholder:'e.g. 90°'})+
          newOrderField('odTolerancePlus','OD + tolerance',{placeholder:'e.g. +0.005 in'})+
          newOrderField('odToleranceMinus','OD − tolerance',{placeholder:'e.g. -0.005 in'})+
          newOrderField('finishedTolerancePlus','Length + tolerance',{placeholder:'e.g. +0.0625 in'})+
          newOrderField('finishedToleranceMinus','Length − tolerance',{placeholder:'e.g. -0.0625 in'})+
          newOrderField('ringMin','Ring minimum OD',{placeholder:'If applicable'})+
          newOrderField('ringMax','Ring maximum OD',{placeholder:'If applicable'})+
          newOrderField('idDrift','ID drift check',{placeholder:'If applicable'})+
          newOrderField('millAmps','Mill weld amps',{placeholder:'e.g. 112 A'})+
          newOrderField('millVolts','Mill weld voltage',{placeholder:'e.g. 21.6 V'})+
          newOrderField('millSpeed','Mill weld speed',{placeholder:'e.g. 42 ft/min'})+
          newOrderField('repairAmps','Repair weld amps',{placeholder:'If applicable'})+
          newOrderField('repairVolts','Repair weld voltage',{placeholder:'If applicable'})+
          newOrderField('repairSpeed','Repair weld speed',{placeholder:'If applicable'})+
        '</div></details><p class="new-order-section-footnote">Part measurements and setup details come from approved engineering records in real TPM. Weld, ring, and tack checks are specific to the tube/process, not automatically independent departments.</p>'})+
      newOrderSection({number:'03',title:'Material planning & allocation',description:'Record required stock footage and select available steel coils / mesh for this order.',
        content:'<div class="new-order-fields">'+
          newOrderField('requiredBlankLF','Required blank steel (LF)',{type:'number',min:'0',step:'0.01',placeholder:'0.00',note:'Enter TPM planning requirement; no auto-generated shortage.'})+
          newOrderField('requiredPerforatedLF','Required perforated steel (LF)',{type:'number',min:'0',step:'0.01',placeholder:'0.00',note:'Enter separately from blank footage.'})+
          newOrderField('meshRequired','Mesh needed for this job?',{choices:['no','yes'],placeholder:'Select mesh requirement',note:'When yes, required mesh LF must be entered and covered.'})+
          newOrderField('requiredMeshLF','Required mesh length (LF)',{type:'number',min:'0',step:'0.01',placeholder:'0.00',note:'Only applies if mesh is required.'})+
        '</div><div id="new-order-material-workspace">'+newMaterialsWorkspace()+'</div>'+
        '<p class="new-order-section-footnote">Steel requirements, blank/perforated shortage, and mesh length are normally computed by TPM (e.g., weight and mesh total endpoints). This browser demo uses manually entered requirements and mock catalog quantities. No stock is reserved.</p>'})+
      newOrderSection({number:'04',title:'Production setup & mill assignment',description:'Complete the setup checklist, then choose the mill and team after material coverage is verified.',
        content:'<div class="new-order-fields">'+
          newOrderField('cutoffOp','Cutoff operator',{placeholder:'Assign later'})+
          newOrderField('inspector','Inspector',{placeholder:'Assign later'})+
          newOrderField('repairWelder','Repair welder',{placeholder:'Only if applicable'})+
        '</div><div id="new-order-setup-workspace">'+newSetupWorkspace()+'</div>'})+
      newOrderSection({number:'05',title:'Schedule & shipping',description:'Capture critical dates and shipping instructions before production begins.',
        content:'<div class="new-order-fields">'+
          newOrderField('ordered','Date ordered',{type:'date',required:true})+
          newOrderField('due','Order due date',{type:'date',required:true})+
          newOrderField('shipDate','Planned ship date',{type:'date',note:'Optional. Must not exceed the due date.'})+
          newOrderField('shipMethod','Shipping method',{choices:['Customer pickup','Freight','Local delivery','Parcel','Other'],placeholder:'Choose later'})+
          newOrderField('containerType','Container type',{choices:['Crate','Box','Bundle','Pallet','Other'],placeholder:'Choose later'})+
        '</div>'})+
      newOrderSection({number:'06',title:'Instructions & requirements',description:'Record additional manufacturing and customer notes.',
        content:'<div class="new-order-fields">'+newOrderNotes()+'</div>'})+
      '</div>';
  }
  function newOrderReview(){
    const d=newOrder.draft,q=Number(d.quantity)||0,p=Number(d.unitPrice)||0,r=newRequirements();
    const groups=[
      ['Customer & order',[
        ['Customer',d.customer],['Purchase order',d.po],['Part number',d.part],
        ['Description',d.description],['Quantity',formatInt(q)+' tubes'],
        ['Sales price per unit',money(p)],['Estimated total',money(q*p)]
      ]],
      ['Part specifications',[
        ['Material grade',d.materialGrade||'Not specified'],['Tube diameter / OD',d.partDimension||'—'],
        ['Strip width',d.stripWidth?d.stripWidth+' in':'Not entered'],
        ['Gage',d.gage?d.gage+' in':'Not entered'],
        ['Finished length',d.finishedLength?d.finishedLength+' in':'Not entered'],
        ['Cutoff setup',d.cutoffLength?d.cutoffLength+' in':'Not entered'],
        ['Perforation',d.pattern||'—'],['Hole diameter',d.holeSize||'—'],['Centers',d.centers||'—'],
        ['Die',d.die||'Not assigned'],['Mill WPS',d.millWeldSpec||'—'],
        ['OD tolerances',[d.odTolerancePlus,d.odToleranceMinus].filter(Boolean).join(' / ')||'—'],
        ['Finished length tolerances',[d.finishedTolerancePlus,d.finishedToleranceMinus].filter(Boolean).join(' / ')||'—'],
        ['Ring OD range',[d.ringMin,d.ringMax].filter(Boolean).join('–')||'—'],
        ['ID drift',d.idDrift||'—'],
        ['Mill welding',[d.millAmps,d.millVolts,d.millSpeed].filter(Boolean).join(' · ')||'—'],
        ['Repair welding',[d.repairAmps,d.repairVolts,d.repairSpeed].filter(Boolean).join(' · ')||'—'],
        ['Repair WPS',d.repairWeldSpec||'—']
      ]],
      ['Material planning & allocation',[
        ['Blank required',r.requested.blank===null?'Not entered':fmtLF(r.requested.blank)],
        ['Blank allocated',fmtLF(r.allocated.blank)],
        ['Perforated required',r.requested.perforated===null?'Not entered':fmtLF(r.requested.perforated)],
        ['Perforated allocated',fmtLF(r.allocated.perforated)],
        ['Mesh required',r.meshRequired?'Yes':'No'],
        ['Mesh LF required',r.meshRequired?(r.requested.mesh===null?'Not entered':fmtLF(r.requested.mesh)):'Not required'],
        ['Mesh LF allocated',fmtLF(r.allocated.mesh)],
        ['Coils selected',String(r.coil.length)],['Mesh rolls selected',String(r.mesh.length)],
        ['Material check',newOrder.materialsConfirmed?'Acknowledged in preview':'Pending'],
        ['Allocation coverage',r.coverageReady?'Covered in preview':'Pending / insufficient']
      ]],
      ['Production setup & mill',[
        ['Setup checklist',newOrder.setupConfirmed?'Confirmed in preview':'Pending'],
        ['Mill',d.mill||'Unassigned'],
        ['Mill operator',d.millOp||'Unassigned'],['Cutoff operator',d.cutoffOp||'Unassigned'],
        ['Inspector',d.inspector||'Unassigned'],['Repair welder',d.repairWelder||'Unassigned']
      ]],
      ['Schedule & shipping',[
        ['Order date',localDate(d.ordered)],['Due date',localDate(d.due)],
        ['Planned ship',d.shipDate?localDate(d.shipDate):'Not set'],
        ['Shipping method',d.shipMethod||'Not set'],['Container',d.containerType||'Not set']
      ]]
    ];
    const allocatedIds='Coils: '+(r.coil.map(x=>x.id).join(', ')||'None')+' · Mesh: '+(r.mesh.map(x=>x.id).join(', ')||'None');
    return '<div class="new-order-review"><div class="new-order-review-heading"><span class="new-order-mini">REVIEW BEFORE CREATION</span><h2>Confirm manufacturing order</h2><p>Review the part setup, allocations, and mill assignment. This is a browser preview and does not reserve stock.</p></div>'+
      groups.map(([title,pairs])=>'<section class="new-order-review-group"><h3>'+esc(title)+'</h3><dl>'+
        pairs.map(([label,value])=>'<div><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl></section>').join('')+
      '<section class="new-order-review-group"><h3>Selected inventory IDs</h3><p class="new-order-review-notes">'+esc(allocatedIds)+'</p></section>'+
      '<section class="new-order-review-group"><h3>Setup notes / manufacturing instructions</h3><p class="new-order-review-notes">'+esc(d.setupNotes||'No setup-specific notes.')+'</p><p class="new-order-review-notes">'+esc(d.notes||'No additional manufacturing instructions.')+'</p></section>'+
      '<div class="new-order-review-warning"><strong>New status: Not started.</strong> '+(r.setupReady?(d.mill?'Mill assigned in the browser preview.':'Setup checked, but no mill selected.'):'This is an unassigned draft with outstanding setup or material requirements.')+' No real TPM materials, mill schedule, customer record, or production data are changed.</div></div>';
  }
  function newOrderPage(){
    const review=newOrder.step==='review';
    return '<div class="new-order-page"><header class="new-order-heading"><div><button type="button" class="orders-mobile-menu" data-shell-open aria-label="Open TPM navigation">☰</button><span class="new-order-mini">TPM / ORDERS / NEW ORDER</span>'+
      '<h1>New order</h1><p>Create a manufacturing order using the same visual language as the redesigned TPM workspace.</p></div>'+
      '<div class="new-order-heading-actions"><span class="orders-demo-pill">PREVIEW ONLY · LOCAL BROWSER</span><button type="button" class="new-order-subtle" data-new-order-action="cancel">← All Orders</button></div></header>'+
      '<div class="new-order-step-strip"><span class="'+(!review?'is-current':'is-finished')+'"><b>1</b> Order details</span><span class="'+(review?'is-current':'')+'"><b>2</b> Review & confirm</span><span class="new-order-step-right">New orders start as <strong>Not started</strong></span></div>'+
      '<div class="new-order-layout"><main class="new-order-main">'+(review?newOrderReview():newOrderEdit())+
      '<div class="new-order-form-footer">'+(review?
        '<button type="button" class="new-order-subtle" data-new-order-action="edit">← Back to edit</button>'+
        '<button type="button" class="new-order-primary" data-new-order-action="create">Create preview order <span aria-hidden="true">→</span></button>':
        '<button type="button" class="new-order-subtle" data-new-order-action="cancel">Cancel</button>'+
        '<button type="button" class="new-order-primary" data-new-order-action="review">Review order <span aria-hidden="true">→</span></button>'
      )+'</div></main><aside class="new-order-aside" aria-label="Draft summary" id="new-order-summary">'+newOrderSummary()+'</aside></div></div>';
  }
  function renderNewOrder({keepScroll=false}={}){
    const y=window.scrollY;
    view.innerHTML=newOrderPage();
    if(keepScroll)window.scrollTo({top:y,behavior:'instant'});
    else window.scrollTo({top:0,behavior:'instant'});
  }
  function showNewOrder({fresh=false}={}){
    if(fresh)newOrder=freshNewOrder();
    const url=new URL(location.href);url.searchParams.set('view','new-order');url.searchParams.delete('job');
    history.replaceState(null,'',url);
    setHeaderListMode(true);
    renderNewOrder();
    document.title='TPM · New Order · Design Preview';
  }
  function reviewDraft(){
    syncNewOrderInputs();
    if(!validateNewOrder()){
      newOrder.step='edit';
      renderNewOrder();
      const firstError=Object.keys(newOrder.errors)[0];
      document.getElementById('new-order-'+firstError)?.focus({preventScroll:false});
      notify('Complete the highlighted required fields before reviewing.');
      return;
    }
    newOrder.step='review';renderNewOrder();
  }
  function createPreviewOrder(){
    syncNewOrderInputs();
    if(!validateNewOrder()){newOrder.step='edit';renderNewOrder();notify('Order details need correction.');return}
    const d=newOrder.draft;
    const id=String(Math.max(990163,...sample.map(r=>Number(r.id)||0))+1);
    const order={
      id,customer:newFieldValue('customer'),po:newFieldValue('po'),
      part:newFieldValue('part'),description:newFieldValue('description'),
      quantity:Number(d.quantity),unitPrice:Number(d.unitPrice),
      status:'not_started',progress:0,ordered:d.ordered,due:d.due,mill:d.mill||'Unassigned',
      source:false,created:true,priority:false,
      shipDate:d.shipDate,millOp:d.millOp,cutoffOp:d.cutoffOp,inspector:d.inspector,
      repairWelder:d.repairWelder,die:d.die,millWeldSpec:d.millWeldSpec,
      repairWeldSpec:d.repairWeldSpec,shipMethod:d.shipMethod,containerType:d.containerType,
      notes:d.notes,
      materialGrade:d.materialGrade,partDimension:d.partDimension,gage:d.gage,
      stripWidth:d.stripWidth,pattern:d.pattern,holeSize:d.holeSize,centers:d.centers,
      finishedLength:d.finishedLength,cutoffLength:d.cutoffLength,
      odTolerancePlus:d.odTolerancePlus,odToleranceMinus:d.odToleranceMinus,
      finishedTolerancePlus:d.finishedTolerancePlus,finishedToleranceMinus:d.finishedToleranceMinus,
      ringMin:d.ringMin,ringMax:d.ringMax,idDrift:d.idDrift,materialAngle:d.materialAngle,
      millAmps:d.millAmps,millVolts:d.millVolts,millSpeed:d.millSpeed,
      repairAmps:d.repairAmps,repairVolts:d.repairVolts,repairSpeed:d.repairSpeed,
      requiredBlankLF:d.requiredBlankLF,requiredPerforatedLF:d.requiredPerforatedLF,
      requiredMeshLF:d.requiredMeshLF,meshRequired:d.meshRequired,setupNotes:d.setupNotes,
      allocatedCoils:[...newOrder.allocatedCoils],allocatedMesh:[...newOrder.allocatedMesh],
      materialsConfirmed:newOrder.materialsConfirmed,setupConfirmed:newOrder.setupConfirmed
    };
    sample.push(order);createdOrders.push(order);persistPreviewCreated();
    ordersState.status='all';ordersState.search=id;ordersState.mill='all';ordersState.onlyPriority=false;ordersState.page=1;clearSelection();
    newOrder=freshNewOrder();
    showIndex();
    notify('Preview order #'+id+' created in this browser only.');
  }
  function discardNewOrder(){
    if(newOrder.dirty&&!window.confirm('Discard the unfinished preview order?'))return;
    newOrder=freshNewOrder();
    showIndex();
  }
  function inspectPreviewOrder(order){
    if(typeof modal!=='function')return notify('Order #'+order.id+' is a preview-only record.');
    const fields=[
      ['Customer',order.customer],['PO',order.po],['Part',order.part],['Description',order.description],
      ['Quantity',formatInt(order.quantity)+' tubes'],['Price per unit',money(order.unitPrice)],
      ['Estimated total',money(order.quantity*order.unitPrice)],['Due date',localDate(order.due)],
      ['Material grade',order.materialGrade||'Not entered'],['Strip width',order.stripWidth?order.stripWidth+' in':'Not entered'],
      ['Gage',order.gage||'Not entered'],['Finished length',order.finishedLength||'Not entered'],
      ['Cutoff setup',order.cutoffLength||'Not entered'],['Die',order.die||'Not entered'],
      ['Blank requirement',order.requiredBlankLF?order.requiredBlankLF+' LF':'Not entered'],
      ['Perforated requirement',order.requiredPerforatedLF?order.requiredPerforatedLF+' LF':'Not entered'],
      ['Mesh required',order.meshRequired==='yes'?'Yes':'No'],
      ['Mesh requirement',order.meshRequired==='yes'?(order.requiredMeshLF?order.requiredMeshLF+' LF':'Not entered'):'Not required'],
      ['Allocated steel coils',(order.allocatedCoils||[]).join(', ')||'None'],
      ['Allocated mesh rolls',(order.allocatedMesh||[]).join(', ')||'None'],
      ['Material verification',order.materialsConfirmed?'Acknowledged in preview':'Pending'],
      ['Setup verification',order.setupConfirmed?'Acknowledged in preview':'Pending'],
      ['Mill',order.mill],['Status','Not started']
    ];
    modal('Preview order #'+order.id,'Browser-only order · Not saved to TPM',
      '<dl class="prod-detail-fields">'+fields.map(([key,value])=>
        '<div><dt>'+esc(key)+'</dt><dd>'+esc(value||'—')+'</dd></div>').join('')+'</dl>'+
        '<p class="new-order-dialog-note">This order, its selected inventory and mill assignment are browser-only. No production or allocation records exist in TPM. Only Job #'+esc(j.job)+' has detailed source fixtures.</p>',
      '<button type="button" class="btn" data-op="close-dialog">Close</button>');
  }

  const labelFor = status => ({started:'Started',not_started:'Not started',completed:'Completed',shipped:'Shipped'})[status]||status;
  const allRows = () => {
    const needle=ordersState.search.toLowerCase().trim();
    let rows=sample.filter(o=>
      (ordersState.status==='all'||o.status===ordersState.status) &&
      (ordersState.mill==='all'||o.mill===ordersState.mill) &&
      (!ordersState.onlyPriority||ordersState.flags.has(o.id)) &&
      (!needle||[o.id,o.customer,o.po,o.part,o.description,o.mill].some(x=>String(x||'').toLowerCase().includes(needle)))
    );
    const sort=ordersState.sort;
    rows.sort((a,b)=>sort==='job'?Number(b.id)-Number(a.id):
      sort==='quantity'?b.quantity-a.quantity:
      sort==='progress'?(b.progress/b.quantity)-(a.progress/a.quantity):
      sort==='customer'?a.customer.localeCompare(b.customer):
      sort==='oldest'?a.due.localeCompare(b.due):
      a.due.localeCompare(b.due));
    return rows;
  };
  const pageRows=rows=>rows.slice((ordersState.page-1)*ordersState.pageSize,ordersState.page*ordersState.pageSize);
  const statusCounts=status=>status==='all'?sample.length:sample.filter(o=>o.status===status).length;
  const selectionText=()=>ordersState.selected.size+' selected';
  const statusChip=(status)=>'<span class="orders-state-tag orders-state-'+esc(status)+'"><span class="orders-state-dot"></span>'+esc(labelFor(status))+'</span>';
  const csvEscape=x=>'"'+String(x??'').replaceAll('"','""')+'"';
  const downloadSelected=()=>{
    const rows=sample.filter(x=>ordersState.selected.has(x.id));
    if(!rows.length)return;
    const keys=['Job #','Customer','PO #','Part','Quantity','Status','Inspected','Due date','Mill','Source'];
    const csv=[keys,...rows.map(r=>[r.id,r.customer,r.po,r.part,r.quantity,labelFor(r.status),r.progress,r.due,r.mill,r.source?'Original fixture':'Fictional sample'])]
      .map(line=>line.map(csvEscape).join(',')).join('\r\n');
    const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='tpm-preview-orders-selected.csv';document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  function listHtml(){
    const filtered=allRows(),pages=Math.max(1,Math.ceil(filtered.length/ordersState.pageSize));
    ordersState.page=Math.min(Math.max(1,ordersState.page),pages);
    const rows=pageRows(filtered);
    const selectedInPage=rows.filter(o=>ordersState.selected.has(o.id)).length;
    const selectedCount=ordersState.selected.size;
    const totalQty=sample.reduce((total,r)=>total+r.quantity,0);
    const inProduction=sample.filter(r=>r.status==='started').length;
    const finished=sample.filter(r=>r.status==='completed'||r.status==='shipped').length;
    const cards=[
      ['All orders',formatInt(sample.length),'Source + fictional orders','all'],
      ['In production',formatInt(inProduction),'Currently started','started'],
      ['Awaiting production',formatInt(sample.filter(r=>r.status==='not_started').length),'Not started','not_started'],
      ['Completed / shipped',formatInt(finished),'Finished in the sample','completed']
    ];
    return '<div class="orders-index" aria-label="TPM Orders list">'
      +'<header class="orders-list-head"><div class="orders-list-identity"><button type="button" class="orders-mobile-menu" data-shell-open aria-label="Open TPM sidebar">☰</button><div class="orders-list-crumb">TPM / MANUFACTURING / ORDERS</div><h1>Orders <span class="orders-list-number">'+formatInt(sample.length)+'</span></h1><p>Manage manufacturing orders, find jobs quickly and work with multiple records in one view.</p></div>'
      +'<div class="orders-list-head-actions"><span class="orders-demo-pill">DEMO DATA · NOT CONNECTED TO TPM</span>'
      +'<button type="button" class="orders-list-secondary" data-orders-open="'+esc(j.job)+'">Sample job ↗</button>'
      +'<button type="button" class="orders-primary-button" data-orders-new>+ New order</button></div></header>'
      +'<section class="orders-list-metrics" aria-label="Order status summary">'+cards.map(([title,value,sub,status])=>
        '<button type="button" data-orders-status="'+status+'" class="orders-list-metric '+(ordersState.status===status?'is-active':'')+'" aria-pressed="'+String(ordersState.status===status)+'">'
        +'<span class="orders-list-metric-name">'+title+'</span><strong>'+value+'</strong><span class="orders-list-metric-foot">'+sub+'</span></button>'
      ).join('')+'</section>'
      +'<section class="orders-table-section"><div class="orders-section-head"><div><div class="orders-section-kicker">ORDER MANAGEMENT</div><h2>Manufacturing orders</h2><p>Search and filter by order status, customer, part, or assigned mill.</p></div><span class="orders-section-count">'+formatInt(filtered.length)+' matching</span></div>'
      +'<div class="orders-status-tabs" role="group" aria-label="Order status">'+statuses.map(([val,title])=>
        '<button type="button" data-orders-status="'+val+'" aria-pressed="'+String(ordersState.status===val)+'">'+esc(title)+'<span>'+formatInt(statusCounts(val))+'</span></button>'
      ).join('')+'</div>'
      +'<div class="orders-tools">'
      +'<label class="orders-tool orders-tool-search">Search orders<input type="search" data-orders-search placeholder="Job #, customer, PO, part number…" autocomplete="off" value="'+esc(ordersState.search)+'"></label>'
      +'<label class="orders-tool">Mill<select data-orders-filter="mill"><option value="all">All mills</option>'+mills.map(x=>'<option '+(ordersState.mill===x?'selected':'')+' value="'+esc(x)+'">'+esc(x)+'</option>').join('')+'</select></label>'
      +'<label class="orders-tool">Sort by<select data-orders-filter="sort">'+[['due','Due date (soonest)'],['oldest','Due date (latest)'],['job','Newest job #'],['quantity','Largest quantity'],['progress','Most complete'],['customer','Customer A–Z']].map(([v,t])=>'<option value="'+v+'" '+(ordersState.sort===v?'selected':'')+'>'+t+'</option>').join('')+'</select></label>'
      +'<label class="orders-tool orders-tool-size">Rows<select data-orders-filter="pageSize">'+[10,25,50].map(v=>'<option value="'+v+'" '+(ordersState.pageSize===v?'selected':'')+'>'+v+'</option>').join('')+'</select></label>'
      +'<label class="orders-priority-toggle"><input type="checkbox" data-orders-priority '+(ordersState.onlyPriority?'checked':'')+'>Flagged only</label>'
      +'</div>'
      +(selectedCount?'<div class="orders-bulk-bar" role="region" aria-label="Bulk order actions"><div><strong>'+selectionText()+'</strong><span> across this order list</span></div><div class="orders-bulk-actions"><button type="button" data-orders-act="filtered">Select all '+filtered.length+' matching</button><button type="button" data-orders-act="flag">Flag for review</button><button type="button" data-orders-act="unflag">Remove flag</button><button type="button" data-orders-act="export">Export CSV</button><button type="button" data-orders-act="clear">Clear selection</button></div></div>':'')
      +'<div class="orders-table-scroll" role="region" aria-label="Scrollable manufacturing orders table" tabindex="0"><table class="orders-index-table"><thead><tr>'
      +'<th class="orders-select-column"><input id="orders-index-header-select" type="checkbox" data-orders-page-check aria-label="Select orders on this page" '+(rows.length&&selectedInPage===rows.length?'checked':'')+'></th>'
      +'<th scope="col">Job #</th><th scope="col">Customer / PO</th><th scope="col">Part number</th><th scope="col" class="orders-align-right">Quantity</th><th scope="col">Status</th><th scope="col">Inspection progress</th><th scope="col">Due date</th><th scope="col">Mill</th><th scope="col" class="orders-align-right">Action</th></tr></thead><tbody>'
      +(rows.length?rows.map(order=>'<tr class="'+(ordersState.selected.has(order.id)?'orders-row-selected':'')+'">'
        +'<td class="orders-select-column"><input type="checkbox" data-orders-check="'+esc(order.id)+'" aria-label="Select job '+esc(order.id)+'" '+(ordersState.selected.has(order.id)?'checked':'')+'></td>'
        +'<td><button type="button" data-orders-open="'+esc(order.id)+'" class="orders-job-link">#'+esc(order.id)+'</button><span class="orders-source-label">'+(order.source?'SOURCE FIXTURE':order.created?'BROWSER PREVIEW':'DEMO ORDER')+'</span></td>'
        +'<td><strong class="orders-customer">'+esc(order.customer)+'</strong><span class="orders-secondary">'+esc(order.po)+'</span></td>'
        +'<td><span class="orders-part">'+esc(order.part)+'</span>'+(ordersState.flags.has(order.id)?'<span class="orders-flag" title="Flagged for review in this preview">⚑</span>':'')+'</td>'
        +'<td class="orders-align-right orders-number">'+formatInt(order.quantity)+'</td>'
        +'<td>'+statusChip(order.status)+'</td>'
        +'<td><div class="orders-progress-top"><strong>'+pct(order.progress,order.quantity)+'%</strong><span>'+formatInt(order.progress)+' / '+formatInt(order.quantity)+'</span></div><div class="orders-progress"><span style="width:'+pct(order.progress,order.quantity)+'%"></span></div></td>'
        +'<td><span class="orders-date">'+esc(localDate(order.due))+'</span></td><td>'+esc(order.mill)+'</td>'
        +'<td class="orders-align-right"><button type="button" class="orders-view-button" data-orders-open="'+esc(order.id)+'">View ↗</button></td></tr>').join(''):'<tr><td colspan="10" class="orders-empty">No orders match these filters. Try another status or clear the search.</td></tr>')+'</tbody></table></div>'
      +'<div class="orders-footer"><span>Showing <strong>'+(filtered.length?(ordersState.page-1)*ordersState.pageSize+1:0)+'–'+Math.min(filtered.length,ordersState.page*ordersState.pageSize)+'</strong> of <strong>'+formatInt(filtered.length)+'</strong> matching orders'
      +' · '+formatInt(totalQty)+' total sample tubes</span>'
      +'<div class="orders-pagination"><button type="button" data-orders-page="prev" '+(ordersState.page<=1?'disabled':'')+'>← Previous</button><span>Page '+ordersState.page+' of '+pages+'</span><button type="button" data-orders-page="next" '+(ordersState.page>=pages?'disabled':'')+'>Next →</button></div></div>'
      +'</section>'
      +'<p class="orders-index-disclaimer"><strong>Preview only.</strong> Job #'+esc(j.job)+' uses the existing sample job fixture and opens the full Overview, Production, Scrap, Materials, Report and History views. Other orders are synthetic examples for styling and selection tests. Locally created orders are saved to this browser only. Flag actions are temporary; no Laravel orders or production data are changed.</p>'
      +'</div>';
  }
  function setHeaderListMode(on){
    document.body.classList.toggle('orders-list-mode',on);
    top.setAttribute('aria-hidden',String(on));
    const nav=top.querySelectorAll('button,input,select,a');
    nav.forEach(el=>{if(on)el.setAttribute('tabindex','-1');else el.removeAttribute('tabindex')});
  }
  function refreshList(options={}){
    const searchFocused=document.activeElement?.hasAttribute('data-orders-search');
    const selectionStart=searchFocused?document.activeElement.selectionStart:null;
    const y=window.scrollY;
    view.innerHTML=listHtml();
    const checkbox=document.getElementById('orders-index-header-select');
    if(checkbox){
      const rows=pageRows(allRows());
      checkbox.indeterminate=rows.some(o=>ordersState.selected.has(o.id))&&!rows.every(o=>ordersState.selected.has(o.id));
    }
    if(options.preserveSearch&&searchFocused){
      const inp=view.querySelector('[data-orders-search]');
      if(inp){inp.focus({preventScroll:true});if(selectionStart!==null)inp.setSelectionRange(selectionStart,selectionStart)}
    }
    if(options.keepScroll)window.scrollTo({top:y,behavior:'instant'});
    else window.scrollTo({top:0,behavior:'instant'});
  }
  const notify = message => {
    const notice=document.getElementById('preview-toast');
    if(notice){notice.textContent=message;notice.classList.add('show');setTimeout(()=>notice.classList.remove('show'),3800)}
    else alert(message);
  };
  const clearSelection=()=>ordersState.selected.clear();
  function openJob(id){
    const source=sample.find(o=>o.id===String(id));
    if(!source)return;
    if(!source.source){
      if(source.created)inspectPreviewOrder(source);
      else notify('Job #'+id+' is a fictional list-row example. Open Job #'+j.job+' for the complete source-backed details.');
      return;
    }
    const url=new URL(location.href);
    url.searchParams.set('job',id);
    url.searchParams.set('view','overview');
    history.replaceState(null,'',url);
    navigate('overview');
  }
  function showIndex(){
    const url=new URL(location.href);
    url.searchParams.set('view','overview');url.searchParams.delete('job');
    history.replaceState(null,'',url);
    setHeaderListMode(true);
    refreshList();
    document.title='TPM · Orders · Design Preview';
  }
  navigate=function(route){
    if(route==='new-order'){showNewOrder();return}
    const hasJob=new URLSearchParams(location.search).has('job');
    if(route==='overview'&&!hasJob){showIndex();return;}
    if(route!=='overview'&&!hasJob){
      const url=new URL(location.href);
      url.searchParams.set('job',String(j.job));
      history.replaceState(null,'',url);
    }
    setHeaderListMode(false);
    originalNavigate(route);
    document.title='TPM · Job #'+j.job+' · Design Preview';
  };
  const crumb=top.querySelector('.c-crumbs');
  if(crumb&&!crumb.querySelector('[data-orders-back]')){
    const back=document.createElement('button');
    back.type='button';back.className='orders-back-button';back.dataset.ordersBack='';
    back.textContent='← All Orders';back.title='Back to the Orders list';
    crumb.prepend(back);
  }
  let searchTimer;
  document.addEventListener('click',event=>{
    const sidebar=event.target.closest('[data-shell-nav="Orders"]');
    if(sidebar){
      event.preventDefault();event.stopImmediatePropagation();
      showIndex();
      return;
    }
    const back=event.target.closest('[data-orders-back]');
    if(back){event.preventDefault();event.stopImmediatePropagation();showIndex();return;}

    const kind=event.target.closest('[data-new-material-kind]');
    if(kind&&document.querySelector('.new-order-page')){
      event.preventDefault();event.stopImmediatePropagation();
      newOrder.materialKind=kind.dataset.newMaterialKind;
      newOrder.materialPage=1;newOrder.materialSearch='';
      refreshMaterialOnly({keepScroll:true});return;
    }
    const matPage=event.target.closest('[data-new-material-page]');
    if(matPage&&document.querySelector('.new-order-page')){
      event.preventDefault();event.stopImmediatePropagation();
      const length=newMaterialRows().length,totalPages=Math.max(1,Math.ceil(length/newOrder.materialPageSize));
      newOrder.materialPage=Math.min(totalPages,Math.max(1,newOrder.materialPage+(matPage.dataset.newMaterialPage==='next'?1:-1)));
      refreshMaterialOnly({keepScroll:true});return;
    }
    const newOrderButton=event.target.closest('[data-orders-new]');
    if(newOrderButton){event.preventDefault();event.stopImmediatePropagation();showNewOrder({fresh:true});return;}
    const createAction=event.target.closest('[data-new-order-action]');
    if(createAction){
      event.preventDefault();event.stopImmediatePropagation();
      switch(createAction.dataset.newOrderAction){
        case 'cancel':discardNewOrder();break;
        case 'review':reviewDraft();break;
        case 'edit':newOrder.step='edit';renderNewOrder();break;
        case 'create':createPreviewOrder();break;
      }
      return;
    }
    const open=event.target.closest('[data-orders-open]');
    if(open){event.preventDefault();event.stopImmediatePropagation();openJob(open.dataset.ordersOpen);return;}
    if(!document.body.classList.contains('orders-list-mode'))return;
    const status=event.target.closest('[data-orders-status]');
    if(status){
      event.preventDefault();event.stopImmediatePropagation();
      ordersState.status=status.dataset.ordersStatus;ordersState.page=1;clearSelection();refreshList({keepScroll:true});return;
    }
    const paginate=event.target.closest('[data-orders-page]');
    if(paginate){
      event.preventDefault();event.stopImmediatePropagation();
      const pages=Math.max(1,Math.ceil(allRows().length/ordersState.pageSize));
      ordersState.page=Math.min(pages,Math.max(1,ordersState.page+(paginate.dataset.ordersPage==='next'?1:-1)));
      refreshList({keepScroll:true});return;
    }
    const action=event.target.closest('[data-orders-act]');
    if(!action)return;
    event.preventDefault();event.stopImmediatePropagation();
    switch(action.dataset.ordersAct){
      case 'filtered':allRows().forEach(o=>ordersState.selected.add(o.id));break;
      case 'flag':ordersState.selected.forEach(id=>ordersState.flags.add(id));notify('Flagged '+selectionText()+' for review in this preview only.');break;
      case 'unflag':ordersState.selected.forEach(id=>ordersState.flags.delete(id));notify('Removed preview flags.');break;
      case 'export':downloadSelected();notify('CSV export generated for '+selectionText()+'.');return;
      case 'clear':clearSelection();break;
    }
    refreshList({keepScroll:true});
  },true);
  document.addEventListener('change',event=>{

    if(event.target.closest('[data-new-order-field]')&&document.querySelector('.new-order-page')){
      const field=event.target.closest('[data-new-order-field]');
      const key=field.dataset.newOrderField;
      if(newOrder.draft[key]!==field.value){
        newOrder.draft[key]=field.value;newOrder.dirty=true;
        if(['materialGrade','stripWidth','gage','partDimension','die','finishedLength','cutoffLength',
          'requiredBlankLF','requiredPerforatedLF','meshRequired','requiredMeshLF'].includes(key))invalidateNewSetup(true);
      }
      if(document.getElementById('new-order-material-workspace'))refreshMaterialOnly({keepScroll:true});
      return;
    }
    const matRow=event.target.closest('[data-new-material-check]');
    if(matRow&&document.querySelector('.new-order-page')){
      syncNewOrderInputs();
      const kind=newOrder.materialKind,rows=newMaterialCatalog(kind),row=rows.find(x=>x.id===matRow.dataset.newMaterialCheck);
      if(!row)return;
      const selected=kind==='coil'?newOrder.allocatedCoils:newOrder.allocatedMesh;
      if(matRow.checked){
        if(!newCompatibility(row)){notify('Check the part strip width and gage before selecting this material.');refreshMaterialOnly({keepScroll:true});return}
        selected.add(row.id);
      }else selected.delete(row.id);
      newOrder.dirty=true;invalidateNewSetup(true);
      refreshMaterialOnly({keepScroll:true});return;
    }
    const matAll=event.target.closest('[data-new-material-select-page]');
    if(matAll&&document.querySelector('.new-order-page')){
      syncNewOrderInputs();
      const sel=newOrder.materialKind==='coil'?newOrder.allocatedCoils:newOrder.allocatedMesh;
      const rows=newMaterialRows().slice((newOrder.materialPage-1)*newOrder.materialPageSize,newOrder.materialPage*newOrder.materialPageSize);
      rows.filter(newCompatibility).forEach(r=>matAll.checked?sel.add(r.id):sel.delete(r.id));
      newOrder.dirty=true;invalidateNewSetup(true);
      refreshMaterialOnly({keepScroll:true});return;
    }
    const matSelect=event.target.closest('[data-new-material-filter]');
    if(matSelect&&document.querySelector('.new-order-page')){
      const key=matSelect.dataset.newMaterialFilter;
      if(key==='materialType'||key==='materialRole'){newOrder[key]=matSelect.value;newOrder.materialPage=1;refreshMaterialOnly({keepScroll:true})}
      return;
    }
    const compatible=event.target.closest('[data-new-material-compatible]');
    if(compatible&&document.querySelector('.new-order-page')){
      newOrder.materialCompatible=compatible.checked;newOrder.materialPage=1;refreshMaterialOnly({keepScroll:true});return;
    }
    const materialApproval=event.target.closest('[data-new-material-confirm]');
    if(materialApproval&&document.querySelector('.new-order-page')){
      syncNewOrderInputs();
      const readiness=newRequirements();
      newOrder.materialsConfirmed=materialApproval.checked&&readiness.specsReady&&readiness.coverageReady;
      newOrder.dirty=true;invalidateNewSetup(false);
      refreshMaterialOnly({keepScroll:true});return;
    }
    const setupApproval=event.target.closest('[data-new-setup-confirm]');
    if(setupApproval&&document.querySelector('.new-order-page')){
      syncNewOrderInputs();
      const readiness=newRequirements();
      newOrder.setupConfirmed=setupApproval.checked&&readiness.approved;
      newOrder.dirty=true;
      if(!newOrder.setupConfirmed)newOrder.draft.mill='';
      refreshMaterialOnly({keepScroll:true});return;
    }
    if(!document.body.classList.contains('orders-list-mode'))return;
    const check=event.target.closest('[data-orders-check]');
    if(check){if(check.checked)ordersState.selected.add(check.dataset.ordersCheck);else ordersState.selected.delete(check.dataset.ordersCheck);refreshList({keepScroll:true});return}
    const page=event.target.closest('[data-orders-page-check]');
    if(page){const rows=pageRows(allRows());rows.forEach(o=>page.checked?ordersState.selected.add(o.id):ordersState.selected.delete(o.id));refreshList({keepScroll:true});return}
    const select=event.target.closest('[data-orders-filter]');
    if(select){
      const key=select.dataset.ordersFilter;
      ordersState[key]=key==='pageSize'?Number(select.value):select.value;
      ordersState.page=1;clearSelection();refreshList({keepScroll:true});return;
    }
    const priority=event.target.closest('[data-orders-priority]');
    if(priority){ordersState.onlyPriority=priority.checked;ordersState.page=1;clearSelection();refreshList({keepScroll:true})}
  },true);
  document.addEventListener('input',event=>{
    const matSearch=event.target.closest('[data-new-material-search]');
    if(matSearch&&document.querySelector('.new-order-page')){
      newOrder.materialSearch=matSearch.value;
      newOrder.materialPage=1;
      clearTimeout(searchTimer);
      searchTimer=setTimeout(()=>refreshMaterialOnly({keepScroll:true}),110);
      return;
    }
    const newField=event.target.closest('[data-new-order-field]');
    if(newField&&document.querySelector('.new-order-page')){
      const key=newField.dataset.newOrderField;
      if(Object.prototype.hasOwnProperty.call(newOrder.draft,key)){
        newOrder.draft[key]=newField.value;newOrder.dirty=true;
        if(newOrder.errors[key]){
          delete newOrder.errors[key];
          newField.closest('.new-order-field')?.classList.remove('new-order-field-error');
          newField.closest('.new-order-field')?.querySelector('.new-order-error')?.remove();
        }
        const critical=['materialGrade','stripWidth','gage','finishedLength','cutoffLength',
          'requiredBlankLF','requiredPerforatedLF','meshRequired','requiredMeshLF'];
        if(critical.includes(key)){
          invalidateNewSetup(true);
          refreshMaterialOnly({keepScroll:true});
        }else{
          const summary=document.getElementById('new-order-summary');
          if(summary)summary.innerHTML=newOrderSummary();
        }
      }
      return;
    }
    const input=event.target.closest('[data-orders-search]');
    if(!input||!document.body.classList.contains('orders-list-mode'))return;
    ordersState.search=input.value;ordersState.page=1;clearSelection();
    clearTimeout(searchTimer);
    searchTimer=setTimeout(()=>refreshList({keepScroll:true,preserveSearch:true}),150);
  },true);
  window.addEventListener('popstate',()=>{const route=new URLSearchParams(location.search).get('view')||'overview';navigate(route)});
  const initialUrl=new URL(location.href);
  if(window.__TPM_INITIAL_VIEW==='new-order'||initialUrl.searchParams.get('view')==='new-order')showNewOrder({fresh:true});
  else if((initialUrl.searchParams.get('view')||'overview')==='overview'&&!initialUrl.searchParams.has('job'))showIndex();
  else{
    if((initialUrl.searchParams.get('view')||'overview')!=='overview'&&!initialUrl.searchParams.has('job')){
      initialUrl.searchParams.set('job',String(j.job));history.replaceState(null,'',initialUrl);
    }
    setHeaderListMode(false);
  }
})();