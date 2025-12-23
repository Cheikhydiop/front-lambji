import { useState, useEffect } from 'react';
import { X, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { betService } from '@/services';

interface CancelBetButtonNewProps {
    betId: string;
    createdAt: string;
    status: string;
    onCancel?: () => void;
}

/**
 * Nouveau composant d'annulation de paris
 * ⭐ Nouvelle règle: Délai minimum de 30 minutes APRÈS création
 * (au lieu de 20 minutes POUR annuler)
 */
export function CancelBetButtonNew({ betId, createdAt, status, onCancel }: CancelBetButtonNewProps) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [minutesRemaining, setMinutesRemaining] = useState(0);
    const [canCancel, setCanCancel] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const calculateCancelAvailability = () => {
            const now = new Date();
            const created = new Date(createdAt);
            const thirtyMinutesLater = new Date(created.getTime() + 30 * 60 * 1000);
            const elapsedMs = now.getTime() - created.getTime();
            const elapsedMinutes = Math.floor(elapsedMs / 60000);
            const progressPercent = Math.min((elapsedMinutes / 30) * 100, 100);

            setProgress(progressPercent);

            if (now >= thirtyMinutesLater) {
                setCanCancel(true);
                setMinutesRemaining(0);
            } else {
                setCanCancel(false);
                const remaining = Math.ceil((thirtyMinutesLater.getTime() - now.getTime()) / 60000);
                setMinutesRemaining(remaining);
            }
        };

        // Calculer immédiatement
        calculateCancelAvailability();

        // Mettre à jour chaque minute
        const interval = setInterval(calculateCancelAvailability, 60000);

        return () => clearInterval(interval);
    }, [createdAt]);

    const handleCancel = async () => {
        if (!canCancel) {
            toast({
                title: 'Annulation impossible',
                description: `Vous devez attendre encore ${minutesRemaining} minute(s) avant de pouvoir annuler ce pari.`,
                variant: 'destructive',
            });
            return;
        }

        try {
            setIsCancelling(true);

            await betService.cancelBet(betId);

            toast({
                title: '✅ Pari annulé',
                description: 'Votre pari a été annulé avec succès. Les fonds ont été remboursés.',
                variant: 'default',
            });

            setIsOpen(false);

            if (onCancel) {
                onCancel();
            }
        } catch (error: any) {
            console.error('Erreur lors de l\'annulation:', error);

            const errorMessage = error?.response?.data?.message ||
                error?.message ||
                'Impossible d\'annuler le pari';

            toast({
                title: 'Erreur',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setIsCancelling(false);
        }
    };

    // Ne rien afficher si le pari n'est pas PENDING
    if (status !== 'PENDING') {
        return null;
    }

    const getStatusColor = () => {
        if (canCancel) return 'text-green-600';
        if (minutesRemaining <= 10) return 'text-orange-600';
        return 'text-blue-600';
    };

    return (
        <>
            <div className="space-y-3">
                {/* Timer et Progress Bar */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className={`w-4 h-4 ${getStatusColor()}`} />
                            <span className="text-xs text-muted-foreground">
                                {canCancel ? 'Annulation disponible' : 'Délai d\'annulation'}
                            </span>
                        </div>
                        <span className={`text-sm font-bold ${getStatusColor()}`}>
                            {canCancel ? '✅ Disponible' : `${minutesRemaining} min`}
                        </span>
                    </div>

                    {/* Barre de progression */}
                    <div className="space-y-1">
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-muted-foreground text-center">
                            {Math.floor(progress)}% • {canCancel ? '30/30' : `${Math.floor(progress * 30 / 100)}/30`} minutes écoulées
                        </p>
                    </div>
                </div>

                {/* Message d'information */}
                {!canCancel && (
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-700 dark:text-blue-400">
                            Vous devez attendre <strong>{minutesRemaining} minute(s)</strong> après la création du pari avant de pouvoir l'annuler.
                        </p>
                    </div>
                )}

                {/* Bouton d'annulation */}
                <Button
                    variant={canCancel ? "destructive" : "secondary"}
                    size="sm"
                    onClick={() => canCancel ? setIsOpen(true) : null}
                    disabled={!canCancel || isCancelling}
                    className="w-full flex items-center justify-center gap-2"
                    title={canCancel ? 'Annuler ce pari' : `Attendez ${minutesRemaining} minute(s)`}
                >
                    {isCancelling ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Annulation...
                        </>
                    ) : canCancel ? (
                        <>
                            <X className="w-4 h-4" />
                            Annuler ce pari
                        </>
                    ) : (
                        <>
                            🔒 Annuler (dans {minutesRemaining} min)
                        </>
                    )}
                </Button>
            </div>

            {/* Dialogue de confirmation */}
            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer l'annulation</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir annuler ce pari ?
                            <br />
                            <br />
                            Le montant de votre pari sera remboursé intégralement sur votre portefeuille.
                            <br />
                            <br />
                            <span className="text-sm font-medium text-foreground">
                                ✅ Délai de 30 minutes respecté
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isCancelling}>
                            Non, garder le pari
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancel}
                            disabled={isCancelling}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isCancelling ? 'Annulation...' : 'Oui, annuler'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
