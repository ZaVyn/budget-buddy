import { state } from './state.js';
import { translations } from '../config/translations.js';

// --- FORMATTERS ---
export const formatCurrency = (amount) => {
    return '฿ ' + (amount || 0).toLocaleString('en-US');
};

// --- HELPER: DATE FILTERS ---
const isToday = (dateString) => {
    if(!dateString) return false;
    const d = new Date(dateString);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
};

const isThisWeek = (dateString) => {
    if(!dateString) return false;
    const d = new Date(dateString);
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return d >= startOfWeek && d <= endOfWeek;
};

const isThisMonth = (dateString) => {
    if(!dateString) return false;
    const d = new Date(dateString);
    const today = new Date();
    return d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
};

// --- UI UPDATES ---

export function updateAllLabels() {
    const lang = state.currentLanguage || 'en';
    const t = translations[lang];
    if (!t) return;

    Object.keys(t).forEach(key => {
        const el = document.getElementById(key);
        if (el) {
            if (el.tagName === 'INPUT') {
                el.placeholder = t[key];
            } else {
                if(key !== 'btn-login-text') el.textContent = t[key];
            }
        }
    });
}

export function updateHeaderLanguageVisuals(lang) {
    const headerFlag = document.getElementById('header-flag');
    const headerText = document.getElementById('header-lang-text');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const dropdownArrow = document.getElementById('dropdown-arrow');

    if(headerFlag && headerText) {
        if (lang === 'en') {
            headerFlag.src = 'https://flagcdn.com/w40/gb.png';
            headerText.textContent = 'EN';
        } else {
            headerFlag.src = 'https://flagcdn.com/w40/th.png';
            headerText.textContent = 'TH';
        }
    }

    if (dropdownMenu) dropdownMenu.classList.add('hidden');
    if (dropdownArrow) dropdownArrow.classList.remove('rotate-180');
}

export function switchTabUI(activeTab) {
    ['dashboard', 'transaction', 'scan', 'budget', 'learn'].forEach(tab => {
        const section = document.getElementById(`section-${tab}`);
        const btn = document.getElementById(`tab-${tab}`);
        
        if (section) section.classList.add('hidden');
        if (btn) {  
            btn.classList.remove('tab-active');
            btn.classList.add('text-gray-600', 'hover:bg-gray-50');
        }
    });

    const activeSection = document.getElementById(`section-${activeTab}`);
    const activeBtn = document.getElementById(`tab-${activeTab}`);

    if (activeSection) {
        activeSection.classList.remove('hidden');
        activeSection.classList.add('animate-slide');
    }
    if (activeBtn) {
        activeBtn.classList.add('tab-active');
        activeBtn.classList.remove('text-gray-600', 'hover:bg-gray-50');
    }
}

export function setTransactionTypeUI(type) {
    const btnIncome = document.getElementById('type-income');
    const btnExpense = document.getElementById('type-expense');
    const submitBtn = document.getElementById('submit-btn');
    const categorySelect = document.getElementById('category-select');
    
    // Safety check: Jika elemen belum ada, berhenti agar tidak crash
    if(!btnIncome || !btnExpense || !submitBtn || !categorySelect) return;

    const lang = state.currentLanguage || 'en';
    const t = translations[lang] || translations['en'];

    if (type === 'income') {
        btnIncome.className = "flex-1 py-3 rounded-xl font-semibold text-sm transition-all income-gradient text-white shadow-sm";
        btnExpense.className = "flex-1 py-3 rounded-xl font-semibold text-sm transition-all bg-gray-100 text-gray-600";
        submitBtn.className = "w-full py-3.5 rounded-xl font-bold text-white text-sm income-gradient hover:opacity-90 active:scale-[0.98] transition-all shadow-md mt-2";
        
        categorySelect.innerHTML = `
            <option value="salary">${t['category-salary']}</option>
            <option value="pocket">${t['category-pocket']}</option>
            <option value="gift">${t['category-gift']}</option>
            <option value="other">${t['category-other-in']}</option>
        `;
    } else {
        btnIncome.className = "flex-1 py-3 rounded-xl font-semibold text-sm transition-all bg-gray-100 text-gray-600";
        btnExpense.className = "flex-1 py-3 rounded-xl font-semibold text-sm transition-all expense-gradient text-white shadow-sm";
        submitBtn.className = "w-full py-3.5 rounded-xl font-bold text-white text-sm expense-gradient hover:opacity-90 active:scale-[0.98] transition-all shadow-md mt-2";
        
        categorySelect.innerHTML = `
            <option value="food">${t['category-food']}</option>
            <option value="transport">${t['category-transport']}</option>
            <option value="school">${t['category-school']}</option>
            <option value="entertainment">${t['category-entertainment']}</option>
            <option value="shopping">${t['category-shopping']}</option>
            <option value="other">${t['category-other-out']}</option>
        `;
    }
}

