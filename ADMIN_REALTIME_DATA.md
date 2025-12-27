# 🔄 DONNÉES TEMPS RÉEL PANEL ADMIN

## ❌ Problème identifié

Les données du panel admin n'étaient **PAS** persistantes ni dynamiques car :

1. ❌ Utilisation de `useState` + `useEffect` (pas de cache)
2. ❌ Pas d'invalidation automatique du cache
3. ❌ WebSocket mal intégré avec le state
4. ❌ Rafraîchissement manuel requis
5. ❌ Données obsolètes entre les mutations

---

## ✅ Solution implémentée

### 🎯 Custom Hooks React Query

**Fichier créé:** `src/hooks/useAdminData.ts`

#### Features:
- 🔄 **Auto-refetch** configurable par hook
- 💾 **Cache intelligent** (données persistantes)
- ⚡ **Mutations avec invalidation auto**
- 🎯 **Stale time** optimisé par type de données

#### Hooks disponibles:

```typescript
// Dashboard stats - Refetch toutes les 30s
const { data, isLoading } = useAdminDashboardStats();

// Analytics - Refetch toutes les 60s
const { data } = useAdminAnalytics();

// Retraits en attente - Refetch toutes les 10s
const { data: withdrawals } = useAdminPendingWithdrawals();

// Approuver retrait - Invalide cache auto
const approveMutation = useApproveWithdrawal();
approveMutation.mutate(withdrawal

Id);

// Rejeter retrait - Invalide cache auto
const rejectMutation = useRejectWithdrawal();
rejectMutation.mutate({ withdrawalId, reason });

// Bouton rafraîchir manuel
const refresh = useRefreshAdminData();
```

---

### 🔌 Synchronisation WebSocket automatique

**Fichier créé:** `src/hooks/useAdminWebSocketSync.ts`

#### Comportement:
Quand un événement WebSocket arrive, **invalide automatiquement** les queries React Query concernées:

| Événement WebSocket | Queries invalidées |
|---------------------|-------------------|
| `FIGHT_*` | Dashboard stats + Fights |
| `BET_*` | Dashboard stats + Bets |
| `TRANSACTION_*` | Dashboard stats + Withdrawals + Analytics |
| `WALLET_UPDATE` | Dashboard stats + Withdrawals |
| `USER_REGISTERED` | Dashboard stats + Users |

**Résultat:** Données mises à jour **instantanément** sans action utilisateur !

---

## 🔧 Comment ça fonctionne

### Avant (❌ Problématique)

```typescript
// Ancien code
const [data, setData] = useState([]);

useEffect(() => {
  loadData();  // Une seule fois au montage
}, []);

// WebSocket écoute mais ne met PAS à jour l'UI
webSocketService.on('event', () => {
  // ❌ Faut rappeler loadData() manuellement
  loadData();
});
```

**Problèmes:**
- Données chargées 1 seule fois
- Pas de cache entre pages
- Rafraîchissement manuel
- WebSocket déconnecté du state

### Après (✅ Solution)

```typescript
// Nouveau code
const { data, isLoading } = useAdminDashboardStats();
// ✅ Auto-refetch toutes les 30s
// ✅ Cache persistent entre pages
// ✅ Refetch intelligente (seulement si stale)

// WebSocket invalide automatiquement le cache
useAdminWebSocketSync(); // Dans AdminLayout
// ✅ WebSocket → Invalide query → Refetch auto → UI updated
```

**Avantages:**
- ✅ Données toujours à jour
- ✅ Cache entre pages (navigation rapide)
- ✅ Refetch intelligent (pas de spam API)
- ✅ WebSocket intégré automatiquement

---

## 📊 Configuration auto-refetch

| Hook | Intervalle | Stale Time | Usage |
|------|-----------|------------|-------|
| `useAdminDashboardStats` | 30s | 20s | Stats générales |
| `useAdminAnalytics` | 60s | 40s | Graphiques |
| `useAdminPendingWithdrawals` | **10s** | 5s | Retraits critiques |

**Explications:**
- **Intervalle**: Refetch toutes les X secondes en arrière-plan
- **Stale Time**: Considérer data comme "fraîche" pendant X secondes
- **Si stale**: React Query refetch automatiquement

---

