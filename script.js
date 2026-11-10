'use strict';

const Utils = {
  formatCurrency(amount, decimals = 2) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(amount);
  },
  randomRange(min, max) { return Math.random() * (max - min) + min; },
  generateUUID() { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) { var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); }); },
  animateValue(element, start, end, duration = 800) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = this.formatCurrency(start + (end - start) * eased);
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }
};

const Store = {
  USERS_KEY: 'larpbank_users_v5',
  SESSION_KEY: 'larpbank_session_v5',
  getUsers() { try { return JSON.parse(localStorage.getItem(this.USERS_KEY)) || []; } catch { return []; } },
  saveUsers(users) { localStorage.setItem(this.USERS_KEY, JSON.stringify(users)); },
  getSessionUser() { const u = localStorage.getItem(this.SESSION_KEY); return u ? this.getUsers().find(x => x.username === u) : null; },
  setSession(u) { localStorage.setItem(this.SESSION_KEY, u); },
  clearSession() { localStorage.removeItem(this.SESSION_KEY); },
  updateUser(updatedUser) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.username === updatedUser.username);
    if (idx > -1) { users[idx] = updatedUser; this.saveUsers(users); }
  }
};

const DataGenerator = {
  createUser(username, password) {
    return {
      id: Utils.generateUUID(), username, password,
      accounts: {
        checking: { name: 'Checking', balance: 15420.50, number: '7527' },
        savings: { name: 'Savings', balance: 50000.00, number: '9538' },
        platinum: { name: 'Platinum Card', balance: -134.88, number: '7537' }
      },
      investing: {
        buyingPower: 1500.00,
        stocks: [
          { symbol: 'AAPL', name: 'Apple Inc.', price: 175.50, change: 0.84, qty: 10, color: 'bg-gray-100 text-gray-800' },
          { symbol: 'TSLA', name: 'Tesla, Inc.', price: 240.30, change: -1.42, qty: 5, color: 'bg-red-100 text-red-500' },
          { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 450.20, change: 2.73, qty: 2, color: 'bg-green-100 text-green-600' }
        ]
      },
      crypto: {
        tokens: [
          { symbol: 'BTC', name: 'Bitcoin', amount: 0.5, price: 64000.00, change: 958.37, iconBg: 'bg-[#f7931a]', icon: 'fa-bitcoin' },
          { symbol: 'ETH', name: 'Ethereum', amount: 2.1, price: 3400.50, change: 150.12, iconBg: 'bg-[#627eea]', icon: 'fa-ethereum' },
          { symbol: 'SOL', name: 'Solana', amount: 15.0, price: 145.00, change: -5.52, iconBg: 'bg-black border border-white', icon: 'fa-s' }
        ]
      },
      transactions: []
    };
  }
};

const ChartEngine = {
  generateSmoothPath(data, width, height, stroke, fillGradient = null) {
    if (!data || data.length === 0) return '';
    const max = Math.max(...data), min = Math.min(...data), range = max - min || 1, stepX = width / (data.length - 1);
    const points = data.map((val, i) => ({ x: i * stepX, y: height - ((val - min) / range) * height }));
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i], p1 = points[i], p2 = points[i + 1], p3 = points[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6, cp1y = p1.y + (p2.y - p0.y) / 6, cp2x = p2.x - (p3.x - p1.x) / 6, cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    let svg = `<svg viewBox="0 0 ${width} ${height}" class="w-full h-full" preserveAspectRatio="none">`;
    if (fillGradient) {
      const id = 'grad-' + Utils.generateUUID();
      svg += `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${fillGradient}" stop-opacity="0.25"/><stop offset="100%" stop-color="${fillGradient}" stop-opacity="0"/></linearGradient></defs>`;
      svg += `<path d="${d} L ${width},${height} L 0,${height} Z" fill="url(#${id})" />`;
    }
    svg += `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg>`;
    return svg;
  },
  generateTrendData(points) { let val = 50; return Array.from({length: points}, () => { val += (Math.random() - 0.5) * 20; return Math.max(5, Math.min(95, val)); }); }
};

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
  },
  openModal(html) { document.getElementById('modal-content').innerHTML = html; document.getElementById('global-modal').classList.add('active'); },
  closeModal() { document.getElementById('global-modal').classList.remove('active'); }
};

document.getElementById('global-modal').addEventListener('click', (e) => { if (e.target.id === 'global-modal') UI.closeModal(); });

