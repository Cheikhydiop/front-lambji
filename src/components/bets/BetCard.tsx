import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface BetCardProps {
  id: string;
  amount: number;
  chosenFighter: 'A' | 'B';
  status: string;
  potentialWin?: number;
  actualWin?: number;
  createdAt: string;
  fight: {
    title: string;
    fighterA: { name: string };
    fighterB: { name: string };
    scheduledAt: string;
  };
  isCreator?: boolean;
  onAccept?: () => void;
  onCancel?: () => void;
}

const statusConfig = {
  PENDING: { label: 'En attente', className: 'bg-warning/20 text-warning' },
  ACCEPTED: { label: 'Accepté', className: 'bg-info/20 text-info' },
  WON: { label: 'Gagné', className: 'bg-accent/20 text-accent' },
  LOST: { label: 'Perdu', className: 'bg-destructive/20 text-destructive' },
  CANCELLED: { label: 'Annulé', className: 'bg-muted text-muted-foreground' },
  REFUNDED: { label: 'Remboursé', className: 'bg-muted text-muted-foreground' },
};

export function BetCard({
  amount,
  chosenFighter,
  status,
  potentialWin,
  actualWin,
  createdAt,
  fight,
  isCreator,
  onAccept,
  onCancel,
}: BetCardProps) {
  // Determine visual selection based on role
  const dbChosenA = chosenFighter === 'A';
  // If creator (or undefined), my choice matches db. If acceptor (isCreator is false), my choice is opposite.
  const mySideIsA = (isCreator ?? true) ? dbChosenA : !dbChosenA;
  const chosenFighterName = mySideIsA ? fight.fighterA.name : fight.fighterB.name;
  const statusInfo = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;

  return (
    <div className="bg-gradient-card rounded-2xl p-4 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", statusInfo.className)}>
          {statusInfo.label}
        </span>
        <span className="text-xs text-muted-foreground">
          {format(new Date(createdAt), 'd MMM HH:mm', { locale: fr })}
        </span>
      </div>

      {/* Fight Info */}
      <h3 className="font-semibold text-foreground mb-1">{fight.title}</h3>
      <p className="text-sm text-muted-foreground mb-3">
        {format(new Date(fight.scheduledAt), "d MMMM 'à' HH:mm", { locale: fr })}
      </p>

      {/* Bet Details */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl mb-3">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Mon pari</p>
          <p className="font-semibold text-primary">{chosenFighterName}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground mb-0.5">Mise</p>
          <p className="font-bold text-foreground">{amount.toLocaleString()} F</p>
        </div>
      </div>

      {/* Potential/Actual Win */}
      {status === 'WON' && actualWin && (
        <div className="p-3 bg-accent/10 rounded-xl border border-accent/30">
          <p className="text-xs text-accent mb-0.5">Gains</p>
          <p className="font-bold text-accent text-lg">+{actualWin.toLocaleString()} F</p>
        </div>
      )}

      {status === 'LOST' && (
        <div className="p-3 bg-destructive/10 rounded-xl border border-destructive/30">
          <p className="text-xs text-destructive mb-0.5">Perte</p>
          <p className="font-bold text-destructive text-lg">-{amount.toLocaleString()} F</p>
        </div>
      )}

      {(status === 'PENDING' || status === 'ACCEPTED') && potentialWin && (
        <div className="p-3 bg-primary/10 rounded-xl border border-primary/30">
          <p className="text-xs text-primary mb-0.5">Gain potentiel</p>
          <p className="font-bold text-primary text-lg">{potentialWin.toLocaleString()} F</p>
        </div>
      )}

      {/* Actions */}
      {status === 'PENDING' && (
        <div className="flex gap-2 mt-3">
          {!isCreator && onAccept && (
            <button
              onClick={onAccept}
              className="flex-1 py-2.5 bg-gradient-gold text-primary-foreground rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
            >
              Accepter
            </button>
          )}
          {isCreator && onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 bg-muted text-muted-foreground rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
            >
              Annuler
            </button>
          )}
        </div>
      )}
    </div>
  );
}
