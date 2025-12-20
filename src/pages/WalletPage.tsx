import React, { useState, useEffect } from 'react';
import Deposit from '../components/wallet/Deposit';
import Withdrawal from '../components/wallet/Withdrawal';
import walletService from '../services/WalletService';
import './WalletPage.css';

type TabType = 'deposit' | 'withdrawal' | 'history';

const WalletPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('deposit');
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBalance();
    }, []);

    const loadBalance = async () => {
        setLoading(true);
        try {
            const result = await walletService.getBalance();
            if (result.success && result.data) {
                setBalance(Number(result.data.balance));
            }
        } catch (error) {
            console.error('Error loading balance:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = () => {
        loadBalance();
        // Optionally switch to history tab after success
        setTimeout(() => {
            setActiveTab('history');
        }, 2000);
    };

    return (
        <div className="wallet-page">
            <div className="wallet-header">
                <h1 className="wallet-title">💰 Mon Portefeuille</h1>
                <div className="balance-card">
                    <div className="balance-label">Solde disponible</div>
                    <div className="balance-value">
                        {loading ? (
                            <span className="loading-spinner">⏳</span>
                        ) : (
                            <>{balance.toLocaleString()} FCFA</>
                        )}
                    </div>
                </div>
            </div>

            <div className="wallet-tabs">
                <button
                    className={`tab-btn ${activeTab === 'deposit' ? 'active' : ''}`}
                    onClick={() => setActiveTab('deposit')}
                >
                    <span className="tab-icon">💳</span>
                    <span>Recharger</span>
                </button>
                <button
                    className={`tab-btn ${activeTab === 'withdrawal' ? 'active' : ''}`}
                    onClick={() => setActiveTab('withdrawal')}
                >
                    <span className="tab-icon">💸</span>
                    <span>Retirer</span>
                </button>
                <button
                    className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    <span className="tab-icon">📊</span>
                    <span>Historique</span>
                </button>
            </div>

            <div className="wallet-content">
                {activeTab === 'deposit' && (
                    <Deposit onSuccess={handleSuccess} />
                )}
                {activeTab === 'withdrawal' && (
                    <Withdrawal currentBalance={balance} onSuccess={handleSuccess} />
                )}
                {activeTab === 'history' && (
                    <div className="history-placeholder">
                        <div className="placeholder-icon">📊</div>
                        <h3>Historique des transactions</h3>
                        <p>Consultez l'historique de vos dépôts et retraits</p>
                        <p className="coming-soon">Fonctionnalité à venir...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WalletPage;
