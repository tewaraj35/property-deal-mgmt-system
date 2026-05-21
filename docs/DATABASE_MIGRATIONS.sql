/**
 * DATABASE MIGRATIONS FOR NESH PROPERTY MANAGEMENT SYSTEM
 * Execute these SQL commands in Supabase SQL Editor
 *
 * This file contains all necessary database schema for the modernized system
 * Phase 3: Database Schema Migration
 */

-- ============================================================================
-- ENABLE EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  role VARCHAR(50) CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'AGENT')) NOT NULL DEFAULT 'AGENT',
  status VARCHAR(50) CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')) DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE,
  managed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,

  CONSTRAINT email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================================================
-- BUYERS TABLE (Migrated from callproperty)
-- ============================================================================

CREATE TABLE IF NOT EXISTS buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  location VARCHAR(255),
  property_of_interest VARCHAR(255),
  lead_source VARCHAR(255),
  follow_up_date DATE,
  status VARCHAR(50) CHECK (status IN ('NEW', 'ACTIVE', 'CONVERTED', 'LOST', 'INACTIVE')) DEFAULT 'NEW',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT phone_format CHECK (phone_number ~ '^\+?[0-9\-\s\(\)]{10,}$')
);

CREATE INDEX idx_buyers_agent_id ON buyers(agent_id);
CREATE INDEX idx_buyers_status ON buyers(status);
CREATE INDEX idx_buyers_created_at ON buyers(created_at);
CREATE INDEX idx_buyers_phone ON buyers(phone_number);
CREATE INDEX idx_buyers_deleted_at ON buyers(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- SELLERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  location VARCHAR(255),
  property_details VARCHAR(255),
  lead_source VARCHAR(255),
  follow_up_date DATE,
  status VARCHAR(50) CHECK (status IN ('NEW', 'ACTIVE', 'SOLD', 'LOST', 'INACTIVE')) DEFAULT 'NEW',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT phone_format CHECK (phone_number ~ '^\+?[0-9\-\s\(\)]{10,}$')
);

CREATE INDEX idx_sellers_agent_id ON sellers(agent_id);
CREATE INDEX idx_sellers_status ON sellers(status);
CREATE INDEX idx_sellers_created_at ON sellers(created_at);
CREATE INDEX idx_sellers_phone ON sellers(phone_number);
CREATE INDEX idx_sellers_deleted_at ON sellers(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- RENTERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS renters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  tenant_name VARCHAR(255) NOT NULL,
  property_address VARCHAR(255) NOT NULL,
  monthly_rent DECIMAL(12, 2),
  rent_due_date DATE,
  tenant_contact VARCHAR(20),
  status VARCHAR(50) CHECK (status IN ('ACTIVE', 'INACTIVE', 'EVICTED', 'MOVED_OUT')) DEFAULT 'ACTIVE',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT rent_positive CHECK (monthly_rent >= 0)
);

CREATE INDEX idx_renters_agent_id ON renters(agent_id);
CREATE INDEX idx_renters_status ON renters(status);
CREATE INDEX idx_renters_created_at ON renters(created_at);
CREATE INDEX idx_renters_deleted_at ON renters(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- LOAN CLIENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS loan_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  client_name VARCHAR(255) NOT NULL,
  income DECIMAL(15, 2),
  loan_type VARCHAR(255),
  loan_amount DECIMAL(15, 2),
  bank_name VARCHAR(255),
  banker_name VARCHAR(255),
  status VARCHAR(50) CHECK (status IN ('NEW', 'PROCESSING', 'APPROVED', 'REJECTED', 'CLOSED')) DEFAULT 'NEW',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT income_positive CHECK (income >= 0),
  CONSTRAINT loan_amount_positive CHECK (loan_amount >= 0)
);

CREATE INDEX idx_loan_clients_agent_id ON loan_clients(agent_id);
CREATE INDEX idx_loan_clients_status ON loan_clients(status);
CREATE INDEX idx_loan_clients_created_at ON loan_clients(created_at);
CREATE INDEX idx_loan_clients_deleted_at ON loan_clients(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(255) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT valid_action CHECK (
    action IN (
      'CREATE', 'READ', 'UPDATE', 'DELETE',
      'LOGIN', 'LOGOUT', 'UPDATE_PROFILE', 'CHANGE_PASSWORD',
      'ASSIGN_ROLE', 'SUSPEND_USER', 'ACTIVATE_USER'
    )
  )
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- FILE UPLOADS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('buyer', 'seller', 'renter', 'loan_client')),
  entity_id VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(512) NOT NULL,
  file_size_bytes INTEGER CHECK (file_size_bytes > 0),
  mime_type VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  UNIQUE(entity_type, entity_id, file_name)
);

