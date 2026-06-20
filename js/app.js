import { state, setState } from './modules/state.js';
import { defaultConfig } from './config/constants.js';
import { translations } from './config/translations.js';
import * as UI from './modules/ui.js';

// --- Initialization ---
function loadLocalData() {
    setState('budget', parseInt(localStorage.getItem('budget')) || 0);
    setState('savingsGoal', JSON.parse(localStorage.getItem('savingsGoal')) || { name: '', target: 0 });
    setState('totalSavings', parseInt(localStorage.getItem('totalSavings')) || 0);
    setState('currentLanguage', localStorage.getItem('language') || 'en');

    // Load transaksi lokal (Guest Mode)
    const localTrans = JSON.parse(localStorage.getItem('local_transactions')) || [];
    setState('transactions', localTrans);

    // [PERBAIKAN UTAMA ADA DI SINI]
    UI.updateHeaderLanguageVisuals(state.currentLanguage);
    
    const budgetInput = document.getElementById('budget-input');
    const savingsName = document.getElementById('savings-name');
    const savingsTarget = document.getElementById('savings-target');

    if(budgetInput) budgetInput.value = state.budget || '';
    if(savingsName) savingsName.value = state.savingsGoal.name || '';
    if(savingsTarget) savingsTarget.value = state.savingsGoal.target || '';
    
    UI.updateAllLabels();
    UI.updateDashboard();
    UI.updateTransactionList();
}

