const START_CASH = 10000000;
const GOAL = 100000000;
const MAX_DAY = 30;
const storageKey = 'antStockSurvivalV1';

const categories = ['전체 종목', '주식', '바이오', 'IT', '에너지', '게임/기타'];
const initialStocks = [
  { id:'samsung', name:'삼성전자우', category:'IT', price:72300, prev:72300, volume:1234567, volatility:0.045, drift:0.002, history:[] },
  { id:'bio', name:'미래바이오', category:'바이오', price:15750, prev:15750, volume:8765432, volatility:0.115, drift:0.006, history:[] },
  { id:'energy', name:'한빛에너지', category:'에너지', price:8620, prev:8620, volume:2345678, volatility:0.085, drift:0.001, history:[] },
  { id:'coin', name:'게임코인', category:'게임/기타', price:3210, prev:3210, volume:15678901, volatility:0.16, drift:-0.001, history:[] },
  { id:'dividend', name:'대한배당', category:'주식', price:25100, prev:25100, volume:987654, volatility:0.035, drift:0.0015, history:[] },
  { id:'robot', name:'국민로보틱스', category:'IT', price:43800, prev:43800, volume:1888800, volatility:0.075, drift:0.004, history:[] },
  { id:'ship', name:'동해조선', category:'주식', price:12900, prev:12900, volume:1654321, volatility:0.07, drift:0.001, history:[] },
  { id:'food', name:'우리푸드', category:'주식', price:6400, prev:6400, volume:723401, volatility:0.04, drift:0.001, history:[] }
];

const eventPool = [
  { text:'정부, 반도체 산업 지원 확대 검토', targets:['samsung','robot'], power:0.06, tag:'호재' },
  { text:'미래바이오, 임상 결과 발표 기대감', targets:['bio'], power:0.12, tag:'호재' },
  { text:'게임코인 거래소 점검 예정', targets:['coin'], power:-0.10, tag:'악재' },
  { text:'에너지 원가 부담 확대 우려', targets:['energy'], power:-0.07, tag:'악재' },
  { text:'대한배당, 배당금 5% 상향 발표', targets:['dividend'], power:0.045, tag:'호재' },
  { text:'로봇 테마주 단기 과열 경고', targets:['robot'], power:-0.06, tag:'악재' },
  { text:'조선 수주 기대감 확대', targets:['ship'], power:0.07, tag:'호재' },
  { text:'식품주 방어주 매수세 유입', targets:['food'], power:0.035, tag:'호재' },
  { text:'시장 전반 관망세, 거래대금 감소', targets:['samsung','bio','energy','coin','dividend','robot','ship','food'], power:-0.025, tag:'악재' },
  { text:'개인 투자자 순매수 확대', targets:['samsung','bio','energy','coin','dividend','robot','ship','food'], power:0.025, tag:'호재' }
];

let state = loadGame();
let selectedId = state.selectedId || state.stocks[0].id;
let currentTab = '전체 종목';
let buyMode = true;
let sortByReturn = false;

const $ = id => document.getElementById(id);
const format = n => Math.round(n).toLocaleString('ko-KR');
const pct = n => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

function createHistory(base){
  let price = base;
  const arr = [];
  for(let i=0;i<42;i++){
    const open = price;
    const change = (Math.random() - 0.45) * 0.012;
    const close = Math.max(100, open * (1 + change));
    const high = Math.max(open, close) * (1 + Math.random()*0.01);
    const low = Math.min(open, close) * (1 - Math.random()*0.01);
    arr.push({open, close, high, low, volume: Math.random()*100});
    price = close;
  }
  return arr;
}

function loadGame(){
  try{
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if(saved && saved.stocks && saved.portfolio) return saved;
  }catch(e){}
  const stocks = initialStocks.map(s => ({...s, history:createHistory(s.price)}));
  return { day:1, cash:START_CASH, stocks, portfolio:{}, news:[], events:[], selectedId:'samsung', logs:[], startedAt:Date.now() };
}

function saveGame(){
  state.selectedId = selectedId;
  localStorage.setItem(storageKey, JSON.stringify(state));
  $('saveText').textContent = '자동 저장됨';
}

