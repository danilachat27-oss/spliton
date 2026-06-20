-- Reset app login password (bcrypt cost 12) — password from spliton_pass.txt (splitoonn@gmail.com line)
-- Supabase → SQL Editor → Run

UPDATE users
SET password_hash = '$2b$12$RbYhHeFUqFNutuNWjgZKUeytG9lKatStxlH/uL06iGsuKgAmTN0Mq',
    updated_at = NOW()
WHERE deleted_at IS NULL;
