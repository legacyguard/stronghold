# Vercel Cron Jobs Setup Guide

## 📋 Overview

Tento projekt implementuje dva Vercel Cron Jobs pre automatizované background procesy:

1. **Daily Expiration Check** - Denná kontrola expirácií dokumentov a závetov
2. **Dead Man's Switch** - Denná kontrola neaktivity používateľov

## 🏗️ Architektúra

### Súbory a štruktúra:
```
stronghold/
├── vercel.json                              # Vercel konfigurácia s cron jobmi
├── test-cron-endpoints.sh                   # Test script pre lokálne testovanie
└── apps/web/src/app/api/cron/
    ├── check-expirations/route.ts           # API endpoint pre expiration check
    └── dead-mans-switch/route.ts            # API endpoint pre dead man's switch
```

### Cron Schedule:
- **Expiration Check**: Každý deň o 9:00 UTC (`0 9 * * *`)
- **Dead Man's Switch**: Každý deň o 10:00 UTC (`0 10 * * *`)

## 🔐 Security

### Authentication:
- Všetky cron endpointy sú chránené `CRON_SECRET` tokenom
- Token sa posiela v `Authorization: Bearer {token}` hlavičke
- Neautorizované requesty vrátia HTTP 401

### Environment Variables:
```bash
CRON_SECRET=stronghold_cron_secret_2024_secure_token_xyz789
```

## 🧪 Lokálne testovanie

### 1. Spustiť development server:
```bash
npm run web
```

### 2. Testovať endpointy:
```bash
# Test check-expirations
curl -X GET "http://localhost:3000/api/cron/check-expirations" \
  -H "Authorization: Bearer stronghold_cron_secret_2024_secure_token_xyz789"

# Test dead-mans-switch
curl -X GET "http://localhost:3000/api/cron/dead-mans-switch" \
  -H "Authorization: Bearer stronghold_cron_secret_2024_secure_token_xyz789"

# Test neautorizovaný prístup (should return 401)
curl -X GET "http://localhost:3000/api/cron/check-expirations" \
  -H "Authorization: Bearer wrong_secret"
```

### 3. Automatizované testovanie:
```bash
./test-cron-endpoints.sh
```

## 🚀 Deployment na Vercel

### 1. Environment Variables:
V Vercel dashboard pridať:
```
CRON_SECRET = stronghold_cron_secret_2024_secure_token_xyz789
```

### 2. Deploy:
```bash
vercel deploy
```

### 3. Overenie:
- Cron joby sa automaticky nakonfigurujú podľa `vercel.json`
- Môžete ich monitorovať v Vercel dashboard → Functions → Cron

## 📊 Response Format

### Successful Response:
```json
{
  "success": true,
  "message": "Check completed successfully",
  "results": {
    "timestamp": "2025-09-30T14:19:45.895Z",
    "expiring_documents": [],
    "users_checked": 0,
    "notifications_sent": 0
  }
}
```

### Error Response:
```json
{
  "error": "Unauthorized - Invalid token"
}
```

## 🔄 Current Implementation Status

### ✅ Dokončené:
- [x] Vercel.json konfigurácia s cron jobmi
- [x] API endpointy pre oba cron joby
- [x] CRON_SECRET authentication
- [x] Error handling a logging
- [x] Lokálne testovanie funkčnosti
- [x] Dokumentácia a deployment guide

### 🚧 TODO (Budúca implementácia):
- [ ] Skutočná logika pre expiration detection
- [ ] Email notifikácie pre guardians
- [ ] Database queries pre inactivity detection
- [ ] Escalation procedures pre dead man's switch
- [ ] Monitoring a alerting pre failed cron jobs
- [ ] Rate limiting a retry logic

## 📝 Notes

- Endpointy sú pripravené ako "skeleton" - obsahujú štruktúru a basic logic
- Skutočná business logika sa bude implementovať v budúcich fázach
- Všetky endpointy používajú Supabase Service Role Key pre admin prístup
- Maximálny timeout pre functions je nastavený na 30 sekúnd

## 🔗 Užitočné odkazy

- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Next.js API Routes Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Supabase Admin API](https://supabase.com/docs/reference/javascript/admin-api)