function stock(id){ return state.stocks.find(s => s.id === id); }
function holding(id){ return state.portfolio[id] || {qty:0, avg:0}; }
function stockValue(){ return state.stocks.reduce((sum,s)=> sum + holding(s.id).qty * s.price, 0); }
function netWorth(){ return state.cash + stockValue(); }
function profit(){ return netWorth() - START_CASH; }

function todayDate(){
  const d = new Date(2026,6,5 + state.day - 1);
  return d.toISOString().slice(0,10).replaceAll('-','.');
}

function initTabs(){
  $('tabs').innerHTML = categories.map(c => `<button class="${c===currentTab?'active':''}" data-tab="${c}">${c}</button>`).join('');
  $('tabs').querySelectorAll('button').forEach(btn=>btn.onclick=()=>{currentTab=btn.dataset.tab; render();});
}

function render(){
  initTabs();
  renderTop();
  renderWatch();
  renderNews();
  renderStocks();
  renderChart();
  renderOrder();
  renderPortfolio();
  saveGame();
}

function renderTop(){
  const sv = stockValue(), nw = netWorth(), pf = profit();
  $('dayText').textContent = String(state.day).padStart(2,'0');
  $('dateText').textContent = todayDate();
  $('sessionText').textContent = state.day >= MAX_DAY ? '최종 정산' : '시장 마감';
  $('netWorthText').textContent = `${format(nw)} 원`;
  $('cashText').textContent = `${format(state.cash)} 원`;
  $('stockValueText').textContent = `${format(sv)} 원`;
  $('profitText').textContent = `${pf>=0?'+':''}${format(pf)} 원`;
  $('profitText').className = pf>=0?'up':'down';
  const y = pf / START_CASH * 100;
  $('yieldText').textContent = pct(y);
  $('yieldText').className = y>=0?'up':'down';
  const gp = Math.max(0, Math.min(100, nw / GOAL * 100));
  $('goalProgress').style.width = `${gp}%`;
  $('goalPercent').textContent = `${gp.toFixed(2)}%`;
  $('nextDayBtn').innerHTML = state.day >= MAX_DAY ? '최종 결과 보기<br><span>Result</span>' : `다음 날로 넘기기<br><span>Day ${String(state.day+1).padStart(2,'0')}</span>`;
  $('mainHeadline').textContent = state.news[0]?.text || '반도체 지원 정책 기대감에 관련주 강세';
}

function renderWatch(){
  let list = [...state.stocks];
  if(sortByReturn) list.sort((a,b)=> changeRate(b)-changeRate(a));
  $('watchList').innerHTML = list.slice(0,5).map(s=>`
    <div class="watch-item" data-id="${s.id}">
      <span class="star">★</span><span class="stock-name">${s.name}</span><span>${format(s.price)}</span><span class="${changeRate(s)>=0?'up':'down'}">${pct(changeRate(s))}</span>
    </div>`).join('');
  $('watchList').querySelectorAll('.watch-item').forEach(row=>row.onclick=()=>{selectedId=row.dataset.id; render();});
}

function renderNews(){
  const news = state.news.length ? state.news : [
    {time:'09:10', text:'개장 직후 테마주 중심 변동성 확대', tag:'주의'},
    {time:'10:30', text:'개인 매수세 유입, 중소형주 강세', tag:'호재'},
    {time:'13:15', text:'장 후반 차익실현 매물 출회', tag:'악재'}
  ];
  $('newsList').innerHTML = news.slice(0,5).map(n=>`<div class="news-item"><span class="news-time">${n.time}</span><span>${n.text}</span><b class="tag ${n.tag==='악재'?'bad':'good'}">${n.tag}</b></div>`).join('');
  $('eventList').innerHTML = (state.events.length ? state.events : ['오늘은 큰 이벤트가 없습니다','초반에는 분산투자가 안전합니다','급등주는 다음 날 변동성이 큽니다']).map(x=>`<li>${x.text || x}</li>`).join('');
}

function changeRate(s){ return (s.price - s.prev) / s.prev * 100; }
function changeAmount(s){ return s.price - s.prev; }

