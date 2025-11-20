# Render Deployment Guide - Straddle NerdCon Demo

Complete step-by-step guide to deploy the Straddle NerdCon demo to Render.

## Architecture Overview

This application requires **3 services** on Render:

1. **Backend API** (Node.js) - Express server on port 3001
2. **Frontend Web** (Static Site) - React/Vite app
3. **Paykey Generator** (Python) - Flask server on port 8081

---

## Prerequisites

- [ ] Render account (https://render.com)
- [ ] GitHub repository: `https://github.com/straddleio/nerdcon`
- [ ] All environment variables from below

---

## Step 1: Deploy Backend API (Node.js)

### 1.1 Create Web Service

1. Log into Render: https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `straddleio/nerdcon`
4. Configure the service:

   ```
   Name: nerdcon-backend
   Region: Oregon (US West) or closest to you
   Branch: master
   Root Directory: server
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   Instance Type: Free (or Starter for production)
   ```

### 1.2 Add Environment Variables

In the **Environment** section, add these variables:

```bash
# Straddle API Configuration
STRADDLE_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBcGlLZXkiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL2F1dGhlbnRpY2F0aW9ubWV0aG9kIjoiU3RyYWRkbGVBcGlBdXRoTWV0aG9kIiwidG9rZW5faWQiOiI0ZmI1NDA3MC1mMjZjLTRmMDQtODQ3Zi1mYjE1Yjg1MTg4YzgiLCJlbnZpcm9ubWVudCI6InNhbmRib3giLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL2V4cGlyYXRpb24iOiI0OTE3ODg4MDAwIiwiaXNzIjoic3RyYWRkbGUifQ.pcSugKsVnWlLaQdwt47hF7v5Krlme78coxjL3sB72CE
STRADDLE_ENV=sandbox

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration (UPDATE AFTER FRONTEND DEPLOYED)
CORS_ORIGIN=https://your-frontend-url.onrender.com

# Webhook Configuration
WEBHOOK_SECRET=whsec_W7X2gyovd67HroKMol9Ax/OvDkDYlHy1
NGROK_URL=https://endopoditic-jacquelynn-curlier.ngrok-free.dev

# Plaid Configuration
PLAID_PROCESSOR_TOKEN=processor-sandbox-2f154536-91dd-46ab-a8f3-49b1ca8b50c5

# Paykey Generator Configuration (UPDATE AFTER GENERATOR DEPLOYED)
GENERATOR_URL=https://your-generator-url.onrender.com

# Demo Feature Flags
ENABLE_UNMASK=false
ENABLE_LOG_STREAM=true
```

### 1.3 Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (2-3 minutes)
3. **Save the backend URL**: e.g., `https://nerdcon-backend.onrender.com`

---

## Step 2: Deploy Paykey Generator (Python)

### 2.1 Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Select repository: `straddleio/nerdcon`
3. Configure the service:

   ```
   Name: nerdcon-generator
   Region: Oregon (US West) - SAME AS BACKEND
   Branch: master
   Root Directory: paykey-generator
   Runtime: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: python server.py
   Instance Type: Free (or Starter)
   ```

### 2.2 Add Environment Variables

```bash
PORT=8081
FLASK_ENV=production
```

### 2.3 Install System Dependencies (if needed)

If the generator requires `b3sum` command-line tool:

1. Go to **Settings** → **Build & Deploy**
2. Add **Dockerfile** or use Render's build command to install:
   ```bash
   apt-get update && apt-get install -y blake3 && pip install -r requirements.txt
   ```

### 2.4 Deploy

1. Click **"Create Web Service"**
2. Wait for deployment
3. **Save the generator URL**: e.g., `https://nerdcon-generator.onrender.com`

---

## Step 3: Update Backend with Generator URL

1. Go back to `nerdcon-backend` service
2. Navigate to **Environment** tab
3. Update `GENERATOR_URL` variable:
   ```
   GENERATOR_URL=https://nerdcon-generator.onrender.com
   ```
4. Click **"Save Changes"** (triggers automatic redeploy)

---

## Step 4: Deploy Frontend (Static Site)

### 4.1 Create Static Site

1. Click **"New +"** → **"Static Site"**
2. Select repository: `straddleio/nerdcon`
3. Configure the service:

   ```
   Name: nerdcon-frontend
   Region: Oregon (US West) - SAME AS BACKEND
   Branch: master
   Root Directory: web
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

### 4.2 Add Environment Variables

**IMPORTANT**: Vite requires env vars prefixed with `VITE_`

```bash
VITE_API_URL=https://nerdcon-backend.onrender.com
```

### 4.3 Deploy

1. Click **"Create Static Site"**
2. Wait for deployment (3-5 minutes)
3. **Save the frontend URL**: e.g., `https://nerdcon-frontend.onrender.com`

---

## Step 5: Update Backend CORS

1. Go back to `nerdcon-backend` service
2. Navigate to **Environment** tab
3. Update `CORS_ORIGIN` variable:
   ```
   CORS_ORIGIN=https://nerdcon-frontend.onrender.com
   ```
4. Click **"Save Changes"** (triggers automatic redeploy)

---

## Step 6: Configure Webhooks (Optional)

If you want to receive webhooks from Straddle:

1. Your backend webhook endpoint: `https://nerdcon-backend.onrender.com/api/webhooks`
2. Go to Straddle dashboard and configure webhook URL
3. Use the `WEBHOOK_SECRET` from your environment variables

**Note**: For production, generate a new webhook secret from Straddle dashboard

---

## Step 7: Verify Deployment

### 7.1 Check Backend Health

Visit: `https://nerdcon-backend.onrender.com/api/config`

Expected response:
```json
{
  "environment": "sandbox",
  "generatorUrl": "https://nerdcon-generator.onrender.com",
  "featureFlags": {
    "enableUnmask": false,
    "enableLogStream": true
  }
}
```

### 7.2 Check Generator Health

Visit: `https://nerdcon-generator.onrender.com/health`

Expected: `200 OK`

### 7.3 Test Frontend

1. Visit: `https://nerdcon-frontend.onrender.com`
2. You should see the terminal and dashboard
3. Type `/demo` in the terminal
4. Verify the full flow works (customer → paykey → charge)

---

## Complete Environment Variable Reference

### Backend Service (`nerdcon-backend`)

| Variable | Value | Notes |
|----------|-------|-------|
| `STRADDLE_API_KEY` | `eyJhbGc...` (see above) | Sandbox API key - replace for production |
| `STRADDLE_ENV` | `sandbox` | Change to `production` for live API |
| `PORT` | `3001` | Render assigns this automatically |
| `NODE_ENV` | `production` | Required for production optimizations |
| `CORS_ORIGIN` | `https://nerdcon-frontend.onrender.com` | Your frontend URL |
| `WEBHOOK_SECRET` | `whsec_W7X2g...` (see above) | Straddle webhook signing secret |
| `NGROK_URL` | `https://endopoditic-jacquelynn...` | Only needed for local webhook testing |
| `PLAID_PROCESSOR_TOKEN` | `processor-sandbox-2f154536...` | Sandbox Plaid token |
| `GENERATOR_URL` | `https://nerdcon-generator.onrender.com` | Your generator service URL |
| `ENABLE_UNMASK` | `false` | Demo feature flag |
| `ENABLE_LOG_STREAM` | `true` | Demo feature flag |

### Generator Service (`nerdcon-generator`)

| Variable | Value | Notes |
|----------|-------|-------|
| `PORT` | `8081` | Flask server port |
| `FLASK_ENV` | `production` | Production mode |

### Frontend Static Site (`nerdcon-frontend`)

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_API_URL` | `https://nerdcon-backend.onrender.com` | Backend API URL |

---

## Troubleshooting

### Issue: "CORS error" in browser console

**Solution**: Verify `CORS_ORIGIN` in backend matches exact frontend URL (no trailing slash)

### Issue: "Cannot connect to generator"

**Solution**:
1. Check `GENERATOR_URL` in backend environment variables
2. Verify generator service is running: visit `/health` endpoint
3. Ensure generator allows requests from backend (CORS or firewall)

### Issue: Build fails with "Module not found"

**Solution**: Check `Root Directory` is set correctly:
- Backend: `server`
- Frontend: `web`
- Generator: `paykey-generator`

### Issue: Free tier services sleeping

**Solution**:
- Free tier services sleep after 15 minutes of inactivity
- Upgrade to Starter ($7/month per service) for always-on
- Or use a service like UptimeRobot to ping every 10 minutes

### Issue: API calls timing out

**Solution**: Free tier has slower cold starts (30+ seconds). Wait or upgrade to Starter.

---

## Production Checklist

Before going to production:

- [ ] Replace `STRADDLE_API_KEY` with production key
- [ ] Change `STRADDLE_ENV` to `production`
- [ ] Generate new `WEBHOOK_SECRET` from Straddle dashboard
- [ ] Replace `PLAID_PROCESSOR_TOKEN` with production token
- [ ] Set `ENABLE_UNMASK=false` (keep customer data secure)
- [ ] Upgrade to Starter tier or higher (no sleeping)
- [ ] Set up custom domain (optional)
- [ ] Enable SSL/HTTPS (Render does this automatically)
- [ ] Set up monitoring/alerting
- [ ] Review and remove `NGROK_URL` (not needed in production)

---

## Cost Breakdown (Render Pricing)

### Free Tier
- 3 services × $0 = **$0/month**
- Services sleep after 15 minutes inactivity
- 750 hours/month shared across all services

### Starter Tier (Recommended for Demo)
- Backend: $7/month
- Generator: $7/month
- Frontend: $0 (static sites are free)
- **Total: $14/month** (always-on, no sleeping)

### Professional Tier (For Production)
- Backend: $25/month
- Generator: $25/month
- Frontend: $0
- **Total: $50/month** (increased resources, priority support)

---

## Quick Deploy Checklist

- [ ] Deploy Backend (Step 1)
- [ ] Note backend URL: `___________________`
- [ ] Deploy Generator (Step 2)
- [ ] Note generator URL: `___________________`
- [ ] Update backend `GENERATOR_URL` (Step 3)
- [ ] Deploy Frontend (Step 4)
- [ ] Note frontend URL: `___________________`
- [ ] Update backend `CORS_ORIGIN` (Step 5)
- [ ] Test `/demo` command on frontend (Step 7)
- [ ] ✅ Deployment complete!

---

## Support Resources

- **Render Documentation**: https://render.com/docs
- **Render Community**: https://community.render.com
- **Straddle API Docs**: https://docs.straddle.io
- **GitHub Repository**: https://github.com/straddleio/nerdcon
- **Issues**: https://github.com/straddleio/nerdcon/issues

---

**Last Updated**: 2025-11-20
**Repository**: https://github.com/straddleio/nerdcon
