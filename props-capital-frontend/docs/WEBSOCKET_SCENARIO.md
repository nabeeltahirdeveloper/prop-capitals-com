# WebSocket Connection – Pehle vs Ab (Scenario)

## Ab ka structure (current)

### 1. Trading WebSocket – `/trading` (main)

| Item | Detail |
|------|--------|
| **File** | `src/lib/socket.js` |
| **URL** | `VITE_API_URL` (e.g. `https://api-dev.prop-capitals.com`) |
| **Namespace** | `/trading` |
| **Auth** | JWT in `auth: { token }` (localStorage: `token` / `accessToken` / `jwt_token`) |
| **Connect kab** | `autoConnect: false` → token milte hi `tryConnect()` (page load + `storage` event). Login ke baad `reconnectSocketWithToken()` (AuthContext) bulaata hai. |
| **Use** | TradingContext: `priceUpdate`, `tradeClosed`, connect/disconnect. Chart bhi isi socket se subscribe/price use karta hai. |

**Backend (NestJS):**

- **File:** `props-capital-backend/src/websocket/trading-events.gateway.ts`
- **Namespace:** `/trading`
- **Connection:** Handshake me `auth.token` ya `query.token` se JWT verify, `payload.sub` / `payload.userId` se user bind.
- **Events backend emit karta hai:**  
  `subscription:confirmed`, `position:closed`, `account:status-changed`, `trade:executed`, `account:update`  
  **Backend `priceUpdate` emit nahi karta** – isliye symbols ki live bid/ask agar dikh rahi hai to wo REST polling (e.g. PriceContext / getUnifiedPrices) se aa rahi hai.

---

### 2. Forex WebSocket – `/forex-prices` (alag socket)

| Item | Detail |
|------|--------|
| **File** | `src/contexts/PriceContext.jsx` (andar naya socket create) |
| **URL** | `VITE_WEBSOCKET_URL` (default same 5002) |
| **Namespace** | `/forex-prices` |
| **Auth** | `auth: { token }` |
| **Connect kab** | Jab user authenticated ho **aur** page “price-required” ho (e.g. trading page). |

**Backend:**  
Abhi backend me **`/forex-prices` namespace ka koi gateway nahi hai** – sirf `TradingEventsGateway` (`/trading`) hai. Isliye ye connection connect nahi hota / reject ho sakta hai.

---

### 3. useTradingWebSocket hook (extra `/trading` connection)

| Item | Detail |
|------|--------|
| **File** | `src/hooks/useTradingWebSocket.js` |
| **URL** | `VITE_WEBSOCKET_URL` |
| **Namespace** | `/trading` (same as 1) |
| **Use** | Account-specific: `subscribe:account`, `position:closed`, `account:status-changed`, `account:update`. |

Agar TradingContext (jo `lib/socket.js` use karta hai) aur ye hook dono use ho rahe hon, to **do alag client same `/trading` pe connect** honge – do connections for same namespace.

---

## Pehle ka idea (inferred) vs ab

- **Pehle:**  
  - Ya to ek hi WebSocket tha (e.g. sirf `/trading`) jahan prices bhi aate the, ya  
  - Alag “forex” socket (`/forex-prices`) socha gaya tha lekin backend me kabhi implement nahi hua.  
  - Trade close events backend se `position:closed` hi emit hote rahe honge.

- **Ab:**  
  - **Trading:** Ek shared socket `lib/socket.js` → `VITE_API_URL/trading`, JWT, token ke baad connect.  
  - **Prices:** Backend se WebSocket pe `priceUpdate` aata nahi; live feel REST polling se (e.g. PriceContext / getUnifiedPrices).  
  - **Forex socket:** Frontend `/forex-prices` pe connect karta hai lekin backend me wo namespace nahi hai.  
  - **Trade closed:** Backend `position:closed` bhejta hai, TradingContext `tradeClosed` sunta hai – **name mismatch** hai, isliye TradingContext ko trade-closed events nahi mil rahe.

---

## Summary table

| Connection | URL/Namespace | Kab connect | Backend support | Notes |
|------------|----------------|-------------|-----------------|--------|
| **lib/socket.js** | `VITE_API_URL` + `/trading` | Token milte hi ( + login pe reconnect ) | ✅ Yes | priceUpdate backend se nahi aata; tradeClosed ≠ position:closed |
| **PriceContext** | `VITE_WEBSOCKET_URL` + `/forex-prices` | Auth + price-required page | ❌ No gateway | Connect fail / useless |
| **useTradingWebSocket** | `VITE_WEBSOCKET_URL` + `/trading` | Hook mount + token | ✅ Same gateway | Duplicate /trading connection possible |

---

## Suggested fix (TradingContext)

Backend `position:closed` bhejta hai, frontend `tradeClosed` sunta hai – isliye trade-closed events TradingContext tak nahi aa rahe.  
TradingContext me listener **`tradeClosed`** ki jagah **`position:closed`** pe laga do (aur payload structure backend jaisa use karo), to same WebSocket pe trade closed real-time kaam karega.
