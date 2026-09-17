-- Ping & Print Seed Data
-- Version: seed.sql

-- 1. Default Kiosk
INSERT INTO kiosks (id, name, location, status, paper_count)
VALUES (
  'kiosk_001',
  'Main Campus Library Kiosk',
  'Ground Floor - Central Library',
  'online',
  500
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location;

-- 2. Default Pricing Configuration
INSERT INTO pricing_config (key, value, description)
VALUES
  ('price_bw_per_page', '2.00', 'Cost in INR for 1 B&W printed page'),
  ('price_color_per_page', '10.00', 'Cost in INR for 1 Color printed page'),
  ('max_file_mb', '20', 'Maximum allowed file upload size in megabytes')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value;

