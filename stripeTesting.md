# Stripe Testing Guide for Lingoscribe

## Phase 1: Stripe Sandbox Testing

### Prerequisites
- Ensure `.env.local` has test mode keys:
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`
  - `STRIPE_SECRET_KEY=sk_test_...`
  - `STRIPE_WEBHOOK_SECRET=whsec_...` (from Stripe CLI or webhook endpoint)
- Install Stripe CLI: `brew install stripe/stripe-cli/stripe` (Mac)
- Login to Stripe CLI: `stripe login`

### A. Setting Up Test Environment

#### 1. Configure Stripe Products & Prices
In Stripe Dashboard (Test Mode):
- Verify 4 products exist with correct lookup keys:
  - `starter_monthly` → £9.99/month (600 minutes)
  - `starter_annual` → £99.99/year (600 minutes)
  - `pro_monthly` → £24.99/month (3000 minutes)
  - `pro_annual` → £249.99/year (3000 minutes)
- Ensure prices have correct metadata if needed
- Note: Use actual test price IDs or rely on lookup keys

#### 2. Set Up Webhook Forwarding
Option A - Using Stripe CLI (Recommended for local testing):
```bash
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```
- Copy the webhook signing secret (whsec_...) to `.env.local`
- Keep this running during all tests

Option B - Using Dashboard Webhooks:
- Create webhook endpoint in Stripe Dashboard pointing to your dev/staging URL
- Subscribe to all `checkout.session.*`, `customer.subscription.*`, and `invoice.*` events
- Use the signing secret in `.env.local`

---

### B. Checkout Flow Tests

#### Test 1: Starter Monthly Subscription
**Steps:**
1. Navigate to `/pricing` (logged out)
2. Click "Get Started" on Starter Monthly plan
3. Should redirect to `/signup` with `?plan=starter_monthly` param
4. Create new account
5. Should automatically redirect to Stripe Checkout
6. Use test card: `4242 4242 4242 4242`, any future date, any CVC
7. Complete checkout

**Expected Results:**
- ✅ Redirects to `/checkout/success`
- ✅ Webhook `checkout.session.completed` received
- ✅ Subscription created in Supabase `subscriptions` table
- ✅ Usage period created in `usage_periods` table
- ✅ `stripe_customer_id` and `stripe_subscription_id` populated
- ✅ Status = `active`
- ✅ Plan = `starter`, billing_interval = `month`, minutes_limit = 600

**Verify in Stripe Dashboard:**
- Customer created with email matching Supabase user
- Subscription active
- Customer metadata contains `supabase_user_id`

#### Test 2: Pro Annual Subscription (Different User)
Repeat Test 1 with:
- Pro Annual plan (£249.99/year)
- New user account
- Expected: minutes_limit = 3000, billing_interval = `year`

#### Test 3: Duplicate Subscription Prevention
**Steps:**
1. Log in as user from Test 1 (already has Starter subscription)
2. Navigate to `/pricing`
3. Attempt to subscribe to Pro plan

**Expected Results:**
- ✅ API returns 409 error
- ✅ User sees error message about existing subscription
- ✅ No new checkout session created

#### Test 4: Promotion Code Support
**Steps:**
1. Create 20% off promotion code in Stripe Dashboard
2. Start checkout for new user
3. Enter promo code in Stripe Checkout UI

**Expected Results:**
- ✅ Discount applied in Stripe
- ✅ Subscription still created correctly in database
- ✅ Usage limits unaffected by discount

---

### C. Customer Portal Tests

#### Test 5: Access Customer Portal
**Steps:**
1. Log in as user with active subscription
2. Navigate to `/settings/billing`
3. Click "Manage Subscription" button

**Expected Results:**
- ✅ Redirects to Stripe Customer Portal
- ✅ Shows current subscription details
- ✅ Can view invoices
- ✅ Can update payment method

#### Test 6: Portal Without Subscription
**Steps:**
1. Create new user without subscription
2. Navigate to `/settings/billing`
3. Attempt to click "Manage Subscription" (if shown)

**Expected Results:**
- ✅ API returns 404 or UI prevents access
- ✅ User prompted to subscribe first

---

### D. Webhook Event Tests

#### Test 7: Subscription Updated Event
**Steps:**
1. In Stripe Dashboard, find test subscription
2. Change plan from Starter Monthly to Pro Monthly
3. Wait for webhook delivery

**Expected Results:**
- ✅ Webhook `customer.subscription.updated` received
- ✅ Database subscription updated to `pro` plan
- ✅ `minutes_limit` updated to 3000
- ✅ `stripe_price_id` updated
- ✅ New usage period created (if billing cycle changed)

**Verify in Stripe CLI:**
```bash
stripe events list --limit 5
stripe events retrieve evt_...
```

#### Test 8: Subscription Cancellation
**Steps:**
1. In Customer Portal, cancel subscription
2. Choose "Cancel at period end"

**Expected Results:**
- ✅ Webhook `customer.subscription.updated` received
- ✅ Database: `cancel_at_period_end` = true
- ✅ UI shows cancellation warning with end date
- ✅ User retains access until period end

#### Test 9: Immediate Subscription Deletion
**Steps:**
1. In Stripe Dashboard, delete subscription immediately
2. Wait for webhook

**Expected Results:**
- ✅ Webhook `customer.subscription.deleted` received
- ✅ Database: status = `canceled`, `canceled_at` timestamp set
- ✅ User loses immediate access
- ✅ Middleware redirects to `/pricing`

#### Test 10: Subscription Renewal (Invoice Paid)
**Steps:**
1. Use Stripe CLI to simulate renewal:
```bash
stripe trigger invoice.paid
```

**Expected Results:**
- ✅ Webhook `invoice.paid` received
- ✅ Subscription status confirmed as `active`
- ✅ New usage period created for next billing cycle
- ✅ `minutes_used` reset to 0 for new period

#### Test 11: Payment Failed
**Steps:**
1. Use test card that requires authentication: `4000 0025 0000 3155`
2. Complete checkout but fail authentication
3. OR simulate with CLI:
```bash
stripe trigger invoice.payment_failed
```

**Expected Results:**
- ✅ Webhook `invoice.payment_failed` received
- ✅ Database: status = `past_due`
- ✅ UI shows "Payment Failed" banner
- ✅ User still has access (grace period)
- ✅ Prompt to update payment method

---

### E. Usage Tracking Tests

#### Test 12: Basic Usage Recording
**Steps:**
1. Log in as user with active Starter subscription (600 min limit)
2. Navigate to `/dashboard`
3. Create transcription using ~50 minutes of audio/video
4. Wait for completion

**Expected Results:**
- ✅ POST to `/api/subscription/usage` succeeds
- ✅ `usage_logs` table has new entry
- ✅ `usage_periods.minutes_used` incremented by rounded minutes
- ✅ UI shows updated usage (e.g., "50 / 600 minutes")
- ✅ Progress bar reflects usage

**Verify Database:**
```sql
SELECT * FROM usage_logs WHERE user_id = '...' ORDER BY created_at DESC;
SELECT * FROM usage_periods WHERE user_id = '...' ORDER BY period_start DESC;
```

#### Test 13: 80% Usage Warning
**Steps:**
1. Continue transcribing until usage reaches ~480 minutes (80% of 600)
2. Refresh page or trigger usage check

**Expected Results:**
- ✅ Yellow warning banner appears: "Approaching Limit"
- ✅ Shows minutes remaining
- ✅ Shows reset date
- ✅ Suggests upgrade if on Starter plan

#### Test 14: 90% Critical Warning
**Steps:**
1. Transcribe until usage reaches ~540 minutes (90% of 600)

**Expected Results:**
- ✅ Red critical warning banner appears
- ✅ More urgent language in message
- ✅ Still able to transcribe

#### Test 15: Limit Reached (100%)
**Steps:**
1. Transcribe until usage equals or exceeds 600 minutes

**Expected Results:**
- ✅ GET `/api/subscription/usage` returns `allowed: false`, `reason: limit_reached`
- ✅ "Limit Reached" modal blocks new transcriptions
- ✅ Existing transcripts still viewable
- ✅ Modal shows reset date
- ✅ Option to upgrade shown

#### Test 16: Usage Pre-Flight Check
**Steps:**
1. With usage at 590 minutes (10 remaining)
2. Attempt to transcribe 15-minute video
3. Check API response from GET `/api/subscription/usage?estimatedMinutes=15`

**Expected Results:**
- ✅ API returns `allowed: false` (estimated usage would exceed limit)
- ✅ User prevented from starting transcription
- ✅ Clear error message about insufficient minutes

#### Test 17: Usage After Period Reset
**Steps:**
1. Simulate period reset by manually creating new usage period in DB with future dates
2. OR wait for actual renewal (use `stripe trigger invoice.paid`)
3. Attempt transcription

**Expected Results:**
- ✅ New period recognized
- ✅ `minutes_used` starts at 0
- ✅ Full limit available again
- ✅ Old usage period archived

---

### F. Edge Case & Error Handling Tests

#### Test 18: Webhook Signature Verification Failure
**Steps:**
1. Send POST request to `/api/stripe/webhook` with invalid signature
```bash
curl -X POST http://localhost:3000/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"type": "test"}'
```

**Expected Results:**
- ✅ Returns 400 error
- ✅ No database changes made
- ✅ Error logged

#### Test 19: Network Timeout During Checkout
**Steps:**
1. Start checkout flow
2. Kill network connection before completing payment
3. Reconnect and check status

**Expected Results:**
- ✅ Checkout session expires (24 hours)
- ✅ No subscription created if not completed
- ✅ User can retry checkout

#### Test 20: Concurrent Usage Recording
**Steps:**
1. Simultaneously submit 2 transcription requests
2. Both complete around the same time

**Expected Results:**
- ✅ Both usages recorded without race condition
- ✅ Database constraints prevent inconsistent state
- ✅ Total usage correctly summed

#### Test 21: Invalid Price Lookup Key
**Steps:**
1. Modify frontend to use non-existent lookup key
2. Attempt checkout

**Expected Results:**
- ✅ API returns 400/404 error
- ✅ Clear error message
- ✅ User not charged

#### Test 22: Subscription Without Usage Period
**Steps:**
1. Manually delete usage period from database
2. Attempt transcription

**Expected Results:**
- ✅ System handles gracefully (creates missing period or shows error)
- ✅ No crash or 500 error

---

### G. Test Card Reference

Use these Stripe test cards for different scenarios:

| Scenario | Card Number | Expected Behavior |
|----------|-------------|-------------------|
| Successful payment | `4242 4242 4242 4242` | Charge succeeds |
| Payment requires authentication | `4000 0025 0000 3155` | 3D Secure challenge |
| Payment declined | `4000 0000 0000 0002` | Generic decline |
| Insufficient funds | `4000 0000 0000 9995` | Insufficient funds decline |
| Expired card | `4000 0000 0000 0069` | Expired card decline |
| Processing error | `4000 0000 0000 0119` | Processing error |

**Fill in any expiry date (future), any CVC, any postal code**

---

## Phase 2: Production Testing Progression

### Stage 1: Pre-Production Checklist

#### Environment Configuration
- [ ] Replace test API keys with production keys in production `.env`:
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...`
  - `STRIPE_SECRET_KEY=sk_live_...`
