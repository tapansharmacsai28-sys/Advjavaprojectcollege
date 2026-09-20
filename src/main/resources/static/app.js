const $ = (selector) => document.querySelector(selector);
const API_BASE = window.TRADEVAULT_API_BASE || '';
const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0));
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);

let token = sessionStorage.getItem('tvToken');
let user = JSON.parse(sessionStorage.getItem('tvUser') || 'null');
let trades = [];
let analytics = {};
let screenshotData = null;
let folders = { strategy: [], indicator: [] };
let editingTradeId = null;
let calendarOffset = 0;

document.body.insertAdjacentHTML('beforeend', `<dialog id="folderModal"><form id="folderForm"><div class="modal-header"><div><span class="kicker">FOLDER DIRECTORY</span><h2 id="folderModalTitle">New folder</h2></div><button type="button" id="closeFolderModal">×</button></div><label>Folder name<input id="folderName" required maxlength="80" placeholder="e.g. Momentum"></label><label>Parent path <input id="folderParentPath" value="/" placeholder="e.g. /Crypto"></label><p class="empty" style="padding:0;text-align:left">Use <b>/</b> for a top-level folder. This path keeps related strategies and indicators organized.</p><p id="folderError" class="error"></p><button class="primary">Save folder →</button></form></dialog>`);
document.head.insertAdjacentHTML('beforeend', '<link rel="stylesheet" href="/calendar.css">');
document.querySelector('nav').insertAdjacentHTML('beforeend', '<button class="nav" data-view="calendar">▦ <span>Calendar</span></button>');

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed. Please try again.');
  return data;
}

function setSession(result) {
  token = result.token;
  user = result.user;
  sessionStorage.setItem('tvToken', token);
  sessionStorage.setItem('tvUser', JSON.stringify(user));
}

function clearSession() {
  sessionStorage.removeItem('tvToken');
  sessionStorage.removeItem('tvUser');
  token = null; user = null; trades = []; analytics = {}; folders = { strategy: [], indicator: [] };
  document.querySelectorAll('dialog[open]').forEach((dialog) => dialog.close());
  $('#menu').hidden = true;
  showApp();
}

function showApp() {
  const authenticated = Boolean(token && user);
  $('#auth').hidden = authenticated;
  $('#app').hidden = !authenticated;
  if (!authenticated) return;
  $('#userName').textContent = user.name;
  $('#userEmail').textContent = user.email;
  $('#date').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  loadDashboard();
}

async function loadDashboard() {
  try {
    const [journal, summary, strategyFolders, indicatorFolders] = await Promise.all([api('/trades'), api('/analytics'), api('/folders/strategy'), api('/folders/indicator')]);
    trades = journal; analytics = summary; folders = { strategy: strategyFolders, indicator: indicatorFolders };
    render(document.querySelector('.nav.active')?.dataset.view || 'dashboard');
  } catch (error) {
    clearSession(); showApp();
  }
}

