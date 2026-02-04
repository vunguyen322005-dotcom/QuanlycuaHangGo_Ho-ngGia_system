-- Fix customers table RLS policy - remove overly permissive policy
-- and replace with role-based access controls

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "All authenticated users can view and manage customers" ON public.customers;

-- Create separate policies with proper role-based access

-- All authenticated users can view customers
CREATE POLICY "All authenticated users can view customers"
  ON public.customers
  FOR SELECT
  TO authenticated
  USING (true);

-- Only owner and manager can create customers
CREATE POLICY "Owner and Manager can create customers"
  ON public.customers
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Only owner and manager can update customers
CREATE POLICY "Owner and Manager can update customers"
  ON public.customers
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Only owner can delete customers
CREATE POLICY "Only Owner can delete customers"
  ON public.customers
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'owner'::app_role));