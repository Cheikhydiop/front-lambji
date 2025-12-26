import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Shield, Wallet, Scale, AlertCircle, Lock, RefreshCw, Gavel } from "lucide-react";

const TermsOfService = () => {
    const navigate = useNavigate();

    const sections = [
        {
            icon: FileText,
            title: "Article 1 – Objet",
            content: "Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités et conditions dans lesquelles les utilisateurs accèdent et utilisent la plateforme Lamb Paris, dédiée aux paris en ligne sur la lutte sénégalaise."
        },
        {
            icon: Shield,
            title: "Article 2 – Acceptation des CGU",
            content: "L'inscription et l'utilisation de la plateforme impliquent l'acceptation pleine et entière des présentes CGU par l'utilisateur."
        },
        {
            icon: Lock,
            title: "Article 3 – Conditions d'accès",
            content: [
                "• L'utilisateur doit être âgé d'au moins 18 ans.",
                "• Un seul compte est autorisé par numéro de téléphone.",
                "• L'utilisateur doit disposer d'un compte mobile money valide (Wave)."
            ]
        },
        {
            icon: FileText,
            title: "Article 4 – Fonctionnement des paris",
            content: [
                "• Les utilisateurs peuvent créer et accepter des paris sur les combats de lutte référencés dans le calendrier officiel de la plateforme.",
                "• Les fonds sont automatiquement bloqués lors de la création ou de l'acceptation d'un pari.",
                "• Les gains sont distribués automatiquement dès validation du résultat par l'administrateur.",
                "• Les utilisateurs peuvent annuler un pari dans les 30 minutes suivant sa création si celui-ci n'a pas été accepté par un autre utilisateur.",
                "• Une fois le pari accepté, il devient définitif et ne peut plus être annulé."
            ]
        },
        {
            icon: Scale,
            title: "Article 5 – Validation des résultats",
            content: [
                "1. Autorité compétente : Seul le verdict rendu par l'arbitre officiel du combat, le jour même de la rencontre, est pris en compte par la plateforme.",
                "2. Caractère définitif : Une fois le verdict saisi et validé, il est considéré comme définitif et irréversible.",
                "3. Absence de recours : Toute contestation ultérieure (appel, révision, décision fédérale ou arbitrale postérieure) ne peut entraîner l'annulation, la modification ou le remboursement des paris déjà réglés.",
                "4. Distribution des gains : Le traitement des gains intervient au plus tard 24h après la validation du verdict officiel et ne peut être révisé."
            ]
        },
        {
            icon: Wallet,
            title: "Article 6 – Gestion des fonds",
            content: [
                "• Achat de jetons via Wave",
                "• Retraits possibles",
                "• Les transactions sont sécurisées et enregistrées."
            ]
        },
        {
            icon: AlertCircle,
            title: "Article 7 – Commissions",
            content: [
                "• La plateforme prélève une commission de 5% sur le gain.",
                "• En cas de nul, votre mise vous sera remboursée."
            ]
        },
        {
            icon: Shield,
            title: "Article 8 – Responsabilités",
            content: [
                "• L'utilisateur est seul responsable de l'usage de son compte.",
                "• La plateforme ne saurait être tenue responsable en cas de fraude via un compte utilisateur.",
                "• En cas d'erreur technique, la plateforme s'engage à corriger et ajuster les soldes de manière équitable."
            ]
        },
        {
            icon: Lock,
            title: "Article 9 – Données personnelles",
            content: [
                "• Les données collectées (nom, numéro de téléphone, email) sont utilisées uniquement pour la gestion des comptes et des transactions.",
                "• L'utilisateur dispose d'un droit de rectification et de suppression de ses données."
            ]
        },
        {
            icon: RefreshCw,
            title: "Article 10 – Modification des CGU",
            content: "La plateforme se réserve le droit de modifier les présentes CGU. Toute modification sera notifiée aux utilisateurs et prendra effet immédiatement."
        },
        {
            icon: Gavel,
            title: "Article 11 – Loi applicable",
            content: "Les présentes CGU sont régies par le droit sénégalais. Tout litige relatif à leur interprétation ou leur exécution sera soumis aux juridictions compétentes du Sénégal."
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="mb-4 text-slate-400 hover:text-white hover:bg-slate-800/50"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour
                    </Button>

                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 mb-4">
                            <FileText className="h-8 w-8 text-slate-900" />
                        </div>
                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600">
                            Conditions Générales d'Utilisation
                        </h1>
                        <p className="text-slate-400 text-lg">
                            Lamb Paris - Plateforme de paris sur la lutte sénégalaise
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700">
                            <span className="text-xs text-slate-400">Dernière mise à jour :</span>
                            <span className="text-xs font-semibold text-gold-400">Décembre 2025</span>
                        </div>
                    </div>
                </div>

                {/* Terms Sections */}
                <div className="space-y-6">
                    {sections.map((section, index) => {
                        const Icon = section.icon;
                        return (
                            <Card
                                key={index}
                                className="bg-slate-900/50 border-slate-800 backdrop-blur-sm hover:bg-slate-800/50 transition-all duration-300"
                            >
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3 text-white">
                                        <div className="p-2 rounded-lg bg-gradient-to-br from-gold-500/20 to-gold-600/20 border border-gold-500/30">
                                            <Icon className="h-5 w-5 text-gold-400" />
                                        </div>
                                        <span className="text-lg">{section.title}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {Array.isArray(section.content) ? (
                                        <div className="space-y-2">
                                            {section.content.map((item, idx) => (
                                                <p key={idx} className="text-slate-300 leading-relaxed">
                                                    {item}
                                                </p>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-slate-300 leading-relaxed">{section.content}</p>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Important Notice */}
                <Card className="mt-8 bg-gradient-to-br from-amber-900/30 to-red-900/30 border-amber-700/50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className="p-2 rounded-lg bg-amber-500/20">
                                <AlertCircle className="h-6 w-6 text-amber-400" />
                            </div>
                            <div className="flex-1 space-y-2">
                                <h3 className="font-semibold text-amber-400">Important</h3>
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    En utilisant la plateforme Lamb Paris, vous reconnaissez avoir lu, compris et accepté l'ensemble de ces conditions générales d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Section */}
                <div className="mt-8 text-center">
                    <p className="text-slate-400 text-sm">
                        Pour toute question concernant ces conditions, veuillez contacter notre équipe de support.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/profile')}
                        className="mt-4 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                        Accéder au Support
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
