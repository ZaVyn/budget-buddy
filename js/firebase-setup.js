import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, onSnapshot, doc, deleteDoc, updateDoc, setDoc, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { state, setState } from './modules/state.js';
import * as UI from './modules/ui.js';

// ============================================================
// 1. FIREBASE CONFIGURATION (PASTIKAN SUDAH DIGANTI DENGAN PUNYA ANDA)
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyCRjZLmLtIKtPGFsy0lCF5zhUYSSxlk_vg",
    authDomain: "penny-wise-3d901.firebaseapp.com",
    projectId: "penny-wise-3d901",
    storageBucket: "penny-wise-3d901.firebasestorage.app",
    messagingSenderId: "59950508203",
    appId: "1:59950508203:web:24d2a547cf6da5867f2fee"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ============================================================
// 2. UI HANDLERS
// ============================================================
const authModal = document.getElementById('auth-modal');
const btnLoginTrigger = document.getElementById('btn-login-trigger');
const btnLoginText = document.getElementById('btn-login-text');
const btnCloseAuth = document.getElementById('btn-close-auth');
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('auth-email');
const passInput = document.getElementById('auth-password');
const authError = document.getElementById('auth-error');
const btnAuthSwitch = document.getElementById('btn-auth-switch');
const btnAuthSubmit = document.getElementById('btn-auth-submit');
const userStatus = document.getElementById('user-status');
const btnResetGuest = document.getElementById('btn-reset-guest');

// Dropdown Elements
const dropdownBtn = document.getElementById('dropdown-btn');
const dropdownMenu = document.getElementById('dropdown-menu');
const dropdownArrow = document.getElementById('dropdown-arrow');
const headerFlag = document.getElementById('header-flag');
const headerText = document.getElementById('header-lang-text');

let isRegistering = false;
let currentUser = null;
let unsubscribeTransactions = null;
let unsubscribeSettings = null;

// --- PASSWORD VISIBILITY TOGGLE ---
const btnTogglePass = document.getElementById('btn-toggle-password');
const inputPass = document.getElementById('auth-password');
const iconEye = document.getElementById('icon-eye');
const iconEyeSlash = document.getElementById('icon-eye-slash');

if (btnTogglePass && inputPass) {
    btnTogglePass.addEventListener('click', () => {
        const isPassword = inputPass.type === 'password';
        if (isPassword) {
            inputPass.type = 'text';
            iconEye.classList.add('hidden');
            iconEyeSlash.classList.remove('hidden');
        } else {
            inputPass.type = 'password';
            iconEye.classList.remove('hidden');
            iconEyeSlash.classList.add('hidden');
        }
    });
}

// ============================================================
// 3. DROPDOWN & HEADER LOGIC
// ============================================================
if (dropdownBtn && dropdownMenu) {
    dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('hidden');
        if (!dropdownMenu.classList.contains('hidden')) {
            dropdownArrow.classList.add('rotate-180');
        } else {
            dropdownArrow.classList.remove('rotate-180');
        }
    });

    document.addEventListener('click', (e) => {
        if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.add('hidden');
            dropdownArrow.classList.remove('rotate-180');
        }
    });

    const updateHeader = (lang) => {
        if (lang === 'en') {
            headerFlag.src = 'https://flagcdn.com/w40/gb.png';
            headerText.textContent = 'EN';
        } else {
            headerFlag.src = 'https://flagcdn.com/w40/th.png';
            headerText.textContent = 'TH';
        }
        dropdownMenu.classList.add('hidden');
        dropdownArrow.classList.remove('rotate-180');
    };

    document.getElementById('btn-lang-en').addEventListener('click', () => updateHeader('en'));
    document.getElementById('btn-lang-th').addEventListener('click', () => updateHeader('th'));
    
    const savedLang = localStorage.getItem('language') || 'en';
    updateHeader(savedLang);
}

// ============================================================
// 4. AUTH & MODAL LOGIC
// ============================================================
if(btnLoginTrigger) {
    btnLoginTrigger.addEventListener('click', () => {
        if(currentUser) {
            const doLogout = confirm("Log out from account?");
            if(doLogout) signOut(auth);
        } else {
            authModal.classList.remove('hidden');
        }
    });
}

if(btnCloseAuth) btnCloseAuth.addEventListener('click', () => authModal.classList.add('hidden'));

