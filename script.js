const START_CASH = 10000000;
const storageKey = 'antStockSurvivalV7';
const MARKET_OPEN_MIN = 9 * 60;
const MARKET_CLOSE_MIN = 15 * 60 + 30;
const MARKET_TOTAL_MIN = MARKET_CLOSE_MIN - MARKET_OPEN_MIN;
const REAL_MARKET_MS = 60 * 60 * 1000;
const TICK_MS = 2000;

const categories = ['전체 종목', '주식', '바이오', 'IT', '에너지', '게임/기타', '금융', '소비재'];

function buildInitialStocks(){
  const base = [
    { id:'samsung', name:'삼성전자우', category:'IT', price:72300, prev:72300, volume:1234567, volatility:0.045, drift:0.002, history:[] },
    { id:'bio', name:'미래바이오', category:'바이오', price:15750, prev:15750, volume:8765432, volatility:0.115, drift:0.006, history:[] },
    { id:'energy', name:'한빛에너지', category:'에너지', price:8620, prev:8620, volume:2345678, volatility:0.085, drift:0.001, history:[] },
    { id:'coin', name:'게임코인', category:'게임/기타', price:3210, prev:3210, volume:15678901, volatility:0.16, drift:-0.001, history:[] },
    { id:'dividend', name:'대한배당', category:'주식', price:25100, prev:25100, volume:987654, volatility:0.035, drift:0.0015, history:[] },
    { id:'robot', name:'국민로보틱스', category:'IT', price:43800, prev:43800, volume:1888800, volatility:0.075, drift:0.004, history:[] },
    { id:'ship', name:'동해조선', category:'주식', price:12900, prev:12900, volume:1654321, volatility:0.07, drift:0.001, history:[] },
    { id:'food', name:'우리푸드', category:'소비재', price:6400, prev:6400, volume:723401, volatility:0.04, drift:0.001, history:[] }
  ];
  const prefixes = ['대한','미래','한빛','우리','국민','동해','세종','하나','청담','백두','코리아','서울','유니온','퍼스트','네오','스마트','그린','블루','골든','에이스'];
  const sectors = [
    ['전자','IT',62000,.055,.002], ['테크','IT',28400,.07,.003], ['반도체','IT',51000,.065,.002], ['소프트','IT',19300,.08,.002],
    ['바이오','바이오',14200,.12,.004], ['제약','바이오',22700,.10,.003], ['헬스','바이오',9600,.095,.002],
    ['에너지','에너지',11800,.08,.001], ['솔라','에너지',17300,.085,.002], ['배터리','에너지',46200,.09,.003],
    ['푸드','소비재',7800,.04,.001], ['리테일','소비재',12100,.05,.001], ['뷰티','소비재',18500,.06,.002],
    ['증권','금융',9200,.055,.001], ['은행','금융',15400,.04,.001], ['카드','금융',20300,.045,.001],
    ['게임즈','게임/기타',8400,.12,.001], ['엔터','게임/기타',25800,.09,.002], ['모빌리티','게임/기타',31900,.085,.002],
    ['중공업','주식',33600,.065,.001], ['건설','주식',12800,.06,.001], ['화학','주식',24600,.07,.001]
  ];
  let idx = 1;
  for(const pre of prefixes){
    for(const [suffix,category,basePrice,vol,drift] of sectors){
      if(base.length >= 108) break;
      const price = Math.max(1000, Math.round((basePrice * (0.55 + Math.random()*1.25)) / 10) * 10);
      base.push({
        id:`stock${idx++}`,
        name:`${pre}${suffix}`,
        category,
        price,
        prev:price,
        volume:Math.round(200000 + Math.random()*9000000),
        volatility:vol,
        drift,
        history:[]
      });
    }
    if(base.length >= 108) break;
  }
  return base;
}

const initialStocks = buildInitialStocks();

