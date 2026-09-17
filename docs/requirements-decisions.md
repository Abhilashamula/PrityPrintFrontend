# Initial Product Decisions

- Each uploaded file is a separate print job. This simplifies pricing, retries, status, and refunds.
- Printing begins only after a verified server-side Razorpay payment event. There is no OTP, release code, or manual confirmation step.
- The backend rejects payment creation when the printer reports zero paper, even if the frontend has stale status.
- A printer jam records printed and unprinted pages. Refund calculations remain pending until printer telemetry is reliable enough to determine the unprinted count.
- The kiosk receives a signed session token and a `kiosk_id`; the browser must not be trusted to identify a machine by itself.
- Phone number collection is optional and consent-based. Razorpay metadata is not treated as a guaranteed source of contact information.
- A printer simulator is required before integrating physical hardware.
