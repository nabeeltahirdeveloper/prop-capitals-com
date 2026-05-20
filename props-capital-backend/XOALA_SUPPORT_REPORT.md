# Xoala / Decta Support Report — 3DS ACS Timeout

**Merchant Member ID:** 14664
**Integration:** Standard Checkout (POST /transaction/Checkout)
**Environment:** Production base URL `https://secure-checkout.xoala.com/`

---

## Issue summary

Every card payment is accepted by Xoala and progresses correctly up to the
**3-D Secure challenge**, then the cardholder's browser fails to load the ACS
page and the transaction never completes.

The failing page is the **Decta test ACS**:

```
https://t-acs.decta.com/mdpayacs/creq   →   ERR_CONNECTION_TIMED_OUT
```

The browser cannot reach `t-acs.decta.com` at all (connection times out after
~90s). Because the cardholder never clears 3DS, **no notification/callback is
ever delivered to our notificationUrl**, and all payments stay `pending`.

This affects 100% of attempts (see list below — all pending, zero callbacks).

---

## Example failed transaction

| Field | Value |
|---|---|
| merchantTransactionId | `XOALA-1779125267610-jpmzqx` |
| Amount | 245.00 EUR |
| Created (UTC) | 2026-05-18 17:27:47 |
| Merchant status | pending |
| Gateway order status | (none — never received) |
| Callback received | NONE |

### REQUEST sent by merchant to Xoala

```json
{
  "memberId": "14664",
  "totype": "Xoala",
  "amount": "245.00",
  "currency": "EUR",
  "merchantTransactionId": "XOALA-1779125267610-jpmzqx",
  "merchantRedirectUrl": "https://prop-capitals.com/pay/success?reference=XOALA-1779125267610-jpmzqx",
  "notificationUrl": "https://api.prop-capitals.com/payments/xoala/callback",
  "orderDescription": "1-Step Challenge - €50K 50000 Account",
  "email": "nabeeltahirdeveloper@gmail.com",
  "firstName": "Muhammad",
  "lastName": "Dawood",
  "country": "PK",
  "city": "Faisalabad",
  "checksum": "3f44110742e1286a3908959fb62198ff"
}
```

### RESPONSE / callback from Xoala

```
NONE — no server-to-server notification was ever delivered for this
(or any) transaction, because the flow stalls at the 3DS ACS step
before a result is produced.
```

### 3DS step that failed (captured from the cardholder browser)

```
Request URL : https://t-acs.decta.com/mdpayacs/creq   (HTTP POST)
Form data   : creq=<base64 challenge request>, threeDSSessionData=41321868
Result      : net::ERR_CONNECTION_TIMED_OUT  ("t-acs.decta.com took too long to respond")
```

---

## Other recent attempts (all identical pattern)

| merchantTransactionId | Amount | Status | Callback |
|---|---|---|---|
| XOALA-1779125267610-jpmzqx | 245.00 EUR | pending | none |
| XOALA-1779109612806-ewfmxh | 299.00 EUR | pending | none |
| XOALA-1779109163341-s2e3lz | 245.00 EUR | pending | none |
| XOALA-1779108242647-5ub0y2 |  99.00 EUR | pending | none |
| XOALA-1779108172308-oby5td | 245.00 EUR | pending | none |

---

## What we need from Xoala / Decta

1. Please check the availability of the 3DS ACS host `t-acs.decta.com` for
   member ID **14664** — it is timing out for our cardholders.
2. Confirm whether our merchant account is pointed at the **test/sandbox ACS**
   (`t-acs.decta.com`) and, if so, move us to the production 3DS ACS.
3. Confirm the request payload above passes your validation (checksum,
   currency, fields) so we can rule out anything on the merchant side.

Our integration is confirmed working up to the 3DS redirect; the failure is
isolated to the ACS host being unreachable.
