import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, History, Plus, Minus } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { WalletBalance } from '@/components/common/WalletBalance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { transactionService, Transaction } from '@/services/TransactionService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

type ActionType = 'deposit' | 'withdraw' | null;

const providers = [
  { id: 'WAVE', name: 'Wave', color: 'bg-[#1dc0ed]' },
];

export default function Wallet({ tab }: { tab?: string }) {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { toast } = useToast();
  const [action, setAction] = useState<ActionType>((tab as ActionType) || null);
  const [amount, setAmount] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [phone, setPhone] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (tab === 'deposit') setAction('deposit');
    if (tab === 'withdraw') setAction('withdraw');
  }, [tab]);

  useEffect(() => {
    if (isAuthenticated) {
      loadHistory();
    }
  }, [isAuthenticated]);

  const loadHistory = async () => {
    try {
      const response = await transactionService.getHistory();
      if (response.data) {
        setTransactions(response.data);
      }
    } catch (error) {
      console.error('Failed to load history', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const walletData = user?.wallet || { balance: 0, lockedBalance: 0, bonusBalance: 0 };

  const handleSubmit = async () => {
    if (!amount || !selectedProvider) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs',
        variant: 'destructive',
      });
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: 'Erreur',
        description: 'Montant invalide',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      if (action === 'deposit') {
        await transactionService.deposit(numAmount, selectedProvider);
        toast({
          title: 'Dépôt initié',
          description: `Votre dépôt de ${numAmount.toLocaleString()} F via ${providers.find(p => p.id === selectedProvider)?.name} est en cours.`,
          variant: 'default'
        });
      } else {
        if (!phone) {
          toast({
            title: 'Erreur',
            description: 'Veuillez renseigner le numéro de téléphone',
            variant: 'destructive',
          });
          setProcessing(false);
          return;
        }
        await transactionService.withdraw(numAmount, selectedProvider, phone);
        toast({
          title: 'Retrait initié',
          description: `Votre demande de retrait de ${numAmount.toLocaleString()} F a été envoyée.`,
          variant: 'default'
        });
      }

      // Refresh data
      await loadHistory();
      await refreshUser();

      // Reset form
      setAction(null);
      setAmount('');
      setSelectedProvider('');
      setPhone('');
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="safe-top flex flex-col items-center justify-center min-h-[70vh] px-4">
          <div className="p-4 bg-muted rounded-full mb-4">
            <WalletIcon className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Connectez-vous</h2>
          <p className="text-muted-foreground text-center mb-6">
            Connectez-vous pour accéder à votre portefeuille
          </p>
          <Link
            to="/auth"
            className="px-8 py-3 bg-gradient-gold text-primary-foreground rounded-xl font-semibold shadow-gold"
          >
            Se connecter
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="safe-top pb-20">
        {/* Header */}
        <header className="px-4 pt-4 pb-2">
          <h1 className="text-xl font-bold text-foreground mb-4">Mon Portefeuille</h1>
          <WalletBalance
            balance={Number(walletData.balance)}
            lockedBalance={Number(walletData.lockedBalance)}
            bonusBalance={Number(walletData.bonusBalance)}
          />
        </header>

        {/* Actions */}
        <div className="px-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={action === 'deposit' ? 'default' : 'outline'}
              size="lg"
              className={cn(
                "h-24 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 transition-all",
                action === 'deposit'
                  ? "bg-emerald-600 hover:bg-emerald-700 border-emerald-500 text-white ring-2 ring-emerald-500/30"
                  : "border-zinc-700 hover:border-emerald-500/50 hover:bg-emerald-500/10"
              )}
              onClick={() => setAction(action === 'deposit' ? null : 'deposit')}
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Plus className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="font-bold text-lg">Dépôt</span>
            </Button>

            <Button
              variant={action === 'withdraw' ? 'default' : 'outline'}
              size="lg"
              className={cn(
                "h-24 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 transition-all",
                action === 'withdraw'
                  ? "bg-orange-600 hover:bg-orange-700 border-orange-500 text-white ring-2 ring-orange-500/30"
                  : "border-zinc-700 hover:border-orange-500/50 hover:bg-orange-500/10"
              )}
              onClick={() => setAction(action === 'withdraw' ? null : 'withdraw')}
            >
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Minus className="w-6 h-6 text-orange-400" />
              </div>
              <span className="font-bold text-lg">Retrait</span>
            </Button>
          </div>
        </div>

        {/* Action Form */}
        {action && (
          <div className="px-4 py-4 animate-slide-up">
            <div className="bg-gradient-card rounded-2xl p-4 space-y-4">
              <h3 className="font-semibold text-foreground">
                {action === 'deposit' ? 'Déposer de l\'argent' : 'Retirer de l\'argent'}
              </h3>

              {/* Provider Selection */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Moyen de paiement
                </label>
                <div className="flex flex-col gap-2">
                  {providers.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => setSelectedProvider(provider.id)}
                      className={cn(
                        "w-full p-4 rounded-xl border transition-all flex items-center justify-start gap-4 relative overflow-hidden group",
                        selectedProvider === provider.id
                          ? "border-[#1dc0ed] bg-[#1dc0ed]/10 ring-1 ring-[#1dc0ed]"
                          : "border-zinc-700 bg-zinc-800 hover:border-zinc-500"
                      )}
                    >
                      <div className="w-12 h-12 rounded-full bg-[#1dc0ed] flex items-center justify-center shadow-lg shadow-[#1dc0ed]/20 shrink-0">
                        {/* Logo Wave Stylisé */}
                        <svg className="w-7 h-7 text-white fill-current" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-bold text-white tracking-wide block">Wave Mobile Money</span>
                        <span className="text-xs text-gray-400">Paiement rapide et sécurisé</span>
                      </div>

                      {selectedProvider === provider.id && (
                        <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-[#1dc0ed] shadow-[0_0_8px_#1dc0ed]"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">
                  Montant (FCFA)
                </label>
                <Input
                  type="number"
                  placeholder="Ex: 10000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <div className="flex gap-2 mt-2">
                  {[1000, 5000, 10000, 25000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setAmount(amt.toString())}
                      className="flex-1 py-1.5 text-xs font-medium bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                    >
                      {(amt / 1000)}K
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone for withdrawal */}
              {action === 'withdraw' && (
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">
                    Numéro de téléphone
                  </label>
                  <Input
                    type="tel"
                    placeholder="77 123 45 67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              )}

              <Button
                variant="gold"
                size="lg"
                className="w-full"
                onClick={handleSubmit}
                disabled={processing}
              >
                {processing ? <LoadingSpinner size="sm" /> : (action === 'deposit' ? 'Confirmer le dépôt' : 'Confirmer le retrait')}
              </Button>
            </div>
          </div>
        )}

        {/* Transactions */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Historique</h2>
          </div>

          {loadingHistory ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-xl">
              Aucune transaction
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const isPositive = tx.amount > 0;
                return (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-gradient-card rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        isPositive ? "bg-accent/10" : "bg-muted"
                      )}>
                        {isPositive ? (
                          <Plus className="w-4 h-4 text-accent" />
                        ) : (
                          <Minus className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          {tx.type === 'DEPOSIT' && 'Dépôt'}
                          {tx.type === 'WITHDRAWAL' && 'Retrait'}
                          {tx.type === 'BET_PLACED' && 'Pari placé'}
                          {tx.type === 'BET_WIN' && 'Gain'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tx.provider || 'Système'} • {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "font-bold block",
                        isPositive ? "text-accent" : "text-foreground"
                      )}>
                        {isPositive ? '+' : ''}{Math.abs(tx.amount).toLocaleString()} F
                      </span>
                      <span className={cn(
                        "text-[10px] font-medium uppercase",
                        tx.status === 'CONFIRMED' ? 'text-green-500' :
                          tx.status === 'PENDING' ? 'text-yellow-500' : 'text-red-500'
                      )}>
                        {tx.status === 'CONFIRMED' ? 'Succès' :
                          tx.status === 'PENDING' ? 'En cours' : 'Échec'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
