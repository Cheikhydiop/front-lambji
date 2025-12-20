import { useEffect, useState } from 'react';
import { Plus, Search, MoreVertical, Pencil, Trash2, Calendar } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { fightService, DayEvent } from '@/services/FightService';
import { adminService } from '@/services/AdminService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const mockEvents: DayEvent[] = [
  {
    id: '1',
    title: 'Grand Combat de Dakar',
    slug: 'grand-combat-dakar',
    description: 'Le plus grand événement de lutte de l\'année',
    date: new Date(Date.now() + 86400000 * 14).toISOString(),
    location: 'Dakar',
    venue: 'Stade Demba Diop',
    status: 'SCHEDULED',
    isFeatured: true,
    totalBets: 156,
    fights: [],
  },
];

export default function AdminEvents() {
  const [events, setEvents] = useState<DayEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<DayEvent | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    date: '',
    location: '',
    venue: '',
    minBetAmount: '100',
    maxBetAmount: '1000000',
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await fightService.getDayEvents();
      setEvents(response.data || mockEvents);
    } catch {
      setEvents(mockEvents);
    } finally {
      setLoading(false);
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

  const handleSubmit = async () => {
    try {
      const payload = {
        title: formData.title,
        slug: formData.slug || generateSlug(formData.title),
        description: formData.description,
        date: formData.date,
        location: formData.location,
        venue: formData.venue,
        minBetAmount: parseInt(formData.minBetAmount),
        maxBetAmount: parseInt(formData.maxBetAmount),
      };

      if (editingEvent) {
        await adminService.updateEvent(editingEvent.id, payload);
        toast({ title: 'Événement mis à jour' });
      } else {
        await adminService.createEvent(payload);
        toast({ title: 'Événement créé' });
      }
      setDialogOpen(false);
      resetForm();
      loadEvents();
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  const handleDelete = async (eventId: string) => {
    try {
      await adminService.deleteEvent(eventId);
      toast({ title: 'Événement supprimé' });
      loadEvents();
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' });
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
      minBetAmount: event.minBetAmount?.toString() || '100',
      maxBetAmount: event.maxBetAmount?.toString() || '1000000',
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      slug: '',
      description: '',
      date: '',
      location: '',
      venue: '',
      minBetAmount: '100',
      maxBetAmount: '1000000',
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

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout title="Événements">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
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
              <Button variant="gold">
                <Plus className="w-4 h-4 mr-2" />
                Nouvel Événement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingEvent ? 'Modifier l\'événement' : 'Nouvel événement'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2">
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
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="grand-combat-dakar"
                  />
                </div>
                <div className="space-y-2">
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
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ville *</Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Dakar"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lieu</Label>
                    <Input
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      placeholder="Stade Demba Diop"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mise min (FCFA)</Label>
                    <Input
                      type="number"
                      value={formData.minBetAmount}
                      onChange={(e) => setFormData({ ...formData, minBetAmount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mise max (FCFA)</Label>
                    <Input
                      type="number"
                      value={formData.maxBetAmount}
                      onChange={(e) => setFormData({ ...formData, maxBetAmount: e.target.value })}
                    />
                  </div>
                </div>
                <Button variant="gold" className="w-full" onClick={handleSubmit}>
                  {editingEvent ? 'Mettre à jour' : 'Créer'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredEvents.map((event) => (
            <div key={event.id} className="bg-card rounded-xl border border-border overflow-hidden">
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
                  <div>
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
                    {event.isFeatured && (
                      <Badge variant="outline" className="text-primary border-primary">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {event.fights?.length || 0} combats • {event.totalBets || 0} paris
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
