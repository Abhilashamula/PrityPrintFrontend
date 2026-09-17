-- Store the requested physical sheet size so the printer bridge can fit pages
-- to the correct media without stretching or silently falling back to A4.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS paper_size VARCHAR(2) NOT NULL DEFAULT 'A4'
    CHECK (paper_size IN ('A4', 'A6')),
  ADD COLUMN IF NOT EXISTS paper_width_mm INTEGER NOT NULL DEFAULT 210,
  ADD COLUMN IF NOT EXISTS paper_height_mm INTEGER NOT NULL DEFAULT 297;