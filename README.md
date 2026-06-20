# BudgetBuddy 💸

BudgetBuddy is a modern, web-based personal finance management application designed to help users track their income, expenses, budgets, and savings goals efficiently.

## 🌟 Features

*   **📊 Dashboard & Analytics**: Get a quick overview of your total income, expenses, current balance, and savings. Includes visual period summaries (Today, This Week, This Month) and spending breakdowns by category.
*   **💳 Transaction Management**: Easily add income and expense records with customizable categories and descriptions. View your complete transaction history.
*   **📸 Receipt Scanning (OCR)**: Utilize your device's camera or upload receipt images to automatically scan and extract transaction amounts using Tesseract.js.
*   **🎯 Budgeting & Savings Goals**: 
    *   Set monthly spending limits and visually track your budget usage.
    *   Create specific savings goals (e.g., "New Bike") with target amounts and monitor your progress with dynamic progress bars.
*   **☁️ Cloud Sync & Authentication**: Log in via Firebase to securely save and sync your financial data across multiple devices. "Guest Mode" is available for offline, local usage.
*   **🌐 Multi-language Support**: Seamlessly switch between English (EN) and Thai (TH) languages.
*   **📖 Financial Education**: Access built-in guides, money management tips (like the 50-30-20 rule), and example weekly allowance plans.

## 🚀 Tech Stack

*   **Frontend**: HTML5, Vanilla JavaScript, CSS
*   **Styling**: Tailwind CSS (via CDN & local dev dependencies)
*   **Backend & Database**: Firebase (Authentication, Firestore, Hosting)
*   **OCR Integration**: Tesseract.js

## 💻 Installation & Setup

Follow these steps to run the project locally:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/penny-wise.git
    cd penny-wise
    ```

2.  **Install dependencies:**
    This project uses npm for Tailwind CSS (dev) and Firebase SDKs.
    ```bash
    npm install
    ```

3.  **Firebase Configuration:**
    *   Create a new project on the [Firebase Console](https://console.firebase.google.com/).
    *   Enable **Firestore Database** and **Authentication** (Email/Password).
    *   Get your Firebase config object.
    *   Update the Firebase configuration in `js/firebase-setup.js` (or relevant config file in `js/config/`) with your project's credentials.

4.  **Run the application:**
    You can use any local web server to serve the `index.html` file. If you use VS Code, the **Live Server** extension is recommended.
    Alternatively, using Node.js:
    ```bash
    npx serve .
    ```
    Then open `http://localhost:3000` (or the port provided) in your browser.

5.  **Build/Deploy (Optional):**
    If you are using Firebase Hosting, you can deploy directly:
    ```bash
    firebase login
    firebase init
    firebase deploy
    ```

## 📱 User Interface
The UI is designed to be mobile-responsive, providing an app-like experience with a bottom navigation bar, smooth slide animations, and a modern, clean aesthetic using Tailwind CSS gradients and glassmorphism effects.
