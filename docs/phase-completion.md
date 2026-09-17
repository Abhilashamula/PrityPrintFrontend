# Phase Completion Status

## Complete without Razorpay credentials

- Welcome screen with audio caption and mute control
- Kiosk and mobile-responsive upload flow
- File size, extension, MIME, and basic signature validation
- PDF page count and first-page preview
- Print options, page-range validation, pricing, and summary
- Kiosk ID query parameter support
- Paper-low and paper-out UI states
- Server-shaped local order service
- Payment-gated local print queue
- Cancellable printer simulator
- Normal, offline, paper-out, and jam simulation modes
- Page progress, partial output, error, refund placeholder, and session timeout screens
- Automatic cleanup of completed/error sessions in the kiosk UI
- Local development environment with no paid runtime dependency

## Intentionally deferred

- Razorpay server order creation
- Razorpay Checkout credentials
- Razorpay signature verification
- Razorpay webhook endpoint and idempotency store
- Production database persistence
- Private object storage upload and server-side document conversion
- SMS provider integration
- Physical printer bridge and model-specific telemetry

## How to run the local flow

```powershell
Copy-Item .env.example .env
npm run dev
```

For failure testing, set `VITE_PRINTER_SIM_MODE` in `.env` to `offline`, `paper_out`, `jam_before_print`, or `jam_after_40_percent` and restart Vite.

The current local payment button is a development-only payment substitute. It must be replaced with a server-created Razorpay order and verified webhook before accepting real money.