function renderStocks(){
  const list = state.stocks.filter(s => currentTab==='전체 종목' || s.category===currentTab);
  $('stockTable').innerHTML = list.map(s=>`
    <tr data-id="${s.id}" class="${s.id===selectedId?'active':''}">
      <td>◆ ${s.name}</td><td>${format(s.price)}</td><td class="${changeAmount(s)>=0?'up':'down'}">${changeAmount(s)>=0?'▲':'▼'} ${format(Math.abs(changeAmount(s)))}</td><td class="${changeRate(s)>=0?'up':'down'}">${pct(changeRate(s))}</td><td>${format(s.volume)}</td>
    </tr>`).join('');
  $('stockTable').querySelectorAll('tr').forEach(row=>row.onclick=()=>{selectedId=row.dataset.id; render();});
}

function renderChart(){
  const s = stock(selectedId);
  $('selectedName').textContent = s.name;
  $('selectedPrice').textContent = `${format(s.price)} ${changeAmount(s)>=0?'▲':'▼'} ${format(Math.abs(changeAmount(s)))} (${pct(changeRate(s))})`;
  $('selectedPrice').className = changeAmount(s)>=0?'up':'down';
  const canvas = $('chartCanvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = '#08121e'; ctx.fillRect(0,0,w,h);
  ctx.strokeStyle = 'rgba(150,180,215,.13)'; ctx.lineWidth = 1;
  for(let i=0;i<7;i++){ const y = 20 + i*(h-55)/6; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
  for(let i=0;i<8;i++){ const x = i*w/7; ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h-35); ctx.stroke(); }
  const data = s.history.slice(-42);
  const max = Math.max(...data.map(d=>d.high));
  const min = Math.min(...data.map(d=>d.low));
  const range = Math.max(1, max-min);
  const cw = w / data.length * .58;
  data.forEach((d,i)=>{
    const x = i*w/data.length + w/data.length*.5;
    const yH = 18 + (max-d.high)/range*(h-70);
    const yL = 18 + (max-d.low)/range*(h-70);
    const yO = 18 + (max-d.open)/range*(h-70);
    const yC = 18 + (max-d.close)/range*(h-70);
    const up = d.close >= d.open;
    ctx.strokeStyle = up ? '#ff4545' : '#2d8cff';
    ctx.fillStyle = up ? '#ff4545' : '#2d8cff';
    ctx.beginPath(); ctx.moveTo(x,yH); ctx.lineTo(x,yL); ctx.stroke();
    ctx.fillRect(x-cw/2, Math.min(yO,yC), cw, Math.max(2, Math.abs(yC-yO)));
    const vh = d.volume / 100 * 28;
    ctx.globalAlpha = .42; ctx.fillRect(x-cw/2, h-35-vh, cw, vh); ctx.globalAlpha = 1;
  });
  ctx.fillStyle = '#c8d7ea'; ctx.font = '13px Arial';
  ctx.fillText('09:00', 8, h-10); ctx.fillText('11:00', w*.28, h-10); ctx.fillText('13:00', w*.58, h-10); ctx.fillText('15:00', w-50, h-10);
}

function renderOrder(){
  const s = stock(selectedId);
  $('orderStockName').textContent = s.name;
  $('orderPrice').textContent = format(s.price);
  $('orderChange').textContent = pct(changeRate(s));
  $('orderChange').className = changeRate(s)>=0?'up':'down';
  if(document.activeElement !== $('orderPriceInput')) $('orderPriceInput').value = Math.round(s.price);
  $('buyMode').classList.toggle('active', buyMode);
  $('sellMode').classList.toggle('active', !buyMode);
  $('submitOrder').textContent = buyMode ? '매수 주문' : '매도 주문';
  $('submitOrder').style.background = buyMode ? 'linear-gradient(180deg,#e33b40,#a31d25)' : 'linear-gradient(180deg,#286be0,#1648aa)';
  updateOrderTotal();
}

function updateOrderTotal(){
  const price = Number($('orderPriceInput').value || 0);
  const qty = Number($('qtyInput').value || 0);
  const total = price * qty;
  $('orderTotal').textContent = `${format(total)} 원`;
  const h = holding(selectedId);
  $('availableText').textContent = buyMode ? `주문 가능 금액 ${format(state.cash)} 원` : `매도 가능 수량 ${format(h.qty)} 주`;
}

function renderPortfolio(){
  const rows = Object.entries(state.portfolio).filter(([id,h])=>h.qty>0);
  if(!rows.length){
    $('portfolioTable').innerHTML = `<tr><td colspan="8" style="text-align:center;color:#9eb1c7;padding:28px">아직 보유 주식이 없습니다. 관심 종목을 선택해서 첫 매수를 해보세요.</td></tr>`;
    return;
  }
  $('portfolioTable').innerHTML = rows.map(([id,h])=>{
    const s = stock(id); const val = h.qty*s.price; const pf = val - h.qty*h.avg; const y = pf/(h.qty*h.avg)*100;
    return `<tr><td>${s.name}</td><td>${format(h.qty)}</td><td>${format(h.avg)}</td><td>${format(s.price)}</td><td>${format(val)}</td><td class="${pf>=0?'up':'down'}">${pf>=0?'+':''}${format(pf)}</td><td class="${y>=0?'up':'down'}">${pct(y)}</td><td><button data-id="${id}">매도</button></td></tr>`;
  }).join('');
  $('portfolioTable').querySelectorAll('button').forEach(btn=>btn.onclick=()=>{selectedId=btn.dataset.id; buyMode=false; render();});
}

function submitOrder(){
  const price = Number($('orderPriceInput').value || 0);
  const qty = Math.floor(Number($('qtyInput').value || 0));
  if(price<=0 || qty<=0){ toast('주문 가격과 수량을 확인하세요.'); return; }
  const s = stock(selectedId); const total = price * qty;
  if(buyMode){
    if(total > state.cash){ toast('현금이 부족합니다.'); return; }
    const h = holding(selectedId);
    const newQty = h.qty + qty;
    const newAvg = (h.avg*h.qty + total) / newQty;
    state.portfolio[selectedId] = {qty:newQty, avg:newAvg};
    state.cash -= total;
    toast(`${s.name} ${qty}주 매수 완료`);
  }else{
    const h = holding(selectedId);
    if(qty > h.qty){ toast('보유 수량이 부족합니다.'); return; }
    state.cash += total;
    h.qty -= qty;
    if(h.qty <= 0) delete state.portfolio[selectedId]; else state.portfolio[selectedId] = h;
    toast(`${s.name} ${qty}주 매도 완료`);
  }
  render();
}

function nextDay(){
  if(state.day >= MAX_DAY){ showResult(); return; }
  state.day += 1;
  const todays = pickEvents();
  state.events = todays;
  state.news = todays.map((e,i)=>({time:['09:05','10:30','13:20'][i] || '14:50', text:e.text, tag:e.tag}));
  state.stocks.forEach(s=>{
    s.prev = s.price;
    const eventImpact = todays.filter(e=>e.targets.includes(s.id)).reduce((sum,e)=>sum+e.power,0);
    const random = (Math.random()*2-1)*s.volatility;
    const jump = Math.max(-0.29, Math.min(0.29, s.drift + random + eventImpact));
    const open = s.price;
    s.price = Math.max(100, Math.round(s.price * (1+jump) / 10) * 10);
    s.volume = Math.max(10000, Math.round(s.volume * (0.7 + Math.random()*0.8) * (1 + Math.abs(jump)*2)));
    const close = s.price;
    const high = Math.max(open, close) * (1 + Math.random()*0.018);
    const low = Math.min(open, close) * (1 - Math.random()*0.018);
    s.history.push({open, close, high, low, volume: Math.random()*100});
    if(s.history.length > 80) s.history.shift();
  });
  if(netWorth() >= GOAL) toast('목표 금액에 도달했습니다. 최종 결과를 확인하세요.');
  render();
}

function pickEvents(){
  const pool = [...eventPool].sort(()=>Math.random()-.5);
  return pool.slice(0,3);
}

function showResult(){
  const nw = netWorth(); const pf = nw - START_CASH; const y = pf/START_CASH*100;
  let grade = '생존 실패';
  if(nw >= GOAL) grade = '전설의 개미';
  else if(y >= 100) grade = '고수익 투자자';
  else if(y >= 20) grade = '침착한 투자자';
  else if(y >= 0) grade = '원금 방어 성공';
  showModal('최종 결과', `<p>최종 자산은 <strong>${format(nw)} 원</strong>입니다.</p><p>총 수익은 <strong class="${pf>=0?'up':'down'}">${pf>=0?'+':''}${format(pf)} 원</strong>, 수익률은 <strong class="${y>=0?'up':'down'}">${pct(y)}</strong>입니다.</p><p>등급은 <strong>${grade}</strong>입니다.</p>`);
}

function showGuide(){
  showModal('게임 가이드', '<p>가상 종목을 매수하고 다음 날로 넘기면 뉴스 이벤트에 따라 가격이 변합니다.</p><p>30일 안에 총자산 1억 원을 만들면 목표 달성입니다.</p><p>데이터는 브라우저에 자동 저장되며 실제 투자 데이터가 아닌 게임용 가상 데이터입니다.</p>');
}
function showRank(){
  const nw = netWorth();
  const rivals = [
    ['상한가요정', 38200000], ['존버개미', 26750000], ['물타기장인', 19420000], ['초보개미', 11200000], ['미현짱', nw]
  ].sort((a,b)=>b[1]-a[1]);
  showModal('브라우저 랭킹', '<p>' + rivals.map((r,i)=>`${i+1}위 ${r[0]} ${format(r[1])} 원`).join('<br>') + '</p>');
}
function showModal(title, body){ $('modalTitle').textContent=title; $('modalBody').innerHTML=body; $('modal').classList.add('show'); }
function toast(msg){ const el=document.createElement('div'); el.className='toast'; el.textContent=msg; document.body.appendChild(el); setTimeout(()=>el.remove(),1900); }

$('buyMode').onclick=()=>{buyMode=true; renderOrder();};
$('sellMode').onclick=()=>{buyMode=false; renderOrder();};
$('submitOrder').onclick=submitOrder;
$('nextDayBtn').onclick=nextDay;
$('resetBtn').onclick=()=>{ if(confirm('게임을 초기화할까요?')){ localStorage.removeItem(storageKey); location.reload(); } };
$('guideBtn').onclick=showGuide;
$('rankBtn').onclick=showRank;
$('modalClose').onclick=()=> $('modal').classList.remove('show');
$('modal').onclick=e=>{ if(e.target.id==='modal') $('modal').classList.remove('show'); };
$('sortBtn').onclick=()=>{sortByReturn=!sortByReturn; $('sortBtn').textContent = sortByReturn ? '기본순' : '수익률순'; renderWatch();};
$('moreNewsBtn').onclick=()=>{state.news = pickEvents().map((e,i)=>({time:['09:40','11:20','14:10'][i], text:e.text, tag:e.tag})); renderNews(); saveGame();};
$('hintBtn').onclick=()=>toast('뉴스 이벤트는 다음 날 가격 변동에 영향을 줍니다.');
$('priceDown').onclick=()=>{$('orderPriceInput').value=Math.max(10,Number($('orderPriceInput').value)-10);updateOrderTotal();};
$('priceUp').onclick=()=>{$('orderPriceInput').value=Number($('orderPriceInput').value)+10;updateOrderTotal();};
$('qtyDown').onclick=()=>{$('qtyInput').value=Math.max(1,Number($('qtyInput').value)-1);updateOrderTotal();};
$('qtyUp').onclick=()=>{$('qtyInput').value=Number($('qtyInput').value)+1;updateOrderTotal();};
$('orderPriceInput').oninput=updateOrderTotal;
$('qtyInput').oninput=updateOrderTotal;
document.querySelectorAll('.quick-pct button').forEach(btn=>btn.onclick=()=>{
  const s = stock(selectedId); const p = Number(btn.dataset.pct)/100;
  if(buyMode) $('qtyInput').value = Math.max(1, Math.floor((state.cash*p)/s.price));
  else $('qtyInput').value = Math.max(1, Math.floor(holding(selectedId).qty*p));
  updateOrderTotal();
});

render();
