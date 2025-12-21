import { useEffect, useState, useCallback } from 'react';
import { Search, Calendar, MapPin, Swords } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { EventCard } from '@/components/fights/EventCard';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { Input } from '@/components/ui/input';
import { fightService, DayEvent } from '@/services';

export default function Events() {
    const [events, setEvents] = useState<DayEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const loadEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fightService.getDayEvents();
            if (response.data) {
                setEvents(response.data);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des événements:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    const filteredEvents = events.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.venue && event.venue.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <AppLayout>
            <div className="safe-top">
                <header className="px-4 pt-4 pb-2">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                            <Calendar className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Événements</h1>
                            <p className="text-sm text-muted-foreground">
                                {events.length} événements programmés
                            </p>
                        </div>
                    </div>

                    <div className="relative mb-4">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher un événement..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-12 bg-gray-50 border-gray-200 focus:bg-white"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </header>

                <div className="px-4 pb-20 space-y-4">
                    {isLoading ? (
                        <PageLoader />
                    ) : filteredEvents.length > 0 ? (
                        filteredEvents.map((event) => (
                            <EventCard key={event.id} {...event} />
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <Swords className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">Aucun événement trouvé</h3>
                            <p className="text-muted-foreground">
                                {searchQuery
                                    ? `Aucun résultat pour "${searchQuery}"`
                                    : "Aucun événement n'est programmé pour le moment"}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
