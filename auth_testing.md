# Auth-Gated App Testing Playbook (Emergent Google Auth)

## Step 1: Create Test User & Session

Run:

```bash
mongosh --eval "
use('test_database');
var visitorId = 'user_' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: visitorId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: visitorId,  // Must match users.user_id exactly
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + visitorId);
"
```

## Step 2: Test Backend API

```bash
# Test auth endpoint
curl -X GET "https://your-app.com/api/auth/me" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Logout
curl -X POST "https://your-app.com/api/auth/logout" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

## MongoDB ID Handling Reminder
- Always use custom `user_id` field (string)
- Always exclude MongoDB `_id` via projection `{ "_id": 0 }`
