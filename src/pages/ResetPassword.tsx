import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import config from "@/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();
    const { toast } = useToast();

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Validation du mot de passe
    const validatePassword = (password: string) => {
        const errors = [];
        if (password.length < 8) errors.push("Minimum 8 caractères");
        if (!/[A-Z]/.test(password)) errors.push("Au moins 1 majuscule");
        if (!/[a-z]/.test(password)) errors.push("Au moins 1 minuscule");
        if (!/[0-9]/.test(password)) errors.push("Au moins 1 chiffre");
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push("Au moins 1 caractère spécial");
        }
        return errors;
    };

    const passwordErrors = validatePassword(newPassword);
    const passwordsMatch = newPassword === confirmPassword;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordErrors.length > 0) {
            toast({
                title: "Mot de passe invalide",
                description: passwordErrors.join(", "),
                variant: "destructive",
            });
            return;
        }

        if (!passwordsMatch) {
            toast({
                title: "Erreur",
                description: "Les mots de passe ne correspondent pas",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${config.apiUrl}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                toast({
                    title: "Succès !",
                    description: "Votre mot de passe a été réinitialisé",
                });
                setTimeout(() => navigate("/login"), 2000);
            } else {
                toast({
                    title: "Erreur",
                    description: data.message || "Token invalide ou expiré",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible de se connecter au serveur",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-destructive">Token manquant</CardTitle>
                        <CardDescription>
                            Le lien de réinitialisation est invalide ou incomplet.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => navigate("/forgot-password")} className="w-full">
                            Demander un nouveau lien
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">Nouveau mot de passe</CardTitle>
                    <CardDescription>
                        Choisissez un mot de passe fort pour sécuriser votre compte
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {success ? (
                        <Alert className="bg-green-50 border-green-200">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                Mot de passe réinitialisé avec succès ! Redirection vers la connexion...
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Nouveau mot de passe */}
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                {newPassword && (
                                    <div className="text-xs space-y-1">
                                        {passwordErrors.map((error, i) => (
                                            <div key={i} className="flex items-center gap-1 text-destructive">
                                                <XCircle className="h-3 w-3" />
                                                {error}
                                            </div>
                                        ))}
                                        {passwordErrors.length === 0 && (
                                            <div className="flex items-center gap-1 text-green-600">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Mot de passe valide
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Confirmation */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirm ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                    >
                                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                {confirmPassword && (
                                    <div className="text-xs">
                                        {passwordsMatch ? (
                                            <div className="flex items-center gap-1 text-green-600">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Les mots de passe correspondent
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-destructive">
                                                <XCircle className="h-3 w-3" />
                                                Les mots de passe ne correspondent pas
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading || passwordErrors.length > 0 || !passwordsMatch}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Réinitialisation...
                                    </>
                                ) : (
                                    "Réinitialiser le mot de passe"
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ResetPassword;
