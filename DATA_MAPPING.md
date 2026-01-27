# PodcastMatch - Complete Data Mapping Documentation

## 📊 Database Collections

### 1. **users** Collection
```
Primary Key: user_id
Fields:
  - user_id: string (PK)
  - email: string (unique)
  - name: string
  - picture: string (URL)
  - role: "host" | "guest"
  - profile_completed: boolean
  - subscription_tier: "free" | "pro"
  - swipes_today: integer
  - swipes_reset_at: datetime
  - created_at: datetime
```

### 2. **profiles** Collection
```
Primary Key: user_id
Foreign Key: user_id → users.user_id
Fields:
  - user_id: string (PK, FK)
  - niche: array[string]
  - language: string
  - country: string
  - availability: string
  
  Host-specific:
  - podcast_name: string
  - podcast_description: string
  - topics: array[string]
  - audience_size: string
  - preferred_guest_type: array[string]
  - recording_format: string
  - podcast_links: object
  
  Guest-specific:
  - bio: string
  - expertise: array[string]
  - previous_appearances: array[string]
  - social_links: object
  - remote_recording: boolean
  
  - created_at: datetime
  - updated_at: datetime
```

### 3. **user_sessions** Collection
```
Primary Key: session_token
Foreign Key: user_id → users.user_id
Fields:
  - user_id: string (FK)
  - session_token: string (PK)
  - expires_at: datetime
  - created_at: datetime
```

### 4. **swipes** Collection
```
Primary Key: swipe_id
Foreign Keys:
  - swiper_id → users.user_id
  - swiped_id → users.user_id
Fields:
  - swipe_id: string (PK)
  - swiper_id: string (FK)
  - swiped_id: string (FK)
  - direction: "left" | "right"
  - created_at: datetime
```

### 5. **matches** Collection
```
Primary Key: match_id
Foreign Keys:
  - user1_id → users.user_id
  - user2_id → users.user_id
Fields:
  - match_id: string (PK)
  - user1_id: string (FK)
  - user2_id: string (FK)
  - created_at: datetime
  - last_message_at: datetime
```

### 6. **chat_messages** Collection
```
Primary Key: message_id
Foreign Keys:
  - match_id → matches.match_id
  - sender_id → users.user_id
Fields:
  - message_id: string (PK)
  - match_id: string (FK)
  - sender_id: string (FK)
  - content: string
  - created_at: datetime
```

### 7. **payment_transactions** Collection
```
Primary Key: payment_id
Foreign Key: user_id → users.user_id
Fields:
  - payment_id: string (PK)
  - user_id: string (FK)
  - session_id: string (Stripe session)
  - amount: float
  - currency: string
  - status: "pending" | "completed" | "failed"
  - payment_status: "pending" | "paid" | "failed"
  - metadata: object
  - created_at: datetime
  - updated_at: datetime
```

---

## 🔗 Data Relationships

```
users (1) ─────────── (1) profiles
users (1) ─────────── (N) user_sessions
users (1) ─────────── (N) swipes [as swiper]
users (1) ─────────── (N) swipes [as swiped]
users (N) ─────────── (N) matches [many-to-many]
users (1) ─────────── (N) chat_messages
users (1) ─────────── (N) payment_transactions
matches (1) ────────── (N) chat_messages
```

---

## 🔌 API Endpoints & Data Flow

### Authentication Flow
```
1. User → Frontend: Click "Sign in with Google"
2. Frontend → Emergent Auth: Redirect to auth.emergentagent.com
3. Emergent Auth → Frontend: Return with session_id in URL hash
4. Frontend → Backend: POST /api/auth/session (X-Session-ID header)
5. Backend → Emergent Auth: Validate session_id
6. Backend → MongoDB: Create/update user in users collection
7. Backend → MongoDB: Create session in user_sessions
8. Backend → Frontend: Return user data + session_token
9. Frontend: Store session_token in cookie
```

### Profile Creation Flow
```
1. Frontend → Backend: POST /api/role {role: "host"|"guest"}
2. Backend → MongoDB: Update users.role
3. Frontend → Backend: POST /api/profile {profile data}
4. Backend → MongoDB: Insert into profiles collection
5. Backend → MongoDB: Update users.profile_completed = true
```

