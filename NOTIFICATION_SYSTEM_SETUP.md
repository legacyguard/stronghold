# 📧 Notification System Setup Guide

## 📋 Overview

Implementovaná je "kostra" notifikačného systému pre LegacyGuard projekt, ktorá obsahuje:

1. **Expiration Check Cron Job** - Denná kontrola expirácií dokumentov, závetov a guardian priradení
2. **Notification Service** - Centralizovaný systém pre posielanie notifikácií
3. **Email Templates** - Preddefinované šablóny pre rôzne typy notifikácií
4. **Comprehensive Logging** - Detailné logovanie všetkých aktivít

## 🏗️ Architektúra

### Súbory a štruktúra:
```
stronghold/
├── vercel.json                              # Vercel konfigurácia s cron jobmi
├── apps/web/src/
│   ├── app/api/cron/
│   │   ├── check-expirations/route.ts       # Main cron endpoint pre expiration checks
│   │   └── dead-mans-switch/route.ts        # Dead man's switch endpoint
│   └── lib/
│       └── notifications.ts                 # NotificationService class a helpers
└── NOTIFICATION_SYSTEM_SETUP.md            # Táto dokumentácia
```

## 🔧 Implementované funkcie

### ✅ Core Infrastructure
- **CRON_SECRET authentication** - Zabezpečenie endpointov
- **Supabase Service Role integration** - Admin prístup k databáze
- **Error handling a logging** - Robustné error handling
- **Production build compatibility** - Pripravené na deployment

### ✅ NotificationService Class
```typescript
// Hlavné metódy
- findExpiringDocuments()        // Vyhľadá expirujúce dokumenty
- findWillsNeedingUpdate()       // Vyhľadá závety potrebujúce update
- findExpiringGuardians()        // Vyhľadá expirujúce guardian priradenia
- sendBatchNotifications()       // Pošle dávku notifikácií
```

### ✅ Email Templates
```typescript
EMAIL_TEMPLATES = {
  document_expiration: {
    subject: 'Document Expiration Reminder - LegacyGuard',
    html: '<p>Your document <strong>{{document_name}}</strong> is expiring in {{days}} days.</p>'
  },
  will_update_reminder: {
    subject: 'Will Update Reminder - LegacyGuard',
    html: '<p>It has been {{days}} days since your last will update. Please review.</p>'
  },
  guardian_expiration: {
    subject: 'Guardian Assignment Review - LegacyGuard',
    html: '<p>Your guardian assignment needs review after {{days}} days.</p>'
  }
}
```

## 🕒 Cron Schedule
- **Daily Expiration Check**: Každý deň o 9:00 UTC (`0 9 * * *`)
- **Dead Man's Switch**: Každý deň o 10:00 UTC (`0 10 * * *`)

## 🧪 Testovanie

### Lokálne testovanie:
```bash
# Štart development servera
npm run dev

# Test notifikačného systému
curl -X GET "http://localhost:3000/api/cron/check-expirations" \
  -H "Authorization: Bearer stronghold_cron_secret_2024_secure_token_xyz789"

# Expected response:
{
  "success": true,
  "message": "Expiration check completed successfully",
  "results": {
    "timestamp": "2025-09-30T14:28:34.927Z",
    "expiring_documents": [],
    "expiring_wills": [],
    "expiring_guardians": [],
    "notifications_sent": 0,
    "notification_results": []
  }
}
```

### Logovanie v konzole:
```
🔍 Starting daily expiration check... 2025-09-30T14:28:34.927Z
📄 Checking for expiring documents...
🔍 Checking for expiring documents...
📋 Found 0 documents to check for expiration
📋 Checking for wills needing updates...
🔍 Checking for wills needing updates...
📋 No will table implemented yet
👥 Checking for expiring guardian assignments...
🔍 Checking for expiring guardian assignments...
📋 Found 0 guardian assignments to check
📭 No notifications needed at this time
✅ Expiration check completed: {
  documents_checked: 0,
  wills_checked: 0,
  guardians_checked: 0,
  notifications_sent: 0,
  timestamp: '2025-09-30T14:28:34.927Z'
}
```

## 🚀 Deployment na Vercel

### 1. Environment Variables
V Vercel dashboard pridať:
```
CRON_SECRET = stronghold_cron_secret_2024_secure_token_xyz789
NEXT_PUBLIC_SUPABASE_URL = [your_supabase_url]
SUPABASE_SERVICE_ROLE_KEY = [your_service_role_key]
DATABASE_URL = [your_database_url]
```

### 2. Deploy projekt:
```bash
vercel deploy
```

### 3. Overiť cron job execution:
- V Vercel dashboard → Functions → Cron môžete monitorovať execution
- Check logs pre výstup z console.log statements

## 📊 Monitoring a Logging

### Cron Job Logs:
Všetky cron joby logujú do Vercel Function logs:
- ✅ Successful execution messages
- ❌ Error messages s detailami
- 📊 Summary statistics (documents_checked, notifications_sent, etc.)

### Key Log Messages:
```
🔍 Starting daily expiration check...
📧 [SKELETON] Would send document expiration notification: {...}
✅ Expiration check completed: {...}
❌ Error in check-expirations cron: {...}
```

## 🔮 Next Steps (Future Implementation)

### 🚧 TODO:
- [ ] **Skutočná email integrácia** (Resend, SendGrid, AWS SES)
- [ ] **Database schema updates** pre will table
- [ ] **Komplexná expiration logic** based on business rules
- [ ] **Template engine** pre dynamic email content
- [ ] **Rate limiting** pre email sending
- [ ] **Retry logic** pre failed notifications
- [ ] **User preferences** pre notification settings
- [ ] **Notification history** tracking
- [ ] **Email delivery status** monitoring

### 📧 Email Provider Integration:
```typescript
// Placeholder pre budúcu implementáciu
async function sendActualEmail(recipient: string, template: string, data: any) {
  // TODO: Integrate with actual email provider
  // Options: Resend.com, SendGrid, AWS SES, etc.
}
```

## 🛡️ Security

- **CRON_SECRET** authentication pre všetky endpoints
- **Supabase RLS** políky pre všetky databázové operácie
- **Environment variables** pre sensitive data
- **Error handling** bez leakage sensitive informácií

## 📝 Notes

- **Skeleton Implementation**: Všetko je pripravené ako kostra s placeholder funkčnosťou
- **Production Ready**: Build passes, deployment ready
- **Comprehensive Logging**: Všetky akcie sú detailne logované
- **Modular Design**: Ľahko rozšíriteľné pre budúce features

---

## ✅ Status: COMPLETED

**Notifikačný systém kostra je úspešne implementovaná a pripravená na deployment!**

Všetky požadované body sú splnené:
- [x] Vytvorený `/app/api/cron/check-expirations/route.ts`
- [x] Implementovaná základná logika s CRON_SECRET overením
- [x] Vytvorený Supabase client so service_role_key
- [x] Implementované console.log správy namiesto reálnych emailov
- [x] Ready pre deployment na Vercel s denným spúšťaním