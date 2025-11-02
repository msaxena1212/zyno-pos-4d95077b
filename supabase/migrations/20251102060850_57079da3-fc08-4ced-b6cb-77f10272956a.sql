-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create app_role enum
CREATE TYPE app_role AS ENUM ('admin', 'manager', 'assistant_manager', 'supervisor', 'cashier', 'stock_manager', 'finance_officer', 'marketing_manager', 'support');

-- Create brand_status enum
CREATE TYPE brand_status AS ENUM ('active', 'inactive', 'archived');

-- Create offer_type enum
CREATE TYPE offer_type AS ENUM ('percentage', 'fixed_amount', 'bogo', 'bundle', 'free_item', 'tiered', 'loyalty', 'cashback', 'flash');

-- Create offer_status enum
CREATE TYPE offer_status AS ENUM ('draft', 'submitted', 'approved', 'active', 'expired', 'archived');

-- Create workflow_task_type enum
CREATE TYPE workflow_task_type AS ENUM ('user_task', 'system_task', 'approval', 'notification');

-- Create workflow_task_status enum
CREATE TYPE workflow_task_status AS ENUM ('pending', 'in_progress', 'completed', 'escalated');

-- Create user_status enum
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');

-- Brands Table
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  status brand_status DEFAULT 'active',
  description TEXT,
  logo_url TEXT,
  primary_color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles Table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  status user_status DEFAULT 'active',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles Table
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  role_level INTEGER DEFAULT 0,
  status user_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, code)
);

-- Permissions Table
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  module_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role Permissions Mapping
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  conditions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- User Role Assignments
CREATE TABLE public.user_role_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.profiles(id),
  assigned_date TIMESTAMPTZ DEFAULT NOW(),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  status user_status DEFAULT 'active',
  UNIQUE(user_id, role_id, brand_id)
);

-- Offers Table
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  type offer_type NOT NULL,
  description TEXT,
  discount_value DECIMAL(10,2),
  discount_percentage DECIMAL(5,2),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  status offer_status DEFAULT 'draft',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  min_purchase_amount DECIMAL(10,2),
  max_discount_cap DECIMAL(10,2),
  usage_limit_per_customer INTEGER,
  total_usage_limit INTEGER,
  current_usage_count INTEGER DEFAULT 0,
  eligibility_rules JSONB,
  created_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Tasks Table
CREATE TABLE public.workflow_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID,
  task_name TEXT NOT NULL,
  task_type workflow_task_type NOT NULL,
  assigned_to_role_id UUID REFERENCES public.roles(id),
  assigned_to_user_id UUID REFERENCES public.profiles(id),
  approval_rule JSONB,
  escalation_rule JSONB,
  status workflow_task_status DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Audit Table
CREATE TABLE public.activity_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  action_type TEXT NOT NULL,
  module_name TEXT NOT NULL,
  resource_id UUID,
  resource_type TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_audit ENABLE ROW LEVEL SECURITY;

-- Security Definer Function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.code
  FROM public.user_role_assignments ura
  JOIN public.roles r ON r.id = ura.role_id
  WHERE ura.user_id = user_uuid
    AND ura.status = 'active'
    AND (ura.end_date IS NULL OR ura.end_date > NOW())
  ORDER BY r.role_level DESC
  LIMIT 1;
$$;

-- Security Definer Function to check if user has permission
CREATE OR REPLACE FUNCTION public.user_has_permission(user_uuid UUID, perm_code TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_role_assignments ura
    JOIN public.role_permissions rp ON rp.role_id = ura.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ura.user_id = user_uuid
      AND p.code = perm_code
      AND ura.status = 'active'
      AND (ura.end_date IS NULL OR ura.end_date > NOW())
  );
$$;

-- RLS Policies for Brands
CREATE POLICY "Brands are viewable by authenticated users"
  ON public.brands FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert brands"
  ON public.brands FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Only admins can update brands"
  ON public.brands FOR UPDATE
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for Profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "System can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for Roles
CREATE POLICY "Roles are viewable by authenticated users"
  ON public.roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins and managers can manage roles"
  ON public.roles FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for Permissions
CREATE POLICY "Permissions are viewable by authenticated users"
  ON public.permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage permissions"
  ON public.permissions FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for Role Permissions
CREATE POLICY "Role permissions are viewable by authenticated users"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage role permissions"
  ON public.role_permissions FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for User Role Assignments
CREATE POLICY "Users can view their own role assignments"
  ON public.user_role_assignments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Only admins and managers can assign roles"
  ON public.user_role_assignments FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Only admins and managers can update role assignments"
  ON public.user_role_assignments FOR UPDATE
  TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for Offers
CREATE POLICY "Offers are viewable by authenticated users"
  ON public.offers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Marketing managers and admins can create offers"
  ON public.offers FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'marketing_manager', 'manager'));

CREATE POLICY "Marketing managers and admins can update offers"
  ON public.offers FOR UPDATE
  TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('admin', 'marketing_manager', 'manager'));

