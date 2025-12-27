import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './PaymentCallback.css';

const PaymentError = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const transactionRef = searchParams.get('ref');

    useEffect(() => {
        // Rediriger vers le wallet après 5 secondes
        const timer = setTimeout(() => {
            navigate('/wallet');
        }, 5000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="payment-callback">
            <div className="callback-card error">
                <div className="error-icon">❌</div>
                <h1>Paiement annulé ou échoué</h1>
                <p>Votre transaction n'a pas pu être complétée.</p>

                {transactionRef && (
                    <div className="transaction-ref">
                        Référence: <code>{transactionRef}</code>
                    </div>
                )}

                <div className="error-reasons">
                    <p><strong>Raisons possibles :</strong></p>
                    <ul>
                        <li>Paiement annulé</li>
                        <li>Solde insuffisant</li>
                        <li>Erreur de connexion</li>
                    </ul>
                </div>

                <div className="actions">
                    <button
                        className="btn-primary"
                        onClick={() => navigate('/wallet')}
                    >
                        Retour au portefeuille
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={() => window.location.reload()}
                    >
                        Réessayer
                    </button>
                </div>

                <p className="redirect-info">Redirection automatique dans 5 secondes...</p>
            </div>
        </div>
    );
};

export default PaymentError;