if(btnAuthSwitch) {
    btnAuthSwitch.addEventListener('click', (e) => {
        e.preventDefault();
        isRegistering = !isRegistering;
        // Gunakan translasi sederhana untuk toggle text
        if(isRegistering) {
            btnAuthSwitch.textContent = "Log In";
            btnAuthSubmit.textContent = "Register";
        } else {
            btnAuthSwitch.textContent = "Register";
            btnAuthSubmit.textContent = "Log In";
        }
        authError.classList.add('hidden');
    });
}

if(authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const password = passInput.value;
        authError.classList.add('hidden');
        btnAuthSubmit.disabled = true;
        btnAuthSubmit.textContent = "Processing...";

        try {
            if (isRegistering) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            authModal.classList.add('hidden');
        } catch(err) {
            console.error(err);
            authError.textContent = err.message.replace("Firebase: ", "");
            authError.classList.remove('hidden');
        } finally {
            btnAuthSubmit.disabled = false;
            btnAuthSubmit.textContent = isRegistering ? "Register" : "Log In";
        }
    });
}

// ============================================================
// 5. CORE DATA LOGIC
// ============================================================

// Sync Local -> Cloud
async function syncLocalToCloud(uid) {
    const localTrans = JSON.parse(localStorage.getItem('local_transactions')) || [];
    
    // Sync Transactions
    if(localTrans.length > 0) {
        UI.showToast('Syncing transactions... ☁️');
        const uploadPromises = localTrans.map(t => {
            const { __backendId, ...cleanData } = t;
            if(!cleanData.createdAt) cleanData.createdAt = new Date().toISOString();
            return addDoc(collection(db, `users/${uid}/transactions`), cleanData);
        });
        await Promise.all(uploadPromises);
        localStorage.removeItem('local_transactions');
    }

    // Sync Settings (Budget & Savings) - Optional: Upload local settings if cloud is empty
    const localBudget = localStorage.getItem('budget');
    const localSavings = localStorage.getItem('totalSavings');
    const localGoal = localStorage.getItem('savingsGoal');

    if(localBudget || localSavings || localGoal) {
        const userRef = doc(db, "users", uid);
        const updates = {};
        if(localBudget) updates.budget = parseInt(localBudget);
        if(localSavings) updates.totalSavings = parseInt(localSavings);
        if(localGoal) updates.savingsGoal = JSON.parse(localGoal);
        
        await setDoc(userRef, updates, { merge: true });
        
        // Clear local settings after sync
        localStorage.removeItem('budget');
        localStorage.removeItem('totalSavings');
        localStorage.removeItem('savingsGoal');
    }
}

// Auth Listener
onAuthStateChanged(auth, async (user) => {
    if(user) {
        // --- LOGGED IN ---
        currentUser = user;
        btnLoginText.textContent = "Logout";
        userStatus.textContent = user.email;
        userStatus.classList.add('text-emerald-600');
        if(btnResetGuest) btnResetGuest.classList.add('hidden');

        // Clear UI first
        setState('transactions', []);
        setState('budget', 0);
        setState('totalSavings', 0);
        UI.updateDashboard();
        UI.updateTransactionList();
        
        await syncLocalToCloud(user.uid); 
        initRealtimeData(user.uid);

    } else {
        // --- GUEST MODE ---
        currentUser = null;
        btnLoginText.textContent = "Login";
        userStatus.textContent = "Guest Mode (Local)";
        userStatus.classList.remove('text-emerald-600');
        if(btnResetGuest) btnResetGuest.classList.remove('hidden');
        
        if (unsubscribeTransactions) unsubscribeTransactions();
        if (unsubscribeSettings) unsubscribeSettings();
        
        // Load Local Data
        const localData = JSON.parse(localStorage.getItem('local_transactions')) || [];
        const localBudget = parseInt(localStorage.getItem('budget')) || 0;
        const localSavings = parseInt(localStorage.getItem('totalSavings')) || 0;
        const localGoal = JSON.parse(localStorage.getItem('savingsGoal')) || { name: '', target: 0 };

        setState('transactions', localData);
        setState('budget', localBudget);
        setState('totalSavings', localSavings);
        setState('savingsGoal', localGoal);
        
        // Update Inputs
        const budgetInput = document.getElementById('budget-input');
        if(budgetInput) budgetInput.value = localBudget || '';
        
        const savingsName = document.getElementById('savings-name');
        if(savingsName) savingsName.value = localGoal.name || '';
        
        const savingsTarget = document.getElementById('savings-target');
        if(savingsTarget) savingsTarget.value = localGoal.target || '';

        UI.updateDashboard();
        UI.updateTransactionList();
    }
});

