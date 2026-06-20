export const state = {
  transactions: [],
  currentTab: 'dashboard',
  transactionType: 'income',
  currentPeriod: 'daily',
  budget: 0,
  savingsGoal: { name: '', target: 0 },
  totalSavings: 0,
  currentLanguage: 'en',
  isLoading: false,
  deleteTargetId: null
};

// Helper to change state if needed in future
export function setState(key, value) {
  state[key] = value;
}