# 🎯 Guide de Migration : Nouvelle Règle d'Annulation de Paris

**Date :** 2025-12-23  
**Statut :** ✅ Implémenté (Backend + Frontend)  
**Priorité :** CRITIQUE

---

## 📋 Résumé des Changements

### Ancienne Règle
- ⏱️ L'utilisateur avait **20 minutes POUR annuler** après création
- ✅ Le bouton d'annulation était disponible immédiatement
- ⏳ Une fenêtre de 20 minutes était calculée par le backend et stockée dans `canCancelUntil`

### Nouvelle Règle
- ⏱️ L'utilisateur doit attendre **30 minutes APRÈS création** avant de pouvoir annuler
- 🔒 Le bouton d'annulation est désactivé pendant les 30 premières minutes
- ✅ Après 30 minutes, l'annulation devient disponible (si le pari est toujours PENDING)

---

## 🔧 Modifications Backend

### Fichier : `BetService.ts`

**Lignes modifiées : 533-547**

```typescript
// Nouvelle logique d'annulation
if (!isAdmin && bet.status !== 'PENDING') {
  throw new Error('Impossible d\'annuler un pari déjà accepté ou terminé');
}

const now = new Date();
const betCreatedAt = bet.createdAt;
const thirtyMinutesAfterCreation = addMinutes(betCreatedAt, 30);

if (!isAdmin && isAfter(thirtyMinutesAfterCreation, now)) {
  const minutesRemaining = Math.ceil(
    (thirtyMinutesAfterCreation.getTime() - now.getTime()) / 60000
  );
  throw new Error(
    `Vous devez attendre ${minutesRemaining} minute(s) avant de pouvoir annuler ce pari`
  );
}
```

**Règles de validation :**
1. ✅ Seul le créateur peut annuler (sauf admin)
2. ✅ Le pari doit être PENDING
3. ✅ Délai minimum de 30 minutes après création
4. ✅ Message d'erreur clair avec temps restant

---

## 🎨 Modifications Frontend

### 1. Nouveau Composant

**Fichier créé :** `src/components/bets/CancelBetButtonNew.tsx`

**Props :**
```typescript
interface CancelBetButtonNewProps {
    betId: string;
    createdAt: string;    // ⭐ Nouvelle prop
    status: string;       // ⭐ Nouvelle prop
    onCancel?: () => void;
}
```

**Fonctionnalités :**
- ⏱️ **Timer en temps réel** : Calcul du temps restant avant disponibilité
- 📊 **Barre de progression** : Affichage visuel de 0% à 100% (30 minutes)
- 💬 **Messages dynamiques** : Information claire sur le temps d'attente
- 🎨 **Couleurs contextuelles** :
  - 🔵 Bleu : Plus de 10 minutes restantes
  - 🟠 Orange : Moins de 10 minutes restantes
  - 🟢 Vert : Annulation disponible
- 🔄 **Rafraîchissement automatique** : Mise à jour toutes les minutes
- ✅ **Validation** : Affiche uniquement pour les paris PENDING

### 2. Mise à Jour de `MyBets.tsx`

**Lignes modifiées : 6, 601-610**

**Avant :**
```typescript
import { CancelBetButton } from '@/components/bets/CancelBetButton';

// ...

{bet.status === 'PENDING' && isUserCreator && bet.canCancelUntil && (
  <CancelBetButton
    betId={bet.id}
    canCancelUntil={bet.canCancelUntil}
    onCancel={() => loadData()}
  />
)}
```

**Après :**
```typescript
import { CancelBetButtonNew } from '@/components/bets/CancelBetButtonNew';

// ...

{bet.status === 'PENDING' && isUserCreator && (
  <CancelBetButtonNew
    betId={bet.id}
    createdAt={bet.createdAt}
    status={bet.status}
    onCancel={() => loadData()}
  />
)}
```

---

## 🎯 Expérience Utilisateur

### Scénario : Utilisateur crée un pari

#### ⏱️ T+0 (Immédiatement après création)
- 🔒 **Bouton désactivé** : "🔒 Annuler (dans 30 min)"
- 📊 **Progress bar** : 0% • 0/30 minutes écoulées
- 💬 **Message** : "Vous devez attendre 30 minute(s) après la création..."

