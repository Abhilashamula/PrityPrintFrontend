---
name: kiosk-ux
description: "Use when designing or implementing Ping & Print kiosk screens, touch interactions, mobile QR upload, voice prompts, accessibility, idle reset, or print-status states."
argument-hint: "Describe the kiosk screen or interaction to design"
---

# Kiosk UX

1. Design the 21-24 inch landscape kiosk first, then adapt the same flow to mobile portrait.
2. Keep primary actions at least 48px and make the current step, price, and next action obvious at a distance.
3. Include text equivalents for audio, a mute control, focus management, keyboard access, and reduced-motion behavior.
4. Define explicit loading, retry, offline, paper-out, printer-jam, refund, completion, and session-timeout states.
5. Reset abandoned kiosk sessions after a documented timeout and delete temporary upload state.
6. Test with Playwright at a 1080p landscape viewport and a narrow mobile viewport.

Do not add an OTP or manual print-release interaction. The UI displays backend status; it does not decide whether a job may print.