- [ ] Create production webhook endpoint in Stripe Dashboard
- [ ] Point webhook to production URL: `https://yourdomain.com/api/stripe/webhook`
- [ ] Update `STRIPE_WEBHOOK_SECRET` with production webhook secret
- [ ] Verify `NEXT_PUBLIC_APP_URL` points to production domain

#### Stripe Dashboard Configuration (Live Mode)
- [ ] Create production products and prices matching test mode
- [ ] Verify lookup keys match: `starter_monthly`, `starter_annual`, `pro_monthly`, `pro_annual`
- [ ] Set up tax collection if applicable (Stripe Tax)
- [ ] Configure email receipts and notifications
- [ ] Set up billing descriptor (appears on credit card statements)
- [ ] Configure Customer Portal settings:
  - [ ] Allow subscription cancellation
  - [ ] Allow payment method updates
  - [ ] Allow invoice viewing
  - [ ] Disable plan switching if not desired

#### Database Preparation
- [ ] Run database migrations in production
- [ ] Verify RLS policies allow webhook operations (service role bypass)
- [ ] Test database functions in production console:
  - `can_transcribe()`
  - `increment_usage()`
- [ ] Set up database backups before launch

#### Monitoring & Logging
- [ ] Set up Stripe webhook monitoring dashboard
- [ ] Configure alerts for webhook failures (check Stripe Dashboard)
- [ ] Set up application logging for payment errors
- [ ] Create dashboard for subscription metrics
- [ ] Set up alerts for payment failures affecting users