## 🎯 Utilisation dans les composants Admin

### Avant

```typescript
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    
    webSocketService.on('event', loadData);
    
    return () => {
      clearInterval(interval);
      webSocketService.off('event', loadData);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    const res = await adminService.getDashboardStats();
    setStats(res.data);
    setLoading(false);
  };
  
  // ... render
}
```

### Après (simplifié)

```typescript
import { useAdminDashboardStats } from '@/hooks/useAdminData';
import { useAdminRealtimeSync } from '@/hooks/useAdminWebSocketSync';

export default function AdminDashboard() {
  // ✅ Données + Auto-refetch + Cache
  const { data: stats, isLoading } = useAdminDashboardStats();
  
  // ✅ WebSocket sync automatique
  useAdminRealtimeSync();
  
  // ✅ C'est tout ! Pas de useEffect, pas de cleanup
  
  // ... render avec stats
}
```

**Code réduit de ~50%** et beaucoup plus fiable !

---

## ⚡ Exemple concret: Withdrawals

### Avant

```typescript
const [withdrawals, setWithdrawals] = useState([]);

const handleApprove = async (id) => {
  await adminService.approveWithdrawal(id);
  // ❌ Faut recharger manuellement
  loadWithdrawals();
};
```

### Après

```typescript
const { data: withdrawals } = useAdminPendingWithdrawals();
const approveMutation = useApproveWithdrawal();

const handleApprove = (id) => {
  // ✅ React Query invalide le cache automatiquement
  approveMutation.mutate(id);
  // ✅ UI se met à jour toute seule !
};
```

---

## 🚀 Avantages

### ✅ Pour l'utilisateur (Admin)

- **Données toujours à jour** sans rafraîchir la page
- **Pas de lag** grâce au cache
- **Feedback instantané** sur les actions
- **Pas de données obsolètes**

### ✅ Pour les développeurs

- **Moins de code** (50% en moins)
- **Plus maintenable** (logique centralisée)
- **Plus fiable** (React Query gère les edge cases)
- **Meilleur DX** (hooks réutilisables)

### ✅ Pour le système

- **Moins de requêtes inutiles** (cache intelligent)
- **Optimistic updates** possibles
- **Synchronisation parfaite** backend ↔ frontend
- **Scalable** (facile d'ajouter de nouveaux hooks)

---

## 📝 TODO: Migration des pages

### À faire:

1. **Dashboard.tsx** - Utiliser `useAdminDashboardStats`
2. **Withdrawals.tsx** - Utiliser `useAdminPendingWithdrawals` + mutations
3. **Users.tsx** - Créer `useAdminUsers`
4. **Fights.tsx** - Créer `useAdminFights`
5. **AdminLayout** - Ajouter `useAdminRealtimeSync()`

### Pattern de migration:

```typescript
// 1. Importer les hooks
import { useAdminXXX } from '@/hooks/useAdminData';

// 2. Remplacer useState + useEffect
const { data, isLoading, error } = useAdminXXX();

// 3. Pour les mutations
const mutation = useXXXMutation();
mutation.mutate(params);

// 4. Supprimer les WebSocket manuels (déjà dans sync)
```

---

## 🔍 Debugging

### Activer React Query Devtools

```typescript
// Dans App.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  {/* ... */}
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

**Permet de voir:**
- Queries actives
- Cache state
- Refetch automatiques
- Mutations en cours

---

## ✅ Checklist

- [x] ✅ Custom hooks React Query créés
- [x] ✅ WebSocket sync automatique créé
- [x] ✅ Invalidation cache configurée
- [x] ✅ Auto-refetch configuré
- [ ] 🔲 Migrer Dashboard.tsx
- [ ] 🔲 Migrer Withdrawals.tsx
- [ ] 🔲 Migrer Users.tsx
- [ ] 🔲 Migrer Fights.tsx
- [ ] 🔲 Ajouter sync dans AdminLayout
- [ ] 🔲 Tester en production
- [ ] 🔲 Activer Devtools (dev uniquement)

---

**Status:** ✅ **HOOKS CRÉÉS - Prêts pour migration**  
**Impact:** Données temps réel + Cache persistent + Auto-refetch  
**Next:** Migrer les composants admin pour utiliser les hooks