const Router = {
  navigate(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + viewId).classList.add('active');
    window.scrollTo(0, 0);
    document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.target === viewId));
    
    if (viewId === 'crypto') {
      document.body.style.backgroundColor = 'var(--bg-dark)';
      document.getElementById('bottom-nav').classList.add('dark-mode');
    } else {
      document.body.style.backgroundColor = 'var(--bg-light)';
      document.getElementById('bottom-nav').classList.remove('dark-mode');
    }
    if (viewId === 'chat') {
      setTimeout(() => document.getElementById('chat-input').focus(), 100);
      const chatMsgs = document.getElementById('chat-messages');
      chatMsgs.scrollTop = chatMsgs.scrollHeight;
    }
  }
};

document.querySelectorAll('.nav-item').forEach(item => item.addEventListener('click', () => Router.navigate(item.dataset.target)));

const Actions = {
  // Deposit funds into checking
  deposit(amount) {
    const user = Store.getSessionUser();
    user.accounts.checking.balance += amount;
    user.transactions.unshift({ id: Utils.generateUUID(), date: new Date().toISOString(), description: 'Mobile Deposit', category: 'Income', amount: amount });
    Store.updateUser(user);
    UI.closeModal();
    Renderer.renderAll(user);
    UI.showToast(`Deposited ${Utils.formatCurrency(amount)}`, 'success');
  },
  
  // Transfer funds (deduct)
  transfer(amount, recipient) {
    const user = Store.getSessionUser();
    if (user.accounts.checking.balance < amount) return UI.showToast('Insufficient funds', 'error');
    user.accounts.checking.balance -= amount;
    user.transactions.unshift({ id: Utils.generateUUID(), date: new Date().toISOString(), description: `Transfer to ${recipient}`, category: 'Transfer', amount: -amount });
    Store.updateUser(user);
    UI.closeModal();
    Renderer.renderAll(user);
    UI.showToast(`Sent ${Utils.formatCurrency(amount)} to ${recipient}`, 'success');
  },

  // Dev Tool: Set exact balance
  setBalance(amount) {
    const user = Store.getSessionUser();
    user.accounts.checking.balance = amount;
    Store.updateUser(user);
    UI.closeModal();
    Renderer.renderAll(user);
    UI.showToast(`Balance set to ${Utils.formatCurrency(amount)}`, 'success');
  },

  // Dev Tool: Add 10k
  addFunds() {
    const user = Store.getSessionUser();
    user.accounts.checking.balance += 10000;
    Store.updateUser(user);
    UI.closeModal();
    Renderer.renderAll(user);
    UI.showToast(`Added $10,000 to Checking`, 'success');
  },

  // Buy Stock
  buyStock(symbol, amount) {
    const user = Store.getSessionUser();
    const stock = user.investing.stocks.find(s => s.symbol === symbol);
    const totalCost = stock.price * amount;
    
    if (user.accounts.checking.balance < totalCost) return UI.showToast('Insufficient funds in checking', 'error');
    
    user.accounts.checking.balance -= totalCost;
    stock.qty += amount;
    user.transactions.unshift({ id: Utils.generateUUID(), date: new Date().toISOString(), description: `Bought ${amount} shares of ${symbol}`, category: 'Investing', amount: -totalCost });
    
    Store.updateUser(user);
    UI.closeModal();
    Renderer.renderAll(user);
    UI.showToast(`Bought ${amount} shares of ${symbol}`, 'success');
  },

  // Buy Crypto
  buyCrypto(symbol, amount) {
    const user = Store.getSessionUser();
    const token = user.crypto.tokens.find(t => t.symbol === symbol);
    const totalCost = token.price * amount;
    
    if (user.accounts.checking.balance < totalCost) return UI.showToast('Insufficient funds in checking', 'error');
    
    user.accounts.checking.balance -= totalCost;
    token.amount += amount;
    user.transactions.unshift({ id: Utils.generateUUID(), date: new Date().toISOString(), description: `Bought ${amount} ${symbol}`, category: 'Crypto', amount: -totalCost });
    
    Store.updateUser(user);
    UI.closeModal();
    Renderer.renderAll(user);
    UI.showToast(`Bought ${amount} ${symbol}`, 'success');
  }
};

