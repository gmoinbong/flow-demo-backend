# Авторизация в NestJS Backend - Интеграция с Next.js Frontend

## Обзор

Документация описывает систему аутентификации и авторизации в NestJS бэкенде для интеграции с Next.js 15 frontend приложением. Система использует JWT токены (access/refresh), OAuth провайдеры (Google, Instagram, TikTok), и защиту маршрутов через NestJS Guards.

**Технологический стек:**
- **JWT**: `jsonwebtoken` для генерации и верификации токенов
- **Хеширование паролей**: `bcrypt` для безопасного хранения паролей
- **Блокировка аккаунтов**: Redis для rate limiting и защиты от brute-force
- **База данных**: PostgreSQL с Drizzle ORM
- **Валидация**: Zod для валидации входных данных

---

## Архитектура Auth модуля

### Структура модуля

```
src/modules/auth/
├── domain/                    # Доменный слой
│   ├── entities/              # User, OAuthAccount
│   ├── value-objects/         # Email, Password, JwtToken
│   ├── repositories/          # Интерфейсы репозиториев
│   ├── errors/                # Доменные ошибки
│   └── domain-events/         # События домена
├── application/               # Слой приложения
│   ├── use-cases/             # Use cases (login, register, refresh, etc.)
│   └── services/              # Сервисы (JWT, Password, OAuth, Redis)
├── infrastructure/            # Инфраструктурный слой
│   ├── persistence/           # Реализации репозиториев
│   ├── oauth-providers/       # OAuth провайдеры (Google, Instagram, TikTok)
│   └── config/                # Конфигурация (JWT, OAuth, Redis)
└── presentation/              # Слой представления
    ├── controllers/            # REST контроллеры
    ├── dto/                    # DTO с Zod валидацией
    ├── guards/                 # JwtAuthGuard для защиты маршрутов
    └── decorators/             # @CurrentUser декоратор
```

### Принципы архитектуры

1. **Clean Architecture**: Четкое разделение на слои (Domain → Application → Infrastructure → Presentation)
2. **Dependency Inversion**: Использование интерфейсов для репозиториев и сервисов
3. **Use Cases**: Бизнес-логика инкапсулирована в use cases
4. **Domain Events**: События для интеграции с другими модулями

---

## API Endpoints

### Base URL

Все endpoints находятся под префиксом `/auth`:

```
http://localhost:3000/auth/...
```

### 1. Регистрация

**POST** `/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Валидация:**
- `email`: валидный email адрес
- `password`: минимум 8 символов, максимум 100

**Response (201 Created):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Ошибки:**
- `409 Conflict`: Пользователь с таким email уже существует

**Пример использования в Next.js:**
```typescript
// app/api/auth/register/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: response.status }
    );
  }
  
  return NextResponse.json(await response.json());
}
```

### 2. Вход в систему

**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Ошибки:**
- `401 Unauthorized`: Неверный email или пароль
- `429 Too Many Requests`: Слишком много попыток входа (аккаунт заблокирован)

**Защита от brute-force:**
- Redis отслеживает неудачные попытки входа
- После 5 неудачных попыток аккаунт блокируется на 15 минут
- Блокировка снимается при успешном входе

**Пример использования в Next.js:**
```typescript
// app/api/auth/login/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const error = await response.json();
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: response.status }
    );
  }
  
  const data = await response.json();
  
  // Сохраняем токены в localStorage или cookies
  // В production рекомендуется использовать httpOnly cookies для refresh token
  return NextResponse.json(data);
}
```

### 3. Обновление токена

**POST** `/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Особенности:**
- Token rotation: старый refresh token удаляется, выдается новый
- Refresh token должен быть валидным и существовать в базе данных
- После обновления старый refresh token становится невалидным

**Ошибки:**
- `401 Unauthorized`: Невалидный или истекший refresh token

**Пример использования в Next.js:**
```typescript
// app/hooks/use-refresh-token.ts
import { useMutation } from '@tanstack/react-query';

export function useRefreshToken() {
  return useMutation({
    mutationFn: async (refreshToken: string) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (!response.ok) {
        throw new Error('Token refresh failed');
      }
      
      return response.json();
    },
  });
}
```

### 4. Выход из системы

**POST** `/auth/logout`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

**Особенности:**
- Требует валидный access token в заголовке Authorization
- Refresh token удаляется из базы данных
- Все последующие запросы с этим refresh token будут отклонены

**Пример использования в Next.js:**
```typescript
// app/api/auth/logout/route.ts
export async function POST(request: NextRequest) {
  const accessToken = request.headers.get('authorization');
  const { refreshToken } = await request.json();
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': accessToken || '',
    },
    body: JSON.stringify({ refreshToken }),
  });
  
  return NextResponse.json(await response.json());
}
```

### 5. Получение текущего пользователя