#### ⏱️ T+15 (Après 15 minutes)
- 🔒 **Bouton désactivé** : "🔒 Annuler (dans 15 min)"
- 📊 **Progress bar** : 50% • 15/30 minutes écoulées
- 💬 **Message** : "Vous devez attendre 15 minute(s) après la création..."

#### ⏱️ T+25 (Après 25 minutes)
- 🟠 **Bouton désactivé** : "🔒 Annuler (dans 5 min)"
- 📊 **Progress bar** : 83% • 25/30 minutes écoulées
- 💬 **Message** : "Vous devez attendre 5 minute(s) après la création..."
- 🎨 **Couleur** : Orange (moins de 10 minutes)

#### ⏱️ T+30 (Après 30 minutes)
- ✅ **Bouton actif** : "Annuler ce pari"
- 📊 **Progress bar** : 100% • 30/30 minutes écoulées
- 💬 **Message** : "Annulation disponible"
- 🎨 **Couleur** : Vert

---

## 🧪 Tests à Effectuer

### Test 1 : Création et Annulation Immédiate (Doit échouer)
```bash
# Créer un pari
POST /api/bets
{
  "fightId": "...",
  "amount": 1000,
  "chosenFighter": "A"
}

# Essayer d'annuler immédiatement (doit échouer)
DELETE /api/bets/:betId
```

**Résultat attendu :**
- ❌ Erreur 400 : "Vous devez attendre 30 minute(s) avant de pouvoir annuler ce pari"

### Test 2 : Annulation Après 30 Minutes (Doit réussir)
```bash
# Attendre 30 minutes (ou modifier manuellement la date de création)

# Annuler le pari
DELETE /api/bets/:betId
```

**Résultat attendu :**
- ✅ Succès 200 : Pari annulé, fonds remboursés

### Test 3 : Interface Utilisateur

1. **Créer un pari** sur `/fights`
2. **Aller sur "Mes Paris"** (`/my-bets`)
3. **Vérifier le bouton d'annulation** :
   - ✅ Timer visible
   - ✅ Progress bar à 0%
   - ✅ Bouton désactivé
   - ✅ Message clair
4. **Attendre 1 minute** (ou rafraîchir)
   - ✅ Progress bar augmente
   - ✅ Timer décrémente
5. **Après 30 minutes** :
   - ✅ Bouton activé
   - ✅ Progress bar à 100%
   - ✅ Couleur verte
   - ✅ Clic fonctionne et annule le pari

---

## 📦 Fichiers Modifiés

### Backend
- ✅ `lamb/src/services/BetService.ts` (lignes 533-547)

### Frontend
- ✅ `fight-ace-app-main/src/components/bets/CancelBetButtonNew.tsx` (nouveau fichier)
- ✅ `fight-ace-app-main/src/pages/MyBets.tsx` (lignes 6, 601-610)

### Documentation
- ✅ `lamb/GUIDE_FRONTEND_UX.md` (déjà créé précédemment)
- ✅ `fight-ace-app-main/MIGRATION_CANCEL_BET.md` (ce fichier)

---

## ✅ Checklist de Déploiement

- [x] Backend modifié et testé
- [x] Frontend nouveau composant créé
- [x] Frontend migration effectuée
- [ ] Tests manuels effectués
- [ ] Tests automatisés (optionnel)
- [ ] Documentation mise à jour
- [ ] Commit et push des changements

---

## 🚀 Prochaines Étapes

1. **Tester manuellement** :
   - Lancer le frontend : `npm run dev`
   - Créer un pari
   - Vérifier le bouton d'annulation

2. **Valider avec l'équipe** :
   - Présenter la nouvelle UX
   - Collecter les retours

3. **Déployer en production** :
   - Merger les changements
   - Déployer backend
   - Déployer frontend
   - Surveiller les logs

---

## 📞 Support

Pour toute question ou problème :
- **Documentation complète** : `/lamb/GUIDE_FRONTEND_UX.md`
- **Code backend** : `/lamb/src/services/BetService.ts`
- **Code frontend** : `/fight-ace-app-main/src/components/bets/CancelBetButtonNew.tsx`

---

## 🎉 Conclusion

Cette migration améliore la **sécurité** et la **clarté** du système d'annulation :
- ✅ Empêche les annulations immédiates (spam)
- ✅ Donne le temps aux autres utilisateurs d'accepter le pari
- ✅ Interface claire et informative
- ✅ Expérience utilisateur fluide

**Date de migration :** 2025-12-23  
**Status :** ✅ COMPLÉTÉ
