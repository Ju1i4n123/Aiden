@echo off

REM 2) Start API + Jobs in PAPER mode in a new cmd window
set PAPER=true
start "ai-invest-api" cmd /k npm run start:all

echo Waiting for API to boot...
timeout /t 8 >nul

REM 3) Seed dummy user & deposit (11 Tage alt)
sqlite3 ai_invest.db "INSERT OR IGNORE INTO users(id,email,stripe_customer_id) VALUES('testuser','paper@test','cus_test');"
sqlite3 ai_invest.db "INSERT OR IGNORE INTO wallets(user_id,balance) VALUES('testuser',0);"
sqlite3 ai_invest.db "INSERT INTO deposits(user_id,principal,invested,processed,created_at) VALUES('testuser',100,0,0,datetime('now','-11 days'));"

echo Dummy deposit seeded.

REM 4) Run invest job
node -r dotenv/config src/jobs/invest.cjs

REM 5) Run unwind job
node -r dotenv/config src/jobs/unwind.cjs

REM 6) Show resulting wallet balance
sqlite3 ai_invest.db "SELECT * FROM wallets WHERE user_id='testuser';"

echo --- Test completed ---
pause