**GET** `/auth/me`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@example.com"
}
```

**Особенности:**
- Требует валидный access token
- Используется для проверки авторизации и получения данных пользователя

**Пример использования в Next.js:**
```typescript
// app/api/auth/me/route.ts
export async function GET(request: NextRequest) {
  const accessToken = request.headers.get('authorization');
  
  if (!accessToken) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': accessToken,
    },
  });
  
  if (!response.ok) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: response.status }
    );
  }
  
  return NextResponse.json(await response.json());
}
```

### 6. Сброс пароля

#### 6.1. Запрос сброса пароля

**POST** `/auth/password-reset/request`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset token sent to email"
}
```

#### 6.2. Проверка токена сброса

**POST** `/auth/password-reset/verify`

**Request Body:**
```json
{
  "token": "reset-token-string"
}
```

**Response (200 OK):**
```json
{
  "valid": true
}
```

#### 6.3. Подтверждение сброса пароля

**POST** `/auth/password-reset/confirm`

**Request Body:**
```json
{
  "token": "reset-token-string",
  "newPassword": "newSecurePassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset successfully"
}
```

---

## OAuth авторизация

### Поддерживаемые провайдеры

- **Google** (`/auth/oauth/google`)
- **Instagram** (`/auth/oauth/instagram`)
- **TikTok** (`/auth/oauth/tiktok`)

### Flow OAuth авторизации

#### 1. Инициация OAuth (получение URL)

**GET** `/auth/oauth/{provider}/initiate`

**Response (200 OK):**
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "state": "random-state-string"
}
```

**Особенности:**
- State используется для защиты от CSRF атак
- State сохраняется в Redis с TTL 10 минут
- Frontend должен сохранить state для проверки на callback

#### 2. OAuth Callback

**GET** `/auth/oauth/{provider}/callback?code={code}&state={state}`

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "isNewUser": true
}
```

**Особенности:**
- Если пользователь с таким OAuth аккаунтом не существует, создается новый пользователь
- Если пользователь существует, выполняется вход
- OAuth аккаунт связывается с пользователем

**Пример интеграции в Next.js:**
```typescript
// app/api/auth/oauth/google/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  
  if (!code || !state) {
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
  }
  
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/auth/oauth/google/callback?code=${code}&state=${state}`
  );
  
  if (!response.ok) {
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
  }
  
  const data = await response.json();
  
  // Сохраняем токены и редиректим пользователя
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

---

## JWT токены

### Структура токенов

**Access Token:**
- **Тип**: `access`
- **Время жизни**: 15 минут (по умолчанию, настраивается через `JWT_ACCESS_TOKEN_EXPIRY`)
- **Payload:**
  ```json
  {
    "sub": "user-id",
    "email": "user@example.com",
    "type": "access",
    "iat": 1234567890,
    "exp": 1234568790
  }
  ```

**Refresh Token:**
- **Тип**: `refresh`
- **Время жизни**: 7 дней (по умолчанию, настраивается через `JWT_REFRESH_TOKEN_EXPIRY`)
- **Payload:**
  ```json
  {
    "sub": "user-id",
    "email": "user@example.com",
    "type": "refresh",
    "iat": 1234567890,
    "exp": 1235160690
  }
  ```

### Конфигурация JWT

**Environment Variables:**
```env
JWT_SECRET=your-secret-key-min-32-chars
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
```

**Формат времени жизни:**
- `s` - секунды (например, `30s`)
- `m` - минуты (например, `15m`)
- `h` - часы (например, `2h`)
- `d` - дни (например, `7d`)

---

## Защита маршрутов

### JWT Guard

Для защиты маршрутов используется `JwtAuthGuard`:

```typescript
@Controller('protected')
export class ProtectedController {
  @Get('data')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getData(@CurrentUser() user: CurrentUser) {
    // user содержит { id, email }
    return { data: 'protected data', userId: user.id };
  }
}
```

### Декоратор @CurrentUser

Используется для получения данных текущего пользователя:

```typescript
@Get('profile')
@UseGuards(JwtAuthGuard)
async getProfile(@CurrentUser() user: CurrentUser) {
  return user; // { id: string, email: string }
}
```

### Проверка токена в Guard

Guard проверяет:
1. Наличие заголовка `Authorization: Bearer <token>`
2. Валидность токена (подпись, срок действия)
3. Тип токена (должен быть `access`)
4. Присоединение данных пользователя к `request.user`

---

## Интеграция с Next.js Frontend

### 1. Хранение токенов

**Рекомендуемый подход:**

```typescript
// lib/auth-storage.ts
export const AuthStorage = {
  // Сохраняем access token в memory (не localStorage для безопасности)
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('accessToken');
  },
  
  setAccessToken(token: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('accessToken', token);
  },
  
  // Refresh token можно хранить в httpOnly cookie (через API route)
  // Или в localStorage с защитой от XSS
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  },
  
  setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('refreshToken', token);
  },
  
  clearTokens(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};
```

### 2. React Query хук для авторизации

