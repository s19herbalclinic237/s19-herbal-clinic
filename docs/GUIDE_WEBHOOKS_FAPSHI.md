# 🔔 Guide des Webhooks Fapshi - SavoirNet

## 📌 Comprendre les 2 URLs de callback

### Return URL (redirectUrl)
```
User paie → Fapshi traite → User redirigé vers return_url
```
- **URL**: `https://votredomaine.com/payment/callback`
- **Type**: Redirection navigateur
- **Quand**: Après que l'utilisateur a payé (succès ou annulation)
- **Authentification**: Oui (filter auth)
- **Utilité**: Afficher une page de confirmation à l'utilisateur

### Webhook URL
```
User paie → Fapshi traite → Fapshi envoie POST au webhook → Activation compte
```
- **URL**: `https://votredomaine.com/payment/webhook-fapshi`
- **Type**: Appel serveur-à-serveur (invisible pour l'user)
- **Quand**: Quand le paiement est confirmé par Fapshi
- **Authentification**: Non (accès public)
- **Utilité**: **C'EST LUI QUI ACTIVE RÉELLEMENT LE COMPTE**

⚠️ **IMPORTANT**: Le webhook est CRITIQUE ! Sans lui, les paiements ne seront jamais confirmés automatiquement.

---

## 🏠 DÉVELOPPEMENT LOCAL

### Problème
❌ `http://localhost:8080/payment/webhook-fapshi`
- Fapshi ne peut PAS accéder à votre localhost

### Solution : Ngrok

#### Étape 1: Installer Ngrok
```bash
# Téléchargez depuis: https://ngrok.com/download
# Ou avec chocolatey sur Windows:
choco install ngrok

# Ou téléchargement direct:
https://ngrok.com/download
```

#### Étape 2: Lancer Ngrok
```bash
# Dans un terminal séparé
ngrok http 8080
```

Vous obtiendrez:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:8080
```

#### Étape 3: Mettre à jour .env (développement)
```bash
# Dans votre .env LOCAL
FAPSHI_return_url = 'https://abc123.ngrok.io/payment/callback'
FAPSHI_webhook_url = 'https://abc123.ngrok.io/payment/webhook-fapshi'
```

#### Étape 4: Tester
1. Créez un paiement test
2. Dans le dashboard ngrok (`http://localhost:4040`), vous verrez les requêtes webhook en temps réel
3. Vérifiez les logs dans `writable/logs/`

---

## 🌐 PRODUCTION

### Prérequis

#### 1. Domaine configuré ✅
```
votredomaine.com → Votre serveur
```

#### 2. Certificat SSL installé 🔒
```bash
# Vérifiez:
curl https://votredomaine.com
# ✅ Doit fonctionner sans erreur SSL
```

#### 3. Routes accessibles 🌐
```bash
# Testez que le webhook est accessible:
curl -X POST https://votredomaine.com/payment/webhook-fapshi \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'

# ✅ Doit retourner: {"status":"error","message":"Payment not found"}
# (C'est normal, ça prouve que le webhook est accessible)
```

### Configuration Production

#### 1. URLs dans .env
```bash
# Production .env
CI_ENVIRONMENT = production

# ⚠️ Utilisez l'API de PRODUCTION Fapshi
FAPSHI_url_api = 'https://live.fapshi.com/initiate-pay'

# Clés de PRODUCTION (demandez-les à Fapshi)
FAPSHI_API_KEY = 'FAK_PROD_XXXXXXXX'
FAPSHI_USER_KEY = 'uuid-production'

# URLs HTTPS publiques
FAPSHI_return_url = 'https://votredomaine.com/payment/callback'
FAPSHI_webhook_url = 'https://votredomaine.com/payment/webhook-fapshi'
```

#### 2. Configuration chez Fapshi
Connectez-vous au dashboard Fapshi et:
1. Passez en mode Production
2. Générez vos clés API de production
3. Enregistrez votre webhook URL: `https://votredomaine.com/payment/webhook-fapshi`
4. Whitelist votre domaine si nécessaire

#### 3. Permissions serveur
```bash
# Sur votre serveur Linux
chmod 775 writable/logs
chmod 775 writable/session

# Vérifiez que Apache/Nginx peut écrire
ls -la writable/
```

---

## 🧪 TESTER LE WEBHOOK

### En développement (avec ngrok)

```bash
# Terminal 1: Lancez votre serveur
cd C:\xampplastversion\htdocs\SavoirNet
php spark serve

# Terminal 2: Lancez ngrok
ngrok http 8080

# Terminal 3: Surveillez les logs
tail -f writable/logs/log-*.log
```

### Simuler un webhook manuellement

#### Option 1: Interface Web (Développement uniquement)
```
http://localhost:8080/payment/test-webhook
```
- Sélectionnez une transaction pending
- Simulez le webhook
- Vérifiez l'activation du compte

#### Option 2: Curl
```bash
# Récupérez un transId d'une transaction test
# Puis envoyez:

curl -X POST http://localhost:8080/payment/webhook-fapshi \
  -H "Content-Type: application/json" \
  -d '{
    "transId": "FAPSHI_TEST_12345",
    "status": "SUCCESSFUL",
    "amount": 15000,
    "externalId": "1",
    "userId": "1",
    "medium": "momo"
  }'
```

### Vérifier que le webhook fonctionne

✅ **Checklist après un webhook**:

1. **Transaction mise à jour**
   ```sql
   SELECT status, webhook_received, transaction_number
   FROM payment_transactions
   WHERE id = 1;
   -- status = 'paid', webhook_received = 1
   ```

2. **Utilisateur activé**
   ```sql
   SELECT has_paid, payment_date, wallet_balance
   FROM users
   WHERE id = 1;
   -- has_paid = 1, payment_date = maintenant
   ```

3. **Commissions distribuées**
   ```sql
   SELECT * FROM referrals WHERE referred_id = 1;
   -- 4 lignes (niveaux 1-4) si l'user avait un parrain
   ```

4. **Logs présents**
   ```bash
   grep "Fapshi Webhook" writable/logs/log-*.log
   # Doit afficher: "Fapshi webhook processed"
   ```

---

## 🚨 DÉPANNAGE

### Problème: Webhook jamais reçu

#### Causes possibles:
1. **URL non accessible**
   ```bash
   # Testez depuis un autre serveur:
   curl https://votredomaine.com/payment/webhook-fapshi
   ```

2. **Firewall bloque Fapshi**
   - Contactez Fapshi pour leur plage d'IPs
   - Whitelist leurs IPs dans votre firewall

3. **Webhook non configuré chez Fapshi**
   - Vérifiez dans votre dashboard Fapshi

4. **Certificat SSL invalide**
   ```bash
   # Vérifiez:
   curl -v https://votredomaine.com/payment/webhook-fapshi
   # Cherchez "SSL certificate problem"
   ```

### Problème: Webhook reçu mais compte non activé

Vérifiez les logs:
```bash
grep -A 5 "Fapshi Webhook" writable/logs/log-*.log
```

Causes communes:
- `transId` ne correspond à aucune transaction
- `status` n'est pas "SUCCESSFUL"
- Erreur dans `activateUserAccess()`

---

## 📊 MONITORING EN PRODUCTION

### Logs à surveiller
```bash
# Webhooks reçus
grep "Fapshi Webhook Received" writable/logs/log-$(date +%Y-%m-%d).log

# Webhooks échoués
grep "Fapshi.*error" writable/logs/log-$(date +%Y-%m-%d).log | grep -i webhook

# Transactions en attente depuis plus de 1h
SELECT * FROM payment_transactions
WHERE status = 'pending'
AND created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR);
```

### Alertes à configurer
1. Webhook timeout > 5 secondes
2. Transaction pending > 15 minutes
3. Webhook erreur (status 500)
4. Ratio success/failure < 95%

---

## 📚 RÉFÉRENCES

### Structure du webhook Fapshi
```json
{
  "transId": "FAPSHI_ABC123",
  "status": "SUCCESSFUL",  // ou FAILED, CANCELLED
  "amount": 15000,
  "externalId": "payment_id",
  "userId": "user_id",
  "medium": "momo",  // momo, om, etc.
  "dateConfirmed": "2025-01-31 12:34:56"
}
```

### Routes concernées (app/Config/Routes.php)
```php
Line 44: $routes->get('callback', 'Payment::callback', ['filter' => 'auth']);
Line 50: $routes->post('webhook-fapshi', 'Payment::webhookFapshi');  // Pas de filter!
```

### Code webhook (app/Controllers/Payment.php)
```
Line 366-431: webhookFapshi()
Line 436-485: activateUserAccess()
```

---

## ✅ CHECKLIST AVANT MISE EN PRODUCTION

- [ ] Certificat SSL valide (Let's Encrypt)
- [ ] Domaine accessible publiquement
- [ ] URLs webhook testées avec curl
- [ ] Clés API de production obtenues auprès de Fapshi
- [ ] Webhook URL enregistré dans dashboard Fapshi
- [ ] `.env` configuré avec URLs HTTPS
- [ ] `CI_ENVIRONMENT = production`
- [ ] `FAPSHI_url_api` pointant vers production
- [ ] Firewall autorise les IPs de Fapshi
- [ ] Logs accessibles en écriture
- [ ] Test complet avec vraie transaction
- [ ] Monitoring/alertes configurés

---

## 🆘 SUPPORT

Si les webhooks ne fonctionnent toujours pas:

1. **Contactez Fapshi Support**
   - Vérifiez leur documentation à jour
   - Demandez leur plage d'IPs
   - Confirmez la structure du webhook

2. **Utilisez les logs détaillés**
   ```php
   // Dans Payment.php, le logging est déjà activé
   log_message('info', 'Fapshi Webhook Received: ' . $rawData);
   ```

3. **Service tiers de test de webhooks**
   - [Webhook.site](https://webhook.site)
   - [RequestBin](https://requestbin.com)
   - Utilisez-les pour capturer un vrai webhook Fapshi

Bonne chance ! 🚀
