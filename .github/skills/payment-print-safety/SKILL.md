---
name: payment-print-safety
description: "Use when implementing Razorpay payments, webhooks, order state transitions, print queues, paper availability, printer failures, refunds, idempotency, or the payment-to-print trigger."
argument-hint: "Describe the payment or printer workflow change"
---

# Payment and Print Safety

1. Model the order and print job state transitions before writing handlers.
2. Create Razorpay orders on the server and verify payment signatures and webhook signatures server-side.
3. Store webhook event IDs and use idempotency keys so retries cannot create duplicate payments, print jobs, or refunds.
4. Check printer health and paper count before payment creation, then check again before print submission.
5. On verified payment, enqueue printing directly. Do not introduce OTP, release codes, or browser-only triggers.
6. Poll printer status through an adapter and record submitted, printed, failed, and unprinted pages.
7. Refund only the unprinted portion when telemetry is trustworthy; otherwise mark the case for operator review rather than guessing.
8. Test duplicate webhooks, refreshes, offline printers, paper-out, jams, partial output, and failed refunds.

The browser may show status but must never be the authority for payment, printing, refunds, or paper availability.