function setupEventListeners() {
    // 1. Tabs
    ['dashboard', 'transaction', 'budget', 'learn'].forEach(tab => {
        const el = document.getElementById(`tab-${tab}`);
        if(el) {
            el.addEventListener('click', () => {
                setState('currentTab', tab);
                UI.switchTabUI(tab);
            });
        }
    });

    const btnLoginTrigger = document.getElementById('btn-login-trigger');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');

    if (btnLoginTrigger) {
        btnLoginTrigger.addEventListener('click', () => {
            if (authEmail) authEmail.value = '';
            if (authPassword) authPassword.value = '';
        });
    }

    // 2. Language Change Handler (Updated for Dropdown)
    const handleLanguageChange = (lang) => {
        if (state.currentLanguage === lang) {
            UI.updateHeaderLanguageVisuals(lang);
            return;
        }
        
        setState('currentLanguage', lang);
        localStorage.setItem('language', lang);
        
        UI.updateHeaderLanguageVisuals(lang);
        UI.updateAllLabels();
        UI.setTransactionTypeUI(state.transactionType);
        UI.updateTransactionList();
        UI.updateDashboard();
    };

    // Event listener untuk tombol di dalam dropdown
    const btnEn = document.getElementById('btn-lang-en');
    const btnTh = document.getElementById('btn-lang-th');

    if(btnEn) btnEn.addEventListener('click', () => handleLanguageChange('en'));
    if(btnTh) btnTh.addEventListener('click', () => handleLanguageChange('th'));

    // 3. Transaction Type Buttons
    const btnIncome = document.getElementById('type-income');
    const btnExpense = document.getElementById('type-expense');

    if(btnIncome) {
        btnIncome.addEventListener('click', () => {
            setState('transactionType', 'income');
            UI.setTransactionTypeUI('income');
        });
    }
    if(btnExpense) {
        btnExpense.addEventListener('click', () => {
            setState('transactionType', 'expense');
            UI.setTransactionTypeUI('expense');
        });
    }

    // 4. Period Buttons
    ['daily', 'weekly', 'monthly'].forEach(period => {
        const el = document.getElementById(`period-${period}`);
        if(el) {
            el.addEventListener('click', () => {
                setState('currentPeriod', period);
                UI.setPeriodUI(period);
            });
        }
    });

    // 5. Guide Modal
    const showGuide = () => UI.toggleGuideModal(true);
    const closeGuide = () => UI.toggleGuideModal(false);
    
    const btnShowGuide = document.getElementById('btn-show-guide');
    const btnCloseGuideX = document.getElementById('btn-close-guide-x');
    const btnCloseGuideMain = document.getElementById('btn-close-guide-main');

    if(btnShowGuide) btnShowGuide.addEventListener('click', showGuide);
    if(btnCloseGuideX) btnCloseGuideX.addEventListener('click', closeGuide);
    if(btnCloseGuideMain) btnCloseGuideMain.addEventListener('click', closeGuide);

    // 6. Transaction Form Submit
    const transForm = document.getElementById('transaction-form');
    if(transForm) transForm.addEventListener('submit', handleTransactionSubmit);

    // --- TAB SCAN & OCR LOGIC ---
    const tabScan = document.getElementById('tab-scan');
    if (tabScan) {
        tabScan.addEventListener('click', () => {
            setState('currentTab', 'scan');
            UI.switchTabUI('scan');
        });
    }

    const scanStatus = document.getElementById('scan-status');
    const scanResults = document.getElementById('scan-results');
    
    // Form Inputs
    const scanDate = document.getElementById('scan-date');
    const scanDescription = document.getElementById('scan-description');
    const scanTotal = document.getElementById('scan-total');
    const btnSaveScanned = document.getElementById('btn-save-scanned');

    // --- VARIABEL INPUT KAMERA & GALERI BARU ---
    const cameraUpload = document.getElementById('receipt-camera');
    const galleryUpload = document.getElementById('receipt-gallery');
    
    // Fungsi utama untuk memproses gambar
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        scanStatus.classList.remove('hidden');
        scanResults.classList.add('hidden');
        const lang = state.currentLanguage || 'en';
        scanStatus.textContent = lang === 'th' ? '⏳ กำลังสแกนสลิป...' : '⏳ Scanning receipt... Please wait.';
        
        try {
            const result = await Tesseract.recognize(file, 'eng+tha', {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        scanStatus.textContent = `Scanning... ${Math.round(m.progress * 100)}%`;
                    }
                }
            });

            const text = result.data.text;
            const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

            let descriptionText = "Auto-scanned transaction";
            let dateStr = "";
            let totalAmount = 0;
            let autoCategory = "other";

            // --- 1. EXTRACT DATE (Universal Thai Banks) ---
            const textBankDateRegex = /(\d{1,2})\s+([a-zA-Z]{3}|[ก-๙]{2,4})\s+(\d{2,4})/;
            const normalDateRegex = /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/;
            
            for (let line of lines) {
                let matchTextDate = line.match(textBankDateRegex);
                let matchNormalDate = line.match(normalDateRegex);
                
                if (matchTextDate) {
                    // Kamus bulan Inggris & Thailand (Singkatan)
                    const months = {
                        "jan":"01","feb":"02","mar":"03","apr":"04","may":"05","jun":"06","jul":"07","aug":"08","sep":"09","oct":"10","nov":"11","dec":"12", 
                        "ม.ค.":"01","ก.พ.":"02","มี.ค.":"03","เม.ย.":"04","พ.ค.":"05","มิ.ย.":"06","ก.ค.":"07","ส.ค.":"08","ก.ย.":"09","ต.ค.":"10","พ.ย.":"11","ธ.ค.":"12"
                    };
                    const d = matchTextDate[1].padStart(2, '0');
                    const mName = matchTextDate[2].toLowerCase();
                    const m = months[mName] || "01"; 
                    let y = matchTextDate[3];
                    
                    // PERBAIKAN LOGIKA TAHUN: Menangani tahun "69" (2569) agar jadi 2026
                    if (y.length === 2) {
                        if (parseInt(y) > 40) y = (2500 + parseInt(y) - 543).toString();
                        else y = "20" + y;
                    } else if (parseInt(y) > 2500) {
                        y = (parseInt(y) - 543).toString();
                    }
                    
                    dateStr = `${d}/${m}/${y}`;
                    break;
                } else if (matchNormalDate) {
                    dateStr = matchNormalDate[0].replace(/[\-\.]/g, '/');
                    break;
                }
            }

            // --- 2. EXTRACT AMOUNT (SUPER ROBUST) ---
            // Menghapus batas kata (\b) karena AI sering menggabungkan angka dengan teks grafis
            const thaiCurrencyPatternGlobal = /\d{1,3}(?:,\d{3})*\.\d{2}/g;
            const amountMatches = text.match(thaiCurrencyPatternGlobal);
            
            if (amountMatches) {
                // Ambil semua angka valid berakhiran .00 yang lebih besar dari 0 (abaikan fee 0.00)
                const validNums = amountMatches.map(n => parseFloat(n.replace(/,/g, ''))).filter(n => n > 0);
                if (validNums.length > 0) {
                    // Angka desimal terbesar di struk hampir pasti adalah nominal transfernya
                    totalAmount = Math.max(...validNums);
                }
            }

            // --- 3. EXTRACT AUTO-CATEGORY ---
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.toLowerCase().includes('payment') || line.match(normalDateRegex) || line.includes('xxx')) continue;
                
                if ((/[ก-๙]/.test(line) && line.length > 5) || (/[a-zA-Z]/.test(line) && line.length > 8)) {
                    const descLower = line.toLowerCase();
                    
                    // Menambahkan keyword "shop" dan "มินิมาร์ท" (Minimart) untuk struk GSB
                    if (descLower.includes('ร้าน') || descLower.includes('cafe') || descLower.includes('food') || descLower.includes('coffee') || descLower.includes('กล้วย')) {
                        autoCategory = 'food';
                    } else if (descLower.includes('lotus') || descLower.includes('7-eleven') || descLower.includes('big c') || descLower.includes('mall') || descLower.includes('shop') || descLower.includes('มินิมาร์ท')) {
                        autoCategory = 'shopping';
                    } else if (descLower.includes('bts') || descLower.includes('mrt') || descLower.includes('grab') || descLower.includes('bolt')) {
                        autoCategory = 'transport';
                    }
                    break;
                }
            }

            // Tampilkan hasil di UI
            if (scanDescription) scanDescription.value = "";
            if (scanDate) scanDate.value = dateStr || new Date().toLocaleDateString('en-GB');
            if (scanTotal) scanTotal.value = totalAmount || '';
            if (scanCategory) scanCategory.value = autoCategory;

            scanStatus.classList.add('hidden');
            scanResults.classList.remove('hidden');

        } catch (error) {
            console.error(error);
            scanStatus.className = 'text-xs text-center font-bold text-red-500 mb-4';
            scanStatus.textContent = '❌ OCR Failed. Image too blurry or not supported.';
        } finally {
            if (cameraUpload) cameraUpload.value = ''; 
            if (galleryUpload) galleryUpload.value = ''; 
        }
    };

    // --- SAMBUNGKAN FUNGSI KE KEDUA TOMBOL ---
    if (cameraUpload) cameraUpload.addEventListener('change', handleImageUpload);
    if (galleryUpload) galleryUpload.addEventListener('change', handleImageUpload);

    // --- PENGATUR TIPE TRANSAKSI DI TAB SCAN ---
    let scanCurrentType = 'expense';
    const btnScanIncome = document.getElementById('scan-type-income');
    const btnScanExpense = document.getElementById('scan-type-expense');
    const scanCategory = document.getElementById('scan-category');
    
    if (document.getElementById('scan-category')) {
        UI.setScanTypeUI(scanCurrentType);
    }

    if (btnScanIncome) {
        btnScanIncome.addEventListener('click', () => {
            scanCurrentType = 'income';
            UI.setScanTypeUI('income');
        });
    }
    if (btnScanExpense) {
        btnScanExpense.addEventListener('click', () => {
            scanCurrentType = 'expense';
            UI.setScanTypeUI('expense');
        });
    }

    // --- AKSI TOMBOL SAVE SCAN ---
    if (btnSaveScanned) {
        btnSaveScanned.addEventListener('click', async () => {
            const amount = parseFloat(scanTotal.value);
            const category = scanCategory ? scanCategory.value : 'other';
            const description = scanDescription ? scanDescription.value : '';
            const inputDateText = scanDate ? scanDate.value.trim() : '';
            
            if (!amount || amount <= 0) {
                UI.showToast('Please verify the total amount');
                return;
            }

            // Logika Tanggal
            let finalDateISO = new Date().toISOString();
            if (inputDateText) {
                const dateParts = inputDateText.split(/[\/\-\.]/);
                if (dateParts.length === 3) {
                    let day = dateParts[0].padStart(2, '0');
                    let month = dateParts[1].padStart(2, '0');
                    let year = dateParts[2];
                    if (year.length === 2) year = "20" + year;
                    if (parseInt(year) > 2500) year = (parseInt(year) - 543).toString();

                    const parsedDate = new Date(`${year}-${month}-${day}T12:00:00Z`);
                    if (!isNaN(parsedDate.getTime())) {
                        finalDateISO = parsedDate.toISOString();
                    }
                }
            }

            const originalBtnText = btnSaveScanned.textContent;
            btnSaveScanned.textContent = state.currentLanguage === 'th' ? 'กำลังบันทึก...' : 'Saving...';
            btnSaveScanned.disabled = true;

            try {
                const result = await window.dataSdk.create({
                    type: scanCurrentType,
                    category: category,
                    amount: amount,
                    description: description || 'Auto-scanned transaction', // Menggunakan kolom Note/Description baru
                    date: finalDateISO,
                    createdAt: new Date().toISOString()
                });

                if (result.isOk) {
                    UI.showToast(scanCurrentType === 'income' ? 'toast-success-income' : 'toast-success-expense');
                    
                    // Reset UI
                    scanResults.classList.add('hidden');
                    if (scanDescription) scanDescription.value = '';
                    if (scanTotal) scanTotal.value = '';
                    
                    // Pindah Tab
                    setState('currentTab', 'transaction');
                    UI.switchTabUI('transaction');
                    UI.updateDashboard();
                    UI.updateTransactionList();
                } else {
                    UI.showToast('toast-error-save-trans');
                }
            } catch (err) {
                console.error(err);
                UI.showToast('toast-error-save-trans');
            } finally {
                btnSaveScanned.textContent = originalBtnText;
                btnSaveScanned.disabled = false;
            }
        });
    }

    // 7. Budget & Savings Forms
    // (Logika penyimpanan ada di firebase-setup.js, di sini hanya preventDefault & update UI lokal)
    
    const formBudget = document.getElementById('budget-form');
    if(formBudget) {
        formBudget.addEventListener('submit', (e) => {
            e.preventDefault();
            const value = parseInt(document.getElementById('budget-input').value);
            if (value && value > 0) {
                // Update State & Simpan (Local/Cloud handled by this function)
                window.appSaveSettings('budget', value);
                
                // Update UI
                const totalExpense = state.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                UI.updateBudgetStatus(totalExpense);
                UI.updateDashboard();
                UI.showToast('toast-success-budget');
            }
        });
    }

    // --- SET GOAL FORM ---
    const formSavings = document.getElementById('savings-form');
    if(formSavings) {
        formSavings.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('savings-name').value;
            const target = parseInt(document.getElementById('savings-target').value);
            if (name && target > 0) {
                const goal = { name, target };
                
                // Update State & Simpan
                window.appSaveSettings('savingsGoal', goal);
                
                UI.updateSavingsStatus();
                UI.showToast('toast-success-goal');
            }
        });
    }

    // --- ADD SAVINGS FORM ---
    const formAddSavings = document.getElementById('add-savings-form');
    if(formAddSavings) {
        formAddSavings.addEventListener('submit', (e) => {
            e.preventDefault();
            const amountInput = document.getElementById('add-savings-amount');
            const amount = parseInt(amountInput.value);
            
            // Hitung Balance: Income - Expense - CurrentSavings
            const totalIncome = state.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const totalExpense = state.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            // Balance yang tersedia (belum termasuk tabungan saat ini)
            const availableFunds = totalIncome - totalExpense; 
            // Saldo bersih (setelah dikurangi tabungan yang sudah ada)
            const netBalance = availableFunds - state.totalSavings;

            if (amount && amount > 0) {
                // Cek apakah uang cukup? (Opsional, matikan jika ingin membolehkan minus)
                if (amount > netBalance) {
                    UI.showToast('toast-insufficient-balance');
                    return;
                }

                const newTotal = (state.totalSavings || 0) + amount;
                
                // Update State & Simpan Nilai Baru
                window.appSaveSettings('totalSavings', newTotal);
                
                UI.updateDashboard();
                amountInput.value = ''; // Baru dikosongkan setelah disimpan
                UI.showToast('toast-success-savings');
            }
        });
    }

    // --- RESET / DELETE GOAL LOGIC ---
    const btnResetGoal = document.getElementById('btn-reset-goal');
    if (btnResetGoal) {
        btnResetGoal.addEventListener('click', () => {
            const lang = state.currentLanguage || 'en';
            const confirmMsg = lang === 'th' ? 'คุณบรรลุเป้าหมายแล้ว! ต้องการรีเซ็ตเงินออมเป็น 0 หรือไม่?' : 'Goal Achieved! Do you want to reset this goal and your savings to 0?';
            
            // Tampilkan popup konfirmasi agar tidak terhapus tidak sengaja
            if (confirm(confirmMsg)) {
                // 1. Reset nilai di penyimpanan (Cloud & Lokal)
                window.appSaveSettings('savingsGoal', { name: '', target: 0 });
                window.appSaveSettings('totalSavings', 0);
                
                // 2. Kosongkan isian di form input UI
                const sName = document.getElementById('savings-name');
                const sTarget = document.getElementById('savings-target');
                if(sName) sName.value = '';
                if(sTarget) sTarget.value = '';
                
                // 3. Sembunyikan kembali tombolnya
                btnResetGoal.classList.add('hidden');
                
                // 4. Kalkulasi ulang tampilan Dashboard
                UI.updateDashboard();
                // UI.showToast('toast-success-delete'); // (Opsional jika ingin muncul toast)
            }
        });
    }

    // 10. Delete Modal Actions
    const btnCancelDelete = document.getElementById('modal-cancel');
    const btnConfirmDelete = document.getElementById('confirm-delete-btn');

    if(btnCancelDelete) {
        btnCancelDelete.addEventListener('click', () => {
            setState('deleteTargetId', null);
            UI.toggleDeleteModal(false);
        });
    }
    if(btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', handleConfirmDelete);
    }
}

