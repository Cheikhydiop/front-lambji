import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './PaymentCallback.css';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const transactionRef = searchParams.get('ref');

    useEffect(() => {
        // Simuler une vérification (en vrai, appeler votre API pour vérifier)
        const timer = setTimeout(() => {
            setStatus('success');

            // Rediriger vers le wallet après 3 secondes
            setTimeout(() => {
                navigate('/wallet');
            }, 3000);
        }, 1500);

        return () => clearTimeout(timer);
    }, [navigate, transactionRef]);

    return (
        <div className="payment-callback">
            <div className="callback-card">
                {status === 'processing' && (
                    <>
                        <div className="spinner-large">⏳</div>
                        <h1>Vérification du paiement...</h1>
                        <p>Veuillez patienter pendant que nous vérifions votre transaction.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="success-icon">✅</div>
                        <h1>Paiement réussi !</h1>
                        <p>Votre compte a été crédité avec succès.</p>
                        {transactionRef && (
                            <div className="transaction-ref">
                                Référence: <code>{transactionRef}</code>
                            </div>
                        )}
                        <p className="redirect-info">Redirection vers votre portefeuille...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="error-icon">❌</div>
                        <h1>Échec du paiement</h1>
                        <p>Une erreur est survenue lors du traitement de votre paiement.</p>
                        <button
                            className="btn-primary"
                            onClick={() => navigate('/wallet')}
                        >
                            Retour au portefeuille
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccess;
