'use strict';

/* ==========================================================================
   1. UTILITIES & HELPERS
   ========================================================================== */
const Utils = {
  formatCurrency(amount, decimals = 2) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD',
      minimumFractionDigits: decimals, maximumFractionDigits: decimals
    }).format(amount);
  },
  formatPercent(value) { return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`; },
  formatDateShort(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },
  randomRange(min, max) { return Math.random() * (max - min) + min; },
  randomElement(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },
  animateValue(element, start, end, duration = 800) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      element.textContent = this.formatCurrency(current);
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }
};

/* ==========================================================================
   2. DATA GENERATION
   ========================================================================== */
const DataGenerator = {
  generateStocks() {
    return [
      { symbol: 'AAPL', name: 'Apple Inc.', price: 413160.66, change: 0.84, color: 'bg-gray-100 text-gray-800' },
      { symbol: 'TSLA', name: 'Tesla, Inc.', price: 239559.53, change: -1.42, color: 'bg-red-100 text-red-500' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 189806.34, change: 2.73, color: 'bg-green-100 text-green-600' },
      { symbol: 'MSFT', name: 'Microsoft Corp.', price: 216798.96, change: 0.51, color: 'bg-blue-100 text-blue-600' }
    ];
  },
  generateCrypto() {
    return [
      { symbol: 'BTC', name: 'Bitcoin', amount: 14.4911, price: 1346752.48, change: 9581.37, iconBg: 'bg-[#f7931a]', icon: 'fa-bitcoin' },
      { symbol: 'ETH', name: 'Ethereum', amount: 329.7971, price: 1087449.98, change: 14850.12, iconBg: 'bg-[#627eea]', icon: 'fa-ethereum' },
      { symbol: 'SOL', name: 'Solana', amount: 3297.97, price: 630110.00, change: -1875.52, iconBg: 'bg-black border border-white', icon: 'fa-s' },
      { symbol: 'DOGE', name: 'Dogecoin', amount: 1648985.63, price: 627523.46, change: 19081.31, iconBg: 'bg-[#c2a633]', icon: 'fa-dog' }
    ];
  },
  createUser(username, password) {
    return {
      id: Utils.generateUUID(),
      username, password,
      accounts: {
        checking: { name: 'Checking', balance: 5072123432.21, number: '7527' },
        platinum: { name: 'Platinum Card', balance: -134.88, number: '7537' },
        savings: { name: 'Savings', balance: 11514.72, number: '9538' }
      },
      investing: {
        total: 2398113.00,
        stocks: this.generateStocks()
      },
      crypto: {
        total: 10032216.83,
        tokens: this.generateCrypto()
      }
    };
  }
};

/* ==========================================================================
   3. STATE MANAGEMENT
   ========================================================================== */
const Store = {
  USERS_KEY: 'larpbank_users_v4',
  SESSION_KEY: 'larpbank_session_v4',
  API_KEY: 'larpbank_deepseek_v4',

  getUsers() {
    try { return JSON.parse(localStorage.getItem(this.USERS_KEY)) || []; } catch { return []; }
  },
  saveUsers(users) { localStorage.setItem(this.USERS_KEY, JSON.stringify(users)); },
  getSessionUser() {
    const username = localStorage.getItem(this.SESSION_KEY);
    if (!username) return null;
    return this.getUsers().find(u => u.username === username) || null;
  },
  setSession(username) { localStorage.setItem(this.SESSION_KEY, username); },
  clearSession() { localStorage.removeItem(this.SESSION_KEY); },
  getApiKey() { return localStorage.getItem(this.API_KEY) || ''; },
  setApiKey(key) { localStorage.setItem(this.API_KEY, key); },
  clearAll() { localStorage.clear(); }
};

/* ==========================================================================
   4. CHART ENGINE (Pure SVG Generation)
   ========================================================================== */
const ChartEngine = {
  generateSmoothPath(data, width, height, stroke, fillGradient = null) {
    if (!data || data.length === 0) return '';
    const max = Math.max(...data), min = Math.min(...data);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);
    
    const points = data.map((val, i) => ({ x: i * stepX, y: height - ((val - min) / range) * height }));
    let d = `M ${points[0].x},${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i], p1 = points[i], p2 = points[i + 1], p3 = points[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6, cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6, cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }

    let svg = `<svg viewBox="0 0 ${width} ${height}" class="w-full h-full" preserveAspectRatio="none">`;
    if (fillGradient) {
      const id = 'grad-' + Utils.generateUUID();
      svg += `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${fillGradient}" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="${fillGradient}" stop-opacity="0"/>
      </linearGradient></defs>`;
      svg += `<path d="${d} L ${width},${height} L 0,${height} Z" fill="url(#${id})" />`;
    }
    svg += `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`;
    svg += `</svg>`;
    return svg;
  },
  generateTrendData(points, trend = 0, volatility = 20) {
    let val = 50;
    return Array.from({length: points}, () => {
      val += (Math.random() - 0.5) * volatility + (trend * 1.5);
      return Math.max(5, Math.min(95, val));
    });
  },
  generateDoubleLineChart(data1, data2, width, height) {
    const max = Math.max(...data1, ...data2), min = Math.min(...data1, ...data2);
    const range = max - min || 1;
    const stepX = width / (data1.length - 1);
    const getPoints = (data) => data.map((val, i) => ({ x: i * stepX, y: height - ((val - min) / range) * height }));
    const p1 = getPoints(data1), p2 = getPoints(data2);
    let path1 = `M ${p1[0].x},${p1[0].y}`, path2 = `M ${p2[0].x},${p2[0].y}`;
    
    for(let i=1; i<p1.length; i++) {
      path1 += ` L ${p1[i].x},${p1[i].y}`;
      path2 += ` L ${p2[i].x},${p2[i].y}`;
    }
    let svg = `<svg viewBox="0 0 ${width} ${height}" class="w-full h-full" preserveAspectRatio="none">`;
    svg += `<line x1="0" y1="${height*0.25}" x2="${width}" y2="${height*0.25}" stroke="#e5e7eb" stroke-width="1" stroke-dasharray="4" />`;
    svg += `<line x1="0" y1="${height*0.5}" x2="${width}" y2="${height*0.5}" stroke="#e5e7eb" stroke-width="1" stroke-dasharray="4" />`;
    svg += `<line x1="0" y1="${height*0.75}" x2="${width}" y2="${height*0.75}" stroke="#e5e7eb" stroke-width="1" stroke-dasharray="4" />`;
    svg += `<path d="${path2}" fill="none" stroke="#9ca3af" stroke-width="2" stroke-dasharray="4" />`;
    svg += `<path d="${path1}" fill="none" stroke="#3b82f6" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" />`;
    return svg + `</svg>`;
  }
};

