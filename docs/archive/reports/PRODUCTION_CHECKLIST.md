# Production Deployment Checklist

## Pre-Deployment Verification

### Code Quality
- [ ] All TypeScript errors resolved (run `npm run type-check` in both workspaces)
- [ ] Production builds succeed (run `npm run build` in both workspaces)
- [ ] No ESLint errors (run `npm run lint`)
- [ ] Code formatted with Prettier (run `npm run format`)

### Environment Configuration
- [ ] Production `STRADDLE_API_KEY` obtained from dashboard
- [ ] `STRADDLE_ENV` set to `production` (or keep `sandbox` for demo)
- [ ] `PORT` configured for production server
- [ ] `CORS_ORIGIN` set to production frontend domain
- [ ] `NGROK_URL` or production webhook URL configured
- [ ] `WEBHOOK_SECRET` set and secure

### Testing
- [ ] Health endpoint responds: `curl https://your-api.com/health`
- [ ] All terminal commands tested (`/demo`, `/create-customer`, etc.)
- [ ] Dashboard cards display correct data
- [ ] SSE connection establishes and receives events
- [ ] Webhooks deliver successfully (test with Straddle dashboard)

## Deployment Steps

### Backend (Server)

1. **Build**
   ```bash
   cd server
   npm install --production
   npm run build
   ```

2. **Environment Variables**
   - Upload `.env` to hosting platform
   - Verify all required variables are set
   - Test with `node dist/index.js`

3. **Start Server**
   ```bash
   npm start
   ```

4. **Verify**
   - Health check: `curl https://api.yourdomain.com/health`
   - Check logs for startup messages

### Frontend (Web)

1. **Build**
   ```bash
   cd web
   npm install --production
   npm run build
   ```

2. **Deploy Static Assets**
   - Upload `web/dist/` to CDN or static host
   - Configure base URL if needed
   - Set CORS headers on API server

3. **Verify**
   - Open production URL in browser
   - Test terminal commands
   - Verify SSE connection (check browser console)
   - Test `/demo` command end-to-end

### Webhook Configuration

1. **Get Production URL**
   - Deploy server first
   - Note webhook endpoint: `https://api.yourdomain.com/api/webhooks/straddle`

2. **Configure in Straddle Dashboard**
   - Go to https://dashboard.straddle.com
   - Navigate to Webhooks settings
   - Add endpoint URL
   - Select events: `customer.*`, `paykey.*`, `charge.*`
   - Save and test delivery

3. **Verify**
   - Trigger a test webhook from dashboard
   - Check server logs for webhook receipt
   - Verify SSE broadcasts event to frontend
   - Confirm dashboard updates in real-time

## Post-Deployment

### Monitoring
- [ ] Server logs accessible and configured
- [ ] Error tracking set up (optional: Sentry, etc.)
- [ ] Uptime monitoring configured
- [ ] Webhook delivery monitoring

### Performance
- [ ] Frontend loads in < 3s
- [ ] API responses in < 500ms
- [ ] SSE connection stable
- [ ] No memory leaks in long-running sessions

### Security
- [ ] API keys not exposed in frontend code
- [ ] CORS configured correctly (no wildcards in production)
- [ ] HTTPS enabled on all endpoints
- [ ] Webhook signature verification enabled

## Rollback Plan

If issues occur:

1. **Revert Backend**
   ```bash
   git revert HEAD
   npm run build
   npm start
   ```

2. **Revert Frontend**
   - Deploy previous `dist/` build
   - Or revert git commit and rebuild

3. **Disable Webhooks**
   - Temporarily disable in Straddle dashboard
   - Prevent failed webhook retries

## Demo Presentation Checklist

### Before Taking Stage
- [ ] Both servers running (backend + frontend)
- [ ] Fresh browser tab opened to production URL
- [ ] Terminal commands tested in last 5 minutes
- [ ] `/reset` run to clear any previous state
- [ ] Backup laptop ready with same setup
- [ ] Internet connection verified (or local network configured)

### Demo Script
1. Show empty dashboard (all cards in empty state)
2. Run `/help` to show available commands
3. Run `/create-customer` - watch Customer Card populate
4. Run `/create-paykey bank` - watch Paykey Card populate
5. Run `/create-charge --amount 5000` - watch Charge Card populate
6. Watch Pizza Tracker progress through lifecycle
7. Highlight real-time SSE updates (if webhooks active)
8. Run `/reset` to clear for next demo

### Backup Plan
- [ ] Local development servers ready (`npm run dev`)
- [ ] Localhost URLs bookmarked
- [ ] ngrok tunnel pre-configured (if needed for webhooks)
- [ ] Terminal commands written on note card

## Troubleshooting

### Server Won't Start
- Check `STRADDLE_API_KEY` is valid
- Verify port is not in use
- Check Node.js version ≥ 18

### Frontend Won't Connect
- Verify `CORS_ORIGIN` matches frontend URL
- Check backend is running and accessible
- Inspect browser console for errors

### Webhooks Not Delivering
- Verify webhook URL is publicly accessible
- Check Straddle dashboard for delivery errors
- Ensure `WEBHOOK_SECRET` matches Straddle config
- Review server logs for webhook receipt

### TypeScript Errors on Build
- Run `npm run type-check` to see errors
- Ensure all dependencies installed
- Check `tsconfig.json` is correct

---

**Last Updated:** 2025-11-14
**Version:** 1.0.0
**Status:** Ready for Production