const eventPool = [
  { text:'정부, 반도체 산업 지원 확대 검토', body:'정부가 반도체 장비와 AI 서버 관련 세제 지원을 확대하는 방안을 검토한다는 소식이 전해졌습니다. 시장에서는 삼성전자우와 국민로보틱스 같은 IT 관련주에 수급이 몰릴 수 있다고 보고 있습니다.', targets:['samsung','robot'], power:0.06, tag:'호재' },
  { text:'미래바이오, 임상 결과 발표 기대감', body:'미래바이오가 신약 후보물질 임상 중간 결과를 곧 공개할 수 있다는 기대감이 커졌습니다. 기대감은 강한 상승 재료가 될 수 있지만, 결과 발표 전후로 변동성이 매우 커질 수 있습니다.', targets:['bio'], power:0.12, tag:'호재' },
  { text:'게임코인 거래소 점검 예정', body:'게임코인의 주요 거래소가 시스템 점검을 예고하면서 단기 거래 위축 우려가 나왔습니다. 일부 투자자는 출금 지연 가능성을 걱정하며 매도세로 대응하고 있습니다.', targets:['coin'], power:-0.10, tag:'악재' },
  { text:'에너지 원가 부담 확대 우려', body:'국제 원자재 가격 상승으로 에너지 기업의 비용 부담이 커질 수 있다는 분석이 나왔습니다. 한빛에너지는 수익성 둔화 우려로 단기 약세 압력을 받을 수 있습니다.', targets:['energy'], power:-0.07, tag:'악재' },
  { text:'대한배당, 배당금 5% 상향 발표', body:'대한배당이 올해 배당금을 기존 계획보다 5% 올리겠다고 발표했습니다. 배당 매력이 부각되며 안정형 투자자들의 매수세가 유입될 가능성이 있습니다.', targets:['dividend'], power:0.045, tag:'호재' },
  { text:'로봇 테마주 단기 과열 경고', body:'최근 로봇 관련주가 빠르게 오르면서 단기 과열 경고가 나왔습니다. 국민로보틱스는 기대감은 유지되지만 차익실현 매물이 나올 수 있는 구간입니다.', targets:['robot'], power:-0.06, tag:'악재' },
  { text:'조선 수주 기대감 확대', body:'해외 선사의 대형 발주 가능성이 거론되며 조선 업종에 기대감이 붙었습니다. 동해조선은 수주 기대와 함께 거래량이 증가할 가능성이 있습니다.', targets:['ship'], power:0.07, tag:'호재' },
  { text:'식품주 방어주 매수세 유입', body:'시장 변동성이 커지자 안정적인 실적을 가진 식품주로 방어적 매수세가 유입되고 있습니다. 우리푸드는 큰 급등보다는 완만한 상승 흐름이 기대됩니다.', targets:['food'], power:0.035, tag:'호재' },
  { text:'시장 전반 관망세, 거래대금 감소', body:'투자자들이 주요 경제지표 발표를 앞두고 관망하는 분위기입니다. 거래대금이 줄면 작은 매도에도 가격이 흔들릴 수 있어 전 종목 변동성 관리가 필요합니다.', targets:['samsung','bio','energy','coin','dividend','robot','ship','food'], power:-0.025, tag:'악재' },
  { text:'개인 투자자 순매수 확대', body:'개인 투자자의 순매수가 확대되며 시장 전반에 매수 심리가 살아났습니다. 다만 단기 반등 후에는 종목별로 차익실현이 나올 수 있습니다.', targets:['samsung','bio','energy','coin','dividend','robot','ship','food'], power:0.025, tag:'호재' }
];

let state = loadGame();
let selectedId = state.selectedId || state.stocks[0].id;
if(!state.stocks.some(s => s.id === selectedId)) selectedId = state.stocks[0].id;
let currentTab = '전체 종목';
let buyMode = true;
let sortByReturn = false;
let stockPage = 0;
let stockSort = { key: null, dir: 'desc' };
const STOCKS_PER_PAGE = 6;
let chartRange = state.chartRange || '1m';
let marketTimer = null;
let lastTickAt = 0;

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
    arr.push({open, close, high, low, volume: Math.random()*100, gameMin: Math.max(MARKET_OPEN_MIN, MARKET_CLOSE_MIN - (42-i))});
    price = close;
  }
  return arr;
}

