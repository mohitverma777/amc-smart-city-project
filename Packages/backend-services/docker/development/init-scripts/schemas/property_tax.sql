-- Property tax related tables
\c amc_smart_city;

-- Create property type enum
CREATE TYPE property_type AS ENUM (
  'residential',
  'commercial',
  'industrial',
  'institutional'
);

-- Create property usage enum
CREATE TYPE property_usage AS ENUM (
  'self_occupied',
  'rented',
  'vacant',
  'mixed'
);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id VARCHAR(20) UNIQUE NOT NULL,
  owner_citizen_id VARCHAR(20) NOT NULL,
  property_type property_type NOT NULL,
  usage_type property_usage NOT NULL,
  area_sqft DECIMAL(10,2) NOT NULL,
  built_up_area DECIMAL(10,2),
  address JSONB NOT NULL,
  ward VARCHAR(50) NOT NULL,
  zone VARCHAR(20) NOT NULL,
  coordinates JSONB,
  construction_year INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tax assessments table
CREATE TABLE IF NOT EXISTS tax_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  financial_year VARCHAR(9) NOT NULL, -- Format: 2023-2024
  annual_rental_value DECIMAL(12,2) NOT NULL,
  tax_rate DECIMAL(5,4) NOT NULL,
  base_tax DECIMAL(12,2) NOT NULL,
  education_cess DECIMAL(12,2) DEFAULT 0,
  fire_tax DECIMAL(12,2) DEFAULT 0,
  water_tax DECIMAL(12,2) DEFAULT 0,
  sewerage_tax DECIMAL(12,2) DEFAULT 0,
  total_tax DECIMAL(12,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  final_amount DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(property_id, financial_year)
);

-- Create payments table
CREATE TABLE IF NOT EXISTS property_tax_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES tax_assessments(id) ON DELETE CASCADE,
  payment_id VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_gateway VARCHAR(50),
  gateway_transaction_id VARCHAR(100),
  payment_date TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'completed',
  receipt_number VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tax rates table
CREATE TABLE IF NOT EXISTS tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_type property_type NOT NULL,
  usage_type property_usage NOT NULL,
  zone VARCHAR(20) NOT NULL,
  rate_percentage DECIMAL(5,4) NOT NULL,
  effective_from DATE NOT NULL,
  effective_until DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default tax rates
INSERT INTO tax_rates (property_type, usage_type, zone, rate_percentage, effective_from) VALUES
('residential', 'self_occupied', 'Zone-A', 0.0800, '2023-04-01'),
('residential', 'rented', 'Zone-A', 0.1200, '2023-04-01'),
('commercial', 'self_occupied', 'Zone-A', 0.1500, '2023-04-01'),
('commercial', 'rented', 'Zone-A', 0.2000, '2023-04-01'),
('industrial', 'self_occupied', 'Zone-A', 0.2500, '2023-04-01'),
('residential', 'self_occupied', 'Zone-B', 0.0600, '2023-04-01'),
('residential', 'rented', 'Zone-B', 0.1000, '2023-04-01'),
('commercial', 'self_occupied', 'Zone-B', 0.1300, '2023-04-01'),
('commercial', 'rented', 'Zone-B', 0.1800, '2023-04-01');

-- Create indexes
CREATE INDEX idx_properties_property_id ON properties(property_id);
CREATE INDEX idx_properties_owner_citizen_id ON properties(owner_citizen_id);
CREATE INDEX idx_properties_ward ON properties(ward);
CREATE INDEX idx_properties_zone ON properties(zone);
CREATE INDEX idx_tax_assessments_property_id ON tax_assessments(property_id);
CREATE INDEX idx_tax_assessments_financial_year ON tax_assessments(financial_year);
CREATE INDEX idx_tax_assessments_due_date ON tax_assessments(due_date);
CREATE INDEX idx_tax_assessments_is_paid ON tax_assessments(is_paid);
CREATE INDEX idx_property_tax_payments_assessment_id ON property_tax_payments(assessment_id);
CREATE INDEX idx_property_tax_payments_payment_date ON property_tax_payments(payment_date);

-- Add triggers
CREATE TRIGGER update_properties_updated_at 
  BEFORE UPDATE ON properties 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_assessments_updated_at 
  BEFORE UPDATE ON tax_assessments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();