function metric(label, value, className = '') { return `<article class="card metric"><small>${label}</small><strong class="${className}">${value}</strong></article>`; }
function metricGrid() {
  return `<div class="metrics">${metric('Account equity', money(analytics.accountEquity))}${metric('Net realized P&L', money(analytics.netPnl), Number(analytics.netPnl) >= 0 ? 'up' : 'down')}${metric('Win rate', `${Number(analytics.winRate || 0).toFixed(1)}%`)}${metric('Profit factor', analytics.profitFactor || '0.00')}${metric('Active trades', analytics.activeTrades || 0)}${metric('Leverage usage', `${analytics.totalLeverage || 0}×`)}</div>`;
}
function tableRows(detailed = false) {
  if (!trades.length) return `<tr><td colspan="15" class="empty">No trades yet. Add a trade to start building your journal.</td></tr>`;
  return trades.map((trade) => `<tr><td>${escapeHtml(trade.tradeDate)}</td><td><b>${escapeHtml(trade.symbol)}</b></td><td><span class="pill">${trade.side === 'SELL' ? 'SHORT' : 'LONG'}</span></td>${detailed ? `<td>${trade.entryPrice}</td><td>${trade.exitPrice}</td><td>${trade.quantity}</td>` : ''}<td>${trade.leverage}×</td><td>${money(trade.brokerage)}</td><td class="${Number(trade.netPnl) >= 0 ? 'up' : 'down'}">${money(trade.netPnl)}</td>${detailed ? `<td>${trade.rMultiple || 0}R</td><td>${escapeHtml(trade.strategyName || '—')}</td><td>${escapeHtml(trade.indicatorsUsed || '—')}</td><td>${escapeHtml(trade.folderPath || '—')}</td><td>${escapeHtml(trade.emotionTag || '—')}</td><td><button class="text-button edit-trade" data-trade-id="${trade.id}">Edit</button></td>` : ''}</tr>`).join('');
}
function dashboard() {
  const bars = trades.slice(0, 14).reverse().map((trade) => `<div class="bar" style="height:${Math.max(8, Math.min(100, Math.abs(Number(trade.netPnl || 0)) / 25 + 15))}%" title="${money(trade.netPnl)}"></div>`).join('') || '<p class="empty">Your equity curve appears after the first recorded trade.</p>';
  return `<section class="journal-hero"><div class="hero-copy"><span class="kicker">TRADEVAULT / PRIVATE JOURNAL</span><h2>Every trade leaves<br><em>a useful trace.</em></h2><p>Capture execution, risk, outcome, and state of mind in one disciplined record.</p><button class="primary" id="heroTrade">Start a journal entry →</button></div></section>${metricGrid()}<div class="layout"><article class="card"><div class="section-title"><h2>Equity momentum</h2><small>Net outcome by recent trade</small></div><div class="chart">${bars}</div></article><article class="card"><div class="section-title"><h2>Risk pulse</h2><small>Live safeguards</small></div><div class="risk-item">Largest trade risk <span>${analytics.maxRisk || 0}%</span></div><div class="risk-item">Profit factor <span>${analytics.profitFactor || 0}</span></div><div class="risk-item">Transaction costs <span>${money(analytics.brokerage)}</span></div><div class="risk-item">Open exposure <span>0.00%</span></div></article></div><article class="card" style="margin-top:10px"><div class="section-title"><h2>Recent activity</h2><small>All values after brokerage deductions</small></div><table><thead><tr><th>Date</th><th>Symbol</th><th>Direction</th><th>Leverage</th><th>Fees</th><th>Net P&L</th></tr></thead><tbody>${tableRows()}</tbody></table></article>`;
}
function journal() {
  const evidence = trades.filter((trade) => trade.screenshotData).map((trade) => `<figure class="proof"><img src="${trade.screenshotData}" alt="${escapeHtml(trade.symbol)} screenshot"><figcaption>${escapeHtml(trade.symbol)} · ${escapeHtml(trade.tradeDate)}<b class="${Number(trade.netPnl) >= 0 ? 'up' : 'down'}">${money(trade.netPnl)}</b></figcaption></figure>`).join('') || '<p class="empty">Attach a chart screenshot to any trade to show evidence here.</p>';
  const risks = trades.map((trade) => `<div class="compact-row"><b>${escapeHtml(trade.symbol)}</b><span>${trade.leverage}×</span><span>${trade.riskPercent}%</span><span>${trade.quantity}</span><span class="${Number(trade.rMultiple) >= 0 ? 'up' : 'down'}">${trade.rMultiple || 0}R</span></div>`).join('') || '<p class="empty">No risk records yet.</p>';
  const psychology = trades.map((trade) => `<div class="psych-row"><span>${escapeHtml(trade.tradeDate)}</span><b>${escapeHtml(trade.symbol)}</b><span>${escapeHtml(trade.emotionTag || 'Not recorded')}</span><span>${escapeHtml(trade.strategyName || 'No strategy')}</span></div>`).join('') || '<p class="empty">Emotion tags are captured with each trade.</p>';
  return `${metricGrid()}<article class="card" style="margin-top:10px"><div class="section-title"><h2>Comprehensive trade journal</h2><small>Calculated using deterministic finance logic</small></div><table><thead><tr><th>Date</th><th>Symbol</th><th>Direction</th><th>Entry</th><th>Exit</th><th>Size</th><th>Lev.</th><th>Brokerage</th><th>Net P&L</th><th>R</th><th>Strategy</th><th>Indicators</th><th>Folder</th><th>Emotion</th><th>Action</th></tr></thead><tbody>${tableRows(true)}</tbody></table></article><section class="journal-sections"><article class="journal-block"><div class="block-title"><h2>🛡 Risk management</h2><small>Position exposure & controls</small></div><div class="compact-head"><span>SYMBOL</span><span>LEVERAGE</span><span>RISK %</span><span>POSITION SIZE</span><span>R-MULTIPLE</span></div>${risks}</article><article class="journal-block"><div class="block-title"><h2>🎯 Results</h2><small>Outcome evidence</small></div><div class="proof-grid">${evidence}</div></article><article class="journal-block"><div class="block-title"><h2>🧠 Psychology</h2><small>Emotional discipline log</small></div><div class="psych-head"><span>DATE</span><span>SYMBOL</span><span>EMOTION</span><span>STRATEGY</span></div>${psychology}</article></section>`;
}
function folderPath(folder) { return `${folder.parentPath === '/' ? '' : folder.parentPath}/${folder.name}`; }
function folderTree(items, empty) {
  if (!items.length) return `<p class="empty folder-empty">${empty}</p>`;
  return `<div class="folder-tree">${items.map((folder) => `<div class="folder-row"><span class="folder-icon">⌁</span><div><b>${escapeHtml(folder.name)}</b><small>${escapeHtml(folderPath(folder))}</small></div><span class="folder-count">${trades.filter((trade) => (trade.folderPath || '').startsWith(folderPath(folder))).length} trades</span></div>`).join('')}</div>`;
}
function strategies() {
  const leaders = analytics.strategyLeaderboard || [];
  return `<div class="folder-grid"><article class="card"><div class="section-title"><div><h2>Strategy folders</h2><small>Organize systems and journal trades</small></div><button class="text-button" id="newStrategyFolder">+ Strategy folder</button></div>${folderTree(folders.strategy, 'Create a strategy folder, then use it when recording a trade.')}</article><article class="card"><div class="section-title"><div><h2>Indicator folders</h2><small>Your reusable indicator sets</small></div><button class="text-button" id="newIndicatorFolder">+ Indicator folder</button></div>${folderTree(folders.indicator, 'Create indicator folders for setups such as RSI, EMA, or VWAP.')}</article></div><div class="layout"><article class="card"><div class="section-title"><h2>Ranked strategy performance</h2><small>Net P&L ↓</small></div>${leaders.map((item, index) => `<div class="leader"><span>#${index + 1}</span><div><b>${escapeHtml(item.name)}</b><small>${item.trades} trades · ${Number(item.winRate).toFixed(0)}% win rate</small></div><strong class="${Number(item.netPnl) >= 0 ? 'up' : 'down'}">${money(item.netPnl)}</strong></div>`).join('') || '<p class="empty">Assign a strategy folder to a trade to see rankings here.</p>'}</article><article class="card strategy-help"><h2>Journal by folder</h2><p>When you save a trade, select a strategy folder and optional indicator folder(s). Its path, strategy and indicator setup remain attached to that journal entry and feed the ranking automatically.</p><button class="primary" id="strategyTrade">＋ Journal a trade</button></article></div>`;
}
function calendarView() { const month = new Date(); month.setDate(1); month.setMonth(month.getMonth() + calendarOffset); const year = month.getFullYear(), monthIndex = month.getMonth(), first = month.getDay(), days = new Date(year, monthIndex + 1, 0).getDate(); const byDate = trades.reduce((map, trade) => { const value = map[trade.tradeDate] || { pnl: 0, count: 0 }; value.pnl += Number(trade.netPnl || 0); value.count++; map[trade.tradeDate] = value; return map; }, {}); const cells = Array.from({ length: first + days }, (_, index) => { if (index < first) return '<div class="calendar-day empty-day"></div>'; const day = index - first + 1, date = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`, result = byDate[date], state = !result ? '' : result.pnl > 0 ? 'positive' : result.pnl < 0 ? 'negative' : ''; return `<div class="calendar-day ${state}"><span class="calendar-date">${day}</span>${result ? `<b class="calendar-pnl ${result.pnl >= 0 ? 'up' : 'down'}">${money(result.pnl)}</b><small class="calendar-trades">${result.count} trade${result.count === 1 ? '' : 's'}</small>` : ''}</div>`; }).join(''); return `<article class="card"><div class="calendar-toolbar"><div><span class="kicker">JOURNAL PERFORMANCE</span><h2>${month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2></div><div class="calendar-nav"><button id="previousMonth">←</button><button id="currentMonth">Today</button><button id="nextMonth">→</button></div></div><div class="calendar-weekdays"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div><div class="calendar-grid">${cells}</div><div class="calendar-legend"><span><i class="gain"></i> Profitable day</span><span><i class="loss"></i> Losing day</span><span><i class="flat"></i> No closed trade</span></div></article>`; }
function analyticsView() { return `${metricGrid()}<div class="layout"><article class="card"><h2>Performance attribution</h2><p class="empty">Strategy rankings, realized profit, fees and win rate are calculated directly from your journal. TradeVault does not use predictive or AI components.</p></article><article class="card"><h2>Cost efficiency</h2><div class="risk-item">Brokerage paid <span>${money(analytics.brokerage)}</span></div><div class="risk-item">Recorded trades <span>${analytics.totalTrades || 0}</span></div></article></div>`; }
function riskView() { return `<article class="card"><div class="section-title"><h2>Position sizing calculator</h2><small>Risk-constrained, deterministic</small></div><div class="calculator"><label>Account equity<input id="eq" value="100000" min="0" type="number"></label><label>Risk %<input id="rp" value="1" min="0" type="number"></label><label>Entry price<input id="en" value="100" min="0.01" type="number"></label><label>Stop price<input id="st" value="98" min="0.01" type="number"></label><label>Leverage<input id="le" value="1" min="1" max="100" type="number"></label><button id="calc" class="primary">Calculate</button></div><div id="riskResult" class="empty">Enter your trade parameters to calculate the maximum position size.</div></article>`; }
function render(view) {
  const pages = { dashboard, journal, strategies, analytics: analyticsView, risk: riskView, calendar: calendarView };
  $('#viewTitle').textContent = { dashboard: 'Portfolio overview', journal: 'Trade Journal', strategies: 'Strategy directory', analytics: 'Performance analytics', risk: 'Risk Engine', calendar: 'Performance calendar' }[view];
  $('#content').innerHTML = pages[view]();
  if (view === 'dashboard') $('#heroTrade').onclick = openTradeModal;
  if (view === 'journal') document.querySelectorAll('.edit-trade').forEach((button) => button.onclick = () => openTradeModal(trades.find((trade) => trade.id === Number(button.dataset.tradeId))));
  if (view === 'strategies') { $('#newStrategyFolder').onclick = () => createFolder('strategy'); $('#newIndicatorFolder').onclick = () => createFolder('indicator'); $('#strategyTrade').onclick = openTradeModal; if (!trades.length) { document.querySelector('.strategy-help').insertAdjacentHTML('beforeend', '<button class="text-button" id="loadDemo">Load presentation sample data</button>'); $('#loadDemo').onclick = loadPresentationData; } }
  if (view === 'calendar') { $('#previousMonth').onclick = () => { calendarOffset--; render('calendar'); }; $('#nextMonth').onclick = () => { calendarOffset++; render('calendar'); }; $('#currentMonth').onclick = () => { calendarOffset = 0; render('calendar'); }; }
  if (view === 'risk') $('#calc').onclick = calculatePosition;
}

function setFolderChoices() { $('#strategyChoices').innerHTML = folders.strategy.map((folder) => `<option value="${escapeHtml(folder.name)}"></option>`).join(''); $('#indicatorChoices').innerHTML = folders.indicator.map((folder) => `<option value="${escapeHtml(folder.name)}"></option>`).join(''); $('#strategyPaths').innerHTML = folders.strategy.map((folder) => `<option value="${escapeHtml(folderPath(folder))}"></option>`).join(''); }
function openTradeModal(trade = null) { $('#tradeError').textContent = ''; $('#tradeForm').reset(); setFolderChoices(); editingTradeId = trade?.id || null; screenshotData = trade?.screenshotData || null; $('#screenshotPreview').hidden = !screenshotData; if (screenshotData) $('#screenshotPreview').src = screenshotData; $('#screenshotLabel').textContent = screenshotData ? '✓ Screenshot attached — click to replace' : '＋ Attach trade screenshot (PNG, JPG, WEBP · max 2 MB)'; if (trade) { const form = $('#tradeForm'); ['tradeDate','symbol','quantity','entryPrice','exitPrice','leverage','riskPercent','strategyName','indicatorsUsed','folderPath','emotionTag','notes'].forEach((field) => { if (trade[field] != null) form.elements[field].value = trade[field]; }); form.elements.side.value = trade.side === 'SELL' ? 'SHORT' : 'LONG'; } else $('#tradeForm').tradeDate.value = new Date().toISOString().slice(0, 10); $('#tradeModal').showModal(); }
let pendingFolderType = 'strategy';
function createFolder(type) { pendingFolderType = type; const label = type === 'strategy' ? 'Strategy' : 'Indicator'; $('#folderModalTitle').textContent = `New ${label.toLowerCase()} folder`; $('#folderName').value = ''; $('#folderParentPath').value = '/'; $('#folderError').textContent = ''; $('#folderModal').showModal(); $('#folderName').focus(); }
async function loadPresentationData() { try { const seedFolders = [{ type: 'strategy', name: 'Momentum Breakout', parentPath: '/Crypto' }, { type: 'strategy', name: 'London Reversal', parentPath: '/Forex' }, { type: 'indicator', name: 'EMA + RSI', parentPath: '/Trend' }, { type: 'indicator', name: 'VWAP Bands', parentPath: '/Mean Reversion' }]; for (const folder of seedFolders) await api(`/folders/${folder.type}`, { method: 'POST', body: JSON.stringify(folder) }); const today = new Date(), date = (offset) => { const value = new Date(today); value.setDate(value.getDate() + offset); return value.toISOString().slice(0, 10); }; const samples = [{ tradeDate: date(-12), symbol: 'BTCUSDT', side: 'LONG', quantity: .12, entryPrice: 62300, exitPrice: 63850, leverage: 3, riskPercent: 1, strategyName: 'Momentum Breakout', indicatorsUsed: 'EMA + RSI', folderPath: '/Crypto/Momentum Breakout', emotionTag: 'Calm', notes: 'Presentation sample: clean continuation setup.' }, { tradeDate: date(-9), symbol: 'EURUSD', side: 'SHORT', quantity: 10000, entryPrice: 1.086, exitPrice: 1.079, leverage: 5, riskPercent: .8, strategyName: 'London Reversal', indicatorsUsed: 'VWAP Bands', folderPath: '/Forex/London Reversal', emotionTag: 'Confident', notes: 'Presentation sample: London session reversal.' }, { tradeDate: date(-5), symbol: 'ETHUSDT', side: 'LONG', quantity: 1.5, entryPrice: 3380, exitPrice: 3310, leverage: 2, riskPercent: 1, strategyName: 'Momentum Breakout', indicatorsUsed: 'EMA + RSI', folderPath: '/Crypto/Momentum Breakout', emotionTag: 'Hesitant', notes: 'Presentation sample: stopped at planned invalidation.' }, { tradeDate: date(-2), symbol: 'XAUUSD', side: 'LONG', quantity: .4, entryPrice: 2450, exitPrice: 2483, leverage: 4, riskPercent: 1, strategyName: 'London Reversal', indicatorsUsed: 'VWAP Bands', folderPath: '/Forex/London Reversal', emotionTag: 'Calm', notes: 'Presentation sample: patient execution at support.' }]; for (const sample of samples) await api('/trades', { method: 'POST', body: JSON.stringify({ ...sample, feeRate: .0004, fixedCommission: 1 }) }); await loadDashboard(); } catch (error) { window.alert(error.message); } }
async function calculatePosition() { try { const result = await api('/risk/position-size', { method: 'POST', body: JSON.stringify({ equity: +$('#eq').value, riskPercent: +$('#rp').value, entryPrice: +$('#en').value, stopPrice: +$('#st').value, leverage: +$('#le').value }) }); $('#riskResult').innerHTML = `Maximum size: <b class="up">${Number(result.positionSize).toFixed(4)}</b> · Notional: <b>${money(result.notional)}</b>${result.overLeveraged ? ' <span class="down"> · Over-leverage alert: above 20×</span>' : ''}`; } catch (error) { $('#riskResult').textContent = error.message; } }

document.querySelectorAll('.tab').forEach((button) => button.onclick = () => { const signup = button.dataset.mode === 'signup'; document.querySelectorAll('.tab').forEach((item) => item.classList.toggle('active', item === button)); $('.signup-only').style.display = signup ? 'block' : 'none'; $('#name').required = signup; $('#authError').textContent = ''; });
$('#authForm').onsubmit = async (event) => { event.preventDefault(); const signup = $('.tab.active').dataset.mode === 'signup'; try { setSession(await api(`/auth/${signup ? 'signup' : 'login'}`, { method: 'POST', body: JSON.stringify({ name: $('#name').value, email: $('#email').value, password: $('#password').value }) })); showApp(); } catch (error) { $('#authError').textContent = error.message; } };
function toggleReset(show) { $('#authForm').hidden = show; $('#resetForm').hidden = !show; $('.tabs').hidden = show; }
let resetCodeSent = false;
$('#forgot').onclick = () => toggleReset(true); $('#backLogin').onclick = () => { resetCodeSent = false; toggleReset(false); };
$('#resetForm').onsubmit = async (event) => { event.preventDefault(); try { const email = $('#resetEmail').value; if (!resetCodeSent) { const result = await api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }); resetCodeSent = true; $('#codeFields').hidden = false; $('#resetCopy').textContent = result.message; $('#resetAction').textContent = 'Reset password'; } else { await api('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, code: $('#resetCode').value, newPassword: $('#newPassword').value }) }); resetCodeSent = false; toggleReset(false); } } catch (error) { $('#resetError').textContent = error.message; } };
$('#profile').onclick = () => { $('#menu').hidden = !$('#menu').hidden; };
$('#logout').onclick = clearSession;
$('#addTrade').onclick = openTradeModal; $('#closeModal').onclick = () => $('#tradeModal').close();
$('#closeFolderModal').onclick = () => $('#folderModal').close();
$('#folderForm').onsubmit = async (event) => { event.preventDefault(); try { await api(`/folders/${pendingFolderType}`, { method: 'POST', body: JSON.stringify({ name: $('#folderName').value.trim(), parentPath: $('#folderParentPath').value.trim() || '/' }) }); $('#folderModal').close(); await loadDashboard(); } catch (error) { $('#folderError').textContent = error.message; } };
$('#screenshot').onchange = () => { const file = $('#screenshot').files[0]; if (!file) return; if (file.size > 2 * 1024 * 1024) { $('#tradeError').textContent = 'Please choose an image below 2 MB.'; return; } const reader = new FileReader(); reader.onload = () => { screenshotData = reader.result; $('#screenshotPreview').src = screenshotData; $('#screenshotPreview').hidden = false; $('#screenshotLabel').textContent = '✓ Screenshot attached — click to replace'; }; reader.readAsDataURL(file); };
$('#screenshotLabel').onclick = () => $('#screenshot').click();
$('#tradeForm').onsubmit = async (event) => { event.preventDefault(); const payload = Object.fromEntries(new FormData(event.target)); delete payload.screenshot; ['quantity', 'entryPrice', 'exitPrice', 'leverage', 'feeRate', 'fixedCommission', 'riskPercent'].forEach((field) => payload[field] = Number(payload[field])); payload.screenshotData = screenshotData; try { await api(editingTradeId ? `/trades/${editingTradeId}` : '/trades', { method: editingTradeId ? 'PUT' : 'POST', body: JSON.stringify(payload) }); $('#tradeModal').close(); editingTradeId = null; await loadDashboard(); } catch (error) { $('#tradeError').textContent = error.message; } };
document.querySelectorAll('.nav').forEach((button) => button.onclick = () => { document.querySelectorAll('.nav').forEach((item) => item.classList.toggle('active', item === button)); render(button.dataset.view); });
// Lifecycle and folder controls extend the existing screens without changing their layout.
const exitInput = document.querySelector('[name="exitPrice"]');
if (exitInput) { exitInput.required = false; exitInput.placeholder = 'Optional — close later'; }
const originalDashboard = dashboard;
dashboard = function () {
  const running = trades.filter((trade) => trade.status === 'RUNNING' || !trade.exitPrice);
  const runningCard = `<article class="card" style="margin-top:10px"><div class="section-title"><h2>Running trades</h2><small>Open positions are excluded from realized performance</small></div>${running.length ? `<table><thead><tr><th>Instrument</th><th>Direction</th><th>Entry</th><th>Size</th><th>Leverage</th><th>Strategy</th><th>Indicator</th></tr></thead><tbody>${running.map((trade) => `<tr><td>${escapeHtml(trade.symbol)}</td><td><span class="pill">${escapeHtml(trade.side)}</span></td><td>${money(trade.entryPrice)}</td><td>${trade.quantity}</td><td>${trade.leverage}×</td><td>${escapeHtml(trade.strategyName || 'Unassigned')}</td><td>${escapeHtml(trade.indicatorsUsed || 'Unassigned')}</td></tr>`).join('')}</tbody></table>` : '<p class="empty">No running trades.</p>'}</article>`;
  return originalDashboard() + runningCard;
};
const originalFolderTree = folderTree;
folderTree = function (items, empty) {
  if (!items.length) return originalFolderTree(items, empty);
  return `<div class="folder-tree">${items.map((folder) => `<div class="folder-row"><span class="folder-icon">⌁</span><div><b>${escapeHtml(folder.name)}</b><small>${escapeHtml(folderPath(folder))}</small></div><span class="folder-count">${trades.filter((trade) => (trade.strategyName === folder.name || trade.indicatorsUsed === folder.name)).length} trades</span><span><button class="text-button folder-rename" data-folder-id="${folder.id}" data-folder-name="${escapeHtml(folder.name)}">Rename</button><button class="text-button folder-delete" data-folder-id="${folder.id}" data-folder-name="${escapeHtml(folder.name)}">Delete</button></span></div>`).join('')}</div>`;
};
const originalRiskView = riskView;
riskView = function () {
  const equity = analytics.accountEquity || 100000;
  return `<article class="card" style="margin-bottom:10px"><div class="section-title"><h2>Account equity</h2><small>User-entered value · INR</small></div><div class="calculator"><label>Account equity (₹)<input id="accountEquity" type="number" min="0" step=".01" value="${equity}"></label><button id="saveAccount" class="primary">Save equity</button></div></article>` + originalRiskView().replace('value="100000"', `value="${equity}"`);
};
document.addEventListener('click', async (event) => {
  if (event.target.closest('#saveAccount')) {
    try { await api('/account', { method: 'PUT', body: JSON.stringify({ accountEquity: Number($('#accountEquity').value) }) }); await loadDashboard(); render('risk'); } catch (error) { window.alert(error.message); }
    return;
  }
  const button = event.target.closest('.folder-delete,.folder-rename');
  if (!button) return;
  const id = button.dataset.folderId;
  const name = button.dataset.folderName;
  try {
    if (button.classList.contains('folder-delete')) {
      if (!window.confirm(`Delete ${name}? Historical trades will be preserved.`)) return;
      await api(`/folders/${id}`, { method: 'DELETE' });
    } else {
      const next = window.prompt('Folder name', name);
      if (!next?.trim()) return;
      await api(`/folders/${id}`, { method: 'PUT', body: JSON.stringify({ name: next.trim(), parentPath: '/' }) });
    }
    await loadDashboard();
  } catch (error) { window.alert(error.message); }
});
showApp();
