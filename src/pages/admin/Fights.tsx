import { useEffect, useState } from 'react';
import { Plus, Search, MoreVertical, CheckCircle, XCircle, Play, Clock, Trophy, ShieldCheck } from 'lucide-react';
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
import { fightService, Fight } from '@/services/FightService';
import { fighterService, Fighter } from '@/services/FighterService';
import { webSocketService, WebSocketMessageType } from '@/services/WebSocketService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from 'react-router-dom';

const mockFights: Fight[] = [
  {
    id: '1',
    title: 'Modou Lô vs Balla Gaye 2',
    location: 'Stade Demba Diop',
    scheduledAt: new Date(Date.now() + 86400000 * 7).toISOString(),
    status: 'SCHEDULED',
    fighterA: { id: '1', name: 'Modou Lô', wins: 25, losses: 2, draws: 0, totalFights: 27 },
    fighterB: { id: '2', name: 'Balla Gaye 2', wins: 22, losses: 4, draws: 0, totalFights: 26 },
    oddsA: 1.8,
    oddsB: 2.1,
    totalBets: 45,
    totalAmount: 125000,
  },
];

export default function AdminFights() {
  const [fights, setFights] = useState<Fight[]>([]);
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [selectedFight, setSelectedFight] = useState<Fight | null>(null);
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'scheduled';

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    scheduledAt: '',
    fighterAId: '',
    fighterBId: '',
    oddsA: '1.0',
    oddsB: '1.0',
  });

  const [resultData, setResultData] = useState({
    winner: '' as 'A' | 'B' | 'DRAW' | 'CANCELLED' | '',
    victoryMethod: '',
    notes: '',
    password: '',
    otpCode: ''
  });
  const [sendingOTP, setSendingOTP] = useState(false);

  useEffect(() => {
    loadData();

    // WebSocket listeners for real-time sync
    const handleUpdate = () => {
      loadData();
    };

    webSocketService.on(WebSocketMessageType.FIGHT_STATUS_UPDATE, handleUpdate);
    webSocketService.on(WebSocketMessageType.FIGHT_RESULT, handleUpdate);
    webSocketService.on(WebSocketMessageType.SYSTEM_ALERT, handleUpdate);

    return () => {
      webSocketService.off(WebSocketMessageType.FIGHT_STATUS_UPDATE, handleUpdate);
      webSocketService.off(WebSocketMessageType.FIGHT_RESULT, handleUpdate);
      webSocketService.off(WebSocketMessageType.SYSTEM_ALERT, handleUpdate);
    };
  }, []);

  const loadData = async () => {
    try {
      const [fightsRes, fightersRes] = await Promise.all([
        fightService.getFights(),
        fighterService.getFighters(),
      ]);
      setFights(fightsRes.data || mockFights);
      setFighters(fightersRes.data || []);
    } catch {
      setFights(mockFights);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFight = async () => {
    try {
      await fightService.createFight({
        title: formData.title,
        location: formData.location,
        scheduledAt: formData.scheduledAt,
        fighterAId: formData.fighterAId,
        fighterBId: formData.fighterBId,
        oddsA: parseFloat(formData.oddsA),
        oddsB: parseFloat(formData.oddsB),
      });
      toast({ title: 'Combat créé' });
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  const handleUpdateStatus = async (fightId: string, status: string) => {
    try {
      await fightService.updateFightStatus(fightId, status);
      toast({ title: 'Statut mis à jour' });
      loadData();
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  const handleRequestOTP = async () => {
    if (!selectedFight) return;
    try {
      setSendingOTP(true);
      const response = await fightService.requestValidationOTP(selectedFight.id);
      if (!response.error) {
        toast({ title: "Code OTP envoyé", description: "Veuillez vérifier vos emails" });
      } else {
        toast({ title: "Erreur", description: response.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Erreur de connexion", variant: "destructive" });
    } finally {
      setSendingOTP(false);
    }
  };

  const handleValidateResult = async () => {
    if (!selectedFight || !resultData.winner) return;
    try {
      const response = await fightService.validateFightResult(selectedFight.id, {
        winner: resultData.winner as 'A' | 'B' | 'DRAW' | 'CANCELLED',
        victoryMethod: resultData.victoryMethod,
        notes: resultData.notes,
        password: resultData.password,
        otpCode: resultData.otpCode
      });

      if (response.error) {
        toast({
          title: 'Erreur de validation',
          description: response.error,
          variant: 'destructive'
        });
        return;
      }

      toast({ title: 'Résultat validé avec succès' });
      setResultDialogOpen(false);
      setSelectedFight(null);
      setResultData({ winner: '', victoryMethod: '', notes: '', password: '', otpCode: '' });
      loadData();
    } catch (error) {
      console.error(error);
      toast({ title: 'Erreur inattendue', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      location: '',
      scheduledAt: '',
      fighterAId: '',
      fighterBId: '',
      oddsA: '1.0',
      oddsB: '1.0',
    });
  };

  const openResultDialog = (fight: Fight) => {
    setSelectedFight(fight);
    setResultDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge variant="secondary">Programmé</Badge>;
      case 'ONGOING':
        return <Badge className="bg-orange-500">En cours</Badge>;
      case 'FINISHED':
        return <Badge className="bg-accent">Terminé</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Annulé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredFights = fights.filter((fight) =>
    fight.title.toLowerCase().includes(search.toLowerCase())
  );

  const getFightsByTab = (tab: string) => {
    switch (tab) {
      case 'scheduled':
        return filteredFights.filter(f => f.status === 'SCHEDULED');
      case 'ongoing':
        return filteredFights.filter(f => f.status === 'ONGOING');
      case 'validation':
        return filteredFights.filter(f => f.status === 'FINISHED' && !f.result);
      case 'finished':
        return filteredFights.filter(f =>
          f.status === 'CANCELLED' || (f.status === 'FINISHED' && f.result)
        );
      default:
        return [];
    }
  };

  const renderFightList = (fightsList: Fight[], isOngoing = false) => (
    <div className="space-y-3">
      {fightsList.map((fight) => (
        <div key={fight.id} className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-foreground">{fight.title}</h3>
              <p className="text-sm text-muted-foreground">
                {fight.location} • {format(new Date(fight.scheduledAt), 'PPp', { locale: fr })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(fight.status)}
            </div>
          </div>

          <div className="flex items-center justify-between bg-muted rounded-lg p-3">
            <div className="text-center flex-1">
              <p className="font-bold text-foreground">{fight.fighterA?.name}</p>
              <p className="text-sm text-primary">Cote {fight.oddsA}</p>
            </div>
            <span className="text-muted-foreground font-bold px-4">VS</span>
            <div className="text-center flex-1">
              <p className="font-bold text-foreground">{fight.fighterB?.name}</p>
              <p className="text-sm text-primary">Cote {fight.oddsB}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              {fight.totalBets || 0} paris
            </div>
            <div className="flex items-center gap-2">
              {fight.status === 'SCHEDULED' && (
                <Button
                  variant="gold"
                  size="sm"
                  onClick={() => handleUpdateStatus(fight.id, 'ONGOING')}
                  className="h-8"
                >
                  <Play className="w-4 h-4 mr-1.5" />
                  Démarrer
                </Button>
              )}
              {fight.status === 'ONGOING' && (
                <Button
                  variant="gold"
                  size="sm"
                  onClick={() => handleUpdateStatus(fight.id, 'FINISHED')}
                  className="h-8"
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Terminer le combat
                </Button>
              )}
              {fight.status === 'FINISHED' && !fight.result && (
                <Button
                  variant="gold"
                  size="sm"
                  onClick={() => openResultDialog(fight)}
                  className="h-8 shadow-lg shadow-gold/20"
                >
                  <Trophy className="w-4 h-4 mr-1.5" />
                  Valider le résultat
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {fight.status !== 'CANCELLED' && fight.status !== 'FINISHED' && (
                    <DropdownMenuItem
                      onClick={() => handleUpdateStatus(fight.id, 'CANCELLED')}
                      className="text-destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Annuler le combat
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <AdminLayout title="Combats">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Combats">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un combat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Combat
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Créer un combat</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Titre</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Combat du siècle"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lieu</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ex: Stade Demba Diop"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date et heure</Label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Combattant A</Label>
                    <Select
                      value={formData.fighterAId}
                      onValueChange={(value) => setFormData({ ...formData, fighterAId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {fighters.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Combattant B</Label>
                    <Select
                      value={formData.fighterBId}
                      onValueChange={(value) => setFormData({ ...formData, fighterBId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {fighters.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cote A</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.oddsA}
                      onChange={(e) => setFormData({ ...formData, oddsA: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cote B</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.oddsB}
                      onChange={(e) => setFormData({ ...formData, oddsB: e.target.value })}
                    />
                  </div>
                </div>
                <Button variant="gold" className="w-full" onClick={handleCreateFight}>
                  Créer le combat
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={(val) => setSearchParams({ tab: val })} className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="scheduled">À venir</TabsTrigger>
            <TabsTrigger value="ongoing">En direct</TabsTrigger>
            <TabsTrigger value="validation">À valider</TabsTrigger>
            <TabsTrigger value="finished">Historique</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="scheduled" className="space-y-4">
              {getFightsByTab('scheduled').length > 0 ? (
                renderFightList(getFightsByTab('scheduled'))
              ) : (
                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                  Aucun combat programmé.
                </div>
              )}
            </TabsContent>

            <TabsContent value="ongoing" className="space-y-4">
              {getFightsByTab('ongoing').length > 0 ? (
                renderFightList(getFightsByTab('ongoing'), true)
              ) : (
                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Aucun combat en direct.</p>
                  <p className="text-sm mt-1">Démarrez un combat pour le voir ici.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="validation" className="space-y-4">
              {getFightsByTab('validation').length > 0 ? (
                renderFightList(getFightsByTab('validation'))
              ) : (
                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Tous les résultats sont à jour.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="finished" className="space-y-4">
              {getFightsByTab('finished').length > 0 ? (
                renderFightList(getFightsByTab('finished'))
              ) : (
                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                  Aucun combat dans l'historique.
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Result Dialog */}
      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Valider le résultat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Vainqueur</Label>
              <Select
                value={resultData.winner}
                onValueChange={(value) => setResultData({ ...resultData, winner: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le vainqueur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">{selectedFight?.fighterA?.name}</SelectItem>
                  <SelectItem value="B">{selectedFight?.fighterB?.name}</SelectItem>
                  <SelectItem value="DRAW">Match nul</SelectItem>
                  <SelectItem value="CANCELLED">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Méthode de victoire</Label>
              <Input
                value={resultData.victoryMethod}
                onChange={(e) => setResultData({ ...resultData, victoryMethod: e.target.value })}
                placeholder="Ex: KO, Décision, etc."
              />
            </div>
            <div className="pt-4 border-t space-y-4">
              <h4 className="text-sm font-medium text-amber-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Sécurité Requise
              </h4>
              <div className="space-y-2">
                <Label>Votre mot de passe</Label>
                <Input
                  type="password"
                  value={resultData.password}
                  onChange={(e) => setResultData({ ...resultData, password: e.target.value })}
                  placeholder="Confirmez votre mot de passe"
                />
              </div>
              <div className="space-y-2">
                <Label>Code OTP (Email)</Label>
                <div className="flex gap-2">
                  <Input
                    value={resultData.otpCode}
                    onChange={(e) => setResultData({ ...resultData, otpCode: e.target.value })}
                    placeholder="6 chiffres"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRequestOTP}
                    disabled={sendingOTP}
                  >
                    {sendingOTP ? "Envoi..." : "Recevoir"}
                  </Button>
                </div>
              </div>
            </div>
            <Button
              variant="gold"
              className="w-full"
              onClick={handleValidateResult}
              disabled={!resultData.password || !resultData.otpCode}
            >
              Confirmer et Valider
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
