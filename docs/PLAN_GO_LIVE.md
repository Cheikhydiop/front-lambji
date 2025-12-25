# 🚀 Plan de Go-Live Commercial - Phase 3

Ce document liste les étapes critiques pour le lancement commercial de la plateforme Mbayar.

## 📅 Calendrier (Estimé : 4 semaines)

| Semaine | Phase | Actions Clés |
| :--- | :--- | :--- |
| **S1** | **Audit & Gel Technique** | Code Freeze, Audit de Sécurité final, Tests de charge (validés à 1000 users). |
| **S2** | **Formation & Beta** | Formation de l'équipe support, Beta privée avec 50 utilisateurs VIP. |
| **S3** | **Pré-Prod** | Déploiement infrastructure finale, Reset des données de test (Seed), Backup 0. |
| **S4** | **LANCEMENT** | Ouverture publique, Surveillance temps réel, Campagne Marketing. |

## ✅ Checklist de Validation Technique

### 1. Infrastructure & Performance
- [x] **Tests de Charge :** Validé (45 req/s API, 1200 req/s Front).
- [ ] **Dimensionnement Serveur :** Vérifier CPU/RAM pour supporter x2 la charge prévue.
- [ ] **Cache :** Redis configuré pour les sessions et les données fréquentes (Lutteurs).
- [ ] **Backup :** Sauvegarde automatique BDD configurée (Journalière + Streaming WAL).

### 2. Sécurité
- [ ] **HTTPS :** Certificats SSL valides et forcés (HSTS).
- [ ] **Variables d'env :** Secrets de prod (Clés API, JWT Secret) changés et sécurisés.
- [ ] **Rate Limiting :** Activé et calibré (actuellement 100/min, à ajuster selon trafic).
- [ ] **Logs :** Niveau de log passé à `WARN` ou `ERROR` (désactiver `DEBUG`).

### 3. Application (Fonctionnel)
- [ ] **Données Officielles :** Base de données nettoyée des lutteurs "Test". Import des vrais profils.
- [ ] **Wallet :** Vérification des callbacks de paiement (Wave/Orange) en mode Production.
- [ ] **Mobile :** Vérification du rendu PWA sur iOS et Android.

## 📢 Protocole de Lancement (Jour J)

1.  **T-2h :** Arrêt maintenance. Migration finale BDD.
2.  **T-1h :** "Smoke Test" par l'équipe interne (1 dépôt, 1 pari, 1 résultat).
3.  **T-0 :** Ouverture DNS / Accès public.
4.  **T+1h :** Surveillance des logs d'erreurs et de la latence.

## 🆘 Plan de Continuité (Rollback)

En cas de bug critique (ex: Erreur de calcul des gains, Crash serveur) :
1.  **Communication :** Basculer en "Maintenance Mode" (Page statique).
2.  **Diagnostic :** Analyser les logs (Sentry / Datadog).
3.  **Correction :** Hotfix sur branche `main`.
4.  **Rollback :** Si impossible à fixer < 1h, restaurer le Backup `T-2h` et rembourser les transactions de la période.

---
*Document de référence pour le Comité de Pilotage*