/* ==========================================================================
   5. UI CONTROLLERS
   ========================================================================== */
const UI = {
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    let icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon} mr-2"></i> ${message}`;
    if (type === 'error') toast.style.background = 'var(--accent-red)';
    if (type === 'success') toast.style.background = 'var(--accent-green)';
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
  }
};

/* ==========================================================================
   6. ROUTER & RENDERERS
   ========================================================================== */
const Router = {
  navigate(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const targetView = document.getElementById('view-' + viewId);
    if (targetView) { targetView.classList.add('active'); window.scrollTo(0, 0); }
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.target === viewId));
    
    const body = document.body, nav = document.getElementById('bottom-nav');
    if (viewId === 'crypto') {
      body.style.backgroundColor = 'var(--bg-dark)';
      nav.classList.add('dark-mode');
      document.querySelector('meta[name="theme-color"]').content = '#000000';
    } else {
      body.style.backgroundColor = 'var(--bg-light)';
      nav.classList.remove('dark-mode');
      document.querySelector('meta[name="theme-color"]').content = '#f3f4f6';
    }
    
    if (viewId === 'chat') {
      setTimeout(() => document.getElementById('chat-input').focus(), 100);
      const chatMsgs = document.getElementById('chat-messages');
      chatMsgs.scrollTop = chatMsgs.scrollHeight;
    }
  }
};

document.querySelectorAll('.nav-item').forEach(item => item.addEventListener('click', () => Router.navigate(item.dataset.target)));