-- RLS Policies for Workflow Tasks
CREATE POLICY "Users can view tasks assigned to them"
  ON public.workflow_tasks FOR SELECT
  TO authenticated
  USING (assigned_to_user_id = auth.uid() OR public.get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Managers and admins can create workflow tasks"
  ON public.workflow_tasks FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Assigned users can update their tasks"
  ON public.workflow_tasks FOR UPDATE
  TO authenticated
  USING (assigned_to_user_id = auth.uid() OR public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for Activity Audit
CREATE POLICY "Users can view their own audit logs"
  ON public.activity_audit FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "System can insert audit logs"
  ON public.activity_audit FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on auth user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflow_tasks_updated_at
  BEFORE UPDATE ON public.workflow_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default brand
INSERT INTO public.brands (name, code, status, description)
VALUES ('RetailPro', 'RETAIL_PRO', 'active', 'Default RetailPro Brand');

-- Insert default permissions
INSERT INTO public.permissions (name, code, module_name, action_type, description) VALUES
  ('View Dashboard', 'view_dashboard', 'dashboard', 'view', 'Access to main dashboard'),
  ('Process Transaction', 'process_transaction', 'pos', 'create', 'Create and process sales transactions'),
  ('Process Payment', 'process_payment', 'pos', 'create', 'Process customer payments'),
  ('Apply Discount', 'apply_discount', 'pos', 'create', 'Apply discounts to transactions'),
  ('Void Transaction', 'void_transaction', 'pos', 'delete', 'Void/cancel transactions'),
  ('Process Refund', 'process_refund', 'pos', 'create', 'Process customer refunds'),
  ('View Inventory', 'view_inventory', 'inventory', 'view', 'View inventory stock levels'),
  ('Adjust Stock', 'adjust_stock', 'inventory', 'update', 'Adjust inventory quantities'),
  ('Create Purchase Order', 'create_po', 'inventory', 'create', 'Create purchase orders'),
  ('Receive Goods', 'receive_goods', 'inventory', 'create', 'Receive and process goods'),
  ('View Customers', 'view_customers', 'customers', 'view', 'View customer information'),
  ('Manage Customers', 'manage_customers', 'customers', 'update', 'Create and update customer records'),
  ('View Reports', 'view_reports', 'reports', 'view', 'Access reports and analytics'),
  ('View Financial Reports', 'view_financial_reports', 'reports', 'view', 'View financial reports'),
  ('Reconcile Cash', 'reconcile_cash', 'finance', 'update', 'Reconcile cash drawer'),
  ('Create Users', 'create_users', 'users', 'create', 'Create new user accounts'),
  ('Assign Roles', 'assign_roles', 'users', 'update', 'Assign roles to users'),
  ('View Activity Log', 'view_activity_log', 'audit', 'view', 'View system activity logs'),
  ('Create Offers', 'create_offers', 'marketing', 'create', 'Create promotional offers'),
  ('Approve Offers', 'approve_offers', 'marketing', 'update', 'Approve promotional offers'),
  ('System Settings', 'system_settings', 'settings', 'update', 'Manage system settings');

-- Insert default roles and assign permissions
DO $$
DECLARE
  default_brand_id UUID;
  admin_role_id UUID;
  manager_role_id UUID;
  cashier_role_id UUID;
  stock_mgr_role_id UUID;
BEGIN
  -- Get default brand ID
  SELECT id INTO default_brand_id FROM public.brands WHERE code = 'RETAIL_PRO' LIMIT 1;
  
  -- Insert default roles
  INSERT INTO public.roles (name, code, description, brand_id, role_level) VALUES
    ('System Administrator', 'admin', 'Full system access', default_brand_id, 100),
    ('Store Manager', 'manager', 'Store-level operations management', default_brand_id, 80),
    ('Cashier', 'cashier', 'Transaction processing', default_brand_id, 20),
    ('Stock Manager', 'stock_manager', 'Inventory management', default_brand_id, 50),
    ('Marketing Manager', 'marketing_manager', 'Promotion and campaign management', default_brand_id, 60);
  
  -- Get role IDs individually
  SELECT id INTO admin_role_id FROM public.roles WHERE code = 'admin' AND brand_id = default_brand_id LIMIT 1;
  SELECT id INTO manager_role_id FROM public.roles WHERE code = 'manager' AND brand_id = default_brand_id LIMIT 1;
  SELECT id INTO cashier_role_id FROM public.roles WHERE code = 'cashier' AND brand_id = default_brand_id LIMIT 1;
  SELECT id INTO stock_mgr_role_id FROM public.roles WHERE code = 'stock_manager' AND brand_id = default_brand_id LIMIT 1;
  
  -- Assign all permissions to admin role
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT admin_role_id, id FROM public.permissions;
  
  -- Assign specific permissions to manager role
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT manager_role_id, id FROM public.permissions
  WHERE code IN ('view_dashboard', 'process_transaction', 'process_payment', 'apply_discount', 
                 'process_refund', 'view_inventory', 'adjust_stock', 'view_customers', 
                 'manage_customers', 'view_reports', 'view_financial_reports', 'reconcile_cash');
  
  -- Assign specific permissions to cashier role
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT cashier_role_id, id FROM public.permissions
  WHERE code IN ('view_dashboard', 'process_transaction', 'process_payment', 'view_inventory', 'view_customers');
  
  -- Assign specific permissions to stock manager role
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT stock_mgr_role_id, id FROM public.permissions
  WHERE code IN ('view_dashboard', 'view_inventory', 'adjust_stock', 'create_po', 'receive_goods');
END $$;