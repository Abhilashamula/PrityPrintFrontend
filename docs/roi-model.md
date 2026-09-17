# Ping & Print ROI Model

This is an indicative India model in INR, not a supplier quotation. Replace the assumptions with local paper, ink, rent, electricity, SMS, and printer prices before committing capital.

## Recommended starting prices

- Black and white A4: **Rs. 3 per page**
- Colour A4: **Rs. 10 per page**
- Double-sided: charge per printed side, with a small paper saving retained as margin
- Minimum order: **Rs. 20** to prevent payment and SMS costs from dominating very small orders

Do not advertise these prices until nearby print shops and the campus operator have been checked.

## Base assumptions

- 6,000 printed pages/month: 75% B&W and 25% colour
- 20% of pages are in separate jobs; SMS cost is modelled at Rs. 0.35/job
- Paper: Rs. 0.45/page
- B&W ink/toner: Rs. 0.35/page
- Colour ink: Rs. 2.40/page
- Maintenance allowance: Rs. 0.18/page
- Razorpay domestic payment cost: 2% plus 18% GST on that fee, modelled as 2.36% of sales
- Fixed operating cost: Rs. 6,500/month for connectivity, electricity, maintenance reserve, domain, and basic alerts
- Initial kiosk investment: Rs. 1,80,000

## Base-case result

| Metric | Estimate |
|---|---:|
| Monthly revenue | Rs. 28,500 |
| Monthly variable cost | Rs. 10,048 |
| Monthly fixed cost | Rs. 6,500 |
| Monthly operating profit | Rs. 11,952 |
| Annual operating profit | Rs. 1,43,429 |
| Payback period | 15.1 months |
| Two-year profit after initial investment | Rs. 1,06,858 |
| Two-year revenue | Rs. 6,84,000 |

The model reaches operating break-even at approximately 2,114 pages/month. To recover Rs. 1,80,000 within 24 months, target approximately **4,553 pages/month** under these assumptions.

## Volume sensitivity

| Pages/month | Monthly profit | Payback | Two-year result after Rs. 1.8 lakh investment |
|---:|---:|---:|---:|
| 3,000 | Rs. 2,726 | 66 months | Rs. -1,14,571 |
| 6,000 | Rs. 11,952 | 15.1 months | Rs. 1,06,858 |
| 10,000 | Rs. 24,254 | 7.4 months | Rs. 4,02,096 |

## Initial investment range

| Item | Lean estimate |
|---|---:|
| Colour duplex ink-tank printer | Rs. 25,000-45,000 |
| Kiosk PC or mini PC | Rs. 25,000-40,000 |
| 21-24 inch touchscreen/display | Rs. 20,000-35,000 |
| UPS, networking, cables | Rs. 10,000-20,000 |
| Kiosk enclosure, QR signage, installation | Rs. 30,000-60,000 |
| Spare ink, paper, and contingency | Rs. 20,000-35,000 |
| **Estimated cash investment** | **Rs. 1,30,000-2,35,000** |

Software cash cost can be near zero when self-built with free/local AI assistance. Outsourced development, rent/deposit, GST, and working capital are excluded.

## Printer recommendation

### Pilot choice: Epson EcoTank L6270/L6290 class

Choose a current model in this class only after confirming local availability and warranty. Required features are A4 colour, automatic duplex, Ethernet/Wi-Fi, an ink tank, and a duty cycle appropriate for the target volume. This gives the best chance of meeting the Rs. 3 B&W and Rs. 10 colour prices.

Use a local printer bridge that submits jobs through the operating system and reports spooler/printer status to the backend. Do not claim automatic page-level refunds until the exact model exposes reliable paper level, job progress, jam, and printed-page telemetry.

### Higher-reliability option: colour laser MFP

A Canon imageCLASS MF657Cdw-class or Brother colour laser MFP is more suitable for unattended duty and network printing, but consumables can make Rs. 3 B&W and Rs. 10 colour margins too thin. Obtain the actual toner yield and service contract before selecting it.

### Purchasing rule

Ask the vendor to demonstrate: duplex printing, network printing, paper-out reporting, jam reporting, job cancellation, page counters, and recovery after power loss. A printer with no reliable status interface cannot satisfy the automatic partial-refund requirement by itself.

## Costs not included in page margin

Razorpay transaction fees, SMS, rent, operator visits, taxes, paper wastage, replacement print heads/toner, and failed/refunded jobs can materially reduce ROI. Treat the 15-month payback as a base case, not a guarantee. Start with a 30-day pilot and measure pages, average order value, colour share, jams, and uptime before buying additional kiosks.