CREATE INDEX idx_file_uploads_uploaded_by_id ON file_uploads(uploaded_by_id);
CREATE INDEX idx_file_uploads_entity ON file_uploads(entity_type, entity_id);
CREATE INDEX idx_file_uploads_created_at ON file_uploads(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE renters ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SUPER ADMIN POLICIES (Full Access)
-- ============================================================================

CREATE POLICY super_admin_users_all ON users
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'SUPER_ADMIN')
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role = 'SUPER_ADMIN')
  );

CREATE POLICY super_admin_buyers_all ON buyers
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'SUPER_ADMIN')
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role = 'SUPER_ADMIN')
  );

CREATE POLICY super_admin_sellers_all ON sellers
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'SUPER_ADMIN')
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role = 'SUPER_ADMIN')
  );

CREATE POLICY super_admin_renters_all ON renters
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'SUPER_ADMIN')
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role = 'SUPER_ADMIN')
  );

CREATE POLICY super_admin_loan_clients_all ON loan_clients
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'SUPER_ADMIN')
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role = 'SUPER_ADMIN')
  );

CREATE POLICY super_admin_audit_logs_all ON audit_logs
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'SUPER_ADMIN')
  );

-- ============================================================================
-- ADMIN POLICIES (All Team Data)
-- ============================================================================

CREATE POLICY admin_buyers_all ON buyers
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN'))
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN'))
  );

CREATE POLICY admin_sellers_all ON sellers
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN'))
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN'))
  );

CREATE POLICY admin_renters_all ON renters
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN'))
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN'))
  );

CREATE POLICY admin_loan_clients_all ON loan_clients
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN'))
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN'))
  );

-- ============================================================================
-- AGENT POLICIES (Own Data Only)
-- ============================================================================

CREATE POLICY agent_buyers_own ON buyers
  FOR ALL USING (
    agent_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN'))
  )
  WITH CHECK (
    agent_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN'))
  );

CREATE POLICY agent_sellers_own ON sellers
  FOR ALL USING (
    agent_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN'))
  )
  WITH CHECK (
    agent_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN'))
  );

CREATE POLICY agent_renters_own ON renters
  FOR ALL USING (
    agent_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN'))
  )
  WITH CHECK (
    agent_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN'))
  );

CREATE POLICY agent_loan_clients_own ON loan_clients
  FOR ALL USING (
    agent_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN'))
  )
  WITH CHECK (
    agent_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN'))
  );

-- ============================================================================
-- AUDIT LOG & FILE POLICIES
-- ============================================================================

CREATE POLICY user_own_profile ON users
  FOR SELECT USING (
    id = auth.uid() OR
    auth.uid() IN (SELECT id FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN'))
  );

CREATE POLICY user_own_audit_logs ON audit_logs
  FOR SELECT USING (
    user_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN'))
  );

CREATE POLICY user_own_files ON file_uploads
  FOR ALL USING (
    uploaded_by_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN'))
  )
  WITH CHECK (
    uploaded_by_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN'))
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buyers_updated_at
  BEFORE UPDATE ON buyers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sellers_updated_at
  BEFORE UPDATE ON sellers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_renters_updated_at
  BEFORE UPDATE ON renters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loan_clients_updated_at
  BEFORE UPDATE ON loan_clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION FROM OLD SYSTEM
-- ============================================================================

-- If you have existing data in the old callproperty table, run:
-- INSERT INTO buyers (agent_id, name, phone_number, email, location, property_of_interest, lead_source, follow_up_date, status, notes, created_at, updated_at)
-- SELECT (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1), name, phone, email, location, property, source, followup, status, notes, created_at, updated_at
-- FROM callproperty;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================

-- Verify tables were created
SELECT * FROM information_schema.tables WHERE table_schema = 'public';

-- Create initial admin user (run manually after Supabase Auth user created)
-- WARNING: Only run once! Replace with actual values
-- INSERT INTO users (id, email, full_name, phone_number, role, status)
-- VALUES ('USER_ID_FROM_AUTH', 'admin@nesh.com', 'System Admin', '+6012345678', 'SUPER_ADMIN', 'ACTIVE');
