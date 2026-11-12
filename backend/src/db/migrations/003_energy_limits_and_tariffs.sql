ALTER TABLE settings ADD COLUMN IF NOT EXISTS daily_energy_limit_kwh NUMERIC(12,3) NOT NULL DEFAULT 0;

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('power_limit', 'current_limit', 'energy_limit', 'cost_limit', 'device_offline'));

UPDATE settings SET tariff_class='R1_900VA', tariff_per_kwh=1352
WHERE tariff_class='R1_900VA' AND tariff_per_kwh=0;
UPDATE settings SET tariff_per_kwh=1444.70 WHERE tariff_class IN ('R1_1300VA','R1_2200VA') AND tariff_per_kwh=0;
UPDATE settings SET tariff_per_kwh=1699.53 WHERE tariff_class IN ('R2_3500_5500VA','R3_6600VA') AND tariff_per_kwh=0;
UPDATE settings SET tariff_class='R1_1300VA', tariff_per_kwh=1444.70
WHERE tariff_class='CUSTOM' AND tariff_per_kwh=0;

ALTER TABLE settings ALTER COLUMN tariff_class SET DEFAULT 'R1_1300VA';
ALTER TABLE settings ALTER COLUMN tariff_per_kwh SET DEFAULT 1444.70;