const App = {
  openModal(type) {
    const user = Store.getSessionUser();
    
    if (type === 'transfer') {
      UI.openModal(`
        <h3 class="text-xl font-bold mb-4 text-gray-900">Send Money</h3>
        <input type="text" id="modal-recipient" placeholder="Recipient Name" class="modal-input">
        <input type="number" id="modal-amount" placeholder="Amount ($)" class="modal-input">
        <button class="modal-btn" onclick="Actions.transfer(parseFloat(document.getElementById('modal-amount').value), document.getElementById('modal-recipient').value)">Send Funds</button>
      `);
    } else if (type === 'deposit') {
      UI.openModal(`
        <h3 class="text-xl font-bold mb-4 text-gray-900">Deposit Funds</h3>
        <input type="number" id="modal-amount" placeholder="Amount ($)" class="modal-input">
        <button class="modal-btn bg-green-500" onclick="Actions.deposit(parseFloat(document.getElementById('modal-amount').value))">Deposit to Checking</button>
      `);
    } else if (type === 'devSetBalance') {
      UI.openModal(`
        <h3 class="text-xl font-bold mb-4 text-blue-900">Dev Tools: Set Balance</h3>
        <p class="text-xs text-gray-500 mb-4">Overwrite your checking balance instantly.</p>
        <input type="number" id="modal-balance" placeholder="New Balance ($)" value="${user.accounts.checking.balance}" class="modal-input">
        <button class="modal-btn bg-blue-600" onclick="Actions.setBalance(parseFloat(document.getElementById('modal-balance').value))">Update Balance</button>
      `);
    } else if (type === 'devAddFunds') {
      Actions.addFunds();
    } else if (type === 'editProfile') {
      UI.openModal(`
        <h3 class="text-xl font-bold mb-4 text-gray-900">Edit Profile</h3>
        <label class="text-xs font-semibold text-gray-500">Username</label>
        <input type="text" id="modal-new-username" value="${user.username}" class="modal-input mt-1">
        <label class="text-xs font-semibold text-gray-500 mt-2 block">New Password</label>
        <input type="password" id="modal-new-password" placeholder="Leave blank to keep current" class="modal-input mt-1">
        <button class="modal-btn" onclick="
          const users = Store.getUsers();
          const oldName = '${user.username}';
          user.username = document.getElementById('modal-new-username').value;
          user.password = document.getElementById('modal-new-password').value || user.password;
          Store.saveUsers(users.map(u => u.username === oldName ? user : u));
          if (oldName !== user.username) Store.setSession(user.username);
          UI.closeModal(); location.reload();
        ">Save Changes</button>
      `);
    }
  }
};