const Renderer = {
  renderBanking(user) {
    const hr = new Date().getHours();
    document.getElementById('greeting-text').textContent = `Good ${hr < 12 ? 'morning' : hr < 18 ? 'afternoon' : 'evening'}, ${user.username}`;
    document.getElementById('banking-card-num').textContent = user.accounts.checking.number;
    Utils.animateValue(document.getElementById('banking-balance'), 0, user.accounts.checking.balance, 1000);
    
    const accList = document.getElementById('banking-accounts');
    accList.innerHTML = '';
    Object.values(user.accounts).forEach(acc => {
      accList.innerHTML += `
        <div class="bg-white rounded-2xl p-4 flex justify-between items-center shadow-sm border border-gray-100">
          <div><p class="font-bold text-[15px] text-gray-900">${acc.name}</p><p class="text-xs text-gray-500 font-medium">••••${acc.number}</p></div>
          <p class="font-bold text-[15px] text-gray-900">${Utils.formatCurrency(acc.balance)}</p>
        </div>`;
    });
  },
  renderAnalytics() {
    const chartContainer = document.getElementById('analytics-chart');
    chartContainer.innerHTML = ChartEngine.generateDoubleLineChart(ChartEngine.generateTrendData(30, 2, 30), ChartEngine.generateTrendData(30, 1, 40), 350, 180);
    chartContainer.innerHTML += `<div class="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-gray-400 font-medium pt-2 bg-white"><span>Jun 5</span><span>Jun 20</span><span>Jul 4</span></div>`;
  },
  renderInvesting(user) {
    document.getElementById('investing-total').textContent = Utils.formatCurrency(user.investing.total);
    document.getElementById('investing-chart').innerHTML = ChartEngine.generateSmoothPath(ChartEngine.generateTrendData(50, 3, 25), 350, 160, '#22c55e', '#22c55e');
    
    const stocksList = document.getElementById('stocks-list');
    stocksList.innerHTML = user.investing.stocks.map(stock => `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full ${stock.color} flex items-center justify-center font-bold text-lg">${stock.symbol[0]}</div>
          <div><p class="font-bold text-sm text-gray-900">${stock.symbol}</p><p class="text-xs text-gray-500 font-medium">${stock.name}</p></div>
        </div>
        <div class="text-right">
          <p class="font-bold text-sm text-gray-900">${Utils.formatCurrency(stock.price)}</p>
          <p class="text-xs font-bold ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}">${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%</p>
        </div>
      </div>`).join('');
  },
  renderCrypto(user) {
    document.getElementById('crypto-total').textContent = Utils.formatCurrency(user.crypto.total);
    const list = document.getElementById('crypto-list');
    list.innerHTML = user.crypto.tokens.map(token => {
      const isUp = token.change >= 0;
      let iconHtml = token.icon === 'fa-bitcoin' || token.icon === 'fa-ethereum' ? `<i class="fab ${token.icon} text-white"></i>` : `<span class="font-bold text-white">${token.symbol[0]}</span>`;
      return `
        <div class="bg-[#1c1c1e] rounded-2xl p-4 flex items-center justify-between border border-[#2c2c2e]">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full ${token.iconBg} flex items-center justify-center text-lg shadow-inner">${iconHtml}</div>
            <div><p class="font-bold text-sm text-white">${token.name}</p><p class="text-[11px] text-gray-400 font-medium">${token.amount} ${token.symbol}</p></div>
          </div>
          <div class="text-right">
            <p class="font-bold text-sm text-white">${Utils.formatCurrency(token.price)}</p>
            <p class="text-[11px] font-bold ${isUp ? 'text-green-500' : 'text-red-500'}">${isUp ? '+' : '-'}$${Utils.formatCurrency(Math.abs(token.change), 0).replace('$', '')}</p>
          </div>
        </div>`;
    }).join('');
  }
};

/* ==========================================================================
   7. AI & APP INITIALIZATION
   ========================================================================== */