// --- Logic Handlers ---

async function handleTransactionSubmit(e) {
    e.preventDefault();
    if (state.isLoading) return;

    const amountInput = document.getElementById('amount-input');
    const amount = parseInt(amountInput.value);
    const category = document.getElementById('category-select').value;
    const descriptionInput = document.getElementById('description-input');
    const description = descriptionInput.value;

    if (!amount || amount <= 0) {
        UI.showToast('toast-error-amount');
        return;
    }

    if (state.transactions.length >= 999) {
        UI.showToast('toast-error-limit');
        return;
    }

    setState('isLoading', true);
    const btn = document.getElementById('submit-btn');
    const submitText = document.getElementById('submit-text');
    const originalText = submitText.textContent;
    const loadingText = state.currentLanguage === 'en' ? 'Saving...' : 'กำลังบันทึก...';
    
    submitText.textContent = loadingText;
    btn.disabled = true;

    try {
        // window.dataSdk sudah di-override oleh firebase-setup.js
        const result = await window.dataSdk.create({
            type: state.transactionType,
            category: category,
            amount: amount,
            description: description,
            date: new Date().toISOString()
        });

        if (result.isOk) {
            const successKey = state.transactionType === 'income' ? 'toast-success-income' : 'toast-success-expense';
            UI.showToast(successKey);
            amountInput.value = '';
            descriptionInput.value = '';
        } else {
            UI.showToast('toast-error-save-trans');
        }
    } catch (err) {
        console.error(err);
        UI.showToast('toast-error-save-trans');
    } finally {
        setState('isLoading', false);
        submitText.textContent = originalText;
        btn.disabled = false;
    }
}

