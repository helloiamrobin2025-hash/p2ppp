# TODO

## EmailJS setup
- Add values to .env.local for EmailJS service, public key, and templates.
- Align template variables with EmailJS templates (welcome, login, transfer).

## Supabase setup
- Run supabase/schema.sql in Supabase SQL editor.
- Create .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
- Verify RLS policies and RPC access for transfer_balance.

## Auth flows
- Add password reset flow and connect EmailJS notifications.
- Add security change alerts (email/2FA/withdrawal allowlist updates).
- Add auth guard for /portfolio and P2P transfer actions.

## P2P and wallet
- Add balances view for selected token/chain.
- Add transfer history panel (p2p_transfers).
- Add escrow and dispute workflows (UI + states).

## Markets
- Add search + sort persistence in URL.
- Add pair details page with depth and order flow.

## QA
- Test signup, login, and transfer with real data.
- Verify Binance rate limits for markets + sparklines.
