import { useEffect, useState } from 'react';
import { Plus, Search, MoreVertical, Pencil, Trash2, User } from 'lucide-react';
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
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { fighterService, Fighter } from '@/services/FighterService';
import { adminService } from '@/services/AdminService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

const mockFighters: Fighter[] = [
  {
    id: '1',
    name: 'Modou Lô',
    nickname: 'Le Roi des Arènes',
    stable: 'Écurie Fass',
    wins: 25,
    losses: 2,
    draws: 1,
    status: 'ACTIVE',
    profileImage: '',
  },
  {
    id: '2',
    name: 'Balla Gaye 2',
    nickname: 'Le Lion de Guédiawaye',
    stable: 'Écurie Boul Falé',
    wins: 22,
    losses: 4,
    draws: 0,
    status: 'ACTIVE',
    profileImage: '',
  },
];

export default function AdminFighters() {
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFighter, setEditingFighter] = useState<Fighter | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    stable: '',
    weight: '',
    height: '',
  });

  useEffect(() => {
    loadFighters();
  }, []);

  const loadFighters = async () => {
    try {
      const response = await fighterService.getFighters();
      console.log('[Admin Fighters] Response:', response);
      if (response.data && response.data.length > 0) {
        setFighters(response.data);
      } else {
        console.log('[Admin Fighters] No data from API, using mock');
        setFighters(mockFighters);
      }
    } catch (error) {
      console.error('[Admin Fighters] Error loading fighters:', error);
      setFighters(mockFighters);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingFighter) {
        // Utiliser fighterService directement au lieu de adminService
        await fighterService.updateFighter(editingFighter.id, {
          name: formData.name,
          nickname: formData.nickname,
          stable: formData.stable,
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
          height: formData.height ? parseFloat(formData.height) : undefined,
        });
        toast({ title: 'Combattant mis à jour' });
      } else {
        await fighterService.createFighter({
          name: formData.name,
          nickname: formData.nickname,
          stable: formData.stable,
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
          height: formData.height ? parseFloat(formData.height) : undefined,
        });
        toast({ title: 'Combattant créé' });
      }
      setDialogOpen(false);
      resetForm();
      loadFighters();
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  const handleDelete = async (fighterId: string) => {
    try {
      await fighterService.deleteFighter(fighterId);
      toast({ title: 'Combattant supprimé' });
      loadFighters();
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' });
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
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingFighter(null);
    setFormData({ name: '', nickname: '', stable: '', weight: '', height: '' });
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
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
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
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button variant="gold">
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
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Modou Lô"
                  />
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
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      placeholder="120"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Taille (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      placeholder="185"
                    />
                  </div>
                </div>
                <Button variant="gold" className="w-full" onClick={handleSubmit}>
                  {editingFighter ? 'Mettre à jour' : 'Créer'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Fighters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFighters.map((fighter) => (
            <div key={fighter.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
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
                  <div>
                    <h3 className="font-bold text-foreground">{fighter.name}</h3>
                    {fighter.nickname && (
                      <p className="text-sm text-muted-foreground">{fighter.nickname}</p>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(fighter)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(fighter.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {fighter.stable && (
                <p className="text-sm text-muted-foreground mb-3">{fighter.stable}</p>
              )}

              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="text-accent border-accent">
                  {fighter.wins}V
                </Badge>
                <Badge variant="outline" className="text-destructive border-destructive">
                  {fighter.losses}D
                </Badge>
                {fighter.draws > 0 && (
                  <Badge variant="secondary">{fighter.draws}N</Badge>
                )}
              </div>

              <Badge
                variant={fighter.status === 'ACTIVE' ? 'default' : 'secondary'}
                className={fighter.status === 'ACTIVE' ? 'bg-accent' : ''}
              >
                {fighter.status === 'ACTIVE' ? 'Actif' : fighter.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
