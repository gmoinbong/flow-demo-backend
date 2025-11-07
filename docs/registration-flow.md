# Registration Flow Documentation

## Overview

Registration process saves all user information from the signup form in a single database transaction to ensure data consistency.

## Database Schema

### Profile Table
Stores user profile information for both creators and brands:

```sql
profile (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL, -- FK to users
  first_name TEXT,              -- From registration form
  last_name TEXT,                -- From registration form
  display_name TEXT,             -- Computed: "firstName lastName" or null
  bio TEXT,
  avatar_url TEXT,
  status VARCHAR(20),            -- active, pending, suspended
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Brands Table
Stores brand/company information (only for brand role):

```sql
brands (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,           -- Company name from form
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  brand_type VARCHAR(20),        -- agency, direct, platform
  company_size VARCHAR(20),      -- 1-10, 11-50, 51-200, 201-1000, 1000+
  user_role VARCHAR(50),         -- marketing-manager, marketing-director, etc.
  profile_id UUID,               -- FK to profile (optional)
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## Registration Flow

### For Creator
1. User fills: email, password, firstName, lastName
2. System creates: user → profile (with firstName, lastName, displayName)

### For Brand
1. User fills: email, password, firstName, lastName, company, companySize, userRole
2. System creates: user → profile (with firstName, lastName, displayName) → brand (with company, companySize, userRole)

## Transaction Logic

All database operations happen in a single transaction:

```typescript
db.transaction(async (tx) => {
  // 1. Create user
  // 2. Create profile
  // 3. If brand: create brand record
  // If any step fails, entire transaction rolls back
})
```

## Mermaid Diagram

```mermaid
sequenceDiagram
    participant F as Frontend Form
    participant API as Auth API
    participant UC as RegisterUseCase
    participant DB as Database (Transaction)
    participant U as users table
    participant P as profile table
    participant B as brands table

    F->>API: POST /auth/register<br/>{email, password, role, firstName, lastName, company?, companySize?, userRole?}
    
    API->>UC: execute(input)
    
    UC->>UC: Validate email (check exists)
    UC->>UC: Get/create role_id
    UC->>UC: Hash password
    
    UC->>DB: Begin Transaction
    
    Note over DB: All operations in single transaction
    
    UC->>U: INSERT user<br/>(id, email, password_hash, role_id)
    U-->>UC: User created
    
    alt Creator Role
        UC->>P: INSERT profile<br/>(id, user_id, first_name, last_name, display_name)
        P-->>UC: Profile created
    else Brand Role
        UC->>P: INSERT profile<br/>(id, user_id, first_name, last_name, display_name)
        P-->>UC: Profile created
        UC->>B: INSERT brand<br/>(id, name, company_size, user_role, profile_id)
        B-->>UC: Brand created
    end
    
    alt Success
        UC->>DB: Commit Transaction
        DB-->>UC: Transaction committed
        UC-->>API: {user, profile, brand?}
        API-->>F: 201 Created
    else Error
        UC->>DB: Rollback Transaction
        DB-->>UC: All changes reverted
        UC-->>API: Error
        API-->>F: 500/400 Error
    end
```

## Data Flow Diagram

```mermaid
flowchart TD
    A[User Fills Form] --> B{Select Role}
    
    B -->|Creator| C[Creator Form:<br/>email, password,<br/>firstName, lastName]
    B -->|Brand| D[Brand Form:<br/>email, password,<br/>firstName, lastName,<br/>company, companySize,<br/>userRole]
    
    C --> E[Validate Input]
    D --> E
    
    E --> F[Check Email Exists]
    F -->|Exists| G[Return Error]
    F -->|Not Exists| H[Get/Create Role ID]
    
    H --> I[Hash Password]
    I --> J[Begin Transaction]
    
    J --> K[Insert User]
    K --> L[Insert Profile<br/>with firstName, lastName,<br/>displayName]
    
    L --> M{Role Type?}
    
    M -->|Creator| N[Commit Transaction]
    M -->|Brand| O[Insert Brand<br/>with company,<br/>companySize, userRole]
    
    O --> P[Link Brand to Profile]
    P --> N
    
    N --> Q[Return Success]
    
    style J fill:#e1f5ff
    style N fill:#d4edda
    style G fill:#f8d7da
```

## API Request/Response

### Request (Creator)
```json
{
  "email": "creator@example.com",
  "password": "password123",
  "role": "creator",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Response (Creator)
```json
{
  "user": {
    "id": "uuid",
    "email": "creator@example.com",
    "role": "creator"
  },
  "profile": {
    "id": "uuid",
    "status": "pending"
  }
}
```

### Request (Brand)
```json
{
  "email": "brand@example.com",
  "password": "password123",
  "role": "brand",
  "firstName": "Jane",
  "lastName": "Smith",
  "company": "Acme Corp",
  "companySize": "51-200",
  "userRole": "marketing-manager"
}
```

### Response (Brand)
```json
{
  "user": {
    "id": "uuid",
    "email": "brand@example.com",
    "role": "brand"
  },
  "profile": {
    "id": "uuid",
    "status": "pending"
  },
  "brand": {
    "id": "uuid",
    "name": "Acme Corp"
  }
}
```

## Error Handling

- **Email already exists**: Transaction not started, returns 409
- **Database error during transaction**: All changes rolled back, returns 500
- **Validation error**: Transaction not started, returns 400

## Migration Required

Add columns to existing tables:

```sql
-- Add to profile table
ALTER TABLE profile ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE profile ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add to brands table
ALTER TABLE brands ADD COLUMN IF NOT EXISTS company_size VARCHAR(20);
ALTER TABLE brands ADD COLUMN IF NOT EXISTS user_role VARCHAR(50);
```

