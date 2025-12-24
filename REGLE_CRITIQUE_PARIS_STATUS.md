# 🚨 RÈGLE CRITIQUE : Statut des combats et paris

## ⚠️ Règle de sécurité implémentée

**IMPORTANT** : Les paris ne peuvent être créés que sur les combats avec le statut **"SCHEDULED"** (programmé).

### Statuts des combats

| Statut | Description | Paris autorisés ? | Badge |
|--------|-------------|-------------------|-------|
| `SCHEDULED` | Combat programmé, à venir | ✅ **OUI** | 🔵 À VENIR |
| `ONGOING` | Combat en cours | ❌ **NON** | 🔴 EN DIRECT |
| `FINISHED` | Combat terminé | ❌ **NON** | 🟢 TERMINÉ |
| `CANCELLED` | Combat annulé | ❌ **NON** | ⚫ ANNULÉ |
| `POSTPONED` | Combat reporté | ❌ **NON** | 🟠 REPORTÉ |

## ✅ Implémentation actuelle

### 1. **Page FightDetails.tsx** (ligne 625)
```typescript
{fight.status === 'SCHEDULED' && (
  <Card>
    <CardContent className="p-6">
      <h2 className="text-xl font-bold mb-6">Créer un pari</h2>
      {/* Formulaire de pari */}
    </CardContent>
  </Card>
)}
```

✅ **Le formulaire de pari n'apparaît QUE si le combat est SCHEDULED**

### 2. **Page FightCard.tsx**
- Badge "EN DIRECT" pour status ONGOING
- Badge "À VENIR" pour status SCHEDULED
- Affichage du résultat pour status FINISHED

## 🔒 Sécurité Backend

Le backend doit également valider cette règle :

```typescript
// Dans BetController.createBet()
if (fight.status !== 'SCHEDULED') {
  throw new ForbiddenError('Les paris ne sont autorisés que pour les combats programmés');
}
```

## 📝 Améliorations recommandées

### À ajouter sur FightCard :

1. **Indicateur visuel "Paris fermés"** pour combats non-SCHEDULED
2. **Message explicatif** : "Les paris sont fermés pour ce combat"
3. **Badge désactivé** : Montrer clairement que les paris ne sont plus possibles

### À ajouter sur FightDetails :

1. **Message d'information** si le combat n'est pas SCHEDULED
2. **Raison de fermeture** : "Combat en cours", "Combat terminé", etc.

## 🎯 Workflow utilisateur

```
Combat SCHEDULED → ✅ Utilisateur peut parier
      ↓
Admin démarre combat (ONGOING) → ❌ Paris bloqués
      ↓
Combat se termine → Admin valide résultat → FINISHED → ❌ Paris bloqués
      ↓
Système distribue gains
```

## 🚀 Prochaines étapes

1. ✅ Vérifier validation backend
2. ✅ Ajouter tests unitaires pour cette règle
3. ✅ Documenter dans l'API Swagger
4. ✅ Ajouter messages d'erreur clairs
5. ✅ Implémenter indicateurs visuels sur UI

## 🔐 Points de sécurité

- **Frontend** : Masquer/désactiver bouton de pari
- **Backend** : Valider le statut avant création de pari
- **WebSocket** : Notifier clients quand statut change
- **Database** : Contrainte au niveau schéma si possible

---

**Date de documentation** : 2025-12-24  
**Criticité** : 🔴 **HAUTE** - Règle métier essentielle
