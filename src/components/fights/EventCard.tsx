import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MapPin, Calendar, Swords } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  location: string;
  venue?: string;
  bannerImage?: string;
  totalFights?: number;
  isFeatured?: boolean;
  status: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function EventCard({
  id,
  title,
  date,
  location,
  venue,
  bannerImage,
  totalFights = 0,
  isFeatured,
  status,
  onClick,
}: EventCardProps) {
  const isLive = status === 'ONGOING';

  return (
    <Link
      to={`/events/${id}`}
      onClick={onClick}
      className="block relative overflow-hidden rounded-2xl bg-gradient-card shadow-card hover:shadow-elevated transition-all duration-300 active:scale-[0.98]"
    >
      {/* Banner */}
      <div className="relative h-32 bg-muted">
        {bannerImage ? (
          <img src={bannerImage} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <Swords className="w-12 h-12 text-primary/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {isLive && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-destructive text-destructive-foreground rounded-full text-xs font-semibold">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              EN DIRECT
            </span>
          )}
          {isFeatured && !isLive && (
            <span className="px-2.5 py-1 bg-primary text-primary-foreground rounded-full text-xs font-semibold">
              À LA UNE
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 -mt-6 relative">
        <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-1">{title}</h3>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{format(new Date(date), "EEEE d MMMM 'à' HH:mm", { locale: fr })}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 text-secondary" />
            <span className="truncate">{venue || location}</span>
          </div>
        </div>

        {totalFights > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground">{totalFights} combats programmés</span>
          </div>
        )}
      </div>
    </Link>
  );
}
