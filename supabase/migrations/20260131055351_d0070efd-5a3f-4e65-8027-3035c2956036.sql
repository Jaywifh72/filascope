-- Add unique constraint on target_currency for upsert operations
ALTER TABLE currency_exchange_rates
ADD CONSTRAINT currency_exchange_rates_target_currency_key UNIQUE (target_currency);