function initRealtimeData(userId) {
    const q = query(collection(db, `users/${userId}/transactions`));
    unsubscribeTransactions = onSnapshot(q, (snapshot) => {
        const transData = [];
        snapshot.forEach((doc) => {
            transData.push({ ...doc.data(), __backendId: doc.id });
        });
        transData.sort((a, b) => new Date(b.date) - new Date(a.date));
        setState('transactions', transData);
        UI.updateDashboard();
        UI.updateTransactionList();
    });

    const settingsDocRef = doc(db, "users", userId);
    unsubscribeSettings = onSnapshot(settingsDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setState('budget', data.budget || 0);
            setState('totalSavings', data.totalSavings || 0);
            setState('savingsGoal', data.savingsGoal || { name: '', target: 0 });
            
            const budgetInput = document.getElementById('budget-input');
            const savingsName = document.getElementById('savings-name');
            const savingsTarget = document.getElementById('savings-target');

            if(budgetInput) budgetInput.value = data.budget || '';
            if(savingsName) savingsName.value = data.savingsGoal?.name || '';
            if(savingsTarget) savingsTarget.value = data.savingsGoal?.target || '';
            
            UI.updateDashboard();
        }
    });
}

// Override Data SDK
window.dataSdk = {
    create: async (data) => {
        if (currentUser) {
            try {
                const dataWithTime = { ...data, createdAt: new Date().toISOString() };
                await addDoc(collection(db, `users/${currentUser.uid}/transactions`), dataWithTime);
                return { isOk: true };
            } catch (e) { return { isOk: false }; }
        } else {
            const newTrans = { ...data, __backendId: Date.now().toString() };
            const current = state.transactions || [];
            const updated = [...current, newTrans];
            setState('transactions', updated);
            localStorage.setItem('local_transactions', JSON.stringify(updated));
            UI.updateDashboard();
            UI.updateTransactionList();
            return { isOk: true };
        }
    },
    delete: async (item) => {
        if (currentUser) {
            try {
                await deleteDoc(doc(db, `users/${currentUser.uid}/transactions`, item.__backendId));
                return { isOk: true };
            } catch (e) { return { isOk: false }; }
        } else {
            const updated = state.transactions.filter(t => t.__backendId !== item.__backendId);
            setState('transactions', updated);
            localStorage.setItem('local_transactions', JSON.stringify(updated));
            UI.updateDashboard();
            UI.updateTransactionList();
            return { isOk: true };
        }
    }
};

// Helper untuk simpan ke Cloud
async function saveUserCloudSettings(key, value) {
    if (!currentUser) return;
    const userRef = doc(db, "users", currentUser.uid);
    await setDoc(userRef, { [key]: value }, { merge: true });
}

// Fungsi ini dipanggil oleh app.js saat form disubmit
window.appSaveSettings = async (key, value) => {
    // 1. Simpan ke State (Memori) agar UI update instan
    if (key === 'budget') setState('budget', value);
    if (key === 'savingsGoal') setState('savingsGoal', value);
    if (key === 'totalSavings') setState('totalSavings', value);

    // 2. Simpan ke Storage Permanen
    if (currentUser) {
        // --- CLOUD MODE ---
        const userRef = doc(db, "users", currentUser.uid);
        if (key === 'totalSavings') {
            // Khusus totalSavings kita bisa replace nilainya atau increment (tergantung logic app.js)
            // Karena app.js mengirim nilai FINAL, kita setDoc saja
            await setDoc(userRef, { [key]: value }, { merge: true });
        } else {
            await setDoc(userRef, { [key]: value }, { merge: true });
        }
    } else {
        // --- GUEST MODE (LOCAL STORAGE) ---
        if (typeof value === 'object') {
            localStorage.setItem(key, JSON.stringify(value));
        } else {
            localStorage.setItem(key, value);
        }
    }
};