### Discovery & Swipe Flow
```
1. Frontend → Backend: GET /api/discover
2. Backend → MongoDB: Query users (opposite role, not swiped)
3. Backend → ML Model: Get ranked candidates
4. Backend → MongoDB: Fetch profiles for candidates
5. Backend → Frontend: Return top 10 candidates
6. User swipes → Frontend → Backend: POST /api/swipe
7. Backend → MongoDB: Insert into swipes
8. Backend: Check if mutual right swipe exists
9. If match → Backend → MongoDB: Create match record
10. Backend → Frontend: Return {matched: true/false}
```

### Chat Flow
```
1. Frontend → Backend: GET /api/chat/{match_id}/messages
2. Backend → MongoDB: Verify user is in match
3. Backend → MongoDB: Fetch messages for match_id
4. Backend → Frontend: Return messages array
5. User sends message → Frontend → Backend: POST /api/chat/{match_id}/messages
6. Backend → MongoDB: Insert message
7. Backend → MongoDB: Update matches.last_message_at
```

### AI Pitch Generation Flow
```
1. Frontend → Backend: POST /api/ai/generate-pitch {match_id}
2. Backend → MongoDB: Fetch match, user profiles
3. Backend → OpenAI: Send prompt with context
4. OpenAI → Backend: Return generated pitch
5. Backend → Frontend: Return pitch text
6. User can edit and send via chat
```

### Payment Flow
```
1. Frontend → Backend: POST /api/subscription/checkout
2. Backend → Stripe: Create checkout session
3. Backend → MongoDB: Create payment_transaction (pending)
4. Backend → Frontend: Return Stripe checkout URL
5. Frontend: Redirect to Stripe
6. User completes payment → Stripe → Backend: Webhook
7. Backend → MongoDB: Update payment_transaction (paid)
8. Backend → MongoDB: Update users.subscription_tier = "pro"
```

### ML Model Flow
```
1. Admin → Frontend → Backend: POST /api/admin/train-model
2. Backend → MongoDB: Fetch all swipes
3. Backend → ML Model: Build user/item mappings
4. ML Model: Train Neural Collaborative Filtering
5. ML Model → Disk: Save model (cf_model.pt)
6. When user requests discovery:
   - Backend loads model
   - Model predicts scores for candidates
   - Backend ranks candidates by score
   - Returns top recommendations
```

---

## 🧠 PyTorch ML Model Architecture

### Model Structure
```
Input Layer:
  - user_id (mapped to index)
  - item_id (mapped to index)

Embedding Layers:
  - User Embedding: [num_users × 32]
  - Item Embedding: [num_items × 32]

Concatenation:
  - Concat user + item embeddings → [64 dims]

MLP Layers:
  - Linear(64 → 64) + ReLU + BatchNorm + Dropout(0.2)
  - Linear(64 → 32) + ReLU + BatchNorm + Dropout(0.2)
  - Linear(32 → 16) + ReLU + BatchNorm + Dropout(0.2)
  - Linear(16 → 1) + Sigmoid

Output:
  - Prediction score: 0.0 to 1.0
```

### Training Data Format
```
Each swipe creates a training sample:
  (user_idx, item_idx, label)
  
  label = 1.0 if direction == "right" (like)
  label = 0.0 if direction == "left" (pass)
```

---

## 📈 Data Statistics (Current)

```
Total Users: 24
  - Hosts: 9
  - Guests: 15

Profiles: 24 (100% completion)
Swipes: ~30+ (including synthetic)
Matches: Depends on user activity
Messages: Depends on matches
Transactions: 0 (test environment)

ML Model:
  - Parameters: ~50K
  - Model Size: 40KB
  - Training Loss: 0.41 (final)
```

---

## 🔐 Security & Data Protection

### Session Management
- Sessions expire after 7 days
- Tokens stored securely in HTTP-only cookies
- All API requests require valid session

### Data Privacy
- Email is unique identifier
- No password storage (OAuth only)
- Profile data visible only to opposite role
- Chat messages only visible to participants

### Payment Security
- Stripe handles all payment processing
- No credit card data stored
- Webhook validation for payment confirmation

---

## 🚀 Scaling Considerations

### Database Indexes
```
users:
  - user_id (primary)
  - email (unique)
  - role + profile_completed (compound)

swipes:
  - swiper_id + swiped_id (compound)
  - swiper_id + created_at (compound)

matches:
  - user1_id, user2_id (compound)
  - last_message_at (for sorting)

chat_messages:
  - match_id + created_at (compound)
```

### Caching Strategy
- User sessions cached in memory
- ML model loaded once, kept in memory
- Candidate lists cached per user (5 min TTL)

### Performance Optimizations
- Projection queries (exclude _id)
- Limit queries to prevent memory issues
- Async operations for I/O
- Background model training
