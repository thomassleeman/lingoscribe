# Set the subscription billing renewal date

Learn how to set the billing date for subscriptions.

A subscription’s billing period depends on two factors:

- The recurring interval of its [price](https://docs.stripe.com/products-prices/overview.md) or prices, such as monthly, yearly, weekly, and so on.
- The [billing cycle anchor](https://docs.stripe.com/api/subscriptions/object.md#subscription_object-billing_cycle_anchor) is the reference point that aligns future billing period dates. It sets the day of week for `week` intervals, the day of month for `month` and `year` intervals and the month of year for `year` intervals. The default value is either the subscription creation date or the trial end date (if you’re using a trial period). You can also explicitly set this value at the time you create the subscription.

> Billing cycle anchors are UNIX timestamps in seconds from the current epoch.

The following are examples of monthly subscriptions with different billing periods:

- A monthly subscription with a billing cycle anchor date of September 2 always bills on the second day of the month.
- A monthly subscription with a billing cycle anchor date of 31 January bills the last day of the month closest to the anchor date, so 28 February (or 29 February in a leap year), then 31 March, 30 April, and so on.
- A weekly subscription with a billing cycle anchor date of Friday, 3 June bills every Friday thereafter.

Full billing periods start on the first full _invoice_ (Invoices are statements of amounts owed by a customer. They track the status of payments from draft through paid or otherwise finalized. Subscriptions automatically generate invoices, or you can manually create a one-off invoice) date, which is often the same as the billing cycle anchor and is always interval-aligned with it.

## Specify the billing cycle anchor for new subscriptions

> The subscription creation time matches the time of the request. It is not the same as the subscription start date. Learn more about [backdating and billing cycle anchors](https://docs.stripe.com/billing/subscriptions/backdating.md#backdating-billing-cycle).

There are two ways to set the billing cycle anchor on new subscriptions:

- Use `billing_cycle_anchor_config` to calculate the timestamp for you (monthly or yearly subscriptions only).
- Use `billing_cycle_anchor` to accept the timestamp directly.

If you’re creating a monthly or yearly subscription, we recommend using the `billing_cycle_anchor_config` parameter because it automatically factors in short months and leap years for you. If you’re creating a daily or weekly subscription or if you prefer to set the renewal date of your subscription using a timestamp, use the `billing_cycle_anchor` parameter directly.

### Use billing_cycle_anchor_config

To create an integration with monthly and yearly subscriptions, use `billing_cycle_anchor_config` on [create subscription](https://docs.stripe.com/api.md#create_subscription) to specify the day of the month on which to anchor.

Set `day_of_month` to `31` to create a monthly subscription that renews at the end of the month, even in months with less than 31 days. If a month has less than 31 days, the subscription renews on the last day of that month.

```curl
curl https://api.stripe.com/v1/subscriptions \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d customer="{{CUSTOMER_ID}}" \
  -d "items[0][price]"="{{PRICE_ID}}" \
  -d "billing_cycle_anchor_config[day_of_month]"=31
```

```cli
stripe subscriptions create  \
  --customer="{{CUSTOMER_ID}}" \
  -d "items[0][price]"="{{PRICE_ID}}" \
  -d "billing_cycle_anchor_config[day_of_month]"=31
```

```ruby
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = Stripe::StripeClient.new("<<YOUR_SECRET_KEY>>")

subscription = client.v1.subscriptions.create({
  customer: '{{CUSTOMER_ID}}',
  items: [{price: '{{PRICE_ID}}'}],
  billing_cycle_anchor_config: {day_of_month: 31},
})
```

```python
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = StripeClient("<<YOUR_SECRET_KEY>>")

# For SDK versions 12.4.0 or lower, remove '.v1' from the following line.
subscription = client.v1.subscriptions.create({
  "customer": "{{CUSTOMER_ID}}",
  "items": [{"price": "{{PRICE_ID}}"}],
  "billing_cycle_anchor_config": {"day_of_month": 31},
})
```

```php
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
$stripe = new \Stripe\StripeClient('<<YOUR_SECRET_KEY>>');

$subscription = $stripe->subscriptions->create([
  'customer' => '{{CUSTOMER_ID}}',
  'items' => [['price' => '{{PRICE_ID}}']],
  'billing_cycle_anchor_config' => ['day_of_month' => 31],
]);
```

```java
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
StripeClient client = new StripeClient("<<YOUR_SECRET_KEY>>");

SubscriptionCreateParams params =
  SubscriptionCreateParams.builder()
    .setCustomer("{{CUSTOMER_ID}}")
    .addItem(
      SubscriptionCreateParams.Item.builder().setPrice("{{PRICE_ID}}").build()
    )
    .setBillingCycleAnchorConfig(
      SubscriptionCreateParams.BillingCycleAnchorConfig.builder()
        .setDayOfMonth(31L)
        .build()
    )
    .build();

// For SDK versions 29.4.0 or lower, remove '.v1()' from the following line.
Subscription subscription = client.v1().subscriptions().create(params);
```

```node
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require("stripe")("<<YOUR_SECRET_KEY>>");

const subscription = await stripe.subscriptions.create({
  customer: "{{CUSTOMER_ID}}",
  items: [
    {
      price: "{{PRICE_ID}}",
    },
  ],
  billing_cycle_anchor_config: {
    day_of_month: 31,
  },
});
```

```go
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
sc := stripe.NewClient("<<YOUR_SECRET_KEY>>")
params := &stripe.SubscriptionCreateParams{
  Customer: stripe.String("{{CUSTOMER_ID}}"),
  Items: []*stripe.SubscriptionCreateItemParams{
    &stripe.SubscriptionCreateItemParams{Price: stripe.String("{{PRICE_ID}}")},
  },
  BillingCycleAnchorConfig: &stripe.SubscriptionCreateBillingCycleAnchorConfigParams{
    DayOfMonth: stripe.Int64(31),
  },
}
result, err := sc.V1Subscriptions.Create(context.TODO(), params)
```

```dotnet
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
var options = new SubscriptionCreateOptions
{
    Customer = "{{CUSTOMER_ID}}",
    Items = new List<SubscriptionItemOptions>
    {
        new SubscriptionItemOptions { Price = "{{PRICE_ID}}" },
    },
    BillingCycleAnchorConfig = new SubscriptionBillingCycleAnchorConfigOptions
    {
        DayOfMonth = 31,
    },
};
var client = new StripeClient("<<YOUR_SECRET_KEY>>");
var service = client.V1.Subscriptions;
Subscription subscription = service.Create(options);
```

You can also specify `month` to control the month of year for the anchor on multi-month and yearly subscriptions.

To cycle your yearly subscriptions on the first of July, create a yearly subscription with a `month` of `7` and `day_of_month` of `1`.

```curl
curl https://api.stripe.com/v1/subscriptions \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d customer="{{CUSTOMER_ID}}" \
  -d "items[0][price]"="{{PRICE_ID}}" \
  -d "billing_cycle_anchor_config[month]"=7 \
  -d "billing_cycle_anchor_config[day_of_month]"=1
```

```cli
stripe subscriptions create  \
  --customer="{{CUSTOMER_ID}}" \
  -d "items[0][price]"="{{PRICE_ID}}" \
  -d "billing_cycle_anchor_config[month]"=7 \
  -d "billing_cycle_anchor_config[day_of_month]"=1
```

```ruby
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = Stripe::StripeClient.new("<<YOUR_SECRET_KEY>>")

subscription = client.v1.subscriptions.create({
  customer: '{{CUSTOMER_ID}}',
  items: [{price: '{{PRICE_ID}}'}],
  billing_cycle_anchor_config: {
    month: 7,
    day_of_month: 1,
  },
})
```

```python
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = StripeClient("<<YOUR_SECRET_KEY>>")

# For SDK versions 12.4.0 or lower, remove '.v1' from the following line.
subscription = client.v1.subscriptions.create({
  "customer": "{{CUSTOMER_ID}}",
  "items": [{"price": "{{PRICE_ID}}"}],
  "billing_cycle_anchor_config": {"month": 7, "day_of_month": 1},
})
```

```php
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
$stripe = new \Stripe\StripeClient('<<YOUR_SECRET_KEY>>');

$subscription = $stripe->subscriptions->create([
  'customer' => '{{CUSTOMER_ID}}',
  'items' => [['price' => '{{PRICE_ID}}']],
  'billing_cycle_anchor_config' => [
    'month' => 7,
    'day_of_month' => 1,
  ],
]);
```

```java
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
StripeClient client = new StripeClient("<<YOUR_SECRET_KEY>>");

SubscriptionCreateParams params =
  SubscriptionCreateParams.builder()
    .setCustomer("{{CUSTOMER_ID}}")
    .addItem(
      SubscriptionCreateParams.Item.builder().setPrice("{{PRICE_ID}}").build()
    )
    .setBillingCycleAnchorConfig(
      SubscriptionCreateParams.BillingCycleAnchorConfig.builder()
        .setMonth(7L)
        .setDayOfMonth(1L)
        .build()
    )
    .build();

// For SDK versions 29.4.0 or lower, remove '.v1()' from the following line.
Subscription subscription = client.v1().subscriptions().create(params);
```

```node
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require("stripe")("<<YOUR_SECRET_KEY>>");

const subscription = await stripe.subscriptions.create({
  customer: "{{CUSTOMER_ID}}",
  items: [
    {
      price: "{{PRICE_ID}}",
    },
  ],
  billing_cycle_anchor_config: {
    month: 7,
    day_of_month: 1,
  },
});
```

```go
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
sc := stripe.NewClient("<<YOUR_SECRET_KEY>>")
params := &stripe.SubscriptionCreateParams{
  Customer: stripe.String("{{CUSTOMER_ID}}"),
  Items: []*stripe.SubscriptionCreateItemParams{
    &stripe.SubscriptionCreateItemParams{Price: stripe.String("{{PRICE_ID}}")},
  },
  BillingCycleAnchorConfig: &stripe.SubscriptionCreateBillingCycleAnchorConfigParams{
    Month: stripe.Int64(7),
    DayOfMonth: stripe.Int64(1),
  },
}
result, err := sc.V1Subscriptions.Create(context.TODO(), params)
```

```dotnet
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
var options = new SubscriptionCreateOptions
{
    Customer = "{{CUSTOMER_ID}}",
    Items = new List<SubscriptionItemOptions>
    {
        new SubscriptionItemOptions { Price = "{{PRICE_ID}}" },
    },
    BillingCycleAnchorConfig = new SubscriptionBillingCycleAnchorConfigOptions
    {
        Month = 7,
        DayOfMonth = 1,
    },
};
var client = new StripeClient("<<YOUR_SECRET_KEY>>");
var service = client.V1.Subscriptions;
Subscription subscription = service.Create(options);
```

You can specify the exact month, day, hour, minute, and second for the billing cycle anchor by using `billing_cycle_anchor_config`. If you don’t specify the hour, minute, and second, they default to the values of the subscription creation time.

The billing cycle anchor uses Coordinated Universal Time (UTC). For example, if you create a subscription using `billing_cycle_anchor_config` at 5 PM EST without specifying the hour, the time is recorded in the system as 10 PM UTC.

`billing_cycle_anchor_config` doesn’t support anchoring on a backdated start date.

For example, if you have an existing monthly subscription with a `billing_cycle_anchor` timestamp that contains the day of the month, hour, minute, and second of 15, 12, 30, and 0, you can align a new monthly subscription with it. To do this, set `day_of_month`, `hour`, `minute`, and `second` to match those same values, respectively.

```curl
curl https://api.stripe.com/v1/subscriptions \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d customer="{{CUSTOMER_ID}}" \
  -d "items[0][price]"="{{PRICE_ID}}" \
  -d "billing_cycle_anchor_config[day_of_month]"=15 \
  -d "billing_cycle_anchor_config[hour]"=12 \
  -d "billing_cycle_anchor_config[minute]"=30 \
  -d "billing_cycle_anchor_config[second]"=0
```

```cli
stripe subscriptions create  \
  --customer="{{CUSTOMER_ID}}" \
  -d "items[0][price]"="{{PRICE_ID}}" \
  -d "billing_cycle_anchor_config[day_of_month]"=15 \
  -d "billing_cycle_anchor_config[hour]"=12 \
  -d "billing_cycle_anchor_config[minute]"=30 \
  -d "billing_cycle_anchor_config[second]"=0
```

```ruby
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = Stripe::StripeClient.new("<<YOUR_SECRET_KEY>>")

subscription = client.v1.subscriptions.create({
  customer: '{{CUSTOMER_ID}}',
  items: [{price: '{{PRICE_ID}}'}],
  billing_cycle_anchor_config: {
    day_of_month: 15,
    hour: 12,
    minute: 30,
    second: 0,
  },
})
```

```python
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = StripeClient("<<YOUR_SECRET_KEY>>")

# For SDK versions 12.4.0 or lower, remove '.v1' from the following line.
subscription = client.v1.subscriptions.create({
  "customer": "{{CUSTOMER_ID}}",
  "items": [{"price": "{{PRICE_ID}}"}],
  "billing_cycle_anchor_config": {
    "day_of_month": 15,
    "hour": 12,
    "minute": 30,
    "second": 0,
  },
})
```

```php
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
$stripe = new \Stripe\StripeClient('<<YOUR_SECRET_KEY>>');

$subscription = $stripe->subscriptions->create([
  'customer' => '{{CUSTOMER_ID}}',
  'items' => [['price' => '{{PRICE_ID}}']],
  'billing_cycle_anchor_config' => [
    'day_of_month' => 15,
    'hour' => 12,
    'minute' => 30,
    'second' => 0,
  ],
]);
```

```java
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
StripeClient client = new StripeClient("<<YOUR_SECRET_KEY>>");

SubscriptionCreateParams params =
  SubscriptionCreateParams.builder()
    .setCustomer("{{CUSTOMER_ID}}")
    .addItem(
      SubscriptionCreateParams.Item.builder().setPrice("{{PRICE_ID}}").build()
    )
    .setBillingCycleAnchorConfig(
      SubscriptionCreateParams.BillingCycleAnchorConfig.builder()
        .setDayOfMonth(15L)
        .setHour(12L)
        .setMinute(30L)
        .setSecond(0L)
        .build()
    )
    .build();

// For SDK versions 29.4.0 or lower, remove '.v1()' from the following line.
Subscription subscription = client.v1().subscriptions().create(params);
```

```node
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require("stripe")("<<YOUR_SECRET_KEY>>");

const subscription = await stripe.subscriptions.create({
  customer: "{{CUSTOMER_ID}}",
  items: [
    {
      price: "{{PRICE_ID}}",
    },
  ],
  billing_cycle_anchor_config: {
    day_of_month: 15,
    hour: 12,
    minute: 30,
    second: 0,
  },
});
```

```go
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
sc := stripe.NewClient("<<YOUR_SECRET_KEY>>")
params := &stripe.SubscriptionCreateParams{
  Customer: stripe.String("{{CUSTOMER_ID}}"),
  Items: []*stripe.SubscriptionCreateItemParams{
    &stripe.SubscriptionCreateItemParams{Price: stripe.String("{{PRICE_ID}}")},
  },
  BillingCycleAnchorConfig: &stripe.SubscriptionCreateBillingCycleAnchorConfigParams{
    DayOfMonth: stripe.Int64(15),
    Hour: stripe.Int64(12),
    Minute: stripe.Int64(30),
    Second: stripe.Int64(0),
  },
}
result, err := sc.V1Subscriptions.Create(context.TODO(), params)
```

```dotnet
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
var options = new SubscriptionCreateOptions
{
    Customer = "{{CUSTOMER_ID}}",
    Items = new List<SubscriptionItemOptions>
    {
        new SubscriptionItemOptions { Price = "{{PRICE_ID}}" },
    },
    BillingCycleAnchorConfig = new SubscriptionBillingCycleAnchorConfigOptions
    {
        DayOfMonth = 15,
        Hour = 12,
        Minute = 30,
        Second = 0,
    },
};
var client = new StripeClient("<<YOUR_SECRET_KEY>>");
var service = client.V1.Subscriptions;
Subscription subscription = service.Create(options);
```

If you use `billing_cycle_anchor_config`, it might result in a `billing_cycle_anchor` that’s more than one billing period in the future. However, the date for the first full invoice always falls within one billing period from the creation of the subscription or the ending of a free trial.

For example, assume that you create a two-month interval subscription in February and you cycle it at the end of every month by setting `day_of_month` to `31`. The next month that has 31 days on two-month intervals from February is August, which results in a billing cycle anchor on 31 August. However, the first full invoice date for this subscription still occurs in February. There’s an initial, prorated period from subscription creation until 28 February (or 29 during a leap year), followed by a full two-month billing period.

### Use billing_cycle_anchor

You can create a subscription with an explicit billing cycle anchor using the Subscriptions API or Checkout.

#### Subscriptions API

Call [create subscription](https://docs.stripe.com/api.md#create_subscription), setting a timestamp for `billing_cycle_anchor`.

```curl
curl https://api.stripe.com/v1/subscriptions \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d customer="{{CUSTOMER_ID}}" \
  -d "items[0][price]"="{{PRICE_ID}}" \
  -d billing_cycle_anchor=1611008505
```

```cli
stripe subscriptions create  \
  --customer="{{CUSTOMER_ID}}" \
  -d "items[0][price]"="{{PRICE_ID}}" \
  --billing-cycle-anchor=1611008505
```

```ruby
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = Stripe::StripeClient.new("<<YOUR_SECRET_KEY>>")

subscription = client.v1.subscriptions.create({
  customer: '{{CUSTOMER_ID}}',
  items: [{price: '{{PRICE_ID}}'}],
  billing_cycle_anchor: 1611008505,
})
```

```python
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = StripeClient("<<YOUR_SECRET_KEY>>")

# For SDK versions 12.4.0 or lower, remove '.v1' from the following line.
subscription = client.v1.subscriptions.create({
  "customer": "{{CUSTOMER_ID}}",
  "items": [{"price": "{{PRICE_ID}}"}],
  "billing_cycle_anchor": 1611008505,
})
```

```php
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
$stripe = new \Stripe\StripeClient('<<YOUR_SECRET_KEY>>');

$subscription = $stripe->subscriptions->create([
  'customer' => '{{CUSTOMER_ID}}',
  'items' => [['price' => '{{PRICE_ID}}']],
  'billing_cycle_anchor' => 1611008505,
]);
```

```java
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
StripeClient client = new StripeClient("<<YOUR_SECRET_KEY>>");

SubscriptionCreateParams params =
  SubscriptionCreateParams.builder()
    .setCustomer("{{CUSTOMER_ID}}")
    .addItem(
      SubscriptionCreateParams.Item.builder().setPrice("{{PRICE_ID}}").build()
    )
    .setBillingCycleAnchor(1611008505L)
    .build();

// For SDK versions 29.4.0 or lower, remove '.v1()' from the following line.
Subscription subscription = client.v1().subscriptions().create(params);
```

```node
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require("stripe")("<<YOUR_SECRET_KEY>>");

const subscription = await stripe.subscriptions.create({
  customer: "{{CUSTOMER_ID}}",
  items: [
    {
      price: "{{PRICE_ID}}",
    },
  ],
  billing_cycle_anchor: 1611008505,
});
```

```go
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
sc := stripe.NewClient("<<YOUR_SECRET_KEY>>")
params := &stripe.SubscriptionCreateParams{
  Customer: stripe.String("{{CUSTOMER_ID}}"),
  Items: []*stripe.SubscriptionCreateItemParams{
    &stripe.SubscriptionCreateItemParams{Price: stripe.String("{{PRICE_ID}}")},
  },
  BillingCycleAnchor: stripe.Int64(1611008505),
}
result, err := sc.V1Subscriptions.Create(context.TODO(), params)
```

```dotnet
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
var options = new SubscriptionCreateOptions
{
    Customer = "{{CUSTOMER_ID}}",
    Items = new List<SubscriptionItemOptions>
    {
        new SubscriptionItemOptions { Price = "{{PRICE_ID}}" },
    },
    BillingCycleAnchor = DateTimeOffset.FromUnixTimeSeconds(1611008505).UtcDateTime,
};
var client = new StripeClient("<<YOUR_SECRET_KEY>>");
var service = client.V1.Subscriptions;
Subscription subscription = service.Create(options);
```

### Configure proration behaviour

Regardless of which API parameter you use, Stripe automatically creates a prorated invoice to bill for the period between the subscription creation date and the first full invoice date.

If you don’t want to immediately charge a customer for the period between the subscription creation and the first full invoice date, either:

- [Disable the proration](https://docs.stripe.com/billing/subscriptions/prorations.md#disable-prorations) by setting `proration_behavior` to `none`, making the initial period up to the first full invoice date free. This action doesn’t generate an invoice at all until the first billing period.
- [Combine a trial with the billing_cycle_anchor](https://docs.stripe.com/billing/subscriptions/trials.md#combine-trial-anchor) by setting `trial_end` to a timestamp representing the date when the free trial ends. Depending on the duration of the free trial and the number of days until the first full invoice date, this option might result in a prorated invoice following the trial period. For example, a free trial is 7 days and the billing renewal is monthly on the 1st. If the customer subscribes on the 15th, we generate a prorated invoice on the 22nd for the period between the 22nd and the 1st, then invoice for the full amount on the 1st of each month thereafter. If a customer subscribes on the 28th, the free trial extends past the 1st, generating a prorated invoice until the next month.

#### Checkout

Call the Stripe Checkout [create session](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session) with a timestamp for `subscription_data.billing_cycle_anchor`:

#### cURL

```bash
curl https://api.stripe.com/v1/checkout/sessions \
  -u <<YOUR_SECRET_KEY>>: \
  -d "line_items[][price]"="{{PRICE_ID}}" \
  -d "line_items[][quantity]"=1 \
  -d "mode"="subscription" \
  -d "success_url"="https://example.com/success?session_id={CHECKOUT_SESSION_ID}" \-d "subscription_data[billing_cycle_anchor]"=1611008505
```

#### Ruby

```ruby

# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
Stripe.api_key = '<<YOUR_SECRET_KEY>>'

session = Stripe::Checkout::Session.create(
  line_items: [{
    price: '{{PRICE_ID}}',
    quantity: 1
  }],
  mode: 'subscription',
  success_url: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',subscription_data: { billing_cycle_anchor:1611008505}
)

# Record the session ID in your system
session_id = session.id

# 303 redirect to session.url
```

#### Python

```python

# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
stripe.api_key = '<<YOUR_SECRET_KEY>>'

session = stripe.checkout.Session.create(
  line_items=[{
    'price': '{{PRICE_ID}}',
    'quantity': 1
  }],
  mode='subscription',
  success_url='https://example.com/success?session_id={CHECKOUT_SESSION_ID}',subscription_data={ 'billing_cycle_anchor':1611008505}
)

# Record the session ID in your system
session_id = session.id

# 303 redirect to session.url
```

#### PHP

```php

// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
\Stripe\Stripe::setApiKey('<<YOUR_SECRET_KEY>>');

$session = \Stripe\Checkout\Session::create([
  'line_items' => [[
    'price' => '{{PRICE_ID}}',
    'quantity' => 1
    ]],
  'mode' => 'subscription',
  'success_url' => 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}','subscription_data' => [ 'billing_cycle_anchor' =>1611008505]
]);

// Record the session ID in your system
$session_id = $session->id

// 303 redirect to $session->url
```

#### Java

```java

// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
Stripe.apiKey = "<<YOUR_SECRET_KEY>>";

SessionCreateParams params =
  SessionCreateParams.builder()
    .addLineItem(
      SessionCreateParams.LineItem.builder()
        .setQuantity(1L)
        .setPrice(""{{PRICE_ID}}"")
        .build())
    .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
    .setSuccessUrl("https://example.com/success?session_id={CHECKOUT_SESSION_ID}").setSubscriptionData(
      SessionCreateParams.SubscriptionData.builder()
        .setBillingCycleAnchor(1611008505L)
        .build())
    .build();

Session session = Session.create(params);

// Record the session ID in your system
String sessionId = session.getId();

// 303 redirect to session.getUrl()
```

#### Node.js

```javascript
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require("stripe")("<<YOUR_SECRET_KEY>>");

const session = await stripe.checkout.sessions.create({
  line_items: [
    {
      price: "{{PRICE_ID}}",
      quantity: 1,
    },
  ],
  mode: "subscription",
  success_url: "https://example.com/success?session_id={CHECKOUT_SESSION_ID}",
  subscription_data: { billing_cycle_anchor: 1611008505 },
});

// Record the session ID in your system
const session_id = session.id;

// 303 redirect to session.url
```

#### Go

```go

// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
stripe.Key = "<<YOUR_SECRET_KEY>>"

params := &stripe.CheckoutSessionParams{
    LineItems: []*stripe.CheckoutSessionLineItemParams{
        &stripe.CheckoutSessionLineItemParams{
            Price: stripe.String(""{{PRICE_ID}}""),
            Quantity: stripe.Int64(1)
        }
    },
    Mode: stripe.String("subscription"),
    SuccessURL: stripe.String("https://example.com/success?session_id={CHECKOUT_SESSION_ID}"),SubscriptionData: &stripe.CheckoutSessionSubscriptionDataParams{
      BillingCycleAnchor: stripe.Int64(1611008505)
    },

}

session, err := session.New(params)

// Record the session ID in your system
session_id := session.ID

// 303 redirect to session.URL
```

#### .NET

```dotnet

// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
StripeConfiguration.ApiKey = "<<YOUR_SECRET_KEY>>";

var options = new SessionCreateOptions {
    LineItems = new List<SessionLineItemOptions>
    {
        new SessionLineItemOptions
        {
            Price = ""{{PRICE_ID}}"",
            Quantity = 1
        }
    },
    Mode = "subscription",
    SuccessUrl = "https://example.com/success?session_id={CHECKOUT_SESSION_ID}",SubscriptionData = new SessionSubscriptionDataOptions
    {
        BillingCycleAnchor = DateTimeOffset.FromUnixTimeSeconds(1611008505).UtcDateTime
    },
};

var service = new SessionService();
Session session = service.Create(options);

// Record the session ID in your system
string sessionId = session.getId()

// 303 redirect to session.Url
```

Checkout must be in `subscription` mode to configure a billing cycle anchor.

### Configure proration behaviour

You can configure how to handle the period between subscription creation and the first full invoice date using the `proration_behavior` parameter. Checkout doesn’t support combining a trial with the billing cycle anchor.

- Keep the default `create_prorations` setting to allow Stripe to immediately invoice the customer for the period between the subscription date and the first full invoice date.
- [Disable the proration](https://docs.stripe.com/payments/checkout/billing-cycle.md?ui=embedded-form#disable-prorations) by setting `proration_behavior` to `none`, making the initial period free (up to the first full invoice date). This action doesn’t generate an invoice at all until the first billing period.

> You can’t use one-off prices in Checkout Sessions when `proration_behavior` is `none`.

## Change the billing period on existing subscriptions

Use the [Subscriptions API](https://docs.stripe.com/api/subscriptions/update.md) or [Dashboard](https://dashboard.stripe.com/subscriptions) to change the billing date of an existing subscription through one of the following options:

- Reset the billing cycle anchor to the current time.
- Add a [free trial](https://docs.stripe.com/billing/subscriptions/trials.md) to automatically set the anchor date to the end of the trial. Trials typically start when you create a subscription, but you can also apply them to existing subscriptions, allowing you to credit the customer for the days left in the previous cycle that they already paid.

Your billing cycle date changes in these scenarios. However, if you create or update a subscription with `billing_mode[type]=flexible`, the billing cycle anchor remains unchanged. Learn more about [configuring flexible billing mode](https://docs.stripe.com/billing/subscriptions/billing-mode.md) and its [limitations](https://docs.stripe.com/billing/subscriptions/billing-mode.md#limitations).

- If all prices are zero-amount, adding one or more paid prices immediately resets the billing period. See the [change subscription prices guide](https://docs.stripe.com/billing/subscriptions/change-price.md#handle-zero-amount-prices-and-quantities) for more information.
- The `billing_cycle_anchor` resets to the [cancel_at](https://docs.stripe.com/api/subscriptions/object.md#subscription_object-cancel_at) date when creating a subscription with `cancel_at` set to a date before the subscription renews next or modifying an existing `cancel_at` date on a subscription with a `billing_cycle_anchor` in the future of the new `cancel_at` date.
- The `billing_cycle_anchor` resets to the current time when switching to a price with a different [recurring.interval](https://docs.stripe.com/api/prices/object.md#price_object-recurring).

### Reset the billing period to the current time

To reset the billing cycle anchor to the current time, make an update request with `billing_cycle_anchor` set to `now`. This sets the billing cycle anchor to the time of the update request. After you reset the billing cycle anchor, Stripe immediately sends an invoice. [Enable proration](https://docs.stripe.com/api/subscriptions/create.md#create_subscription-proration_behavior) to credit the customer for any days already paid in the previous period. Disabling proration might result in overcharging your customer.

#### API

Call [update the subscription](https://docs.stripe.com/api.md#update_subscription), setting `billing_cycle_anchor` to `now` and `proration_behavior` to `create_prorations` to prevent overcharging the customer for any days they already paid in the previous cycle.

```curl
curl https://api.stripe.com/v1/subscriptions/sub_49ty4767H20z6a \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d billing_cycle_anchor=now \
  -d proration_behavior=create_prorations
```

```cli
stripe subscriptions update sub_49ty4767H20z6a \
  --billing-cycle-anchor=now \
  --proration-behavior=create_prorations
```

```ruby
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = Stripe::StripeClient.new("<<YOUR_SECRET_KEY>>")

subscription = client.v1.subscriptions.update(
  'sub_49ty4767H20z6a',
  {
    billing_cycle_anchor: 'now',
    proration_behavior: 'create_prorations',
  },
)
```

```python
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = StripeClient("<<YOUR_SECRET_KEY>>")

# For SDK versions 12.4.0 or lower, remove '.v1' from the following line.
subscription = client.v1.subscriptions.update(
  "sub_49ty4767H20z6a",
  {"billing_cycle_anchor": "now", "proration_behavior": "create_prorations"},
)
```

```php
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
$stripe = new \Stripe\StripeClient('<<YOUR_SECRET_KEY>>');

$subscription = $stripe->subscriptions->update(
  'sub_49ty4767H20z6a',
  [
    'billing_cycle_anchor' => 'now',
    'proration_behavior' => 'create_prorations',
  ]
);
```

```java
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
StripeClient client = new StripeClient("<<YOUR_SECRET_KEY>>");

SubscriptionUpdateParams params =
  SubscriptionUpdateParams.builder()
    .setBillingCycleAnchor(SubscriptionUpdateParams.BillingCycleAnchor.NOW)
    .setProrationBehavior(SubscriptionUpdateParams.ProrationBehavior.CREATE_PRORATIONS)
    .build();

// For SDK versions 29.4.0 or lower, remove '.v1()' from the following line.
Subscription subscription =
  client.v1().subscriptions().update("sub_49ty4767H20z6a", params);
```

```node
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require("stripe")("<<YOUR_SECRET_KEY>>");

const subscription = await stripe.subscriptions.update("sub_49ty4767H20z6a", {
  billing_cycle_anchor: "now",
  proration_behavior: "create_prorations",
});
```

```dotnet
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
var options = new SubscriptionUpdateOptions
{
    BillingCycleAnchor = SubscriptionBillingCycleAnchor.Now,
    ProrationBehavior = "create_prorations",
};
var client = new StripeClient("<<YOUR_SECRET_KEY>>");
var service = client.V1.Subscriptions;
Subscription subscription = service.Update("sub_49ty4767H20z6a", options);
```

```go
params := &stripe.SubscriptionParams{
  BillingCycleAnchor: stripe.String("now"),
  ProrationBehavior: stripe.String("create_prorations"),
};
result, _ := subscription.Update("sub_49ty4767H20z6a", params);
```

#### Dashboard

1. From the [Subscriptions overview](https://docs.stripe.com/api/subscriptions.md), click the overflow menu ⋯ and choose **Update subscription**.
1. Scroll to **Advanced options** and select **Reset the billing cycle**.
1. Select the **Prorate changes** toggle to prevent overcharging for the days already paid from the previous cycle.
1. Click **Update subscription**.

### Change the billing period using a trial period

You can change the billing cycle anchor by using a [free trial](https://docs.stripe.com/billing/subscriptions/trials.md) to automatically set the billing cycle anchor date to the `trial_end` date.

For example, if a customer has an active subscription originally set to bill next on 23 July, and on 15 July you introduce a trial period ending on 1 August:

- The customer receives a 0 USD Invoice on 15 July. They already paid until 23 July in the previous cycle, so the “free” period only applies to 24 July until 31 July.
- The customer isn’t billed on 23 July.
- The new cycle billed on 1 August is a full cycle at the normal rate, then again on the 1st of each month after that.

Optionally, you can prevent prorations when you update a subscription to start a trial by using `proration_behavior=none`. In most cases, if you’re using the trial period to change the billing period without issuing a prorated invoice, you disable proration because the length of the trial period accounts for the portion already paid from the previous billing period.

#### API

Call [update subscription](https://docs.stripe.com/api.md#update_subscription), setting `trial_end` to a Unix timestamp representing the end date for the trial and `proration_behavior` to `none`. Setting the `trial_end` sets the billing cycle anchor to the same date.

```curl
curl https://api.stripe.com/v1/subscriptions/sub_49ty4767H20z6a \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d trial_end=1627801200 \
  -d proration_behavior=none
```

```cli
stripe subscriptions update sub_49ty4767H20z6a \
  --trial-end=1627801200 \
  --proration-behavior=none
```

```ruby
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = Stripe::StripeClient.new("<<YOUR_SECRET_KEY>>")

subscription = client.v1.subscriptions.update(
  'sub_49ty4767H20z6a',
  {
    trial_end: 1627801200,
    proration_behavior: 'none',
  },
)
```

```python
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = StripeClient("<<YOUR_SECRET_KEY>>")

# For SDK versions 12.4.0 or lower, remove '.v1' from the following line.
subscription = client.v1.subscriptions.update(
  "sub_49ty4767H20z6a",
  {"trial_end": 1627801200, "proration_behavior": "none"},
)
```

```php
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
$stripe = new \Stripe\StripeClient('<<YOUR_SECRET_KEY>>');

$subscription = $stripe->subscriptions->update(
  'sub_49ty4767H20z6a',
  [
    'trial_end' => 1627801200,
    'proration_behavior' => 'none',
  ]
);
```

```java
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
StripeClient client = new StripeClient("<<YOUR_SECRET_KEY>>");

SubscriptionUpdateParams params =
  SubscriptionUpdateParams.builder()
    .setTrialEnd(1627801200L)
    .setProrationBehavior(SubscriptionUpdateParams.ProrationBehavior.NONE)
    .build();

// For SDK versions 29.4.0 or lower, remove '.v1()' from the following line.
Subscription subscription =
  client.v1().subscriptions().update("sub_49ty4767H20z6a", params);
```

```node
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require("stripe")("<<YOUR_SECRET_KEY>>");

const subscription = await stripe.subscriptions.update("sub_49ty4767H20z6a", {
  trial_end: 1627801200,
  proration_behavior: "none",
});
```

```go
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
sc := stripe.NewClient("<<YOUR_SECRET_KEY>>")
params := &stripe.SubscriptionUpdateParams{
  TrialEnd: stripe.Int64(1627801200),
  ProrationBehavior: stripe.String("none"),
}
result, err := sc.V1Subscriptions.Update(context.TODO(), "sub_49ty4767H20z6a", params)
```

```dotnet
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
var options = new SubscriptionUpdateOptions
{
    TrialEnd = DateTimeOffset.FromUnixTimeSeconds(1627801200).UtcDateTime,
    ProrationBehavior = "none",
};
var client = new StripeClient("<<YOUR_SECRET_KEY>>");
var service = client.V1.Subscriptions;
Subscription subscription = service.Update("sub_49ty4767H20z6a", options);
```

#### Dashboard

1. From the [Subscriptions overview](https://docs.stripe.com/api/subscriptions.md), select the subscription you want to change to open its Details page.
1. Click **Actions** > **Update subscription**.
1. Click **Add trial** and enter the number of days of the trial. The end of the trial becomes the new billing cycle anchor date.
1. Deselect the **Prorate changes** toggle to prevent crediting the customer for already paid days.
1. Click **Update subscription**.

## Usage-based billing

With [usage-based billing](https://docs.stripe.com/products-prices/pricing-models.md), the price paid by the customer varies based on consumption during the billing period. When changing the billing period results in ending a subscription’s service period early, you charge the customer for the usage accrued during the shortened billing period.

### Thresholds

In addition to the regular cycle, you can configure subscriptions to bill whenever the amount due reaches a [threshold](https://docs.stripe.com/billing/subscriptions/usage-based/thresholds.md).

If you have a subscription configured to invoice this way, you can set it up to reset the subscription service period when it hits the threshold.

## See also

- [Using trial periods](https://docs.stripe.com/billing/subscriptions/trials.md)
- [Update Subscription](https://docs.stripe.com/api.md#update_subscription)
