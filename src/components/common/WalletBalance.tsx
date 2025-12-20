import { Wallet, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface WalletBalanceProps {
  balance: number;
  lockedBalance?: number;
  bonusBalance?: number;
  className?: string;
  compact?: boolean;
}

export function WalletBalance({
  balance,
  lockedBalance = 0,
  bonusBalance = 0,
  className,
  compact = false,
}: WalletBalanceProps) {
  const [isVisible, setIsVisible] = useState(true);

  const formatAmount = (amount: number) => {
    return isVisible ? amount.toLocaleString() : '••••••';
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="p-1.5 bg-primary/10 rounded-lg">
          <Wallet className="w-4 h-4 text-primary" />
        </div>
        <span className="font-bold text-foreground">{formatAmount(balance)} F</span>
      </div>
    );
  }

  return (
    <div className={cn("bg-gradient-card rounded-2xl p-5 shadow-card", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <span className="text-muted-foreground font-medium">Mon Solde</span>
        </div>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          {isVisible ? (
            <EyeOff className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Eye className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      <div className="mb-4">
        <p className="text-3xl font-bold text-gradient-gold">{formatAmount(balance)} F</p>
        <p className="text-sm text-muted-foreground mt-1">Disponible</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-muted/50 rounded-xl">
          <p className="text-xs text-muted-foreground mb-0.5">En jeu</p>
          <p className="font-semibold text-warning">{formatAmount(lockedBalance)} F</p>
        </div>
        <div className="p-3 bg-muted/50 rounded-xl">
          <p className="text-xs text-muted-foreground mb-0.5">Bonus</p>
          <p className="font-semibold text-accent">{formatAmount(bonusBalance)} F</p>
        </div>
      </div>
    </div>
  );
}
