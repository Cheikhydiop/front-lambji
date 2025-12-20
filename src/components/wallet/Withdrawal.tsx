import React, { useState } from 'react';
import walletService from '../../services/WalletService';
import './Withdrawal.css';

interface WithdrawalProps {
    currentBalance?: number;
    onSuccess?: () => void;
    onCancel?: () => void;
}

type PaymentProvider = 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY';

const Withdrawal: React.FC<WithdrawalProps> = ({ currentBalance = 0, onSuccess, onCancel }) => {
    const [amount, setAmount] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [provider, setProvider] = useState<PaymentProvider>('WAVE');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const MIN_WITHDRAWAL = 1000;
    const MAX_WITHDRAWAL = 500000;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const amountNum = parseInt(amount);

        // Validation
        if (!amount || isNaN(amountNum)) {
            setError('Veuillez entrer un montant valide');
            return;
        }

        if (amountNum < MIN_WITHDRAWAL) {
            setError(`Le montant minimum est de ${MIN_WITHDRAWAL} FCFA`);
            return;
        }

        if (amountNum > MAX_WITHDRAWAL) {
            setError(`Le montant maximum est de ${MAX_WITHDRAWAL.toLocaleString()} FCFA`);
            return;
        }

        if (amountNum > currentBalance) {
            setError(`Solde insuffisant. Votre solde actuel: ${currentBalance.toLocaleString()} FCFA`);
            return;
        }

        if (!phoneNumber || phoneNumber.length < 9) {
            setError('Veuillez entrer un numéro de téléphone valide');
            return;
        }

        setLoading(true);

        try {
            const result = await walletService.withdraw({
                amount: BigInt(amountNum),
                provider,
                phoneNumber: phoneNumber.startsWith('+') ? phoneNumber : `+221${phoneNumber}`
            });

            if (result.success) {
                setSuccess(result.data?.message || 'Retrait en cours de traitement. Vous recevrez l\'argent sous peu.');
                setAmount('');
                setPhoneNumber('');

                setTimeout(() => {
                    if (onSuccess) onSuccess();
                }, 2000);
            } else {
                setError(result.error || 'Erreur lors du retrait');
            }
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    const providerLogos: Record<PaymentProvider, string> = {
        WAVE: '🌊',
        ORANGE_MONEY: '🍊',
        FREE_MONEY: '💰'
    };

    const providerNames: Record<PaymentProvider, string> = {
        WAVE: 'Wave',
        ORANGE_MONEY: 'Orange Money',
        FREE_MONEY: 'Free Money'
    };

    return (
        <div className="withdrawal-container">
            <div className="withdrawal-card">
                <h2 className="withdrawal-title">💸 Retirer mes gains</h2>
                <p className="withdrawal-subtitle">Transférez votre solde vers votre compte mobile</p>

                {/* Balance Display */}
                <div className="balance-display">
                    <div className="balance-label">Solde disponible</div>
                    <div className="balance-amount">{currentBalance.toLocaleString()} FCFA</div>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <span className="alert-icon">⚠️</span>
                        {error}
                    </div>
                )}

                {success && (
                    <div className="alert alert-success">
                        <span className="alert-icon">✅</span>
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="withdrawal-form">
                    {/* Provider Selection */}
                    <div className="form-group">
                        <label className="form-label">Moyen de réception</label>
                        <div className="provider-grid">
                            {(['WAVE', 'ORANGE_MONEY', 'FREE_MONEY'] as PaymentProvider[]).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    className={`provider-btn ${provider === p ? 'active' : ''}`}
                                    onClick={() => setProvider(p)}
                                >
                                    <span className="provider-logo">{providerLogos[p]}</span>
                                    <span className="provider-name">{providerNames[p]}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Amount Input */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="amount">
                            Montant (FCFA)
                        </label>
                        <input
                            id="amount"
                            type="number"
                            className="form-input"
                            placeholder="Ex: 10000"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min={MIN_WITHDRAWAL}
                            max={Math.min(MAX_WITHDRAWAL, currentBalance)}
                            disabled={loading}
                        />
                        <small className="form-hint">
                            Min: {MIN_WITHDRAWAL} FCFA - Max: {Math.min(MAX_WITHDRAWAL, currentBalance).toLocaleString()} FCFA
                        </small>
                    </div>

                    {/* Phone Number Input */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="phone">
                            Numéro de téléphone
                        </label>
                        <div className="phone-input-wrapper">
                            <span className="phone-prefix">+221</span>
                            <input
                                id="phone"
                                type="tel"
                                className="form-input phone-input"
                                placeholder="77 123 45 67"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value.replace(/\s/g, ''))}
                                disabled={loading}
                            />
                        </div>
                        <small className="form-hint">
                            Le numéro {providerNames[provider]} à créditer
                        </small>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="form-group">
                        <label className="form-label">Montants rapides</label>
                        <div className="quick-amounts">
                            {[5000, 10000, 25000, 50000, 100000]
                                .filter(amt => amt <= currentBalance)
                                .map((amt) => (
                                    <button
                                        key={amt}
                                        type="button"
                                        className="quick-amount-btn"
                                        onClick={() => setAmount(amt.toString())}
                                        disabled={loading}
                                    >
                                        {amt.toLocaleString()}
                                    </button>
                                ))}
                            {currentBalance > MIN_WITHDRAWAL && (
                                <button
                                    type="button"
                                    className="quick-amount-btn all-balance"
                                    onClick={() => setAmount(currentBalance.toString())}
                                    disabled={loading}
                                >
                                    Tout retirer
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="form-actions">
                        {onCancel && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onCancel}
                                disabled={loading}
                            >
                                Annuler
                            </button>
                        )}
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || currentBalance < MIN_WITHDRAWAL}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Traitement...
                                </>
                            ) : (
                                <>
                                    <span>💸</span>
                                    Retirer
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="withdrawal-info">
                    <p className="info-text">
                        <strong>ℹ️ Informations importantes</strong>
                    </p>
                    <ul className="info-list">
                        <li>Le retrait est traité immédiatement</li>
                        <li>Vous recevrez l'argent sur votre compte mobile</li>
                        <li>En cas d'échec, votre solde sera automatiquement restauré</li>
                        <li>Délai de réception: 1 à 5 minutes</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Withdrawal;
