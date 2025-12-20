import React, { useState } from 'react';
import walletService from '../../services/WalletService';
import './Deposit.css';

interface DepositProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

type PaymentProvider = 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY';

const Deposit: React.FC<DepositProps> = ({ onSuccess, onCancel }) => {
    const [amount, setAmount] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [provider, setProvider] = useState<PaymentProvider>('WAVE');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const MIN_DEPOSIT = 500;
    const MAX_DEPOSIT = 1000000;

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

        if (amountNum < MIN_DEPOSIT) {
            setError(`Le montant minimum est de ${MIN_DEPOSIT} FCFA`);
            return;
        }

        if (amountNum > MAX_DEPOSIT) {
            setError(`Le montant maximum est de ${MAX_DEPOSIT.toLocaleString()} FCFA`);
            return;
        }

        if (!phoneNumber || phoneNumber.length < 9) {
            setError('Veuillez entrer un numéro de téléphone valide');
            return;
        }

        setLoading(true);

        try {
            const result = await walletService.deposit({
                amount: BigInt(amountNum),
                provider,
                phoneNumber: phoneNumber.startsWith('+') ? phoneNumber : `+221${phoneNumber}`
            });

            if (result.success) {
                setSuccess(result.data?.message || 'Dépôt initié avec succès ! Veuillez confirmer sur votre téléphone.');
                setAmount('');
                setPhoneNumber('');

                setTimeout(() => {
                    if (onSuccess) onSuccess();
                }, 2000);
            } else {
                setError(result.error || 'Erreur lors du dépôt');
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
        <div className="deposit-container">
            <div className="deposit-card">
                <h2 className="deposit-title">💳 Recharger mon compte</h2>
                <p className="deposit-subtitle">Achetez du solde pour parier sur vos combats préférés</p>

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

                <form onSubmit={handleSubmit} className="deposit-form">
                    {/* Provider Selection */}
                    <div className="form-group">
                        <label className="form-label">Moyen de paiement</label>
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
                            min={MIN_DEPOSIT}
                            max={MAX_DEPOSIT}
                            disabled={loading}
                        />
                        <small className="form-hint">
                            Min: {MIN_DEPOSIT} FCFA - Max: {MAX_DEPOSIT.toLocaleString()} FCFA
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
                            Le numéro {providerNames[provider]} à débiter
                        </small>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="form-group">
                        <label className="form-label">Montants rapides</label>
                        <div className="quick-amounts">
                            {[1000, 5000, 10000, 25000, 50000].map((amt) => (
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
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Traitement...
                                </>
                            ) : (
                                <>
                                    <span>💳</span>
                                    Recharger
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="deposit-info">
                    <p className="info-text">
                        <strong>ℹ️ Comment ça marche ?</strong>
                    </p>
                    <ol className="info-list">
                        <li>Choisissez votre moyen de paiement</li>
                        <li>Entrez le montant et votre numéro</li>
                        <li>Confirmez le paiement sur votre téléphone</li>
                        <li>Votre solde sera crédité automatiquement</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default Deposit;
