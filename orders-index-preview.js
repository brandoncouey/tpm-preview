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
          notes:String(item.notes||'').slice(0,4000)
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
    containerType:'',notes:''
  });
  let newOrder={draft:freshDraft(),step:'edit',errors:{},dirty:false};
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
      '<input '+attrs+' type="'+type+'" value="'+esc(value)+'" placeholder="'+esc(placeholder)+'" autocomplete="off">';
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
    newOrder.errors=errors;
    return !Object.keys(errors).length;
  }
  function newOrderSummary(){
    const d=newOrder.draft,q=Number(d.quantity)||0,p=Number(d.unitPrice)||0;
    const moneyValue=Number.isFinite(q*p)?money(q*p):'—';
    const filled=[!!newFieldValue('customer'),!!newFieldValue('po'),!!newFieldValue('part'),
      !!newFieldValue('description'),!!newFieldValue('quantity'),!!newFieldValue('unitPrice'),
      !!newFieldValue('ordered'),!!newFieldValue('due')];
    const complete=filled.filter(Boolean).length;
    return '<div class="new-order-aside-top"><span class="new-order-mini">ORDER SUMMARY</span><h3>Draft details</h3><p>Values update as you complete the form.</p></div>'+
      '<div class="new-order-summary-list">'+[
        ['Customer',d.customer||'Not selected'],
        ['Part',d.part||'Not selected'],
        ['Quantity',q?formatInt(q)+' tubes':'Not entered'],
        ['Unit price',newFieldValue('unitPrice')?money(p):'Not entered'],
        ['Estimated order total',newFieldValue('quantity')&&newFieldValue('unitPrice')?moneyValue:'—'],
        ['Due date',d.due?localDate(d.due):'Not set'],
        ['Assigned mill',d.mill||'Unassigned']
      ].map(([label,value],i)=>'<div class="'+(i===4?'new-order-summary-emph':'')+'"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong></div>').join('')+'</div>'+
      '<div class="new-order-completion"><div><strong>'+complete+' of 8 required fields</strong><span>'+Math.round(complete/8*100)+'%</span></div><div class="new-order-completion-track"><span style="width:'+Math.round(complete/8*100)+'%"></span></div></div>'+
      '<div class="new-order-aside-note"><strong>Preview only</strong><p>Submitting adds an unstarted sample order to this browser. It does not create a Laravel record or reserve materials.</p></div>';
  }
  function newOrderSection({number,title,description,content}){
    return '<section class="new-order-section" id="new-order-section-'+number+'">'+
      '<header class="new-order-section-head"><span class="new-order-section-number">'+number+'</span><div><h2>'+title+'</h2><p>'+description+'</p></div></header>'+
      '<div class="new-order-section-body">'+content+'</div></section>';
  }
  function newOrderEdit(){
    const d=newOrder.draft;
    const customerNames=[j.customer_name,...customers.filter(x=>x!==j.customer_name)];
    return '<div class="new-order-form-grid">'+
      newOrderSection({number:'01',title:'Customer & order details',description:'Identify the customer, purchase order, and part being manufactured.',
        content:'<div class="new-order-fields">'+
          newOrderField('customer','Customer',{required:true,placeholder:'Customer name'})+
          newOrderField('po','Customer PO / reference',{required:true,placeholder:'e.g. PO-44850'})+
          newOrderField('part','Part number',{required:true,placeholder:'e.g. AF-1250-083'})+
          newOrderField('description','Part description',{required:true,placeholder:'What is being manufactured?',wide:true})+
          newOrderField('quantity','Ordered quantity',{type:'number',required:true,min:'1',step:'1',placeholder:'Tubes'})+
          newOrderField('unitPrice','Sales price per unit',{type:'number',required:true,min:'0',step:'0.01',placeholder:'0.00',note:'Preview total = quantity × unit price.'})+
        '</div><p class="new-order-section-footnote">The preview accepts customer and part text. The live TPM application should use its actual searchable customer and part records.</p>'})+
      newOrderSection({number:'02',title:'Production setup & assignments',description:'Optional initial station and employee assignments. No production work is recorded at creation.',
        content:'<div class="new-order-fields">'+
          newOrderField('mill','Assigned mill',{choices:mills,placeholder:'Assign later'})+
          newOrderField('die','Die number',{placeholder:'Optional die reference'})+
          newOrderField('millOp','Mill operator',{placeholder:'Assign later'})+
          newOrderField('cutoffOp','Cutoff operator',{placeholder:'Assign later'})+
          newOrderField('inspector','Inspector',{placeholder:'Assign later'})+
          newOrderField('repairWelder','Repair welder',{placeholder:'Only if applicable'})+
          newOrderField('millWeldSpec','Mill weld specification',{placeholder:'WPS / specification'})+
          newOrderField('repairWeldSpec','Repair weld specification',{placeholder:'If required'})+
        '</div><p class="new-order-section-footnote">Ring welding and tack-weld checks belong to applicable tube processes. This form does not assume every job requires them.</p>'})+
      newOrderSection({number:'03',title:'Schedule & shipping',description:'Record target dates and shipment preferences before production begins.',
        content:'<div class="new-order-fields">'+
          newOrderField('ordered','Date ordered',{type:'date',required:true})+
          newOrderField('due','Order due date',{type:'date',required:true})+
          newOrderField('shipDate','Planned ship date',{type:'date',note:'Optional. Must not exceed the order due date.'})+
          newOrderField('shipMethod','Shipping method',{choices:['Customer pickup','Freight','Local delivery','Parcel','Other'],placeholder:'Choose later'})+
          newOrderField('containerType','Container type',{choices:['Crate','Box','Bundle','Pallet','Other'],placeholder:'Choose later'})+
        '</div>'})+
      newOrderSection({number:'04',title:'Instructions & requirements',description:'Keep manufacturing notes with the order.',
        content:'<div class="new-order-fields">'+newOrderNotes()+'</div>'})+
      '</div>';
  }
  function newOrderReview(){
    const d=newOrder.draft,q=Number(d.quantity)||0,p=Number(d.unitPrice)||0;
    const groups=[
      ['Customer & order',[
        ['Customer',d.customer],['Purchase order',d.po],['Part number',d.part],
        ['Description',d.description],['Quantity',formatInt(q)+' tubes'],
        ['Sales price per unit',money(p)],['Estimated total',money(q*p)]
      ]],
      ['Production assignments',[
        ['Mill',d.mill||'Not assigned'],['Die',d.die||'—'],
        ['Mill operator',d.millOp||'Unassigned'],['Cutoff operator',d.cutoffOp||'Unassigned'],
        ['Inspector',d.inspector||'Unassigned'],['Repair welder',d.repairWelder||'Unassigned'],
        ['Mill weld spec',d.millWeldSpec||'—'],['Repair weld spec',d.repairWeldSpec||'—']
      ]],
      ['Dates & shipping',[
        ['Order date',localDate(d.ordered)],['Due date',localDate(d.due)],
        ['Planned ship',d.shipDate?localDate(d.shipDate):'Not set'],
        ['Shipping method',d.shipMethod||'Not set'],['Container',d.containerType||'Not set']
      ]]
    ];
    return '<div class="new-order-review"><div class="new-order-review-heading"><span class="new-order-mini">REVIEW BEFORE CREATION</span><h2>Confirm order details</h2><p>Review all information below. Creating this order only saves to your browser-based demo.</p></div>'+
      groups.map(([title,pairs])=>'<section class="new-order-review-group"><h3>'+esc(title)+'</h3><dl>'+
        pairs.map(([label,value])=>'<div><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl></section>').join('')+
      '<section class="new-order-review-group"><h3>Manufacturing instructions</h3><p class="new-order-review-notes">'+esc(d.notes||'No special instructions provided.')+'</p></section>'+
      '<div class="new-order-review-warning"><strong>Status on creation: Not started.</strong> This is a UI-only preview; no real order number, customer association, material allocation, or production schedule is created in TPM.</div></div>';
  }
  function newOrderPage(){
    const review=newOrder.step==='review';
    return '<div class="new-order-page"><header class="new-order-heading"><div><span class="new-order-mini">TPM / ORDERS / NEW ORDER</span>'+
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
    if(fresh)newOrder={draft:freshDraft(),step:'edit',errors:{},dirty:false};
    const url=new URL(location.href);url.searchParams.set('view','new-order');url.searchParams.delete('job');
    history.replaceState(null,'',url);
    setHeaderListMode(true);
    renderNewOrder();
    document.title='TPM · New Order · Design Preview';
  }
  function reviewDraft(){
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
      notes:d.notes
    };
    sample.push(order);createdOrders.push(order);persistPreviewCreated();
    ordersState.status='all';ordersState.search=id;ordersState.mill='all';ordersState.onlyPriority=false;ordersState.page=1;clearSelection();
    newOrder={draft:freshDraft(),step:'edit',errors:{},dirty:false};
    showIndex();
    notify('Preview order #'+id+' created in this browser only.');
  }
  function discardNewOrder(){
    if(newOrder.dirty&&!window.confirm('Discard the unfinished preview order?'))return;
    newOrder={draft:freshDraft(),step:'edit',errors:{},dirty:false};
    showIndex();
  }
  function inspectPreviewOrder(order){
    if(typeof modal!=='function')return notify('Order #'+order.id+' is a preview-only record.');
    const fields=[
      ['Customer',order.customer],['PO',order.po],['Part',order.part],['Description',order.description],
      ['Quantity',formatInt(order.quantity)+' tubes'],['Price per unit',money(order.unitPrice)],
      ['Estimated total',money(order.quantity*order.unitPrice)],['Due date',localDate(order.due)],
      ['Mill',order.mill],['Status','Not started']
    ];
    modal('Preview order #'+order.id,'Created locally · Not saved to TPM',
      '<dl class="prod-detail-fields">'+fields.map(([key,value])=>
        '<div><dt>'+esc(key)+'</dt><dd>'+esc(value||'—')+'</dd></div>').join('')+'</dl>'+
        '<p class="new-order-dialog-note">Only Job #'+esc(j.job)+' has full sample Production, Scrap, Materials, Report and History records in this preview.</p>',
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
      +'<button type="button" class="orders-primary-button" data-orders-open="'+esc(j.job)+'">Open sample job <span aria-hidden="true">↗</span></button></div></header>'
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
        +'<td><button type="button" data-orders-open="'+esc(order.id)+'" class="orders-job-link">#'+esc(order.id)+'</button><span class="orders-source-label">'+(order.source?'SOURCE FIXTURE':'DEMO ORDER')+'</span></td>'
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
      +'<p class="orders-index-disclaimer"><strong>Preview only.</strong> Job #'+esc(j.job)+' uses the existing sample job fixture and opens the full Overview, Production, Scrap, Materials, Report and History views. Other orders are synthetic examples for styling and selection tests. Flag actions are temporary browser-only UI state. No Laravel operations, bulk mutations or permissions are simulated.</p>'
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
      notify('Job #'+id+' is a fictional list-row example. Open Job #'+j.job+' for the complete source-backed details.');
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
    const input=event.target.closest('[data-orders-search]');
    if(!input||!document.body.classList.contains('orders-list-mode'))return;
    ordersState.search=input.value;ordersState.page=1;clearSelection();
    clearTimeout(searchTimer);
    searchTimer=setTimeout(()=>refreshList({keepScroll:true,preserveSearch:true}),150);
  },true);
  window.addEventListener('popstate',()=>{const route=new URLSearchParams(location.search).get('view')||'overview';navigate(route)});
  const initialUrl=new URL(location.href);
  if((initialUrl.searchParams.get('view')||'overview')==='overview'&&!initialUrl.searchParams.has('job'))showIndex();
  else{
    if((initialUrl.searchParams.get('view')||'overview')!=='overview'&&!initialUrl.searchParams.has('job')){
      initialUrl.searchParams.set('job',String(j.job));history.replaceState(null,'',initialUrl);
    }
    setHeaderListMode(false);
  }
})();