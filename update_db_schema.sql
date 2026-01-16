-- Run this query in your Supabase SQL Editor to add the necessary columns for financial tracking

ALTER TABLE service_puntual 
ADD COLUMN budget_value numeric DEFAULT 0, 
ADD COLUMN discounted_value numeric DEFAULT 0, 
ADD COLUMN final_price numeric DEFAULT 0;
