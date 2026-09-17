-- Ping & Print Database Migration
-- Version: 001_initial.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Kiosks Table
CREATE TABLE IF NOT EXISTS kiosks (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  status VARCHAR(32) NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'error')),
  paper_count INTEGER NOT NULL DEFAULT 500 CHECK (paper_count >= 0),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Pricing Configuration Table
CREATE TABLE IF NOT EXISTS pricing_config (
  key VARCHAR(64) PRIMARY KEY,
  value VARCHAR(255) NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kiosk_id VARCHAR(64) REFERENCES kiosks(id) ON DELETE SET NULL,
  phone VARCHAR(32),
  file_name VARCHAR(255) NOT NULL,
  file_storage_path TEXT,
  file_size INTEGER,
  page_count INTEGER NOT NULL CHECK (page_count > 0),
  copies INTEGER NOT NULL DEFAULT 1 CHECK (copies > 0),
  orientation VARCHAR(16) NOT NULL DEFAULT 'portrait' CHECK (orientation IN ('portrait', 'landscape')),
  sides VARCHAR(16) NOT NULL DEFAULT 'single' CHECK (sides IN ('single', 'double')),
  color_mode VARCHAR(16) NOT NULL DEFAULT 'bw' CHECK (color_mode IN ('bw', 'color')),
  page_range VARCHAR(32) NOT NULL DEFAULT 'all',
  custom_page_range TEXT,
  total_pages_to_print INTEGER NOT NULL CHECK (total_pages_to_print > 0),
  unit_price_bw DECIMAL(10, 2) NOT NULL,
  unit_price_color DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  currency VARCHAR(8) NOT NULL DEFAULT 'INR',
  status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'printing', 'done', 'failed', 'refunded')),
  razorpay_order_id VARCHAR(128),
  razorpay_payment_id VARCHAR(128),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Print Jobs Table (Direct queue polled by printer bridge)
CREATE TABLE IF NOT EXISTS print_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  kiosk_id VARCHAR(64) NOT NULL REFERENCES kiosks(id) ON DELETE CASCADE,
  printer_job_id VARCHAR(128),
  status VARCHAR(32) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'printing', 'done', 'jammed', 'failed')),
  pages_printed INTEGER NOT NULL DEFAULT 0 CHECK (pages_printed >= 0),
  pages_total INTEGER NOT NULL CHECK (pages_total > 0),
  claimed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Webhook Events Table (For Razorpay deduplication)
CREATE TABLE IF NOT EXISTS webhook_events (
  id VARCHAR(255) PRIMARY KEY,
  event_type VARCHAR(128) NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. System Events Table (For paper-low alerts, printer jams, auto-refunds)
CREATE TABLE IF NOT EXISTS system_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kiosk_id VARCHAR(64) REFERENCES kiosks(id) ON DELETE SET NULL,
  event_type VARCHAR(64) NOT NULL,
  severity VARCHAR(16) NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_kiosk ON orders(kiosk_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_print_jobs_order ON print_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_print_jobs_queued ON print_jobs(kiosk_id, status) WHERE status = 'queued';

-- Setup Supabase Storage Bucket for Documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Row Level Security (RLS) Policies
ALTER TABLE kiosks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;

-- Allow public read access to pricing_config and kiosk status
CREATE POLICY "Allow public read access to pricing" ON pricing_config FOR SELECT USING (true);
CREATE POLICY "Allow public read access to kiosk status" ON kiosks FOR SELECT USING (true);

-- Allow public insert to orders
CREATE POLICY "Allow public insert to orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select orders by id" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public select print_jobs by order" ON print_jobs FOR SELECT USING (true);

-- Trigger for auto updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_kiosks_updated_at BEFORE UPDATE ON kiosks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_print_jobs_updated_at BEFORE UPDATE ON print_jobs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

