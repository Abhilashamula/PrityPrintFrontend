# Ping & Print Project Instructions

## Product boundary

Build a kiosk-first print flow: welcome -> upload -> options -> summary -> Razorpay payment -> automatic printing. There must be no OTP screen, OTP endpoint, or manual release step.

## Cost and maintenance constraints

- Prefer free-tier or self-hostable services and small dependencies.
- Prefer TypeScript, browser-native APIs, and managed services with a simple dashboard.
- Do not add Redis, Kubernetes, a paid AI API, or a separate microservice unless a measured requirement justifies it.
- Use a database-backed job queue with polling for the first production version.
- Keep the frontend deployable as a static site and keep secrets on the server side.
- Use free/local AI models when available; never make a paid model or API a runtime dependency.

## Architecture rules

- The backend is authoritative for payment, printer availability, order state, refunds, and document deletion.
- A browser payment callback is not sufficient to start printing. Verify Razorpay server-side and handle the webhook idempotently.
- Recheck paper availability immediately before payment creation and again before submitting a print job.
- Use an adapter for the printer so a simulator can be used in development.
- Persist an explicit order state and make every payment, print, refund, and webhook operation idempotent.
- Treat each uploaded file as a separate print job in the first release.
- Never store card data, expose private document URLs, or retain documents longer than necessary.

## Frontend rules

- Optimize for 21-24 inch landscape touchscreens and responsive mobile QR upload.
- Keep interactive targets at least 48px, with visible focus states and readable contrast.
- Provide a text equivalent for every voice prompt and a visible mute control.
- Include loading, retry, offline, paper-out, jam, partial-print, refund, and session-timeout states.
- Do not use decorative UI that obscures the print status or primary action.

## Delivery rules

- Start with mocked Razorpay and printer services, then integrate real providers behind the same interfaces.
- Add tests for duplicate webhooks, refreshes, paper-out, printer jams, partial printing, and failed refunds.
- Prefer small focused changes and document assumptions in `docs/`.
