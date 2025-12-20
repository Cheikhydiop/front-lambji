import { useState } from 'react';
import { X, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useCountdown } from '@/hooks/useCountdown';
import { betService } from '@/services';

interface CancelBetButtonProps {
    betId: string;
    canCancelUntil: string | null | undefined;
    onCancel?: () => void;
}

export function CancelBetButton({ betId, canCancelUntil, onCancel }: CancelBetButtonProps) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const { formatted, isExpired, totalSeconds } = useCountdown(canCancelUntil);

    const handleCancel = async () => {
        try {
            setIsCancelling(true);

            await betService.cancelBet(betId);

            toast({
                title: 'Pari annulé',
                description: 'Votre pari a été annulé avec succès. Les fonds ont été remboursés.',
                variant: 'default',
            });

            setIsOpen(false);

            // Appeler le callback pour rafraîchir la liste
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

    // Si pas de date limite ou déjà expiré, ne rien afficher
    if (!canCancelUntil) {
        return null;
    }

    // Déterminer la couleur selon le temps restant
    const getTimeColor = () => {
        if (isExpired) return 'text-gray-400';
        if (totalSeconds < 300) return 'text-red-600'; // < 5 minutes
        if (totalSeconds < 600) return 'text-orange-600'; // < 10 minutes
        return 'text-green-600';
    };

    return (
        <>
            <div className="flex items-center justify-between gap-3">
                {/* Compte à rebours */}
                <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${getTimeColor()}`} />
                    <div>
                        <p className="text-xs text-muted-foreground">Temps pour annuler (max 20min)</p>
                        <p className={`text-sm font-bold ${getTimeColor()}`}>
                            {isExpired ? 'Expiré' : formatted}
                        </p>
                    </div>
                </div>

                {/* Bouton d'annulation */}
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsOpen(true)}
                    disabled={isExpired || isCancelling}
                    className="flex items-center gap-2"
                >
                    <X className="w-4 h-4" />
                    Annuler
                </Button>
            </div>

            {/* Badge d'information si expiré */}
            {isExpired && (
                <div className="mt-2 p-2 bg-gray-50 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-gray-500" />
                    <p className="text-xs text-gray-600">
                        La fenêtre d'annulation de 20 minutes est expirée
                    </p>
                </div>
            )}

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
                                Temps restant : <span className={getTimeColor()}>{formatted}</span>
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
