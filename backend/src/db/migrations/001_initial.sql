CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS devices (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS readings (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL,
  voltage NUMERIC(10,3) NOT NULL,
  current NUMERIC(10,3) NOT NULL,
  power NUMERIC(12,3) NOT NULL,
  energy NUMERIC(14,6) NOT NULL,
  frequency NUMERIC(8,3) NOT NULL,
  power_factor NUMERIC(5,4) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS readings_device_ts_idx ON readings(device_id, ts);

CREATE TABLE IF NOT EXISTS settings (
  device_id TEXT PRIMARY KEY REFERENCES devices(device_id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  tariff_class TEXT NOT NULL DEFAULT 'R1_1300VA',
  tariff_per_kwh NUMERIC(12,2) NOT NULL DEFAULT 1444.70,
  power_limit_w NUMERIC(12,2) NOT NULL DEFAULT 1500,
  daily_cost_limit_rp NUMERIC(14,2) NOT NULL DEFAULT 250000,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('power_limit', 'cost_limit', 'device_offline')),
  value NUMERIC(14,3) NOT NULL,
  limit_value NUMERIC(14,3) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_read BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS notifications_device_created_idx ON notifications(device_id, created_at DESC);