```typescript
// app/hooks/use-auth.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthStorage } from '@/lib/auth-storage';

export function useAuth() {
  const queryClient = useQueryClient();
  
  // Получение текущего пользователя
  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const token = AuthStorage.getAccessToken();
      if (!token) return null;
      
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        // Попытка обновить токен
        await refreshTokenIfNeeded();
        return null;
      }
      
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 минут
    retry: false,
  });
  
  // Вход
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const data = await response.json();
      AuthStorage.setAccessToken(data.accessToken);
      AuthStorage.setRefreshToken(data.refreshToken);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
  
  // Выход
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const token = AuthStorage.getAccessToken();
      const refreshToken = AuthStorage.getRefreshToken();
      
      if (token && refreshToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
      
      AuthStorage.clearTokens();
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null);
    },
  });
  
  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
  };
}

// Автоматическое обновление токена
async function refreshTokenIfNeeded(): Promise<void> {
  const refreshToken = AuthStorage.getRefreshToken();
  if (!refreshToken) return;
  
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    
    if (response.ok) {
      const data = await response.json();
      AuthStorage.setAccessToken(data.accessToken);
      AuthStorage.setRefreshToken(data.refreshToken);
    } else {
      AuthStorage.clearTokens();
    }
  } catch (error) {
    AuthStorage.clearTokens();
  }
}
```

### 3. API Routes в Next.js

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Login failed' },
        { status: response.status }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4. Middleware для защиты маршрутов

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Проверка защищенных маршрутов
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/profile')) {
    const token = request.cookies.get('accessToken')?.value;
    
    if (!token) {
      return NextResponse.redirect(
        new URL(`/login?redirect=${pathname}`, request.url)
      );
    }
    
    // Можно добавить проверку валидности токена через API
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*'],
};
```

### 5. Interceptor для автоматического добавления токена

```typescript
// lib/api-client.ts
import { AuthStorage } from './auth-storage';

export async function apiClient(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = AuthStorage.getAccessToken();
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');
  
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );
  
  // Автоматическое обновление токена при 401
  if (response.status === 401) {
    await refreshTokenIfNeeded();
    // Повтор запроса с новым токеном
    const newToken = AuthStorage.getAccessToken();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      return fetch(`${process.env.NEXT_PUBLIC_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    }
  }
  
  return response;
}
```

---

## Безопасность

### Рекомендации

1. **Хранение токенов:**
   - Access token: в памяти (sessionStorage) или httpOnly cookie
   - Refresh token: httpOnly cookie (предпочтительно) или localStorage с защитой от XSS

2. **HTTPS:**
   - Всегда используйте HTTPS в production
   - JWT секрет должен быть минимум 32 символа

3. **CORS:**
   - Настройте CORS на бэкенде для разрешенных доменов
   - Не используйте `Access-Control-Allow-Origin: *` в production

4. **Rate Limiting:**
   - Бэкенд использует Redis для защиты от brute-force
   - Рекомендуется добавить rate limiting на уровне API Gateway

5. **Валидация:**
   - Все входные данные валидируются через Zod
   - Пароли должны соответствовать требованиям (минимум 8 символов)

6. **Token Rotation:**
   - Refresh token ротируется при каждом обновлении
   - Старые токены немедленно становятся невалидными

---

## Обработка ошибок

### Коды ошибок

- `400 Bad Request`: Некорректные входные данные
- `401 Unauthorized`: Невалидный или отсутствующий токен
- `403 Forbidden`: Недостаточно прав доступа
- `409 Conflict`: Конфликт (например, пользователь уже существует)
- `429 Too Many Requests`: Превышен лимит попыток (блокировка аккаунта)

### Формат ошибки

```json
{
  "message": "Error message",
  "code": 1001,
  "statusCode": 401,
  "context": {
    "email": "user@example.com"
  }
}
```

---

## Тестирование

### Примеры запросов с curl

**Регистрация:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Вход:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Получение текущего пользователя:**
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

**Обновление токена:**
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```

---

## Конфигурация

### Environment Variables

**Backend (.env):**
```env
# JWT
JWT_SECRET=your-very-secure-secret-key-minimum-32-characters
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# Database
DATABASE_WRITE_URL=postgresql://user:password@localhost:5432/dbname

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# OAuth (Google example)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/oauth/google/callback
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## Troubleshooting

### Проблема: Токен не принимается

**Решение:**
1. Проверьте формат заголовка: `Authorization: Bearer <token>`
2. Убедитесь, что токен не истек
3. Проверьте, что используете access token, а не refresh token

### Проблема: Refresh token не работает

**Решение:**
1. Убедитесь, что refresh token сохранен корректно
2. Проверьте, что токен не был отозван (logout)
3. Проверьте срок действия токена

### Проблема: OAuth callback не работает

**Решение:**
1. Проверьте, что state совпадает с сохраненным значением
2. Убедитесь, что redirect URI настроен правильно
3. Проверьте, что OAuth credentials корректны

---

## Дополнительные ресурсы

- [NestJS Documentation](https://docs.nestjs.com/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)
- [Next.js Authentication](https://nextjs.org/docs/authentication)