export function setScanTypeUI(type) {
    const btnIncome = document.getElementById('scan-type-income');
    const btnExpense = document.getElementById('scan-type-expense');
    const categorySelect = document.getElementById('scan-category');
    
    if (!btnIncome || !btnExpense || !categorySelect) return;

    const lang = state.currentLanguage || 'en';
    const t = translations[lang] || translations['en'];

    if (type === 'income') {
        // Tampilan tombol Income aktif
        btnIncome.className = "flex-1 py-2 rounded-lg font-bold text-xs bg-emerald-500 text-white transition-all shadow-sm";
        btnExpense.className = "flex-1 py-2 rounded-lg font-bold text-xs bg-gray-200 text-gray-600 transition-all";
        
        // Isi dropdown dengan kategori Income
        categorySelect.innerHTML = `
            <option value="salary">${t['category-salary'] || 'Salary'}</option>
            <option value="pocket">${t['category-pocket'] || 'Pocket Money'}</option>
            <option value="gift">${t['category-gift'] || 'Gift'}</option>
            <option value="other">${t['category-other-in'] || 'Other Income'}</option>
        `;
    } else {
        // Tampilan tombol Expense aktif (Default)
        btnIncome.className = "flex-1 py-2 rounded-lg font-bold text-xs bg-gray-200 text-gray-600 transition-all";
        btnExpense.className = "flex-1 py-2 rounded-lg font-bold text-xs bg-red-500 text-white transition-all shadow-sm";
        
        // Isi dropdown dengan kategori Expense
        categorySelect.innerHTML = `
            <option value="food">${t['category-food'] || 'Food'}</option>
            <option value="shopping">${t['category-shopping'] || 'Shopping'}</option>
            <option value="transport">${t['category-transport'] || 'Transport'}</option>
            <option value="school">${t['category-school'] || 'School'}</option>
            <option value="entertainment">${t['category-entertainment'] || 'Entertainment'}</option>
            <option value="other">${t['category-other-out'] || 'Other Expense'}</option>
        `;
    }
}

export function setPeriodUI(activePeriod) {
    ['daily', 'weekly', 'monthly'].forEach(p => {
        const btn = document.getElementById(`period-${p}`);
        if(btn) {
            if (p === activePeriod) {
                btn.className = "flex-1 py-2 px-3 rounded-lg text-xs md:text-sm font-medium bg-emerald-500 text-white whitespace-nowrap shadow-sm";
            } else {
                btn.className = "flex-1 py-2 px-3 rounded-lg text-xs md:text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-200 whitespace-nowrap";
            }
        }
    });
    updateDashboard();
}

