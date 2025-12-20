import { useState, useEffect } from 'react';

interface CountdownResult {
    minutes: number;
    seconds: number;
    isExpired: boolean;
    formatted: string;
    totalSeconds: number;
}

/**
 * Hook personnalisé pour gérer un compte à rebours
 * @param targetDate - Date cible au format ISO string
 * @returns Objet contenant le temps restant et l'état d'expiration
 */
export function useCountdown(targetDate: string | null | undefined): CountdownResult {
    const [timeLeft, setTimeLeft] = useState<number>(0);

    useEffect(() => {
        if (!targetDate) {
            setTimeLeft(0);
            return;
        }

        // Calculer le temps restant initial
        const calculateTimeLeft = () => {
            const target = new Date(targetDate).getTime();
            const now = new Date().getTime();
            const difference = target - now;
            return Math.max(0, Math.floor(difference / 1000)); // en secondes
        };

        // Initialiser
        setTimeLeft(calculateTimeLeft());

        // Mettre à jour toutes les secondes
        const interval = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);

            // Arrêter l'intervalle si le temps est écoulé
            if (newTimeLeft <= 0) {
                clearInterval(interval);
            }
        }, 1000);

        // Nettoyer l'intervalle lors du démontage
        return () => clearInterval(interval);
    }, [targetDate]);

    // Calculer les minutes et secondes
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    // Formater le temps (MM:SS)
    const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    return {
        minutes,
        seconds,
        isExpired: timeLeft <= 0,
        formatted,
        totalSeconds: timeLeft,
    };
}