const AI = {
  async sendMessage(user, message) {
    const apiKey = Store.getApiKey();
    if (!apiKey) return this.mockResponse(user, message);

    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: `You are LarpAI, a helpful financial assistant inside LarpBank. Context: Checking: $${user.accounts.checking.balance}, Crypto: $${user.crypto.total}.` },
            { role: 'user', content: message }
          ]
        })
      });
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      return this.mockResponse(user, message) + " (Fallback used)";
    }
  },
  mockResponse(user, message) {
    const q = message.toLowerCase();
    if (q.includes('balance')) return `Your checking balance is ${Utils.formatCurrency(user.accounts.checking.balance)}.`;
    if (q.includes('crypto')) return `Your crypto portfolio is worth ${Utils.formatCurrency(user.crypto.total)}.`;
    return "I can help you check your balances, crypto, or investments.";
  }
};

let isSignupMode = false;
const authView = document.getElementById('view-auth');
const appContainer = document.getElementById('app-container');
const authForm = document.getElementById('auth-form');
const chatForm = document.getElementById('chat-form');
const chatMessages = document.getElementById('chat-messages');

document.getElementById('tab-login').addEventListener('click', () => {
  isSignupMode = false;
  document.getElementById('tab-login').className = 'flex-1 py-2.5 rounded-lg text-sm font-semibold bg-white shadow-sm text-black transition-all';
  document.getElementById('tab-signup').className = 'flex-1 py-2.5 rounded-lg text-sm font-semibold text-gray-500 transition-all';
  document.getElementById('auth-submit').textContent = 'Sign In';
});

document.getElementById('tab-signup').addEventListener('click', () => {
  isSignupMode = true;
  document.getElementById('tab-signup').className = 'flex-1 py-2.5 rounded-lg text-sm font-semibold bg-white shadow-sm text-black transition-all';
  document.getElementById('tab-login').className = 'flex-1 py-2.5 rounded-lg text-sm font-semibold text-gray-500 transition-all';
  document.getElementById('auth-submit').textContent = 'Create Account';
});

authForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value;
  const users = Store.getUsers();

  if (isSignupMode) {
    if (users.find(x => x.username === u)) return UI.showToast('Username taken', 'error');
    const newUser = DataGenerator.createUser(u, p);
    users.push(newUser);
    Store.saveUsers(users);
    Store.setSession(u);
    initializeApp(newUser);
  } else {
    const user = users.find(x => x.username === u && x.password === p);
    if (!user) return UI.showToast('Invalid credentials', 'error');
    Store.setSession(u);
    initializeApp(user);
  }
});

document.getElementById('save-api-key').addEventListener('click', () => {
  Store.setApiKey(document.getElementById('api-key-input').value.trim());
  UI.showToast('API Key Saved', 'success');
});

document.getElementById('clear-data-btn').addEventListener('click', () => {
  if (confirm('Delete all data?')) { Store.clearAll(); location.reload(); }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  Store.clearSession(); location.reload();
});

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('chat-input').value.trim();
  if (!msg) return;
  document.getElementById('chat-input').value = '';
  chatMessages.innerHTML += `<div class="flex justify-end"><div class="bubble-user px-4 py-3 text-sm shadow-sm max-w-[85%]">${msg}</div></div>`;
  chatMessages.scrollTop = chatMessages.scrollHeight;

  const response = await AI.sendMessage(Store.getSessionUser(), msg);
  chatMessages.innerHTML += `<div class="flex justify-start"><div class="bubble-ai px-4 py-3 text-sm text-gray-700 shadow-sm max-w-[85%]">${response}</div></div>`;
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

function initializeApp(user) {
  authView.classList.remove('active');
  appContainer.classList.remove('hidden');
  document.getElementById('settings-username').textContent = user.username;
  document.getElementById('settings-avatar').textContent = user.username[0].toUpperCase();
  document.getElementById('api-key-input').value = Store.getApiKey();

  Renderer.renderBanking(user);
  Renderer.renderAnalytics();
  Renderer.renderInvesting(user);
  Renderer.renderCrypto(user);

  Router.navigate('banking');
}

(function boot() {
  const activeUser = Store.getSessionUser();
  if (activeUser) initializeApp(activeUser);
  else { authView.classList.add('active'); appContainer.classList.add('hidden'); }
})();
