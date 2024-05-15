const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2020-03-02',
  maxNetworkRetries: 2,
});

const inventory = require('./data/products.json');

exports.handler = async (event) => {
  const { sku, quantity } = JSON.parse(event.body);
  const product = inventory.find((p) => p.sku === sku);
  const validatedQuantity = quantity > 0 && quantity < 11 ? quantity : 1;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    billing_address_collection: 'auto',
    shipping_address_collection: {
      allowed_countries: ['US', 'CA'],
    },
    shipping_options: [
      {
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: {
          amount: 300,
          currency: 'usd',
        },
        display_name: 'USPS Media',
        delivery_estimate: {
          minimum: {
            unit: 'business_day',
            value: 3,
          },
          maximum: {
            unit: 'business_day',
            value: 10,
          },
        },
      },
    },
  ],
    line_items: [
      {
        name: product.name,
        description: product.description,
        images: [product.image],
        amount: product.amount,
        currency: product.currency,
        quantity: validatedQuantity,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.URL}/success.html`,
    cancel_url: process.env.URL,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      sessionId: session.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    }),
  };
};