### Stage 2: Soft Launch Testing (Real Money, Limited Users)

#### Test Group Selection
- Use 3-5 internal test users or trusted beta users
- Provide refund policy for test phase

#### Test 23: Real Production Checkout (Small Group)
**Steps:**
1. Selected user signs up
2. Completes real checkout with real payment method
3. Gets charged real money

**Expected Results:**
- ✅ Webhook received in production
- ✅ Subscription created correctly
- ✅ User receives email receipt from Stripe
- ✅ Can access protected features

**Monitoring:**
- Check Stripe Dashboard for successful payment
- Verify webhook delivery (should be instant)
- Check application logs for errors

#### Test 24: Real Usage Tracking
**Steps:**
1. Test user creates multiple transcriptions
2. Usage accumulates over several days

**Expected Results:**
- ✅ Usage tracked accurately
- ✅ Warnings appear at thresholds
- ✅ Limits enforced correctly

#### Test 25: Real Subscription Management
**Steps:**
1. Test user accesses Customer Portal
2. Updates payment method
3. Cancels subscription (cancel at period end)
4. Re-activates before period end

**Expected Results:**
- ✅ All webhooks received
- ✅ Database stays in sync
- ✅ User experience smooth

#### Test 26: Real Payment Failure (Controlled)
**Steps:**
1. Test user intentionally uses card with insufficient funds for renewal
2. OR cancel payment method card before renewal

