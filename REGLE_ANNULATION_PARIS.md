# 🔒 Règle Critique : Annulation de Paris

## ⚠️ Règle métier implémentée

**Un pari ne peut être annulé QUE si :**
1. ✅ Le statut est **`PENDING`** (en attente)
2. ✅ L'utilisateur est le **créateur** du pari
3. ✅ Le délai de **30 minutes** après création est écoulé
4. ❌ Le pari n'a **PAS été accepté** par un autre utilisateur

**Dès qu'un pari est accepté (`ACCEPTED`), le bouton d'annulation disparaît automatiquement.**

---

## 📋 Implémentation actuelle

### 1. **Page MyBets.tsx** (ligne 659-668)

Le bouton d'annulation s'affiche UNIQUEMENT si :

```typescript
{bet.status === 'PENDING' && isUserCreator && (
  <div className="border-t pt-3 mt-3">
    <CancelBetButtonNew
      betId={bet.id}
      createdAt={bet.createdAt}
      status={bet.status}
      onCancel={() => loadData()}
    />
  </div>
)}
```

✅ **Double vérification** :
- `bet.status === 'PENDING'` → Statut non accepté
- `isUserCreator` → Utilisateur est le créateur

---

### 2. **Composant CancelBetButtonNew.tsx** (ligne 112-114)

Protection supplémentaire au niveau du composant :

```typescript
// Ne rien afficher si le pari n'est pas PENDING
if (status !== 'PENDING') {
    return null;
}
```

✅ **Triple protection** : Même si le composant est rendu par erreur, il ne s'affichera pas

---

## 🎯 Workflow utilisateur

### Scénario 1 : Pari en attente (PENDING)

```
1. Utilisateur A crée un pari → Status: PENDING
2. ✅ Bouton "Annuler" visible (30 min après création)
3. Utilisateur A peut annuler → Remboursement intégral
```

### Scénario 2 : Pari accepté (ACCEPTED)

```
1. Utilisateur A crée un pari → Status: PENDING
2. Utilisateur B accepte le pari → Status: ACCEPTED
3. ❌ Bouton "Annuler" DISPARAÎT immédiatement
4. Les deux utilisateurs sont engagés jusqu'au résultat
```

### Scénario 3 : Tentative d'annulation après acceptation

```
1. Utilisateur A voit son pari en PENDING
2. Pendant qu'il regarde, Utilisateur B accepte
3. WebSocket envoie notification → loadData()
4. État mis à jour → status = ACCEPTED
5. ❌ Bouton disparaît automatiquement
```

---

## 🔐 Sécurité multi-niveaux

### Niveau 1 : Frontend (MyBets.tsx)
```typescript
bet.status === 'PENDING' && isUserCreator
```

### Niveau 2 : Composant (CancelBetButtonNew.tsx)
```typescript
if (status !== 'PENDING') return null;
```

### Niveau 3 : Backend (à vérifier)
Le backend doit également vérifier :
- Statut = PENDING
- Utilisateur = créateur
- Délai de 30 min respecté
- Pari n'est pas accepté

---

## 📊 États de paris et annulation

| Statut | Bouton visible ? | Peut annuler ? | Raison |
|--------|-----------------|----------------|---------|
| `PENDING` | ✅ OUI (créateur uniquement) | ✅ OUI (après 30 min) | Pari en attente |
| `ACCEPTED` | ❌ NON | ❌ NON | **Pari accepté, engagement mutuel** |
| `WON` | ❌ NON | ❌ NON | Combat terminé |
| `LOST` | ❌ NON | ❌ NON | Combat terminé |
| `CANCELLED` | ❌ NON | ❌ NON | Déjà annulé |
| `REFUNDED` | ❌ NON | ❌ NON | Déjà remboursé |

---

## 🔄 Synchronisation temps réel

### WebSocket events écoutés (MyBets.tsx, ligne 238-242)

```typescript
webSocketService.on(WebSocketMessageType.BET_ACCEPTED, handleBetUpdate);
```

✅ **Mise à jour immédiate** : Quand un pari est accepté, tous les clients reçoivent la notification et rechargent les données

---

## ⏱️ Délai de 30 minutes

### Règle actuelle (ligne 27-28)
```typescript
/**
 * Nouvelle règle: Délai minimum de 30 minutes APRÈS création
 * (au lieu de 20 minutes POUR annuler)
 */
```

### Implémentation (ligne 42)
```typescript
const thirtyMinutesLater = new Date(created.getTime() + 30 * 60 * 1000);
```

✅ **Timer visuel** :
- Barre de progression (0-100%)
- Minutes restantes affichées
- Bouton désactivé tant que délai non écoulé

---

## 🧪 Tests recommandés

### Test 1 : Vérifier disparition du bouton
1. Créer un pari
2. Depuis un autre compte, accepter le pari
3. ✅ Vérifier que le bouton d'annulation disparaît sur le compte créateur

### Test 2 : Protection backend
1. Créer un pari
2. L'accepter depuis un autre compte
3. Tenter d'appeler l'API d'annulation directement
4. ✅ Backend doit retourner erreur 403 ou 400

### Test 3 : Synchronisation temps réel
1. Ouvrir deux navigateurs
2. Créer pari sur navigateur A
3. Accepter sur navigateur B
4. ✅ Navigateur A doit mettre à jour l'état automatiquement

---

## 📝 Recommandations

### Frontend ✅
- [x] Double vérification (page + composant)
- [x] Mise à jour temps réel (WebSocket)
- [x] Affichage conditionnel

### Backend ⚠️ À vérifier
- [ ] Validation du statut PENDING
- [ ] Validation que user = creator
- [ ] Vérification que pari n'est pas accepté
- [ ] Tests unitaires pour cette règle

---

**Date** : 2024-12-24  
**Criticité** : 🔴 **HAUTE** - Règle métier essentielle  
**Status** : ✅ **IMPLÉMENTÉ** (Frontend) / ⚠️ **À VÉRIFIER** (Backend)
