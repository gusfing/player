# YouTube Shell - Deployment Checklist

## Pre-Deployment

### 1. Environment Variables Setup

Create these environment variables in Vercel:

```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-xxx-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_xxx"
CLERK_SECRET_KEY="sk_test_xxx"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

# Stripe
STRIPE_SECRET_KEY="sk_test_xxx"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"
STRIPE_STARTER_PRICE_ID="price_xxx"
STRIPE_PRO_PRICE_ID="price_xxx"

# Resend Email
RESEND_API_KEY="re_xxx"

# App URL
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### 2. Database Setup

```bash
# Push schema to production
npx prisma db push --env production
```

### 3. Vercel Configuration

The `vercel.json` file is already configured with:
- Cron job for webhook cleanup (runs daily at midnight)

### 4. Stripe Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

## Deployment Steps

### Option 1: Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login
vercel login

# Deploy (from project directory)
vercel

# Deploy to production
vercel --prod
```

### Option 2: GitHub Integration

1. Push code to GitHub
2. Go to Vercel Dashboard → Import Project
3. Select your GitHub repository
4. Configure environment variables
5. Deploy

## Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Test sign-up/sign-in flow
- [ ] Test installation creation
- [ ] Test webhook delivery
- [ ] Test Stripe checkout flow
- [ ] Verify cron job is running (check Vercel Functions logs)
- [ ] Test email notifications (webhook failures, new leads)
- [ ] Verify player.js is accessible at `/player.js`

## Testing the Player Script

After deployment, test the player script:

```html
<script src="https://your-domain.com/player.min.js" data-site-id="YOUR_INSTALLATION_ID"></script>

<iframe 
  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
  width="560" 
  height="315"
  frameborder="0"
></iframe>
```

## Monitoring

### Vercel Functions Logs
Check for errors in: Vercel Dashboard → Functions → Logs

### Neon Database
Monitor query performance and connections in Neon Dashboard

### Stripe Dashboard
Monitor subscription events and revenue

## Troubleshooting

### "Prisma Client not initialized"
```bash
npx prisma generate
```

### "Webhook signature verification failed"
Ensure `STRIPE_WEBHOOK_SECRET` matches the value in Stripe Dashboard

### "Email not sending"
Verify `RESEND_API_KEY` is correct and the domain is verified in Resend

### "Player not loading"
Check browser console for CORS errors or 404 on `/player.js`
