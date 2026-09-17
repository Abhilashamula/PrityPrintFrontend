# Low-Cost Architecture

## Recommended first release

- **Frontend:** React + TypeScript + Vite, deployed to Cloudflare Pages or another static free tier.
- **Backend:** One TypeScript API, preferably Supabase Edge Functions or a small serverless endpoint.
- **Database:** Supabase Postgres free tier. Store orders, print jobs, webhook events, printer status, and refund records.
- **Files:** Private Supabase Storage bucket with short-lived signed URLs and scheduled deletion.
- **Queue:** A `print_jobs` table with claimed timestamps and a small polling worker. Add Redis only after measured queue pressure.
- **Printer connection:** A tiny local printer bridge on the kiosk machine. It polls the API, talks to the printer, and sends status updates. The browser never talks directly to the printer.
- **Payments:** Razorpay hosted checkout and server-side webhooks. Razorpay production transactions and refunds are not assumed to be free.
- **SMS:** Begin with a development logger/mock. Add an Indian SMS provider only when the operator supplies credentials and accepts the per-message cost.
- **Monitoring:** Provider logs plus a small `system_events` table. Add a paid monitoring service only if the free logs are insufficient.

## Why this is low maintenance

This keeps the public site static, uses one database instead of several infrastructure services, avoids a message broker at small volume, and isolates the only hardware-specific code in a local bridge. Supabase and Cloudflare free tiers have quotas, so add quota alerts before production launch.

## Free or local AI model policy

AI is a development aid only; it is not part of the kiosk runtime. Use the free model available in the user's Antigravity account, or a local Ollama model such as a small Qwen Coder model when the machine can run it. Do not send student documents or payment data to an AI service. Keep model selection in the editor configuration rather than hard-coding a paid model into the repository.

## Minimum production safeguards

- Use environment variables for Razorpay and storage secrets.
- Verify Razorpay webhook signatures and deduplicate webhook event IDs.
- Enforce server-side file size, MIME, extension, and signature checks.
- Delete the source document after successful printing or a short expiry.
- Back up order and payment records, but never back up document contents by default.
- Add a health endpoint and alert when the printer bridge has not checked in.
- Confirm that the selected printer exposes paper level, job progress, and failure status before promising automatic partial refunds.

## Explicit non-goals for version one

Do not add a native mobile app, Kubernetes, a separate analytics warehouse, custom card handling, a large admin dashboard, or a multi-printer orchestration layer until usage proves they are needed.

## Monochrome printer shortlist for the kiosk

The project is now **A4 B&W-only**. Prefer a business monochrome laser over an ink-tank printer: toner does not dry during idle periods, page cost is predictable, print speed is higher, and network-management alerts are usually better. Prices and availability change, so require a written Indian dealer quote and a live demonstration. Do not pay extra for A3, banner, photo, or specialty-media support.

### 1. Recommended underrated option: Kyocera ECOSYS P2040dn class

Target purchase range: approximately Rs. 25,000-40,000 depending on current stock, GST, warranty, and dealer. Typical configuration is a 250-sheet cassette plus multipurpose feed, with an optional feeder available on compatible configurations. It is a 40 ppm-class network monochrome laser with high-yield TK-series toner and a high monthly duty rating.

Why it fits: Kyocera ECOSYS models are often overlooked compared with HP and Canon, but are designed for office volume, have economical long-life consumables, Ethernet, duplex, and SNMP/device-management support. Confirm local Kyocera service and genuine toner pricing before purchase.

### 2. Best practical choice: Brother HL-L5210DN class

Target purchase range: approximately Rs. 25,000-45,000. Look for the standard 250-sheet cassette, multipurpose feed, optional high-capacity feeder, Ethernet, automatic duplex, and high-yield TN-series toner. It is a fast office monochrome laser with strong Windows/Linux driver support.

Why it fits: good availability, simple maintenance, high-yield toner options, network printing, and a practical upgrade path for additional paper capacity. Choose a higher Brother HL-L6xxx class if the pilot regularly exceeds 10,000 pages/month.

### 3. Canon imageCLASS LBP246dw class

Target purchase range: approximately Rs. 20,000-35,000 where available. It is a compact network duplex monochrome laser with a 250-sheet-class cassette and high-yield toner option. It is suitable for a lower-volume pilot, but confirm optional tray availability and local consumable pricing.

### 4. HP LaserJet Pro 4003dn class

Target purchase range: approximately Rs. 25,000-45,000. It is easy to source and manage, with Ethernet, duplex, and optional paper expansion on compatible configurations. It is a safe support choice, but genuine high-yield toner cost may be higher than Kyocera or Brother.

## Purchase acceptance test

Do not buy based on an online feature list alone. Ask the dealer to demonstrate the exact unit with a 50-100 page B&W duplex job and confirm:

- 250-sheet or larger main cassette, plus a manual/rear feed if available
- Ethernet connection and a stable Windows print driver
- automatic duplex on PDF and office documents
- recovery after paper-out, jam, and power interruption
- page counter and consumable level reporting
- job cancellation and spooler behaviour
- quoted black toner yield and price
- local service response time and printhead/toner warranty
- whether any SDK, SNMP, WSD, or printer-management interface exposes status

The bridge may use Windows spooler status initially, but the preferred device should also expose SNMP or a documented management interface for paper-out, cover-open, toner-low, offline, and jam alerts. Do not promise automatic page-level refunds until the exact printer exposes reliable printed-page and jam telemetry.

## Power-loss recovery design

Do not rely on the printer alone to resume a partially printed PDF. Use a UPS for the kiosk PC, printer, and network equipment. The bridge should persist a job checkpoint, split a job into page-range chunks, wait for the printer to become ready, and retry only the unconfirmed chunk. If the printer cannot report the last confirmed page, mark the job as `unknown_after_power_loss` and require operator review rather than risking duplicate pages.

## Buying recommendation

For a first kiosk, quote the Kyocera ECOSYS P2040dn class and Brother HL-L5210DN class in parallel. Choose the unit with the better local service contract, genuine high-yield toner price, SNMP alert support, and confirmed optional paper feeder, not merely the lowest online price. Start with one printer and a 30-day pilot at 4,500-6,000 pages/month before adding a second unit.