function loadGame(){
  try{
    const saved = JSON.parse(localStorage.getItem(storageKey)) || JSON.parse(localStorage.getItem('antStockSurvivalV6')) || JSON.parse(localStorage.getItem('antStockSurvivalV5')) || JSON.parse(localStorage.getItem('antStockSurvivalV4')) || JSON.parse(localStorage.getItem('antStockSurvivalV3'));
    if(saved && saved.stocks && saved.portfolio){
      const byId = new Map(saved.stocks.map(x => [x.id, x]));
      const merged = initialStocks.map(base => {
        const old = byId.get(base.id);
        if(old){
          old.category = old.category || base.category;
          old.volatility = old.volatility || base.volatility;
          old.drift = old.drift || base.drift;
          old.history = Array.isArray(old.history) && old.history.length ? old.history.map((d,i)=>({...d, gameMin:d.gameMin || Math.max(MARKET_OPEN_MIN, MARKET_CLOSE_MIN - old.history.length + i)})) : createHistory(old.price || base.price);
          return old;
        }
        return {...base, history:createHistory(base.price)};
      });
      saved.stocks = merged;
      if(!saved.marketStartedAt) saved.marketStartedAt = Date.now();
      if(!Array.isArray(saved.watchIds)) saved.watchIds = ['samsung','bio','energy','coin','dividend'].filter(id=>merged.some(s=>s.id===id));
      saved.chartRange = saved.chartRange || '1m';
      saved.marketTime = gameClockFromStart(saved.marketStartedAt);
      saved.marketOpen = saved.marketTime < '15:30';
      return saved;
    }
  }catch(e){}
  const stocks = initialStocks.map(s => ({...s, history:createHistory(s.price)}));
  return { day:1, cash:START_CASH, stocks, portfolio:{}, news:[], events:[], selectedId:'samsung', watchIds:['samsung','bio','energy','coin','dividend'], chartRange:'1m', logs:[], startedAt:Date.now(), marketStartedAt:Date.now(), marketTime:'09:00', marketOpen:true };
}

