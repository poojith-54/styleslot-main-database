# StyleSlot Deployment Guide

This guide explains how to deploy StyleSlot to **Vercel** and connect it to **GitHub** for continuous integration and continuous deployment (CI/CD).

---

## 💻 GitHub Setup

Follow these steps to store your code securely and enable continuous deployment:

1. **Initialize Local Git Repository**:
   ```bash
   git init
   git add .
   git commit -m "feat: integrate Supabase backend, CMS, and Vercel hosting config"
   ```

2. **Publish code to GitHub**:
   - Create a new repository on GitHub (keep it private if you want to protect your Gemini and Supabase API keys).
   - Link your local repository to GitHub and push:
     ```bash
     git remote add origin https://github.com/your-username/styleslot.git
     git branch -M main
     git push -u origin main
     ```

---

## ⚡ Vercel Deployment

Vercel hosts the static React SPA frontend and automatically deploys the Express backend API as a Serverless Function in the `api` folder.

### Step 1: Deploy through Vercel Dashboard
1. Go to the [Vercel Dashboard](https://vercel.com) and click **Add New** -> **Project**.
2. Import your GitHub repository `styleslot`.
3. Configure the **Build & Development Settings**:
   - **Framework Preset**: `Vite` (automatically detected)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add the following **Environment Variables** in Vercel settings:
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - `VITE_SUPABASE_URL`: Your Supabase Project API URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Public Key.
   - `SUPABASE_URL`: Your Supabase Project API URL (same as `VITE_SUPABASE_URL`).
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Private Key (allows secure serverless writes bypassing RLS).
5. Click **Deploy**. Vercel will build the frontend assets and host them globally, routing `/api/*` requests to the Serverless handler.

---

## 📝 Pre-deployment Checklists

- [ ] Run `supabase_schema.sql` in your Supabase SQL Editor.
- [ ] Ensure all 5 Environment Variables are added in the Vercel Dashboard.
- [ ] Confirm `GEMINI_API_KEY` is active and billed for request completions.
- [ ] Verify that Git commits are pushed to the `main` branch to trigger builds automatically.
- [ ] Test the Vercel URL on mobile to ensure the layout is responsive and accessible.
