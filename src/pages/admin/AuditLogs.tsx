import { useEffect, useState } from 'react';
import { Search, Filter, Clock, User, Shield, Info } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { adminService, AuditLog } from '@/services/AdminService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminAuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        loadLogs();
    }, [page]);

    const loadLogs = async () => {
        try {
            setLoading(true);
            const response = await adminService.getAuditLogs(page);
            if (response.data) {
                setLogs(response.data);
                if (response.pagination) {
                    setTotalPages(response.pagination.pages);
                }
            }
        } catch (error) {
            console.error('Failed to load audit logs', error);
        } finally {
            setLoading(false);
        }
    };

    const getSeverityBadge = (action: string) => {
        if (action.includes('BAN') || action.includes('DELETE') || action.includes('APPROVE')) {
            return <Badge variant="destructive">Haute</Badge>;
        }
        if (action.includes('UPDATE')) {
            return <Badge variant="secondary">Moyenne</Badge>;
        }
        return <Badge variant="outline">Basse</Badge>;
    };

    const filteredLogs = logs.filter((log) =>
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.user?.name.toLowerCase().includes(search.toLowerCase()) ||
        log.table.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AdminLayout title="Logs d'audit">
            <div className="space-y-4">
                {/* Header/Filters */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border">
                    <div className="relative flex-1 w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher une action, un utilisateur..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => loadLogs()}>
                            <Filter className="w-4 h-4 mr-2" />
                            Actualiser
                        </Button>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Admin</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Ressource</TableHead>
                                    <TableHead>Sévérité</TableHead>
                                    <TableHead className="text-right">Détails</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                            Aucun log trouvé
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-medium whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-foreground">
                                                        {format(new Date(log.createdAt), 'PP', { locale: fr })}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {format(new Date(log.createdAt), 'p')}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-sm">
                                                            {log.user?.name || 'Système'}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {log.user?.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono text-[10px] uppercase">
                                                    {log.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium capitalize">{log.table}</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono">
                                                        ID: {log.recordId || 'N/A'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getSeverityBadge(log.action)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" title={JSON.stringify(log.newData, null, 2)}>
                                                    <Info className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-end gap-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            Précédent
                        </Button>
                        <span className="text-sm text-muted-foreground mx-2">
                            Page {page} sur {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        >
                            Suivant
                        </Button>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
