import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, Users, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Fighter {
  id: string;
  name: string;
  nickname?: string;
  profileImage?: string;
  wins: number;
  losses: number;
}

interface FightCardProps {
  id: string;
  title: string;
  scheduledAt: string;
  status: string;
  fighterA: Fighter;
  fighterB: Fighter;
  oddsA: number;
  oddsB: number;
  totalBets?: number;
  totalAmount?: number;
  location?: string;
  showTime?: boolean;
  timeText?: string;
  showLocation?: boolean;
  showEvent?: boolean;
  eventName?: string;
}

export function FightCard({
  id,
  title,
  scheduledAt,
  status,
  fighterA,
  fighterB,
  oddsA,
  oddsB,
  totalBets = 0,
  location,
  showTime = false,
  timeText,
  showLocation = false,
  showEvent = false,
  eventName,
}: FightCardProps) {
  const isLive = status === 'ONGOING';
  const isScheduled = status === 'SCHEDULED';


  return (
    <Link
      to={`/fights/${id}`}
      className="block bg-gradient-card rounded-2xl p-4 shadow-card hover:shadow-elevated transition-all duration-300 active:scale-[0.98]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col gap-1">
          {showEvent && eventName && (
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              {eventName}
            </span>
          )}
          <div className="flex items-center gap-2">
            {isLive && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-destructive/20 text-destructive rounded-full text-xs font-semibold">
                <span className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />
                EN DIRECT
              </span>
            )}
            {isScheduled && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/20 text-primary rounded-full text-xs font-semibold">
                <Clock className="w-3 h-3" />
                {timeText || format(new Date(scheduledAt), 'HH:mm', { locale: fr })}
              </span>
            )}
            {showLocation && location && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="hidden sm:inline">•</span>
                {location}
              </span>
            )}
          </div>
        </div>
        {!showTime && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {format(new Date(scheduledAt), 'd MMM', { locale: fr })}
          </span>
        )}
      </div>

      {/* Fighters */}
      <div className="flex items-center justify-between gap-4">
        {/* Fighter A */}
        <div className="flex-1 text-center">
          <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-primary/30">
            {fighterA.profileImage ? (
              <img src={fighterA.profileImage} alt={fighterA.name} className="w-full h-full object-cover" />
            ) : (
              <Trophy className="w-6 h-6 text-primary" />
            )}
          </div>
          <h3 className="font-semibold text-sm text-foreground truncate">{fighterA.name}</h3>
          <p className="text-xs text-muted-foreground">{fighterA.wins}V - {fighterA.losses}D</p>
          {/* Odds removed */}
        </div>

        {/* VS */}
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-muted-foreground">VS</span>
        </div>

        {/* Fighter B */}
        <div className="flex-1 text-center">
          <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-secondary/30">
            {fighterB.profileImage ? (
              <img src={fighterB.profileImage} alt={fighterB.name} className="w-full h-full object-cover" />
            ) : (
              <Trophy className="w-6 h-6 text-secondary" />
            )}
          </div>
          <h3 className="font-semibold text-sm text-foreground truncate">{fighterB.name}</h3>
          <p className="text-xs text-muted-foreground">{fighterB.wins}V - {fighterB.losses}D</p>
          {/* Odds removed */}
        </div>
      </div>

      {/* Footer */}
      {totalBets > 0 && (
        <div className="flex items-center justify-center gap-1.5 mt-4 pt-3 border-t border-border">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{totalBets} paris</span>
        </div>
      )}
    </Link>
  );
}
