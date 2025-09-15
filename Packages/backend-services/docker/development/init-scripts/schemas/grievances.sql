-- Connect to grievances database
\c amc_smart_city;

-- Create grievance categories enum
CREATE TYPE grievance_category AS ENUM (
  'roads',
  'water',
  'sanitation', 
  'electricity',
  'waste',
  'other'
);

-- Create grievance priority enum
CREATE TYPE grievance_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Create grievance status enum
CREATE TYPE grievance_status AS ENUM (
  'submitted',
  'acknowledged',
  'in_progress',
  'resolved',
  'closed'
);

-- Create grievances table
CREATE TABLE IF NOT EXISTS grievances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category grievance_category NOT NULL,
  priority grievance_priority DEFAULT 'medium',
  status grievance_status DEFAULT 'submitted',
  location JSONB,
  attachments TEXT[],
  assigned_to VARCHAR(50),
  ward VARCHAR(50) NOT NULL,
  estimated_resolution_date TIMESTAMP,
  actual_resolution_date TIMESTAMP,
  feedback JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create status history table
CREATE TABLE IF NOT EXISTS grievance_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grievance_id UUID NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
  status grievance_status NOT NULL,
  updated_by VARCHAR(50) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE IF NOT EXISTS grievance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO grievance_categories (name, description) VALUES
('roads', 'Issues related to roads, potholes, street lighting'),
('water', 'Water supply issues, leakages, quality problems'),
('sanitation', 'Waste collection, cleanliness, drainage'),
('electricity', 'Street lighting, electrical faults'),
('waste', 'Garbage collection, disposal issues'),
('other', 'Other civic issues not covered in above categories');

-- Create indexes
CREATE INDEX idx_grievances_citizen_id ON grievances(citizen_id);
CREATE INDEX idx_grievances_status ON grievances(status);
CREATE INDEX idx_grievances_category ON grievances(category);
CREATE INDEX idx_grievances_ward ON grievances(ward);
CREATE INDEX idx_grievances_created_at ON grievances(created_at);
CREATE INDEX idx_grievances_assigned_to ON grievances(assigned_to);
CREATE INDEX idx_grievance_status_history_grievance_id ON grievance_status_history(grievance_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_grievances_updated_at 
  BEFORE UPDATE ON grievances 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();