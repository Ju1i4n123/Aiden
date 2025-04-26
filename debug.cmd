:: A) create user
curl -X POST http://localhost:3000/users ^
     -H "Content-Type: application/json" ^
     -d "{\"email\":\"test@example.com\"}"

:: B) copy the userId and do a checkout
curl -X POST http://localhost:3000/checkout ^
     -H "Content-Type: application/json" ^
     -d "{\"userId\":\"<USER_ID>\",\"amount\":1000}"

:: C) copy the sessionId and mark success
curl "http://localhost:3000/success?session_id=<SESSION_ID>"

:: D) back-date deposit to 5 days (ID=1)
sqlite3 ai_invest.db "UPDATE deposits SET created_at=datetime('now','-5 days') WHERE id=1;"

:: E) run invest once
node src\jobs\invest.cjs