**Expected Results:**
- ✅ Payment fails
- ✅ User notified via email and UI
- ✅ Status changes to `past_due`
- ✅ Grace period provided
- ✅ User can update payment method

#### Test 27: Real Renewal
**Steps:**
1. Wait for test user's first renewal (monthly) or fast-forward by using daily billing for test
2. Monitor webhook and database

**Expected Results:**
- ✅ Payment succeeds automatically
- ✅ New usage period created
- ✅ Usage resets
- ✅ Email receipt sent

### Stage 3: Gradual Public Rollout

#### Phase 3A: Controlled Launch (10-20% traffic)
- Enable subscription for subset of users (A/B test or waitlist)
- Monitor for 1 week:
  - Webhook delivery success rate (target: >99%)
  - Checkout conversion rate
  - Payment failure rate
  - Support tickets related to billing
  - Database sync issues

#### Phase 3B: Expanded Launch (50% traffic)
- Continue monitoring metrics
- Review refund requests
- Analyze churn reasons

#### Phase 3C: Full Launch (100% traffic)
- Monitor for 2 weeks
- Address any edge cases discovered

---

## Phase 3: Non-Stripe System Tests

These tests ensure the broader application works correctly with subscriptions.

### H. Authentication & Middleware Tests

#### Test 28: Unauthenticated Access Control
**Steps:**
1. Log out
2. Attempt to access `/dashboard`, `/transcripts`, `/my-content`, `/settings`

**Expected Results:**
- ✅ Redirected to `/signin`
- ✅ After login, redirected back to original page

#### Test 29: Authenticated but No Subscription
**Steps:**
1. Create new user account
2. Skip subscription (close checkout page)
3. Attempt to access `/dashboard`

**Expected Results:**
- ✅ Middleware detects no subscription
- ✅ Redirected to `/pricing`
- ✅ Clear message explaining subscription required

#### Test 30: Past Due Access (Grace Period)
**Steps:**
1. User with `past_due` subscription tries to access protected routes

**Expected Results:**
- ✅ Access GRANTED (grace period)
- ✅ Payment failed banner shown on all pages
- ✅ Can still create transcriptions (within limit)

#### Test 31: Canceled Subscription Access
**Steps:**
1. User with canceled subscription attempts access

**Expected Results:**
- ✅ Access DENIED
- ✅ Redirected to `/pricing`
- ✅ Can still view old transcripts (consider implementing)

### I. Frontend Component Tests

#### Test 32: Pricing Page Display
**Steps:**
1. Visit `/pricing` (logged out and logged in)

**Expected Results:**
- ✅ Shows all 4 plan options clearly
- ✅ Monthly/Annual toggle works
- ✅ Prices displayed correctly
- ✅ Button text changes based on auth state
- ✅ If already subscribed, shows current plan badge

#### Test 33: Subscription Details Display
**Steps:**
1. Navigate to `/settings/billing`

**Expected Results:**
- ✅ Shows current plan name
- ✅ Shows billing interval
- ✅ Shows next billing date
- ✅ Shows cancelation warning if applicable
- ✅ "Manage Subscription" button works

