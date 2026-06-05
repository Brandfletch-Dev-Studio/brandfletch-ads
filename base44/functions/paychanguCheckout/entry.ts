import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount, currency, tx_ref, description, callback_url, return_url } = await req.json();

    const secretKey = Deno.env.get('PAYCHANGU_SECRET_KEY');
    if (!secretKey) return Response.json({ error: 'Paychangu not configured' }, { status: 500 });

    const nameParts = (user.full_name || 'User').split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || '';

    const payload = {
      amount: String(amount),
      currency: currency || 'MWK',
      tx_ref,
      first_name: firstName,
      last_name: lastName,
      email: user.email,
      callback_url,
      return_url,
      customization: {
        title: 'Brandfletch Media',
        description: description || 'Payment',
      },
    };

    const response = await fetch('https://api.paychangu.com/payment', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secretKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.status !== 'success') {
      return Response.json({ error: data.message || 'Payment initiation failed' }, { status: 400 });
    }

    const checkoutUrl = data.data?.checkout_url || data.checkout_url;
    const txRefOut = data.data?.tx_ref || tx_ref;

    return Response.json({
      checkout_url: checkoutUrl,
      tx_ref: txRefOut,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});