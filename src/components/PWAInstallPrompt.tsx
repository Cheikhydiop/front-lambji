import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            // Empêcher le mini-infobar par défaut
            e.preventDefault();
            // Stocker l'événement pour l'utiliser plus tard
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Afficher le prompt personnalisé
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        // Afficher le prompt d'installation
        deferredPrompt.prompt();

        // Attendre le choix de l'utilisateur
        const { outcome } = await deferredPrompt.userChoice;

        console.log(`User response to install prompt: ${outcome}`);

        // Réinitialiser
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        // Masquer pour cette session
        sessionStorage.setItem('pwa-install-dismissed', 'true');
    };

    // Ne pas afficher si déjà installé ou si l'utilisateur a refusé
    if (
        !showPrompt ||
        !deferredPrompt ||
        sessionStorage.getItem('pwa-install-dismissed') === 'true' ||
        window.matchMedia('(display-mode: standalone)').matches
    ) {
        return null;
    }

    return (
        <Card className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 shadow-2xl animate-in slide-in-from-bottom">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                    <Download className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-foreground mb-1">
                        Installer Mbayar
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                        Installez l'application pour un accès rapide et des notifications en temps réel
                    </p>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleInstall}
                            variant="default"
                            size="sm"
                            className="flex-1 bg-primary hover:bg-primary/90"
                        >
                            Installer
                        </Button>
                        <Button
                            onClick={handleDismiss}
                            variant="outline"
                            size="sm"
                        >
                            Plus tard
                        </Button>
                    </div>
                </div>
                <Button
                    onClick={handleDismiss}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 -mt-1 -mr-1"
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>
        </Card>
    );
}
