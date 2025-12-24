import { useEffect, useState } from 'react';
import { Plus, Search, MoreVertical, Pencil, Trash2, Calendar, Eye, Users, X, AlertCircle } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { fightService, DayEvent, Fight } from '@/services/FightService';
import { fighterService, Fighter } from '@/services/FighterService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface FightFormData {
  title: string;
  fighterAId: string;
  fighterBId: string;
  oddsA: string;
  oddsB: string;
  scheduledAt: string;
}

export default function AdminEvents() {
  const [events, setEvents] = useState<DayEvent[]>([]);
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fightsDialogOpen, setFightsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<DayEvent | null>(null);
  const [eventFights, setEventFights] = useState<Fight[]>([]);
  const [loadingFights, setLoadingFights] = useState(false);
  const [editingEvent, setEditingEvent] = useState<DayEvent | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    date: '',
    location: '',
    venue: '',
  });

  // Liste des combats à créer avec l'événement
  const [pendingFights, setPendingFights] = useState<FightFormData[]>([]);

  // Formulaire pour ajouter un combat
  const [fightForm, setFightForm] = useState<FightFormData>({
    title: '',
    fighterAId: '',
    fighterBId: '',
    oddsA: '1.5',
    oddsB: '2.0',
    scheduledAt: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventsRes, fightersRes] = await Promise.all([
        fightService.getDayEvents(),
        fighterService.getFighters(),
      ]);

      if (eventsRes.data) setEvents(eventsRes.data);
      if (fightersRes.data) setFighters(fightersRes.data);
    } catch (error) {
      console.error('[Admin Events] Error loading data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEventFights = async (event: DayEvent) => {
    setSelectedEvent(event);
    setLoadingFights(true);
    setFightsDialogOpen(true);

    try {
      const response = await fightService.getDayEvent(event.id);

      if (response.data && response.data.fights) {
        setEventFights(response.data.fights);
      } else {
        setEventFights([]);
      }
    } catch (error) {
      console.error('[Admin Events] Error loading fights:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les combats',
        variant: 'destructive',
      });
      setEventFights([]);
    } finally {
      setLoadingFights(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const validateFightForm = (): boolean => {
    if (!fightForm.fighterAId || !fightForm.fighterBId) {
      toast({
        title: 'Validation échouée',
        description: 'Veuillez sélectionner les deux combattants',
        variant: 'destructive',
      });
      return false;
    }

    if (fightForm.fighterAId === fightForm.fighterBId) {
      toast({
        title: 'Erreur de validation',
        description: 'Un combattant ne peut pas se battre contre lui-même',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const addFightToPending = () => {
    if (!validateFightForm()) return;

    const fighterA = fighters.find(f => f.id === fightForm.fighterAId);
    const fighterB = fighters.find(f => f.id === fightForm.fighterBId);

    if (!fighterA || !fighterB) return;

    const title = fightForm.title || `${fighterA.name} vs ${fighterB.name}`;

    setPendingFights([...pendingFights, {
      ...fightForm,
      title,
    }]);

    // Réinitialiser le formulaire de combat
    setFightForm({
      title: '',
      fighterAId: '',
      fighterBId: '',
      oddsA: '1.5',
      oddsB: '2.0',
      scheduledAt: formData.date, // Utiliser la date de l'événement
    });

    toast({
      title: 'Combat ajouté',
      description: `${title} sera créé avec l'événement`,
    });
  };

  const removePendingFight = (index: number) => {
    setPendingFights(pendingFights.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.title || !formData.date || !formData.location) {
        toast({
          title: 'Validation échouée',
          description: 'Veuillez remplir tous les champs obligatoires',
          variant: 'destructive',
        });
        return;
      }

      const eventPayload = {
        title: formData.title,
        slug: formData.slug || generateSlug(formData.title),
        description: formData.description,
        date: formData.date,
        location: formData.location,
        venue: formData.venue,
      };

      let eventId: string;

      if (editingEvent) {
        await fightService.updateDayEvent(editingEvent.id, eventPayload);
        eventId = editingEvent.id;
        toast({ title: 'Événement mis à jour' });
      } else {
        const response = await fightService.createDayEvent(eventPayload);
        eventId = response.data?.id || '';
        toast({ title: 'Événement créé avec succès' });

        // Créer tous les combats associés
        if (pendingFights.length > 0 && eventId) {
          for (const fight of pendingFights) {
            try {
              await fightService.createFight({
                title: fight.title,
                location: formData.location,
                scheduledAt: fight.scheduledAt || formData.date,
                fighterAId: fight.fighterAId,
                fighterBId: fight.fighterBId,
                oddsA: parseFloat(fight.oddsA),
                oddsB: parseFloat(fight.oddsB),
                dayEventId: eventId, // Associer le combat à l'événement
              });
            } catch (error) {
              console.error('Error creating fight:', error);
            }
          }
          toast({
            title: 'Combats créés',
            description: `${pendingFights.length} combat(s) ajouté(s) à l'événement`,
          });
        }
      }

      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('[Admin Events] Error submitting:', error);
      toast({
        title: 'Erreur',
        description: error?.response?.data?.message || 'Erreur lors de l\'opération',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      return;
    }

    try {
      await fightService.deleteDayEvent(eventId);
      toast({ title: 'Événement supprimé' });
      loadData();
    } catch (error: any) {
      console.error('[Admin Events] Error deleting:', error);
      toast({
        title: 'Erreur',
        description: error?.response?.data?.message || 'Erreur lors de la suppression',
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (event: DayEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      slug: event.slug,
      description: event.description || '',
      date: event.date.slice(0, 16),
      location: event.location,
      venue: event.venue || '',
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingEvent(null);
    setPendingFights([]);
    setFormData({
      title: '',
      slug: '',
      description: '',
      date: '',
      location: '',
      venue: '',
    });
    setFightForm({
      title: '',
      fighterAId: '',
      fighterBId: '',
      oddsA: '1.5',
      oddsB: '2.0',
      scheduledAt: '',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge variant="secondary">Programmé</Badge>;
      case 'ONGOING':
        return <Badge className="bg-orange-500">En cours</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-accent">Terminé</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Annulé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getFightStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Programmé</Badge>;
      case 'ONGOING':
        return <Badge className="bg-orange-500">En cours</Badge>;
      case 'FINISHED':
        return <Badge className="bg-green-600">Terminé</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Annulé</Badge>;
      case 'POSTPONED':
        return <Badge variant="secondary">Reporté</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFighterName = (fighterId: string) => {
    const fighter = fighters.find(f => f.id === fighterId);
    return fighter?.name || 'Inconnu';
  };

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout title="Événements">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Chargement des événements...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Événements">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un événement..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button variant="gold" onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvel Événement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingEvent ? 'Modifier l\'événement' : 'Créer un événement'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Informations de l'événement */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Informations de l'événement</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label>Titre *</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            title: e.target.value,
                            slug: generateSlug(e.target.value),
                          });
                        }}
                        placeholder="Ex: Grand Combat de Dakar"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Slug</Label>
                      <Input
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="grand-combat-dakar"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Description de l'événement..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date et heure *</Label>
                      <Input
                        type="datetime-local"
                        value={formData.date}
                        onChange={(e) => {
                          setFormData({ ...formData, date: e.target.value });
                          // Mettre à jour aussi la date du formulaire de combat
                          setFightForm({ ...fightForm, scheduledAt: e.target.value });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ville *</Label>
                      <Input
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Dakar"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Lieu</Label>
                      <Input
                        value={formData.venue}
                        onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                        placeholder="Stade Demba Diop"
                      />
                    </div>
                  </div>
                </div>

                {/* Ajouter des combats (seulement pour création) */}
                {!editingEvent && (
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="font-semibold text-sm">Ajouter des combats à l'événement</h3>

                    {/* Formulaire d'ajout de combat */}
                    <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                      <div className="space-y-2">
                        <Label>Titre du combat (optionnel)</Label>
                        <Input
                          value={fightForm.title}
                          onChange={(e) => setFightForm({ ...fightForm, title: e.target.value })}
                          placeholder="Laissez vide pour générer automatiquement"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Combattant A *</Label>
                          <Select
                            value={fightForm.fighterAId}
                            onValueChange={(value) => setFightForm({ ...fightForm, fighterAId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                              {fighters
                                .filter(f => f.id !== fightForm.fighterBId) // Exclure le combattant B
                                .map((fighter) => (
                                  <SelectItem key={fighter.id} value={fighter.id}>
                                    {fighter.name}
                                    {fighter.nickname && ` (${fighter.nickname})`}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Combattant B *</Label>
                          <Select
                            value={fightForm.fighterBId}
                            onValueChange={(value) => setFightForm({ ...fightForm, fighterBId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                              {fighters
                                .filter(f => f.id !== fightForm.fighterAId) // Exclure le combattant A
                                .map((fighter) => (
                                  <SelectItem key={fighter.id} value={fighter.id}>
                                    {fighter.name}
                                    {fighter.nickname && ` (${fighter.nickname})`}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {fightForm.fighterAId === fightForm.fighterBId && fightForm.fighterAId && (
                        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                          <p className="text-sm text-destructive">
                            Un combattant ne peut pas se battre contre lui-même. Veuillez sélectionner deux combattants différents.
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Cote A</Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="1.0"
                            value={fightForm.oddsA}
                            onChange={(e) => setFightForm({ ...fightForm, oddsA: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Cote B</Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="1.0"
                            value={fightForm.oddsB}
                            onChange={(e) => setFightForm({ ...fightForm, oddsB: e.target.value })}
                          />
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={addFightToPending}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter ce combat
                      </Button>
                    </div>

                    {/* Liste des combats en attente */}
                    {pendingFights.length > 0 && (
                      <div className="space-y-2">
                        <Label>{pendingFights.length} combat(s) à créer</Label>
                        <div className="space-y-2">
                          {pendingFights.map((fight, index) => (
                            <div key={index} className="flex items-center justify-between bg-card border border-border rounded-lg p-3">
                              <div className="flex-1">
                                <p className="font-semibold text-sm">{fight.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  Cotes: {fight.oddsA} vs {fight.oddsB}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removePendingFight(index)}
                                className="h-8 w-8"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <Button variant="gold" className="w-full" onClick={handleSubmit}>
                  {editingEvent ? 'Mettre à jour' : `Créer l'événement${pendingFights.length > 0 ? ` et ${pendingFights.length} combat(s)` : ''}`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Calendar className="w-12 h-12 text-muted-foreground" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Aucun événement</h3>
              <p className="text-sm text-muted-foreground">
                {search ? `Aucun événement ne correspond à "${search}"` : 'Créez votre premier événement pour commencer'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredEvents.map((event) => (
              <div key={event.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
                {event.bannerImage && (
                  <div className="h-32 bg-muted">
                    <img
                      src={event.bannerImage}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground">{event.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(event.date), 'PPP', { locale: fr })}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => loadEventFights(event)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Voir les combats
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(event)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(event.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">
                    {event.venue ? `${event.venue}, ${event.location}` : event.location}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(event.status)}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{event.fights?.length || 0} combats</span>
                      </div>
                      <span>• {event.totalBets || 0} paris</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fights Dialog */}
      <Dialog open={fightsDialogOpen} onOpenChange={setFightsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Combats de {selectedEvent?.title}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {selectedEvent && format(new Date(selectedEvent.date), 'PPP', { locale: fr })} • {selectedEvent?.location}
            </p>
          </DialogHeader>

          <div className="py-4 overflow-y-auto">
            {loadingFights ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : eventFights.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Users className="w-12 h-12 text-muted-foreground" />
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Aucun combat</h3>
                  <p className="text-sm text-muted-foreground">
                    Aucun combat n'a encore été programmé pour cet événement
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {eventFights.map((fight, index) => (
                  <div key={fight.id} className="bg-muted/50 rounded-lg p-4 border border-border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="font-mono">#{index + 1}</Badge>
                          {getFightStatusBadge(fight.status)}
                        </div>
                        <h4 className="font-semibold text-foreground mb-1">
                          {fight.title}
                        </h4>
                        {fight.description && (
                          <p className="text-sm text-muted-foreground">{fight.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Fighters */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-card rounded-lg p-3 border border-border">
                        <div className="flex items-center gap-3">
                          {fight.fighterA.profileImage ? (
                            <img
                              src={fight.fighterA.profileImage}
                              alt={fight.fighterA.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{fight.fighterA.name}</p>
                            {fight.fighterA.nickname && (
                              <p className="text-xs text-muted-foreground truncate">{fight.fighterA.nickname}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {fight.fighterA.wins}V - {fight.fighterA.losses}D
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 text-center">
                          <Badge variant="outline" className="text-xs">
                            Cote: {fight.oddsA.toFixed(2)}
                          </Badge>
                        </div>
                      </div>

                      <div className="bg-card rounded-lg p-3 border border-border">
                        <div className="flex items-center gap-3">
                          {fight.fighterB.profileImage ? (
                            <img
                              src={fight.fighterB.profileImage}
                              alt={fight.fighterB.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                              <Users className="w-5 h-5 text-red-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{fight.fighterB.name}</p>
                            {fight.fighterB.nickname && (
                              <p className="text-xs text-muted-foreground truncate">{fight.fighterB.nickname}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {fight.fighterB.wins}V - {fight.fighterB.losses}D
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 text-center">
                          <Badge variant="outline" className="text-xs">
                            Cote: {fight.oddsB.toFixed(2)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                      <span>{fight.totalBets} paris</span>
                      <span>{fight.totalAmount.toLocaleString()} FCFA</span>
                      {fight.scheduledAt && (
                        <span>{format(new Date(fight.scheduledAt), 'HH:mm', { locale: fr })}</span>
                      )}
                    </div>

                    {/* Résultat si terminé */}
                    {fight.result && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-600">
                            Vainqueur: {fight.result.winner === 'A' ? fight.fighterA.name :
                              fight.result.winner === 'B' ? fight.fighterB.name :
                                fight.result.winner === 'DRAW' ? 'Match nul' : 'Annulé'}
                          </Badge>
                          {fight.result.victoryMethod && (
                            <Badge variant="outline" className="text-xs">
                              {fight.result.victoryMethod}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
