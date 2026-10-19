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
    const unfulfilled=sample.filter(r=>r.status==='not_started'||r.status==='started').length;
    const inProduction=sample.filter(r=>r.status==='started').length;
    const finished=sample.filter(r=>r.status==='completed'||r.status==='shipped').length;
    const cards=[
      ['All orders',formatInt(sample.length),'Source + fictional orders','all'],
      ['In production',formatInt(inProduction),'Currently started','started'],
      ['Awaiting production',formatInt(sample.filter(r=>r.status==='not_started').length),'Not started','not_started'],
      ['Completed / shipped',formatInt(finished),'Finished in the sample','completed']
    ];
    return '<div class="orders-index" aria-label="TPM Orders list">'
      +'<header class="orders-list-head"><div class="orders-list-identity"><div class="orders-list-crumb">TPM / MANUFACTURING / ORDERS</div><h1>Orders <span class="orders-list-number">'+formatInt(sample.length)+'</span></h1><p>Manage manufacturing orders, find jobs quickly and work with multiple records in one view.</p></div>'
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
  else setHeaderListMode(false);
})();