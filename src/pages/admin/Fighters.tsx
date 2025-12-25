import { useEffect, useState } from 'react';
import { Plus, Search, MoreVertical, Pencil, Trash2, User, RefreshCw, AlertCircle } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { fighterService, Fighter } from '@/services/FighterService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

export default function AdminFighters() {
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingFighter, setEditingFighter] = useState<Fighter | null>(null);
  const [fighterToDelete, setFighterToDelete] = useState<Fighter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Form state with validation errors
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    stable: '',
    weight: '',
    height: '',
  });

  const [formErrors, setFormErrors] = useState({
    name: '',
    weight: '',
    height: '',
  });

  useEffect(() => {
    loadFighters();
  }, []);

  const loadFighters = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fighterService.getFighters();
      console.log('[Admin Fighters] Loaded fighters:', response.data?.length || 0);

      if (response.data) {
        setFighters(response.data);
        if (response.data.length === 0) {
          setError('Aucun combattant trouvé. Ajoutez-en un pour commencer.');
        }
      } else {
        throw new Error('Aucune donnée reçue de l\'API');
      }
    } catch (error: any) {
      console.error('[Admin Fighters] Error loading fighters:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erreur lors du chargement des combattants';
      setError(errorMessage);
      toast({
        title: 'Erreur de chargement',
        description: errorMessage,
        variant: 'destructive',
      });
      setFighters([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const validateForm = (): boolean => {
    const errors = {
      name: '',
      weight: '',
      height: '',
    };

    let isValid = true;

    // Validate name
    if (!formData.name.trim()) {
      errors.name = 'Le nom est requis';
      isValid = false;
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Le nom doit contenir au moins 2 caractères';
      isValid = false;
    }

    // Validate weight
    if (formData.weight && parseFloat(formData.weight) <= 0) {
      errors.weight = 'Le poids doit être supérieur à 0';
      isValid = false;
    }

    // Validate height
    if (formData.height && parseFloat(formData.height) <= 0) {
      errors.height = 'La taille doit être supérieure à 0';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: 'Validation échouée',
        description: 'Veuillez corriger les erreurs dans le formulaire',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        nickname: formData.nickname.trim() || undefined,
        stable: formData.stable.trim() || undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
      };

      let response;

      if (editingFighter) {
        response = await fighterService.updateFighter(editingFighter.id, payload);
      } else {
        response = await fighterService.createFighter(payload);
      }

      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: 'Succès',
        description: `${formData.name} a été ${editingFighter ? 'mis à jour' : 'créé'} avec succès`,
      });

      setDialogOpen(false);
      resetForm();
      await loadFighters(true); // Refresh with spinner
    } catch (error: any) {
      console.error('[Admin Fighters] Error submitting:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erreur lors de l\'opération';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (fighter: Fighter) => {
    setFighterToDelete(fighter);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!fighterToDelete) return;

    setDeleting(fighterToDelete.id);
    try {
      await fighterService.deleteFighter(fighterToDelete.id);
      toast({
        title: 'Succès',
        description: `${fighterToDelete.name} a été supprimé avec succès`,
      });
      setDeleteDialogOpen(false);
      setFighterToDelete(null);
      await loadFighters(true);
    } catch (error: any) {
      console.error('[Admin Fighters] Error deleting:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erreur lors de la suppression';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  const openEditDialog = (fighter: Fighter) => {
    setEditingFighter(fighter);
    setFormData({
      name: fighter.name,
      nickname: fighter.nickname || '',
      stable: fighter.stable || '',
      weight: fighter.weight?.toString() || '',
      height: fighter.height?.toString() || '',
    });
    setFormErrors({ name: '', weight: '', height: '' });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingFighter(null);
    setFormData({ name: '', nickname: '', stable: '', weight: '', height: '' });
    setFormErrors({ name: '', weight: '', height: '' });
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      ACTIVE: 'Actif',
      INJURED: 'Blessé',
      RETIRED: 'Retraité',
      SUSPENDED: 'Suspendu',
      INACTIVE: 'Inactif',
    };
    return labels[status] || status;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'INJURED':
        return 'destructive';
      case 'RETIRED':
      case 'SUSPENDED':
      case 'INACTIVE':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const filteredFighters = fighters.filter(
    (fighter) =>
      fighter.name.toLowerCase().includes(search.toLowerCase()) ||
      fighter.nickname?.toLowerCase().includes(search.toLowerCase()) ||
      fighter.stable?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout title="Combattants">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Chargement des combattants...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Combattants">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un combattant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => loadFighters(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button variant="gold" onClick={openCreateDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingFighter ? 'Modifier le combattant' : 'Nouveau combattant'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                      }}
                      placeholder="Ex: Modou Lô"
                      className={formErrors.name ? 'border-destructive' : ''}
                    />
                    {formErrors.name && (
                      <p className="text-sm text-destructive">{formErrors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nickname">Surnom</Label>
                    <Input
                      id="nickname"
                      value={formData.nickname}
                      onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                      placeholder="Ex: Le Roi des Arènes"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stable">Écurie</Label>
                    <Input
                      id="stable"
                      value={formData.stable}
                      onChange={(e) => setFormData({ ...formData, stable: e.target.value })}
                      placeholder="Ex: Écurie Fass"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weight">Poids (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.weight}
                        onChange={(e) => {
                          setFormData({ ...formData, weight: e.target.value });
                          if (formErrors.weight) setFormErrors({ ...formErrors, weight: '' });
                        }}
                        placeholder="120"
                        className={formErrors.weight ? 'border-destructive' : ''}
                      />
                      {formErrors.weight && (
                        <p className="text-sm text-destructive">{formErrors.weight}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Taille (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.height}
                        onChange={(e) => {
                          setFormData({ ...formData, height: e.target.value });
                          if (formErrors.height) setFormErrors({ ...formErrors, height: '' });
                        }}
                        placeholder="185"
                        className={formErrors.height ? 'border-destructive' : ''}
                      />
                      {formErrors.height && (
                        <p className="text-sm text-destructive">{formErrors.height}</p>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={submitting}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="gold"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        {editingFighter ? 'Mise à jour...' : 'Création...'}
                      </>
                    ) : (
                      editingFighter ? 'Mettre à jour' : 'Créer'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Error State */}
        {error && fighters.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <AlertCircle className="w-12 h-12 text-muted-foreground" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Aucun combattant</h3>
              <p className="text-sm text-muted-foreground max-w-md">{error}</p>
            </div>
            <Button variant="gold" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter le premier combattant
            </Button>
          </div>
        )}

        {/* Empty Search Results */}
        {!error && fighters.length > 0 && filteredFighters.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Search className="w-12 h-12 text-muted-foreground" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Aucun résultat</h3>
              <p className="text-sm text-muted-foreground">
                Aucun combattant ne correspond à votre recherche "{search}"
              </p>
            </div>
            <Button variant="outline" onClick={() => setSearch('')}>
              Réinitialiser la recherche
            </Button>
          </div>
        )}

        {/* Fighters Grid */}
        {filteredFighters.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredFighters.length} combattant{filteredFighters.length > 1 ? 's' : ''}
                {search && ` trouvé${filteredFighters.length > 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFighters.map((fighter) => (
                <div key={fighter.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        {fighter.profileImage ? (
                          <img
                            src={fighter.profileImage}
                            alt={fighter.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-foreground truncate">{fighter.name}</h3>
                        {fighter.nickname && (
                          <p className="text-sm text-muted-foreground truncate">{fighter.nickname}</p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="flex-shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(fighter)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => confirmDelete(fighter)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {fighter.stable && (
                    <p className="text-sm text-muted-foreground mb-3 truncate" title={fighter.stable}>
                      {fighter.stable}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {fighter.wins || 0}V
                    </Badge>
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      {fighter.losses || 0}D
                    </Badge>
                    {(fighter.draws || 0) > 0 && (
                      <Badge variant="secondary">{fighter.draws}N</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={getStatusVariant(fighter.status)}
                      className={fighter.status === 'ACTIVE' ? 'bg-accent hover:bg-accent' : ''}
                    >
                      {getStatusLabel(fighter.status)}
                    </Badge>
                    {fighter.weight && (
                      <Badge variant="outline" className="text-xs">
                        {fighter.weight} kg
                      </Badge>
                    )}
                    {fighter.height && (
                      <Badge variant="outline" className="text-xs">
                        {fighter.height} cm
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer <strong>{fighterToDelete?.name}</strong> ?
              Cette action est irréversible et supprimera également toutes les données associées à ce combattant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!!deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
