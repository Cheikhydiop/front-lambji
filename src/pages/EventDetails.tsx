import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Trophy, ArrowLeft, Swords } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { FightCard } from '@/components/fights/FightCard';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { fightService, DayEvent, Fight } from '@/services';

export default function EventDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [event, setEvent] = useState<DayEvent | null>(null);
    const [fights, setFights] = useState<Fight[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadEventDetails = useCallback(async () => {
        if (!id) return;

        setIsLoading(true);
        try {
            // Charger les détails de l'événement
            const eventRes = await fightService.getDayEvent(id);
            if (eventRes.data) {
                setEvent(eventRes.data);
            }

            // Charger les combats de l'événement
            // Note: On suppose que l'API renvoie les combats avec l'événement ou on les filtre
            // Si l'API getDayEvent ne renvoie pas les combats, on devrait peut-être faire un appel séparé
            if (eventRes.data?.fights) {
                setFights(eventRes.data.fights);
            } else {
                // Fallback: chercher les combats liés à cet événement si non inclus
                // Ceci dépend de votre API, pour l'instant on assume qu'ils sont inclus ou on essaie de les charger
                // const fightsRes = await fightService.getFights({ dayEventId: id });
                // if (fightsRes.data) setFights(fightsRes.data);
            }
        } catch (error) {
            console.error('Erreur chargement événement:', error);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadEventDetails();
    }, [loadEventDetails]);

    if (isLoading) return <PageLoader />;

    if (!event) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center h-[80vh] px-4 text-center">
                    <Trophy className="w-16 h-16 text-muted-foreground mb-4" />
                    <h2 className="text-xl font-bold mb-2">Événement non trouvé</h2>
                    <button
                        onClick={() => navigate('/events')}
                        className="text-primary hover:underline"
                    >
                        Retour aux événements
                    </button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="relative min-h-screen bg-background">
                {/* Hero Section */}
                <div className="relative h-48 sm:h-64 bg-muted">
                    {event.bannerImage ? (
                        <img
                            src={event.bannerImage}
                            alt={event.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />

                    <button
                        onClick={() => navigate(-1)}
                        className="absolute top-4 left-4 p-2 bg-background/50 backdrop-blur-md rounded-full text-foreground hover:bg-background/80 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-4 -mt-12 relative z-10 pb-20">
                    <div className="mb-6">
                        <span className="inline-block px-3 py-1 mb-2 text-xs font-semibold bg-primary/10 text-primary rounded-full">
                            {event.status === 'ONGOING' ? 'EN DIRECT' : 'À VENIR'}
                        </span>
                        <h1 className="text-2xl font-bold text-foreground mb-2">{event.title}</h1>

                        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" />
                                <span>{format(new Date(event.date), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-secondary" />
                                <span>{event.venue || event.location}</span>
                            </div>
                        </div>

                        {event.description && (
                            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                                {event.description}
                            </p>
                        )}
                    </div>

                    {/* Fights List */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Swords className="w-5 h-5 text-primary" />
                            Programme ({fights.length})
                        </h2>

                        {fights.length > 0 ? (
                            <div className="space-y-4">
                                {fights.map(fight => (
                                    <FightCard key={fight.id} {...fight} />
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-muted/30 rounded-2xl border border-dashed border-border">
                                <p className="text-muted-foreground">Aucun combat annoncé pour le moment</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
