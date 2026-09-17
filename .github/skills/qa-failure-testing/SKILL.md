---
name: qa-failure-testing
description: "Use when testing Ping & Print end-to-end, writing Playwright tests, validating responsive kiosk screens, simulating payment failures, printer jams, paper-out, refunds, and session recovery."
argument-hint: "Describe the workflow or failure scenario to test"
---

# QA and Failure Testing

1. Run the frontend against fake payment, storage, SMS, and printer adapters before using live providers.
2. Cover the happy path from upload through verified payment and automatic printing without any OTP screen.
3. Cover duplicate webhook delivery, browser refresh, abandoned sessions, unsupported files, conversion failure, and network interruption.
4. Simulate zero paper before payment and confirm the backend rejects payment creation, not only the UI button.
5. Simulate a jam after partial output and confirm printed/unprinted pages and refund behavior are recorded.
6. Verify mobile portrait and 1080p kiosk landscape layouts, touch target sizes, keyboard navigation, captions, and focus order.
7. Keep tests deterministic with fixed order IDs, fake clocks, and a printer simulator.