export function updateDashboard() {
    const trans = state.transactions || [];
    const period = state.currentPeriod || 'daily';

    // 1. Total (Always All Data)
    const totalIncomeAll = trans.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalExpenseAll = trans.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
    const balance = totalIncomeAll - totalExpenseAll - (state.totalSavings || 0);

    const elTotalIncome = document.getElementById('total-income');
    const elTotalExpense = document.getElementById('total-expense');
    const elBalance = document.getElementById('current-balance');
    const elTotalSavings = document.getElementById('total-savings');

    if(elTotalIncome) elTotalIncome.textContent = formatCurrency(totalIncomeAll);
    if(elTotalExpense) elTotalExpense.textContent = formatCurrency(totalExpenseAll);
    if(elBalance) elBalance.textContent = formatCurrency(balance);
    if(elTotalSavings) elTotalSavings.textContent = formatCurrency(state.totalSavings || 0);

    // 2. Period Filtering
    let filteredTrans = [];
    if (period === 'daily') {
        filteredTrans = trans.filter(t => isToday(t.date || t.createdAt));
    } else if (period === 'weekly') {
        filteredTrans = trans.filter(t => isThisWeek(t.date || t.createdAt));
    } else if (period === 'monthly') {
        filteredTrans = trans.filter(t => isThisMonth(t.date || t.createdAt));
    } else {
        filteredTrans = trans; // Fallback
    }

    const periodIncome = filteredTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
    const periodExpense = filteredTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);

    const elPeriodIncome = document.getElementById('period-income');
    const elPeriodExpense = document.getElementById('period-expense');

    if(elPeriodIncome) elPeriodIncome.textContent = formatCurrency(periodIncome);
    if(elPeriodExpense) elPeriodExpense.textContent = formatCurrency(periodExpense);

    // 3. Budget (Month Based)
    const monthlyExpense = trans
        .filter(t => t.type === 'expense' && isThisMonth(t.date || t.createdAt))
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    updateBudgetStatus(monthlyExpense);

    // 4. Category
    updateCategoryBreakdown(filteredTrans);

    // 5. Savings
    updateSavingsStatus();
}

export function updateBudgetStatus(currentExpense) {
    const limit = state.budget || 0;
    
    const elBudgetAmount = document.getElementById('budget-amount');
    const elBudgetUsed = document.getElementById('budget-used');
    const bar = document.getElementById('budget-bar');
    const text = document.getElementById('budget-percent');
    const warning = document.getElementById('budget-warning');
    
    if(elBudgetAmount) elBudgetAmount.textContent = limit > 0 ? formatCurrency(limit) : 'Not set';
    if(elBudgetUsed) elBudgetUsed.textContent = formatCurrency(currentExpense);
    
    const percent = limit > 0 ? Math.min((currentExpense / limit) * 100, 100) : 0;

    if(bar) bar.style.width = `${percent}%`;
    if(text) text.textContent = `${Math.round(percent)}%`;

    if(bar && text && warning) {
        if (percent > 90) {
            bar.className = 'h-full bg-red-500 transition-all duration-500';
            text.className = 'text-xs text-red-500 mt-1 text-right font-bold';
            warning.classList.remove('hidden');
        } else {
            bar.className = 'h-full bg-emerald-500 transition-all duration-500';
            text.className = 'text-xs text-gray-500 mt-1 text-right';
            warning.classList.add('hidden');
        }
    }
}

export function updateSavingsStatus() {
    const goal = state.savingsGoal || { name: '', target: 0 };
    const current = state.totalSavings || 0;

    const elGoalName = document.getElementById('savings-goal-name');
    const elGoalAmount = document.getElementById('savings-goal-amount');
    const elCurrent = document.getElementById('savings-current');
    const bar = document.getElementById('savings-bar');
    const text = document.getElementById('savings-percent');

    if(elGoalName) elGoalName.textContent = goal.name || 'Not set';
    if(elGoalAmount) elGoalAmount.textContent = formatCurrency(goal.target);
    if(elCurrent) elCurrent.textContent = formatCurrency(current);

    const percent = goal.target > 0 ? Math.min((current / goal.target) * 100, 100) : 0;

    if(bar) bar.style.width = `${percent}%`;
    if(text) text.textContent = `${Math.round(percent)}%`;

    const btnResetGoal = document.getElementById('btn-reset-goal');
    if (btnResetGoal) {
        if (goal.target > 0 && percent >= 100) {
            // Jika target lebih dari 0 dan persentase sudah 100% atau lebih, tampilkan tombolnya
            btnResetGoal.classList.remove('hidden');
        } else {
            // Jika belum 100%, sembunyikan kembali tombolnya
            btnResetGoal.classList.add('hidden');
        }
    }
}