// Global function for onclick in HTML template
window.appOpenDeleteModal = (id) => {
    setState('deleteTargetId', id);
    UI.toggleDeleteModal(true);
};

async function handleConfirmDelete() {
    if (!state.deleteTargetId || state.isLoading) return;

    const transaction = state.transactions.find(t => t.__backendId === state.deleteTargetId);
    if (!transaction) return;

    setState('isLoading', true);
    const btn = document.getElementById('confirm-delete-btn');
    const originalText = btn.textContent;
    btn.textContent = state.currentLanguage === 'en' ? 'Deleting...' : 'กำลังลบ...';
    btn.disabled = true;

    try {
        const result = await window.dataSdk.delete(transaction);
        if (result.isOk) {
            UI.showToast('toast-success-delete');
            UI.toggleDeleteModal(false);
            setState('deleteTargetId', null);
        } else {
            UI.showToast('toast-error-delete');
        }
    } catch (err) {
        console.error(err);
        UI.showToast('toast-error-delete');
    } finally {
        setState('isLoading', false);
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// --- Main Init ---
async function init() {
    // 1. Load data awal (LocalStorage)
    loadLocalData();
    
    // 2. Pasang Event Listeners (Tombol, Form, dll)
    setupEventListeners();
    
    // 3. Set UI awal
    UI.setTransactionTypeUI('income'); 

    // 4. Element SDK Init (untuk konfigurasi teks dasar saja)
    if (window.elementSdk) {
        await window.elementSdk.init({
            defaultConfig,
            onConfigChange,
            mapToCapabilities: (config) => ({
                recolorables: [], borderables: [], fontEditable: undefined, fontSizeable: undefined
            }),
            mapToEditPanelValues: (config) => new Map([
                ['app_title', config.app_title || defaultConfig.app_title],
                ['welcome_message', config.welcome_message || defaultConfig.welcome_message]
            ])
        });
    }
}

async function onConfigChange(config) {
    document.getElementById('app-title').textContent = config.app_title || defaultConfig.app_title;
    const welcomeMsg = document.getElementById('welcome-msg');
    if(welcomeMsg) welcomeMsg.textContent = config.welcome_message || defaultConfig.welcome_message;
}

// Run App
init();