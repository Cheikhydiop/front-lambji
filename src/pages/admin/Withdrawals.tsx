import { useEffect, useState } from 'react';
import { Search, Check, X, Clock } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { adminService } from '@/services/AdminService';
import { WithdrawalRequest } from '@/services/WalletService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const mockWithdrawals: WithdrawalRequest[] = [
  {
    id: '1',
    amount: 50000,
    phoneNumber: '77 123 45 67',
    provider: 'WAVE',
    status: 'PENDING',
    requestedAt: new Date(Date.now() - 3600000).toISOString(),
    user: { id: '1', name: 'Moussa Diop', email: 'moussa@example.com' },
  },
  {
    id: '2',
    amount: 25000,
    phoneNumber: '78 987 65 43',
    provider: 'ORANGE_MONEY',
    status: 'PENDING',
    requestedAt: new Date(Date.now() - 7200000).toISOString(),
    user: { id: '2', name: 'Fatou Sow', email: 'fatou@example.com' },
  },
];

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    try {
      const response = await adminService.getPendingWithdrawals();
      setWithdrawals(response.data || mockWithdrawals);
    } catch {
      setWithdrawals(mockWithdrawals);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (withdrawalId: string) => {
    try {
      await adminService.approveWithdrawal(withdrawalId);
      toast({ title: 'Retrait approuvé' });
      loadWithdrawals();
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal || !rejectReason) return;
    try {
      await adminService.rejectWithdrawal(selectedWithdrawal.id, rejectReason);
      toast({ title: 'Retrait rejeté' });
      setRejectDialogOpen(false);
      setSelectedWithdrawal(null);
      setRejectReason('');
      loadWithdrawals();
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  const openRejectDialog = (withdrawal: WithdrawalRequest) => {
    setSelectedWithdrawal(withdrawal);
    setRejectDialogOpen(true);
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'WAVE':
        return <Badge className="bg-blue-500">Wave</Badge>;
      case 'ORANGE_MONEY':
        return <Badge className="bg-orange-500">Orange Money</Badge>;
      case 'FREE_MONEY':
        return <Badge className="bg-green-500">Free Money</Badge>;
      default:
        return <Badge variant="secondary">{provider}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> En attente</Badge>;
      case 'APPROVED':
        return <Badge className="bg-blue-500">Approuvé</Badge>;
      case 'PROCESSING':
        return <Badge className="bg-orange-500">Traitement</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-accent">Complété</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredWithdrawals = withdrawals.filter(
    (w) =>
      w.user?.name.toLowerCase().includes(search.toLowerCase()) ||
      w.phoneNumber.includes(search)
  );

  if (loading) {
    return (
      <AdminLayout title="Retraits">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Retraits">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">En attente</p>
            <p className="text-2xl font-bold text-primary">
              {withdrawals.filter((w) => w.status === 'PENDING').length}
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Montant total</p>
            <p className="text-2xl font-bold text-foreground">
              {withdrawals
                .filter((w) => w.status === 'PENDING')
                .reduce((sum, w) => sum + w.amount, 0)
                .toLocaleString()} F
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWithdrawals.map((withdrawal) => (
                <TableRow key={withdrawal.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{withdrawal.user?.name}</p>
                      <p className="text-xs text-muted-foreground">{withdrawal.user?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">
                    {withdrawal.amount.toLocaleString()} F
                  </TableCell>
                  <TableCell>{withdrawal.phoneNumber}</TableCell>
                  <TableCell>{getProviderBadge(withdrawal.provider)}</TableCell>
                  <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(withdrawal.requestedAt), 'Pp', { locale: fr })}
                  </TableCell>
                  <TableCell>
                    {withdrawal.status === 'PENDING' && (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-accent border-accent hover:bg-accent/10"
                          onClick={() => handleApprove(withdrawal.id)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive hover:bg-destructive/10"
                          onClick={() => openRejectDialog(withdrawal)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeter le retrait</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Retrait de {selectedWithdrawal?.amount.toLocaleString()} F pour{' '}
                {selectedWithdrawal?.user?.name}
              </p>
              <div className="space-y-2">
                <Label>Raison du rejet *</Label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ex: Informations incorrectes, solde insuffisant..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setRejectDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleReject}
                  disabled={!rejectReason}
                >
                  Rejeter
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
