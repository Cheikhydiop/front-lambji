import { useState } from 'react';
import { Send, Users, User } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { notificationService, NotificationType } from '@/services/NotificationService';
import { useToast } from '@/hooks/use-toast';

const notificationTypes: { value: NotificationType; label: string }[] = [
  { value: 'ADMIN_ALERT', label: 'Alerte Admin' },
  { value: 'SYSTEM_MAINTENANCE', label: 'Maintenance' },
  { value: 'FIGHT_STARTING', label: 'Combat imminent' },
  { value: 'FIGHT_RESULT', label: 'Résultat de combat' },
];

export default function AdminNotifications() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Individual notification
  const [userId, setUserId] = useState('');
  const [individualForm, setIndividualForm] = useState({
    type: 'ADMIN_ALERT' as NotificationType,
    title: '',
    message: '',
  });

  // Broadcast notification
  const [broadcastForm, setBroadcastForm] = useState({
    type: 'ADMIN_ALERT' as NotificationType,
    title: '',
    message: '',
  });

  const handleSendIndividual = async () => {
    if (!userId || !individualForm.title || !individualForm.message) {
      toast({ title: 'Veuillez remplir tous les champs', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await notificationService.sendNotification(userId, {
        type: individualForm.type,
        title: individualForm.title,
        message: individualForm.message,
      });
      toast({ title: 'Notification envoyée' });
      setIndividualForm({ type: 'ADMIN_ALERT', title: '', message: '' });
      setUserId('');
    } catch {
      toast({ title: 'Erreur lors de l\'envoi', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastForm.title || !broadcastForm.message) {
      toast({ title: 'Veuillez remplir tous les champs', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await notificationService.broadcastNotification({
        type: broadcastForm.type,
        title: broadcastForm.title,
        message: broadcastForm.message,
      });
      toast({ title: `Notification envoyée à ${response.data?.sent || 'tous les'} utilisateurs` });
      setBroadcastForm({ type: 'ADMIN_ALERT', title: '', message: '' });
    } catch {
      toast({ title: 'Erreur lors de l\'envoi', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Notifications">
      <div className="max-w-2xl">
        <Tabs defaultValue="individual">
          <TabsList className="mb-6">
            <TabsTrigger value="individual" className="gap-2">
              <User className="w-4 h-4" />
              Individuelle
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="gap-2">
              <Users className="w-4 h-4" />
              Diffusion
            </TabsTrigger>
          </TabsList>

          <TabsContent value="individual">
            <Card>
              <CardHeader>
                <CardTitle>Envoyer à un utilisateur</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>ID Utilisateur *</Label>
                  <Input
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Ex: clxxxxxxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={individualForm.type}
                    onValueChange={(value) =>
                      setIndividualForm({ ...individualForm, type: value as NotificationType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {notificationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Titre *</Label>
                  <Input
                    value={individualForm.title}
                    onChange={(e) =>
                      setIndividualForm({ ...individualForm, title: e.target.value })
                    }
                    placeholder="Titre de la notification"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message *</Label>
                  <Textarea
                    value={individualForm.message}
                    onChange={(e) =>
                      setIndividualForm({ ...individualForm, message: e.target.value })
                    }
                    placeholder="Contenu de la notification..."
                    rows={4}
                  />
                </div>
                <Button
                  variant="gold"
                  className="w-full"
                  onClick={handleSendIndividual}
                  disabled={loading}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="broadcast">
            <Card>
              <CardHeader>
                <CardTitle>Diffusion à tous les utilisateurs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm text-primary">
                    ⚠️ Cette notification sera envoyée à tous les utilisateurs actifs.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={broadcastForm.type}
                    onValueChange={(value) =>
                      setBroadcastForm({ ...broadcastForm, type: value as NotificationType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {notificationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Titre *</Label>
                  <Input
                    value={broadcastForm.title}
                    onChange={(e) =>
                      setBroadcastForm({ ...broadcastForm, title: e.target.value })
                    }
                    placeholder="Titre de la notification"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message *</Label>
                  <Textarea
                    value={broadcastForm.message}
                    onChange={(e) =>
                      setBroadcastForm({ ...broadcastForm, message: e.target.value })
                    }
                    placeholder="Contenu de la notification..."
                    rows={4}
                  />
                </div>
                <Button
                  variant="gold"
                  className="w-full"
                  onClick={handleBroadcast}
                  disabled={loading}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Diffuser à tous
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