const Renderer = {
  renderAll(user) {
    this.renderBanking(user);
    this.renderAnalytics(user);
    this.renderInvesting(user);
    this.renderCrypto(user);
  },
  
  renderBanking(user) {
    const hr = new Date().getHours();
    document.getElementById('greeting-text').textContent = `Good ${hr < 12 ? 'morning' : hr < 18 ? 'afternoon' : 'evening'}, ${user.username}`;
    document.getElementById('banking-card-num').textContent = `•••• ${user.accounts.checking.number}`;
    document.getElementById('banking-balance').textContent = Utils.formatCurrency(user.accounts.checking.balance);
    
    const accList = document.getElementById('banking-accounts');
    accList.innerHTML = Object.values(user.accounts).map(acc => `
      <div class="bg-white rounded-2xl p-4 flex justify-between items-center shadow-sm border border-gray-100">
        <div><p class="font-bold text-[15px] text-gray-900">${acc.name}</p><p class="text-xs text-gray-500 font-medium">••••${acc.number}</p></div>
        <p class="font-bold text-[15px] text-gray-900">${Utils.formatCurrency(acc.balance)}</p>
      </div>
    `).join('');

    const txList = document.getElementById('banking-transactions');
    txList.innerHTML = user.transactions.slice(0, 3).map(tx => `
      <div class="flex justify-between items-center py-2 border-b border-gray-100">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><i class="fas fa-receipt text-gray-500 text-xs"></i></div>
          <div><p class="text-sm font-bold text-gray-900">${tx.description}</p><p class="text-[10px] text-gray-500">${new Date(tx.date).toLocaleDateString()}</p></div>
        </div>
        <p class="text-sm font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-gray-900'}">${tx.amount > 0 ? '+' : ''}${Utils.formatCurrency(tx.amount)}</p>
      </div>
    `).join('') || '<p class="text-sm text-gray-500">No recent transactions</p>';
  },

  renderAnalytics(user) {
    const spend = user.transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const income = user.transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    document.getElementById('analytics-total-spend').textContent = Utils.formatCurrency(spend);
    document.getElementById('analytics-total-income').textContent = Utils.formatCurrency(income);
    document.getElementById('analytics-chart').innerHTML = ChartEngine.generateSmoothPath(ChartEngine.generateTrendData(30), 350, 180, '#3b82f6', '#3b82f6');
  },

  renderInvesting(user) {
    let total = 0;
    user.investing.stocks.forEach(s => { total += s.price * s.qty; });
    
    document.getElementById('investing-total').textContent = Utils.formatCurrency(total);
    document.getElementById('investing-buying-power').textContent = Utils.formatCurrency(user.accounts.checking.balance);
    document.getElementById('investing-chart').innerHTML = ChartEngine.generateSmoothPath(ChartEngine.generateTrendData(40), 350, 160, '#22c55e', '#22c55e');

    const stocksList = document.getElementById('stocks-list');
    stocksList.innerHTML = user.investing.stocks.map(stock => `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full ${stock.color} flex items-center justify-center font-bold text-lg">${stock.symbol[0]}</div>
          <div><p class="font-bold text-sm text-gray-900">${stock.symbol}</p><p class="text-xs text-gray-500 font-medium">${stock.qty} shares</p></div>
        </div>
        <div class="text-right">
          <p class="font-bold text-sm text-gray-900">${Utils.formatCurrency(stock.price * stock.qty)}</p>
          <button class="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-bold mt-1" onclick="App.openModal('buyStock-${stock.symbol}')">Buy</button>
        </div>
      </div>
    `).join('');
    
    // Attach Buy Modal logic dynamically
    user.investing.stocks.forEach(stock => {
        App.openModal = (function(orig) {
            return function(type) {
                if(type === 'buyStock-' + stock.symbol) {
                    UI.openModal(`
                        <h3 class="text-xl font-bold mb-4 text-gray-900">Buy ${stock.symbol}</h3>
                        <p class="text-xs text-gray-500 mb-4">Price: ${Utils.formatCurrency(stock.price)}</p>
                        <input type="number" id="modal-qty" placeholder="Quantity" value="1" class="modal-input">
                        <button class="modal-btn" onclick="Actions.buyStock('${stock.symbol}', parseInt(document.getElementById('modal-qty').value))">Confirm Purchase</button>
                    `);
                } else { orig.call(App, type); }
            }
        })(App.openModal);
    });
  },

  renderCrypto(user) {
    let total = 0;
    user.crypto.tokens.forEach(t => { total += t.price * t.amount; });
    document.getElementById('crypto-total').textContent = Utils.formatCurrency(total);

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
            <p class="font-bold text-sm text-white">${Utils.formatCurrency(token.price * token.amount)}</p>
            <button class="text-[10px] bg-[#2c2c2e] text-white px-2 py-0.5 rounded font-bold mt-1 border border-[#3c3c3e]" onclick="App.openModal('buyCrypto-${token.symbol}')">Buy</button>
          </div>
        </div>`;
    }).join('');

    // Attach Buy Modal logic dynamically
    user.crypto.tokens.forEach(token => {
        App.openModal = (function(orig) {
            return function(type) {
                if(type === 'buyCrypto-' + token.symbol) {
                    UI.openModal(`
                        <h3 class="text-xl font-bold mb-4 text-gray-900">Buy ${token.name}</h3>
                        <p class="text-xs text-gray-500 mb-4">Price: ${Utils.formatCurrency(token.price)}</p>
                        <input type="number" id="modal-qty" placeholder="Amount (e.g. 0.5)" value="1" class="modal-input">
                        <button class="modal-btn" onclick="Actions.buyCrypto('${token.symbol}', parseFloat(document.getElementById('modal-qty').value))">Confirm Purchase</button>
                    `);
                } else { orig.call(App, type); }
            }
        })(App.openModal);
    });
  }
};

const AI = {
  async sendMessage(user, message) {
    const apiKey = localStorage.getItem('larpbank_deepseek_v5');
    if (!apiKey) return this.mockResponse(user, message);
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: `You are LarpAI, a helpful financial assistant inside LarpBank. User: ${user.username}. Checking Balance: $${user.accounts.checking.balance}. Crypto Holdings: ${user.crypto.tokens.map(t => `${t.amount} ${t.symbol}`).join(', ')}.` },
            { role: 'user', content: message }
          ]
        })
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      return data.choices[0].message.content;
    } catch { return this.mockResponse(user, message) + " (Fallback)"; }
  },
  mockResponse(user, message) {
    const q = message.toLowerCase();
    if (q.includes('balance')) return `Your checking balance is ${Utils.formatCurrency(user.accounts.checking.balance)}.`;
    if (q.includes('crypto')) return `You currently hold ${user.crypto.tokens.map(t => `${t.amount} ${t.symbol}`).join(' and ')}.`;
    if (q.includes('how to change') || q.includes('add money')) return "To add money, go to Settings > Larp Dev Tools and click 'Add $10,000' or 'Set Balance'.";
    return "I can help you check your balances, crypto, or investments.";
  }
};

let isSignupMode = false;
document.getElementById('tab-login').onclick = () => {
  isSignupMode = false;
  document.getElementById('tab-login').className = 'flex-1 py-2.5 rounded-lg text-sm font-semibold bg-white shadow-sm text-black transition-all';
  document.getElementById('tab-signup').className = 'flex-1 py-2.5 rounded-lg text-sm font-semibold text-gray-500 transition-all';
  document.getElementById('auth-submit').textContent = 'Sign In';
};
document.getElementById('tab-signup').onclick = () => {
  isSignupMode = true;
  document.getElementById('tab-signup').className = 'flex-1 py-2.5 rounded-lg text-sm font-semibold bg-white shadow-sm text-black transition-all';
  document.getElementById('tab-login').className = 'flex-1 py-2.5 rounded-lg text-sm font-semibold text-gray-500 transition-all';
  document.getElementById('auth-submit').textContent = 'Create Account';
};

document.getElementById('auth-form').onsubmit = (e) => {
  e.preventDefault();
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value;
  const users = Store.getUsers();
  if (isSignupMode) {
    if (users.find(x => x.username === u)) return UI.showToast('Username taken', 'error');
    const newUser = DataGenerator.createUser(u, p);
    users.push(newUser); Store.saveUsers(users); Store.setSession(u);
    initializeApp(newUser);
  } else {
    const user = users.find(x => x.username === u && x.password === p);
    if (!user) return UI.showToast('Invalid credentials', 'error');
    Store.setSession(u); initializeApp(user);
  }
};

document.getElementById('save-api-key').onclick = () => {
  localStorage.setItem('larpbank_deepseek_v5', document.getElementById('api-key-input').value.trim());
  UI.showToast('API Key Saved', 'success');
};
document.getElementById('clear-data-btn').onclick = () => { if (confirm('Delete all data?')) { localStorage.clear(); location.reload(); } };
document.getElementById('logout-btn').onclick = () => { Store.clearSession(); location.reload(); };

document.getElementById('chat-form').onsubmit = async (e) => {
  e.preventDefault();
  const msg = document.getElementById('chat-input').value.trim();
  if (!msg) return;
  document.getElementById('chat-input').value = '';
  const chatMsgs = document.getElementById('chat-messages');
  chatMsgs.innerHTML += `<div class="flex justify-end"><div class="bubble-user px-4 py-3 text-sm shadow-sm max-w-[85%]">${msg}</div></div>`;
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
  const response = await AI.sendMessage(Store.getSessionUser(), msg);
  chatMsgs.innerHTML += `<div class="flex justify-start"><div class="bubble-ai px-4 py-3 text-sm text-gray-700 shadow-sm max-w-[85%]">${response}</div></div>`;
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
};

function initializeApp(user) {
  document.getElementById('view-auth').classList.remove('active');
  document.getElementById('app-container').classList.remove('hidden');
  document.getElementById('settings-username').textContent = user.username;
  document.getElementById('settings-avatar').textContent = user.username[0].toUpperCase();
  document.getElementById('api-key-input').value = localStorage.getItem('larpbank_deepseek_v5') || '';
  
  // Seed some initial transactions if none exist
  if (user.transactions.length === 0) {
      user.transactions = [
          { id: '1', date: new Date().toISOString(), description: 'Initial Deposit', category: 'Income', amount: 15000 },
          { id: '2', date: new Date(Date.now() - 86400000).toISOString(), description: 'Apple Store', category: 'Shopping', amount: -1299 }
      ];
      Store.updateUser(user);
  }

  Renderer.renderAll(user);
  Router.navigate('banking');
}

(function boot() {
  const activeUser = Store.getSessionUser();
  if (activeUser) initializeApp(activeUser);
  else { document.getElementById('view-auth').classList.add('active'); document.getElementById('app-container').classList.add('hidden'); }
})();