function saveGame(){
  if(!state.marketTime) state.marketTime = marketTime();
  state.selectedId = selectedId;
  state.chartRange = chartRange;
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
function toClock(totalMin){
  const h = Math.floor(totalMin / 60);
  const m = Math.floor(totalMin % 60);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

function gameClockFromStart(startedAt){
  const elapsed = Math.max(0, Date.now() - startedAt);
  const gameMin = Math.min(MARKET_TOTAL_MIN, Math.floor(elapsed / REAL_MARKET_MS * MARKET_TOTAL_MIN));
  return toClock(MARKET_OPEN_MIN + gameMin);
}

function isMarketOpen(){
  return marketTime() < '15:30';
}


function marketTime(){
  if(state.marketStartedAt){
    state.marketTime = gameClockFromStart(state.marketStartedAt);
    state.marketOpen = state.marketTime < '15:30';
  }
  return state.marketTime || '09:00';
}

function fullGameDateTime(){
  return `${todayDate()} ${marketTime()}`;
}


function ensureNewsArchive(){
  if(!Array.isArray(state.news)) state.news = [];
  state.news = state.news.map((n, idx) => ({
    id: n.id || `news-${state.day}-${idx}-${Date.now()}`,
    day: n.day || state.day,
    date: n.date || todayDate(),
    time: n.time || marketTime(),
    text: n.text || '시장 뉴스',
    title: n.title || n.text || '시장 뉴스',
    body: n.body || '이 뉴스는 이전 버전에서 생성된 기사라 상세 본문이 없습니다. 새로 다음 날로 넘기면 제목과 내용이 함께 저장됩니다.',
    tag: n.tag || '중립',
    targets: n.targets || []
  }));
}

function makeNews(event, index){
  const times = ['09:05','10:30','13:20','14:50','15:10'];
  return {
    id: `news-${state.day}-${index}-${Date.now()}-${Math.floor(Math.random()*9999)}`,
    day: state.day,
    date: todayDate(),
    time: times[index] || '15:10',
    title: event.text,
    text: event.text,
    body: event.body || '상세 내용이 아직 준비되지 않은 뉴스입니다.',
    tag: event.tag,
    targets: event.targets || []
  };
}

function newsTagClass(tag){
  if(tag === '악재') return 'bad';
  if(tag === '호재') return 'good';
  return 'neutral';
}

function initTabs(){
  $('tabs').innerHTML = categories.map(c => `<button class="${c===currentTab?'active':''}" data-tab="${c}">${c}</button>`).join('');
  $('tabs').querySelectorAll('button').forEach(btn=>btn.onclick=()=>{currentTab=btn.dataset.tab; stockPage = 0; render();});
}

function render(){
  ensureNewsArchive();
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
  $('sessionText').textContent = `${marketTime()} ${isMarketOpen() ? '장 진행 중' : '장 마감'}`;
  $('netWorthText').textContent = `${format(nw)} 원`;
  $('cashText').textContent = `${format(state.cash)} 원`;
  $('stockValueText').textContent = `${format(sv)} 원`;
  $('profitText').textContent = `${pf>=0?'+':''}${format(pf)} 원`;
  $('profitText').className = pf>=0?'up':'down';
  const y = pf / START_CASH * 100;
  $('yieldText').textContent = pct(y);
  $('yieldText').className = y>=0?'up':'down';
  $('survivalDayText').textContent = `${state.day}일차 진행 중`;
  $('survivalReturnText').textContent = pct(y);
  $('survivalReturnText').className = y >= 0 ? 'up' : 'down';
  $('nextDayBtn').innerHTML = `${isMarketOpen() ? '장 마감하기' : '다음 장 시작'}<br><span>Day ${String(isMarketOpen()?state.day:state.day+1).padStart(2,'0')}</span>`;
  $('mainHeadline').textContent = state.news[0]?.text || '식품주 방어주 매수세 유입';
}

function renderWatch(){
  if(!Array.isArray(state.watchIds)) state.watchIds = ['samsung','bio','energy','coin','dividend'];
  let list = state.watchIds.map(id => stock(id)).filter(Boolean);
  if(sortByReturn) list.sort((a,b)=> changeRate(b)-changeRate(a));
  if(!list.length){
    $('watchList').innerHTML = '<div class="watch-empty">관심 종목이 없습니다.<br>전체종목 표의 ☆ 버튼으로 추가하세요.</div>';
    return;
  }
  $('watchList').innerHTML = list.map(s=>`
    <div class="watch-item" data-id="${s.id}">
      <button class="watch-remove" data-remove-id="${s.id}" title="관심종목 해제">★</button><span class="stock-name">${s.name}</span><span>${format(s.price)}</span><span class="${changeRate(s)>=0?'up':'down'}">${pct(changeRate(s))}</span>
    </div>`).join('');
  $('watchList').querySelectorAll('.watch-item').forEach(row=>row.onclick=(e)=>{
    if(e.target.dataset.removeId) return;
    selectedId=row.dataset.id; render();
  });
  $('watchList').querySelectorAll('.watch-remove').forEach(btn=>btn.onclick=(e)=>{
    e.stopPropagation();
    state.watchIds = state.watchIds.filter(id => id !== btn.dataset.removeId);
    render();
  });
}

function toggleWatch(id){
  if(!Array.isArray(state.watchIds)) state.watchIds = [];
  if(state.watchIds.includes(id)){
    state.watchIds = state.watchIds.filter(x => x !== id);
    toast(`${stock(id)?.name || '종목'} 관심종목 해제`);
  }else{
    state.watchIds.push(id);
    toast(`${stock(id)?.name || '종목'} 관심종목 추가`);
  }
  render();
}

function renderNews(){
  ensureNewsArchive();
  const news = state.news.length ? [...state.news].reverse() : [
    {id:'sample-1', day:state.day, date:todayDate(), time:'09:10', title:'개장 직후 테마주 중심 변동성 확대', text:'개장 직후 테마주 중심 변동성 확대', body:'장 초반에는 거래량이 적은 종목일수록 작은 매수와 매도에도 가격 변동이 크게 나타날 수 있습니다.', tag:'주의'},
    {id:'sample-2', day:state.day, date:todayDate(), time:'10:30', title:'개인 매수세 유입, 중소형주 강세', text:'개인 매수세 유입, 중소형주 강세', body:'개인 투자자의 매수세가 유입되면서 중소형주가 상대적으로 강한 흐름을 보이고 있습니다.', tag:'호재'},
    {id:'sample-3', day:state.day, date:todayDate(), time:'13:15', title:'장 후반 차익실현 매물 출회', text:'장 후반 차익실현 매물 출회', body:'오전에 오른 종목을 중심으로 장 후반 차익실현 매물이 나오고 있습니다.', tag:'악재'}
  ];
  $('newsList').innerHTML = news.slice(0,5).map(n=>`<div class="news-item" data-news-id="${n.id}"><span class="news-date">${n.date}<br>${n.time}</span><span>${n.title || n.text}</span><b class="tag ${newsTagClass(n.tag)}">${n.tag}</b></div>`).join('');
  $('newsList').querySelectorAll('.news-item').forEach(row=>row.onclick=()=>showNewsDetail(row.dataset.newsId));
  $('eventList').innerHTML = (state.events.length ? state.events : ['오늘은 큰 이벤트가 없습니다','초반에는 분산투자가 안전합니다','급등주는 다음 날 변동성이 큽니다']).map(x=>`<li>${x.text || x}</li>`).join('');
}

function showNewsDetail(id){
  ensureNewsArchive();
  const samples = [
    {id:'sample-1', day:state.day, date:todayDate(), time:'09:10', title:'개장 직후 테마주 중심 변동성 확대', body:'장 초반에는 거래량이 적은 종목일수록 작은 매수와 매도에도 가격 변동이 크게 나타날 수 있습니다.', tag:'주의'},
    {id:'sample-2', day:state.day, date:todayDate(), time:'10:30', title:'개인 매수세 유입, 중소형주 강세', body:'개인 투자자의 매수세가 유입되면서 중소형주가 상대적으로 강한 흐름을 보이고 있습니다.', tag:'호재'},
    {id:'sample-3', day:state.day, date:todayDate(), time:'13:15', title:'장 후반 차익실현 매물 출회', body:'오전에 오른 종목을 중심으로 장 후반 차익실현 매물이 나오고 있습니다.', tag:'악재'}
  ];
  const n = state.news.find(x=>x.id===id) || samples.find(x=>x.id===id);
  if(!n) return;
  const targetNames = (n.targets || []).map(id=>stock(id)?.name).filter(Boolean).join(', ');
  const articleBody = buildArticleBody(n);
  showModal(n.title || n.text, `
    <article class="news-article">
      <div class="news-detail-meta"><span>Day ${String(n.day).padStart(2,'0')}</span><span>${n.date}</span><span>${n.time}</span><b class="tag ${newsTagClass(n.tag)}">${n.tag}</b></div>
      <p class="article-lead">${articleBody.lead}</p>
      <div class="news-detail-body">${articleBody.body}</div>
      ${targetNames ? `<div class="news-detail-impact">영향 가능 종목: ${targetNames}</div>` : ''}
      <p class="article-note">이 기사는 게임 내 가상 뉴스이며, 다음 날 가격 변동 이벤트에 영향을 줄 수 있습니다.</p>
    </article>`);
}

function buildArticleBody(n){
  const title = n.title || n.text || '시장 뉴스';
  const base = n.body || '상세 내용이 아직 준비되지 않은 뉴스입니다.';
  const targetNames = (n.targets || []).map(id=>stock(id)?.name).filter(Boolean).join(', ');
  const tone = n.tag === '호재' ? '매수 심리 개선' : n.tag === '악재' ? '투자 심리 위축' : '관망세 확대';
  const lead = `${title} 소식이 전해지며 시장 참여자들의 관심이 커지고 있습니다.`;
  const body = `
    <p>${base}</p>
    <p>시장에서는 이번 이슈가 단기적으로 ${tone}으로 이어질 수 있다고 보고 있습니다. 다만 장중 수급과 전일 상승폭에 따라 실제 주가 반응은 달라질 수 있습니다.</p>
    ${targetNames ? `<p>관련 종목으로는 ${targetNames} 등이 거론됩니다. 해당 종목은 뉴스 영향으로 다음 거래일 변동성이 커질 수 있습니다.</p>` : ''}
    <p>투자자는 보유 현금과 손절 기준을 함께 확인하면서 무리한 몰빵 매수보다는 분할 매수와 분산 투자를 고려할 필요가 있습니다.</p>
  `;
  return {lead, body};
}

function showNewsArchive(){
  ensureNewsArchive();
  if(!state.news.length){
    showModal('뉴스 전체보기', '<p class="empty-news">아직 저장된 뉴스가 없습니다. 다음 날로 넘기면 뉴스가 누적됩니다.</p>');
    return;
  }
  const html = `<div class="news-archive">${[...state.news].reverse().map(n=>`<div class="archive-news-item" data-news-id="${n.id}"><div class="archive-news-top"><span>Day ${String(n.day).padStart(2,'0')}</span><span>${n.date}</span><span>${n.time}</span><b class="tag ${newsTagClass(n.tag)}">${n.tag}</b></div><div class="archive-news-title">${n.title || n.text}</div><div class="archive-news-body">${(n.body || '').slice(0,90)}${(n.body || '').length > 90 ? '...' : ''}</div></div>`).join('')}</div>`;
  showModal('뉴스 전체보기', html);
  $('modalBody').querySelectorAll('.archive-news-item').forEach(row=>row.onclick=()=>showNewsDetail(row.dataset.newsId));
}

function changeRate(s){ return (s.price - s.prev) / s.prev * 100; }
function changeAmount(s){ return s.price - s.prev; }

function sortStockList(list){
  if(!stockSort.key) return list;
  const dir = stockSort.dir === 'asc' ? 1 : -1;
  const value = (s) => {
    if(stockSort.key === 'price') return s.price;
    if(stockSort.key === 'change') return changeAmount(s);
    if(stockSort.key === 'rate') return changeRate(s);
    if(stockSort.key === 'volume') return s.volume;
    return 0;
  };
  return [...list].sort((a,b)=>{
    const diff = value(a) - value(b);
    if(diff === 0) return a.name.localeCompare(b.name, 'ko-KR');
    return diff * dir;
  });
}

function sortArrow(key){
  if(stockSort.key !== key) return '';
  return stockSort.dir === 'asc' ? ' ▲' : ' ▼';
}

function updateStockHeaderSortUI(){
  document.querySelectorAll('.stock-table thead th[data-sort]').forEach(th=>{
    const label = th.dataset.label || th.textContent.replace(/[▲▼]/g,'').trim();
    th.dataset.label = label;
    th.textContent = label + sortArrow(th.dataset.sort);
    th.classList.toggle('sorted', stockSort.key === th.dataset.sort);
  });
}

function renderStocks(){
  let list = state.stocks.filter(s => currentTab==='전체 종목' || s.category===currentTab);
  list = sortStockList(list);
  const totalPages = Math.max(1, Math.ceil(list.length / STOCKS_PER_PAGE));
  if(stockPage >= totalPages) stockPage = totalPages - 1;
  if(stockPage < 0) stockPage = 0;
  const start = stockPage * STOCKS_PER_PAGE;
  const pageList = list.slice(start, start + STOCKS_PER_PAGE);
  $('stockTable').innerHTML = pageList.map(s=>`
    <tr data-id="${s.id}" class="${s.id===selectedId?'active':''}">
      <td><button class="watch-toggle" data-watch-id="${s.id}">${state.watchIds?.includes(s.id)?'★':'☆'}</button> ◆ ${s.name}</td><td>${format(s.price)}</td><td class="${changeAmount(s)>=0?'up':'down'}">${changeAmount(s)>=0?'▲':'▼'} ${format(Math.abs(changeAmount(s)))}</td><td class="${changeRate(s)>=0?'up':'down'}">${pct(changeRate(s))}</td><td>${format(s.volume)}</td>
    </tr>`).join('');

  const end = Math.min(start + STOCKS_PER_PAGE, list.length);
  $('stockPageInfo').textContent = `${currentTab} ${list.length ? start + 1 : 0}-${end} / ${list.length} · ${stockPage + 1}/${totalPages}쪽`;
  updateStockHeaderSortUI();
  $('stockPrevBtn').disabled = stockPage <= 0;
  $('stockNextBtn').disabled = stockPage >= totalPages - 1;
  $('stockPrevBtn').onclick = () => { if(stockPage > 0){ stockPage--; render(); } };
  $('stockNextBtn').onclick = () => { if(stockPage < totalPages - 1){ stockPage++; render(); } };

  $('stockTable').querySelectorAll('tr').forEach(row=>row.onclick=(e)=>{ if(e.target.dataset.watchId) return; selectedId=row.dataset.id; render();});
  $('stockTable').querySelectorAll('.watch-toggle').forEach(btn=>btn.onclick=(e)=>{ e.stopPropagation(); toggleWatch(btn.dataset.watchId); });
}

function getCurrentGameMinute(){
  const mt = marketTime().split(':').map(Number);
  return mt[0] * 60 + mt[1];
}

function aggregateCandles(history, bucketMin){
  const currentMin = getCurrentGameMinute();
  let filtered = history.filter(d => (d.gameMin || MARKET_OPEN_MIN) <= currentMin);
  if(!filtered.length) filtered = history.slice(-1);
  if(bucketMin <= 1) return filtered.slice(-80);
  const buckets = new Map();
  filtered.forEach(d=>{
    const gm = d.gameMin || MARKET_OPEN_MIN;
    const key = Math.floor((gm - MARKET_OPEN_MIN) / bucketMin) * bucketMin + MARKET_OPEN_MIN;
    const b = buckets.get(key);
    if(!b){
      buckets.set(key, {open:d.open, close:d.close, high:d.high, low:d.low, volume:d.volume, gameMin:key});
    }else{
      b.close = d.close;
      b.high = Math.max(b.high, d.high);
      b.low = Math.min(b.low, d.low);
      b.volume += d.volume;
    }
  });
  return [...buckets.values()].slice(-80);
}

function chartBucketMinutes(){
  if(chartRange === '10m') return 10;
  if(chartRange === '1h') return 60;
  if(chartRange === '1d') return MARKET_TOTAL_MIN;
  return 1;
}

function renderChart(){
  const s = stock(selectedId);
  $('selectedName').textContent = s.name;
  $('selectedPrice').textContent = `${format(s.price)} ${changeAmount(s)>=0?'▲':'▼'} ${format(Math.abs(changeAmount(s)))} (${pct(changeRate(s))})`;
  $('selectedPrice').className = changeAmount(s)>=0?'up':'down';
  document.querySelectorAll('#chartTabs button').forEach(btn=>btn.classList.toggle('active', btn.dataset.range === chartRange));
  const canvas = $('chartCanvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = '#08121e'; ctx.fillRect(0,0,w,h);
  ctx.strokeStyle = 'rgba(150,180,215,.13)'; ctx.lineWidth = 1;
  for(let i=0;i<7;i++){ const y = 20 + i*(h-55)/6; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
  for(let i=0;i<8;i++){ const x = i*w/7; ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h-35); ctx.stroke(); }
  const data = aggregateCandles(s.history, chartBucketMinutes());
  const max = Math.max(...data.map(d=>d.high));
  const min = Math.min(...data.map(d=>d.low));
  const range = Math.max(1, max-min);
  const cw = Math.max(3, w / Math.max(8,data.length) * .58);
  data.forEach((d,i)=>{
    const x = i*w/Math.max(1,data.length) + w/Math.max(1,data.length)*.5;
    const yH = 18 + (max-d.high)/range*(h-70);
    const yL = 18 + (max-d.low)/range*(h-70);
    const yO = 18 + (max-d.open)/range*(h-70);
    const yC = 18 + (max-d.close)/range*(h-70);
    const up = d.close >= d.open;
    ctx.strokeStyle = up ? '#ff4545' : '#2d8cff';
    ctx.fillStyle = up ? '#ff4545' : '#2d8cff';
    ctx.beginPath(); ctx.moveTo(x,yH); ctx.lineTo(x,yL); ctx.stroke();
    ctx.fillRect(x-cw/2, Math.min(yO,yC), cw, Math.max(2, Math.abs(yC-yO)));
    const vh = Math.min(32, d.volume / 120 * 28);
    ctx.globalAlpha = .42; ctx.fillRect(x-cw/2, h-35-vh, cw, vh); ctx.globalAlpha = 1;
  });
  ctx.fillStyle = '#c8d7ea'; ctx.font = '13px Arial';
  const labels = chartRange === '1d' ? ['09:00','장중','15:30'] : chartRange === '1h' ? ['09시','10시','11시','12시','13시','14시','15시'] : chartRange === '10m' ? ['10분봉','장중','현재'] : ['1분봉','장중','현재'];
  labels.forEach((label,i)=>ctx.fillText(label, 8 + i*(w-70)/Math.max(1,labels.length-1), h-10));
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
  $('submitOrder').textContent = isMarketOpen() ? (buyMode ? '매수 주문' : '매도 주문') : '장 마감';
  $('submitOrder').disabled = !isMarketOpen();
  document.body.classList.toggle('market-closed', !isMarketOpen());
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
  if(!isMarketOpen()){ toast('장 마감 후에는 거래할 수 없습니다. 다음 장을 시작하세요.'); return; }
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

function startNewMarketDay(){
  state.day += 1;
  state.marketStartedAt = Date.now();
  state.marketTime = '09:00';
  state.marketOpen = true;
  state.stocks.forEach(s => { s.prev = s.price; });
  const todays = pickEvents();
  state.events = todays;
  const newNews = todays.map((e,i)=>makeNews(e,i));
  state.news = [...state.news, ...newNews].slice(-160);
  render();
  startMarketTicker();
}

function closeMarket(){
  state.marketTime = '15:30';
  state.marketOpen = false;
  state.marketStartedAt = Date.now() - REAL_MARKET_MS;
  render();
  toast('오늘 장이 마감되었습니다.');
}

function nextDay(){
  if(isMarketOpen()) closeMarket();
  else startNewMarketDay();
}

function applyMarketTick(){
  if(!isMarketOpen()){
    renderTop();
    renderOrder();
    saveGame();
    return;
  }
  state.marketTime = gameClockFromStart(state.marketStartedAt);
  const elapsedSec = Math.max(1, (Date.now() - lastTickAt) / 1000);
  lastTickAt = Date.now();
  state.stocks.forEach(s=>{
    const eventImpact = (state.events || []).filter(e=>e.targets.includes(s.id) || e.targets.includes('*')).reduce((sum,e)=>sum+e.power,0) / 350;
    const random = (Math.random()*2-1) * s.volatility / 110;
    const drift = s.drift / 260;
    const move = Math.max(-0.035, Math.min(0.035, random + drift + eventImpact));
    const open = s.price;
    s.price = Math.max(100, Math.round(s.price * (1+move) / 10) * 10);
    s.volume = Math.max(10000, Math.round(s.volume * (0.998 + Math.random()*0.008)));
    const close = s.price;
    const high = Math.max(open, close) * (1 + Math.random()*0.003);
    const low = Math.min(open, close) * (1 - Math.random()*0.003);
    s.history.push({open, close, high, low, volume: Math.random()*100, gameMin:getCurrentGameMinute()});
    if(s.history.length > 260) s.history.shift();
  });
  render();
}

function startMarketTicker(){
  if(marketTimer) clearInterval(marketTimer);
  lastTickAt = Date.now();
  marketTimer = setInterval(applyMarketTick, TICK_MS);
}

function pickEvents(){
  const pool = [...eventPool].sort(()=>Math.random()-.5);
  return pool.slice(0,3);
}

function showResult(){
  const nw = netWorth(); const pf = nw - START_CASH; const y = pf/START_CASH*100;
  let grade = '생존 실패';
  if(y >= 100) grade = '전설의 개미';
  else if(y >= 20) grade = '침착한 투자자';
  else if(y >= 0) grade = '원금 방어 성공';
  showModal('최종 결과', `<p>최종 자산은 <strong>${format(nw)} 원</strong>입니다.</p><p>총 수익은 <strong class="${pf>=0?'up':'down'}">${pf>=0?'+':''}${format(pf)} 원</strong>, 수익률은 <strong class="${y>=0?'up':'down'}">${pct(y)}</strong>입니다.</p><p>등급은 <strong>${grade}</strong>입니다.</p>`);
}

function showGuide(){
  showModal('게임 가이드', '<p>가상 종목을 매수하고 다음 날로 넘기면 뉴스 이벤트에 따라 가격이 변합니다.</p><p>게임에 기간 제한은 없으며, 목표는 오래 살아남으면서 자산을 지키고 키우는 것입니다.</p><p>상단에서 현재 게임 날짜와 시간을 확인할 수 있고, 각 뉴스에는 발생 날짜와 시간이 함께 저장됩니다.</p><p>뉴스는 새로고침으로 사라지지 않고 누적되며, 뉴스 제목을 누르면 상세 내용을 볼 수 있습니다.</p><p>데이터는 브라우저에 자동 저장되며 실제 투자 데이터가 아닌 게임용 가상 데이터입니다.</p>');
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
$('resetBtn').onclick=()=>{ if(confirm('게임을 초기화할까요?')){ ['antStockSurvivalV7','antStockSurvivalV6','antStockSurvivalV5','antStockSurvivalV4','antStockSurvivalV3'].forEach(k=>localStorage.removeItem(k)); location.reload(); } };
$('guideBtn').onclick=showGuide;
$('rankBtn').onclick=showRank;
$('modalClose').onclick=()=> $('modal').classList.remove('show');
$('modal').onclick=e=>{ if(e.target.id==='modal') $('modal').classList.remove('show'); };
$('sortBtn').onclick=()=>{sortByReturn=!sortByReturn; $('sortBtn').textContent = sortByReturn ? '기본순' : '수익률순'; renderWatch();};
$('moreNewsBtn').onclick=showNewsArchive;

document.querySelectorAll('.stock-table thead th[data-sort]').forEach(th=>{
  th.onclick = () => {
    const key = th.dataset.sort;
    if(stockSort.key === key){
      stockSort.dir = stockSort.dir === 'desc' ? 'asc' : 'desc';
    }else{
      stockSort.key = key;
      stockSort.dir = 'desc';
    }
    stockPage = 0;
    renderStocks();
  };
});
document.querySelectorAll('#chartTabs button').forEach(btn=>btn.onclick=()=>{ chartRange = btn.dataset.range; renderChart(); saveGame(); });
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
startMarketTicker();
