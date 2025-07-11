# Vercel Deployment Guide

## 🚀 Quick Deploy

### Option 1: GitHub + Vercel Dashboard (推荐)

1. **Push to GitHub**
   \`\`\`bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   \`\`\`

2. **Deploy to Vercel**
   - Go to https://vercel.com/new
   - Click "Import Project"
   - Select your GitHub repository
   - Configure project:
     - Framework Preset: **Next.js**
     - Root Directory: `./`
     - Build Command: `npm run build` (auto-detected)
     - Output Directory: `.next` (auto-detected)

3. **Add Environment Variables**
   ```
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = your_project_id_here
   ```

   Get your Project ID from: https://cloud.walletconnect.com

4. **Click "Deploy"** 🎉

Your app will be live at: `https://YOUR_PROJECT.vercel.app`

---

### Option 2: Vercel CLI

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Or deploy to production directly
vercel --prod
\`\`\`

---

### Option 3: One-Click Deploy Button

Add this to your README.md:

\`\`\`markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/YOUR_REPO)
\`\`\`

---

## 🔧 Pre-Deployment Checklist

- [ ] Create WalletConnect Project ID at https://cloud.walletconnect.com
- [ ] Update \`.env.example\` with your values
- [ ] Test locally: \`npm run dev\`
- [ ] Build successfully: \`npm run build\`
- [ ] Push code to GitHub
- [ ] Configure environment variables in Vercel

---

## 📝 Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| \`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID\` | WalletConnect Project ID | \`1234567890abcdef\` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| \`NEXT_PUBLIC_CONTRACT_ADDRESS\` | Contract address | \`0xbc70...6483\` |
| \`NEXT_PUBLIC_CHAIN_ID\` | Chain ID | \`11155111\` |

---

## 🌐 Custom Domain

1. Go to your project in Vercel
2. Click "Settings" → "Domains"
3. Add your domain
4. Update DNS records:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   ```

---

## 🔍 Troubleshooting

### Build Fails

**Error:** \`Module not found\`
\`\`\`bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build
\`\`\`

### Environment Variables Not Working

- Make sure variables start with \`NEXT_PUBLIC_\`
- Redeploy after adding environment variables
- Check Vercel Dashboard → Settings → Environment Variables

### Wallet Connection Issues

- Verify WalletConnect Project ID is correct
- Check browser console for errors
- Test on different browsers

---

## 📊 Post-Deployment

### Monitor Performance

- Vercel Analytics: https://vercel.com/docs/analytics
- Check build logs: Vercel Dashboard → Deployments
- View runtime logs: Vercel Dashboard → Logs

### Update Deployment

\`\`\`bash
# Push to GitHub (auto-deploy enabled)
git add .
git commit -m "Update"
git push

# Or use Vercel CLI
vercel --prod
\`\`\`

---

## 🎯 Production Optimization

### 1. Enable Preview Deployments

- Every PR gets a preview URL
- Test before merging to main

### 2. Configure Build Settings

\`\`\`json
// package.json
{
  "scripts": {
    "build": "next build",
    "start": "next start -p $PORT"
  }
}
\`\`\`

### 3. Add Analytics

\`\`\`jsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
\`\`\`

---

## 🔐 Security Checklist

- [ ] Never commit \`.env.local\` to Git
- [ ] Use environment variables for sensitive data
- [ ] Enable "Automatically delete Preview Deployments"
- [ ] Set up branch protection on GitHub

---

## 📱 Mobile Testing

Test your deployment on:
- iOS Safari
- Android Chrome
- Desktop browsers (Chrome, Firefox, Safari)

Vercel provides preview URLs for testing before going live.

---

## 🚀 Go Live!

Once deployed, share your link:
- Twitter: "Check out my privacy-preserving dApp built with @zama_fhe!"
- Discord: Post in Zama community
- GitHub: Update README with live link

**Your live URL:** \`https://YOUR_PROJECT.vercel.app\`

🎉 Congratulations! Your Next.js dApp is now live on Vercel!
