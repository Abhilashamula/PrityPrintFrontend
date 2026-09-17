# Phase 2: Print Engine

Phase 2 replaces the timer embedded in the printing screen with a reusable local printer simulator. It establishes the lifecycle that a real printer bridge will later report through the backend.

## Implemented

- `src/lib/printerSimulator.ts` owns queued, printing, completed, jammed, and failed transitions.
- Jobs are cancellable when the user leaves the screen or React unmounts the component.
- The screen consumes printer updates instead of owning timers.
- Simulation modes are configured with `VITE_PRINTER_SIM_MODE`:
  - `normal`
  - `offline`
  - `paper_out`
  - `jam_before_print`
  - `jam_after_40_percent`
- Partial progress is retained for jam scenarios and shown on the error/refund screen.

## Try the modes

Copy `.env.example` to `.env`, set the mode, and start the app. For example:

```text
VITE_PRINTER_SIM_MODE=jam_after_40_percent
```

The current browser-only payment simulation still starts this engine after the simulated payment. Phase 3 should replace order creation and payment verification with a server-side API. Phase 4 should replace the simulator import with authenticated backend job polling while keeping the same `JobStatus` lifecycle.

## Production boundary

The simulator is not a payment or printer authority. A production backend must verify Razorpay events, recheck paper availability, enqueue an idempotent print job, and let an authenticated kiosk bridge report hardware status. Automatic partial refunds must only use reliable printed-page telemetry.