function updateCategoryBreakdown(transactions) {
    const container = document.getElementById('category-breakdown');
    if (!container) return;

    const expenses = transactions.filter(t => t.type === 'expense');
    const lang = state.currentLanguage || 'en';
    const t = translations[lang] || translations['en'];
    
    if (expenses.length === 0) {
        container.innerHTML = `<p class="text-gray-500 text-center py-4 text-xs">${t['text-no-expense']}</p>`;
        return;
    }

    const groups = {};
    let total = 0;
    expenses.forEach(t => {
        if (!groups[t.category]) groups[t.category] = 0;
        groups[t.category] += t.amount;
        total += t.amount;
    });

    let html = '';
    Object.entries(groups)
        .sort(([,a], [,b]) => b - a)
        .forEach(([cat, amount]) => {
            const percent = Math.round((amount / total) * 100);
            const catName = t[`category-${cat}`] || cat; 
            
            html += `
            <div class="mb-3">
                <div class="flex justify-between text-xs mb-1">
                    <span class="text-gray-700 font-medium">${catName}</span>
                    <span class="text-gray-500">${percent}% (${formatCurrency(amount)})</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2">
                    <div class="bg-red-400 h-2 rounded-full" style="width: ${percent}%"></div>
                </div>
            </div>
            `;
        });

    container.innerHTML = html;
}

export function updateTransactionList() {
    const list = document.getElementById('transaction-list');
    if(!list) return;

    const trans = state.transactions || [];
    const lang = state.currentLanguage || 'en';
    const t = translations[lang] || translations['en'];
    
    if (trans.length === 0) {
        list.innerHTML = `<p class="text-gray-500 text-center py-8 text-xs">${t['text-no-transaction']}</p>`;
        return;
    }

    const sortedTrans = [...trans].sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.date).getTime();
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.date).getTime();
            return timeB - timeA;
    });

    list.innerHTML = sortedTrans.map(item => {
        const isIncome = item.type === 'income';
        const colorClass = isIncome ? 'text-emerald-600' : 'text-red-500';
        const sign = isIncome ? '+' : '-';
        const catName = t[`category-${item.category}`] || item.category;
        
        let dateStr = '-';
        try {
            // Tambahkan year: 'numeric' di dalam kurung kurawal
            dateStr = new Date(item.date || item.createdAt).toLocaleDateString(lang === 'en' ? 'en-GB' : 'th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch(e) {}

        return `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100 mb-2">
            
            <div class="flex items-center gap-3 flex-1 min-w-0 pr-4">
                <div class="min-w-0">
                    <p class="font-bold text-gray-800 text-sm truncate">${catName}</p>
                    <p class="text-xs text-gray-500 truncate">${item.description || '-'}</p>
                </div>
            </div>

            <div class="flex items-center gap-4 shrink-0">
                <div class="text-right">
                    <p class="font-bold ${colorClass} text-sm whitespace-nowrap">${sign} ${formatCurrency(item.amount)}</p>
                    <p class="text-[10px] text-gray-400">${dateStr}</p>
                </div>
                
                <button onclick="window.appOpenDeleteModal('${item.__backendId}')" 
                    class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>

        </div>
        `;
    }).join('');
}

// ... Fungsi modal & toast tetap sama ...
export function toggleGuideModal(show) {
    const modal = document.getElementById('guide-modal');
    if(modal) {
        if(show) modal.classList.remove('hidden');
        else modal.classList.add('hidden');
    }
}

export function toggleDeleteModal(show) {
    const modal = document.getElementById('delete-modal');
    if(modal) {
        if(show) modal.classList.remove('hidden');
        else modal.classList.add('hidden');
    }
}

export function showToast(messageKeyOrText) {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toast-message');
    if (!toast || !msgEl) return;

    const lang = state.currentLanguage || 'en';
    const t = translations[lang] || translations['en'];
    
    const text = t[messageKeyOrText] || messageKeyOrText;

    msgEl.textContent = text;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}