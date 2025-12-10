
# AzubiHub

A companion web app for V-Markt apprentices to manage tasks, files, and generate report books using AI.

## Setup

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Run locally**:
    ```bash
    npm run dev
    ```

3.  **Build for production**:
    ```bash
    npm run build
    ```

## Deployment to GitHub Pages

1.  Initialize Git:
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    ```

2.  Push to your repository.

3.  Go to **Settings > Pages** in your GitHub repository and set Source to **GitHub Actions**.

## API Key

This app requires a Google Gemini API Key.
- Users can enter their own key in the Settings menu (Gear icon).
- You do not need to set a repository secret unless you want to provide a default key for everyone (not recommended for public apps).