#### Test 34: Usage Display Accuracy
**Steps:**
1. Check usage display in multiple locations:
   - Dashboard
   - Settings billing page
   - Usage banner

**Expected Results:**
- ✅ All locations show consistent usage numbers
- ✅ Progress bar percentage accurate
- ✅ Reset date displayed correctly
- ✅ Updates after new transcription

#### Test 35: Responsive Design
**Steps:**
1. Test subscription UI on:
   - Desktop (1920x1080)
   - Tablet (768px width)
   - Mobile (375px width)

**Expected Results:**
- ✅ Pricing cards stack properly
- ✅ Buttons remain accessible
- ✅ Modals/banners display correctly
- ✅ Customer Portal link works on mobile

### J. Data Integrity Tests

#### Test 36: Subscription-User Link Integrity
**Steps:**
1. Create subscription
2. Verify database relationships

**Expected Results:**
- ✅ `subscriptions.user_id` matches Supabase auth user
- ✅ `subscriptions.stripe_customer_id` matches Stripe customer
- ✅ Stripe customer metadata contains correct `supabase_user_id`
- ✅ No orphaned records

#### Test 37: Usage Period Continuity
**Steps:**
1. Check that usage periods don't overlap or have gaps
2. Query database:
```sql
SELECT
  user_id,
  period_start,
  period_end,
  LAG(period_end) OVER (PARTITION BY user_id ORDER BY period_start) as prev_end
FROM usage_periods
WHERE user_id = '...'
ORDER BY period_start;
```

**Expected Results:**
- ✅ No overlapping periods
- ✅ period_end of one period = period_start of next (or close)
- ✅ Current period covers current date

#### Test 38: Usage Log Accuracy
**Steps:**
1. Compare usage logs sum with usage period total
```sql
SELECT
  up.user_id,
  up.minutes_used as period_total,
  COALESCE(SUM(ul.minutes_charged), 0) as logs_total
FROM usage_periods up
LEFT JOIN usage_logs ul ON up.id = ul.usage_period_id
WHERE up.user_id = '...'
GROUP BY up.id, up.user_id, up.minutes_used;
```

**Expected Results:**
- ✅ `period_total` = `logs_total`
- ✅ No discrepancies

### K. Performance & Load Tests

#### Test 39: Webhook Processing Speed
**Steps:**
1. Trigger webhook event
2. Measure time from Stripe send to database update

**Expected Results:**
- ✅ Processing completes in <5 seconds
- ✅ No timeouts (Stripe expects response in 30 seconds)
- ✅ Stripe Dashboard shows webhook as "Succeeded"

#### Test 40: Subscription Status API Performance
**Steps:**
1. Make repeated calls to `/api/subscription/status`
2. Measure response time

**Expected Results:**
- ✅ Response in <500ms
- ✅ Consider caching if slower

#### Test 41: Concurrent User Load
**Steps:**
1. Simulate 50-100 concurrent users checking subscription status
2. Use load testing tool (e.g., k6, Apache Bench)

**Expected Results:**
- ✅ No database deadlocks
- ✅ All requests succeed
- ✅ Response times remain acceptable

### L. Security Tests

#### Test 42: API Route Authorization
**Steps:**
1. Attempt to access `/api/subscription/status` without auth token
2. Attempt to access with another user's token

**Expected Results:**
- ✅ Returns 401 Unauthorized
- ✅ Cannot access other users' data

#### Test 43: Customer Portal Security
**Steps:**
1. Try to generate portal session for different user
2. Attempt to access portal URL for another customer

**Expected Results:**
- ✅ Cannot generate session for other users
- ✅ Portal URLs are one-time use and expire

#### Test 44: Webhook Replay Attack
**Steps:**
1. Capture webhook payload
2. Replay same payload with old timestamp

**Expected Results:**
- ✅ Stripe signature verification fails
- ✅ Request rejected with 400 error

### M. Email & Notification Tests

#### Test 45: Stripe Email Receipts
**Steps:**
1. Complete checkout
2. Check inbox

**Expected Results:**
- ✅ Receipt email received from Stripe
- ✅ Shows correct amount and plan
- ✅ Includes invoice PDF

#### Test 46: Renewal Notifications
**Steps:**
1. Wait for renewal or trigger with CLI

**Expected Results:**
- ✅ User receives renewal receipt
- ✅ (Optional) Custom email sent from your app

#### Test 47: Payment Failed Notifications
**Steps:**
1. Trigger payment failure

**Expected Results:**
- ✅ Stripe sends dunning email
- ✅ UI shows payment failed banner
- ✅ (Optional) Custom notification in-app

### N. Refund & Customer Support Tests

#### Test 48: Full Refund
**Steps:**
1. In Stripe Dashboard, issue full refund for a subscription
2. Check user status

**Expected Results:**
- ✅ Webhook `charge.refunded` received
- ✅ Consider canceling subscription or providing custom handling
- ✅ User loses access (based on your policy)

#### Test 49: Partial Refund
**Steps:**
1. Issue partial refund (e.g., for partial month)

**Expected Results:**
- ✅ User retains access
- ✅ Refund logged in Stripe

#### Test 50: Customer Support Access
**Steps:**
1. Support team member searches for user by email in Stripe Dashboard
2. Views subscription history

**Expected Results:**
- ✅ Can find customer easily
- ✅ Can see all invoices and events
- ✅ Can manually adjust subscription if needed

---

## Phase 4: Ongoing Monitoring

### Daily Checks
- [ ] Webhook delivery success rate in Stripe Dashboard (target: >99%)
- [ ] Number of payment failures
- [ ] New subscriptions count
- [ ] Cancellations count

### Weekly Checks
- [ ] Review failed webhooks and retry if needed
- [ ] Check for database sync issues (run Test 36-38)
- [ ] Review support tickets related to billing
- [ ] Analyze churn reasons

### Monthly Checks
- [ ] Review MRR (Monthly Recurring Revenue)
- [ ] Check for abandoned carts (started checkout but didn't complete)
- [ ] Analyze conversion funnel: Pricing page → Checkout → Active subscription
- [ ] Test key flows end-to-end (repeat Tests 1, 5, 12)

---

## Rollback Plan

If critical issues discovered in production:

1. **Immediate:** Disable new subscriptions by:
   - Temporarily hiding pricing page CTA
   - Adding maintenance message

2. **Preserve existing:** Don't cancel existing subscriptions

3. **Investigate:** Check logs, webhooks, database

4. **Fix & Re-test:** Fix in sandbox, then re-deploy

5. **Communicate:** Email affected users if needed

---

## Key Metrics to Track

### Technical Metrics
- Webhook delivery success rate: >99%
- API response times: <500ms for subscription status
- Payment success rate: >95%
- Checkout abandonment rate: <30%

### Business Metrics
- Conversion rate: Visitor → Paid subscriber
- MRR (Monthly Recurring Revenue)
- Churn rate: <5% monthly
- Average revenue per user (ARPU)
- Lifetime value (LTV)

### User Experience Metrics
- Time to complete checkout: <2 minutes
- Support tickets per 100 subscribers: <5
- Payment failure resolution rate: >90%

---

## Summary

This testing plan covers:
- ✅ 50 specific test cases across all features
- ✅ Sandbox testing with test cards and Stripe CLI
- ✅ Gradual production rollout strategy
- ✅ Non-Stripe system integration tests
- ✅ Performance, security, and data integrity tests
- ✅ Ongoing monitoring and metrics

**Recommended Testing Sequence:**
1. Complete all Phase 1 sandbox tests (Tests 1-27)
2. Fix any issues found
3. Execute Pre-Production Checklist (Stage 1)
4. Run soft launch with 3-5 users (Stage 2, Tests 23-27)
5. Monitor for 1 week
6. Gradually roll out to all users (Stage 3)
7. Run non-Stripe tests (Tests 28-50) during rollout
8. Establish ongoing monitoring routine (Phase 4)

**Critical Tests to Never Skip:**
- Test 1: Basic checkout flow
- Test 7: Subscription updated webhook
- Test 10: Renewal (invoice paid)
- Test 11: Payment failed handling
- Test 15: Usage limit enforcement
- Test 18: Webhook signature verification
- Test 42: API authorization

---

## Tools & Resources

- **Stripe CLI:** `brew install stripe/stripe-cli/stripe`
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Webhook Tester:** https://webhook.site (for debugging)
- **Test Cards:** https://stripe.com/docs/testing
- **Stripe API Docs:** https://stripe.com/docs/api

**Support:**
- Stripe Support: https://support.stripe.com
- Stripe Discord: https://stripe.com/discord
