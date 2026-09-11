import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@/lib/atomsClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { CheckCircle, XCircle, Clock, Shield, FileText, User, Megaphone } from 'lucide-react';
import { toast } from 'sonner';

const client = createClient();

interface KycItem {
  id: number;
  user_id: string;
  full_name: string;
  document_type: string;
  document_number: string;
  country: string;
  specialty: string;
  years_experience: number;
  certifications: string;
  status: string;
  created_at: string;
}

interface AdBookingItem {
  id: number;
  slot: string;
  advertiser_name: string;
  advertiser_email: string;
  title: string;
  image_url: string;
  link_url: string;
  amount_cents: number;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string | null;
  rejected_reason: string | null;
}

interface AdSlotItem {
  slot: string;
  price_cents: number;
  self_service_enabled: boolean;
  occupied_until: string | null;
  queue_length: number;
}

interface HouseAdItem {
  slot: string;
  title: string;
  image_url: string;
  link_url: string;
  active: boolean;
}

interface InvitationItem {
  id: number;
  email: string;
  plan: string;
  months: number;
  status: string;
  source: string | null;
  created_at: string | null;
  redeemed_at: string | null;
}

interface DashboardStats {
  users_total: number;
  users_last_7_days: number;
  professionals_total: number;
  active_subscriptions: number;
  mrr_estimate_eur: number;
  jobs_total: number;
  jobs_active: number;
  messages_total: number;
  reviews_total: number;
  disputes_open: number;
  kyc_pending: number;
  ad_bookings_active: number;
}

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  account_status: string;
  created_at: string | null;
  last_login: string | null;
  plan: string | null;
  subscription_status: string | null;
}

interface AdminJob {
  id: number;
  title: string;
  category: string;
  country: string;
  location: string;
  status: string | null;
  user_id: string;
  created_at: string | null;
}

interface AdminBid {
  id: number;
  job_id: number;
  job_title: string | null;
  amount: number;
  message: string | null;
  status: string | null;
  user_id: string;
  bidder_email: string | null;
  created_at: string | null;
}

interface AdminDispute {
  id: number;
  job_title: string;
  reason: string;
  description: string;
  amount_disputed: number | null;
  status: string;
  resolution: string | null;
  user_id: string;
  created_at: string | null;
}

interface AdminReview {
  id: number;
  professional_id: string;
  rating: number;
  comment: string;
  reviewer_name: string | null;
  user_id: string;
  created_at: string | null;
}

interface AdminProfessional {
  id: number;
  display_name: string;
  role: string;
  country: string | null;
  rating: number | null;
  jobs_completed: number | null;
  verified_kyc: boolean | null;
  user_id: string;
  email: string | null;
}

interface SecurityOverview {
  failed_logins_24h: number;
  banned_users: number;
  recent_attempts: {
    email: string; method: string; success: boolean; reason: string | null;
    ip_address: string | null; created_at: string | null;
  }[];
}

interface AuditLogEntry {
  id: number;
  actor_email: string | null;
  action: string;
  target: string | null;
  details: string | null;
  created_at: string | null;
}

interface StaffMember {
  id: string;
  email: string;
  name: string | null;
  role: string;
  role_label: string;
}

const SLOT_LABELS: Record<string, string> = {
  home_top: 'Portada',
  jobs_top: 'Trabajos',
  pros_top: 'Profesionales',
};

const STAFF_ROLE_OPTIONS = [
  { value: 'admin', label: 'Super admin' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'seguridad', label: 'Seguridad' },
  { value: 'moderacion', label: 'Moderación' },
  { value: 'soporte', label: 'Soporte' },
  { value: 'user', label: 'Quitar rol de staff' },
];

function HouseAdEditor({
  slot, current, saving, onSave, onDelete,
}: {
  slot: string;
  current: HouseAdItem | undefined;
  saving: boolean;
  onSave: (slot: string, title: string, imageUrl: string, linkUrl: string) => void;
  onDelete: (slot: string) => void;
}) {
  const [title, setTitle] = useState(current?.title || '');
  const [imageUrl, setImageUrl] = useState(current?.image_url || '');
  const [linkUrl, setLinkUrl] = useState(current?.link_url || '');

  return (
    <Card className="bg-white">
      <CardHeader><CardTitle className="text-sm">{SLOT_LABELS[slot] || slot}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {current?.image_url && <img src={current.image_url} alt={current.title} className="w-full h-24 object-cover rounded-md bg-slate-100" />}
        <Input placeholder="Título / texto alternativo" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input placeholder="URL de la imagen" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        <Input placeholder="Enlace al hacer clic" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
        <div className="flex gap-2">
          <Button size="sm" disabled={saving} className="cursor-pointer bg-emerald-600 hover:bg-emerald-700" onClick={() => onSave(slot, title, imageUrl, linkUrl)}>Guardar</Button>
          {current && <Button size="sm" variant="destructive" disabled={saving} className="cursor-pointer" onClick={() => onDelete(slot)}>Quitar</Button>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | number | null>(null);

  const [pendingKyc, setPendingKyc] = useState<KycItem[]>([]);
  const [allKyc, setAllKyc] = useState<KycItem[]>([]);
  const [adBookings, setAdBookings] = useState<AdBookingItem[]>([]);
  const [adSlots, setAdSlots] = useState<AdSlotItem[]>([]);
  const [houseAds, setHouseAds] = useState<HouseAdItem[]>([]);
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [launchDate, setLaunchDate] = useState<string>('');
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [newInvitePlan, setNewInvitePlan] = useState('pro');
  const [newInviteMonths, setNewInviteMonths] = useState(1);
  const [slotSaving, setSlotSaving] = useState<string | null>(null);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [bids, setBids] = useState<AdminBid[]>([]);
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [professionals, setProfessionals] = useState<AdminProfessional[]>([]);
  const [security, setSecurity] = useState<SecurityOverview | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('soporte');

  useEffect(() => {
    client.auth.me()
      .then((res) => {
        if (!res?.data) {
          client.auth.toLogin();
        } else {
          setUser(res.data);
          loadData();
        }
      })
      .catch(() => client.auth.toLogin());
  }, []);

  const loadData = async (search?: string) => {
    const endpoints: Array<[string, (data: unknown) => void]> = [
      ['/api/v1/admin/kyc/pending', (d: any) => d?.items && setPendingKyc(d.items)],
      ['/api/v1/admin/kyc/all', (d: any) => d?.items && setAllKyc(d.items)],
      ['/api/v1/admin/ad-bookings', (d: any) => d && setAdBookings(d)],
      ['/api/v1/admin/ad-slots', (d: any) => d && setAdSlots(d)],
      ['/api/v1/admin/house-ads', (d: any) => d && setHouseAds(d)],
      ['/api/v1/admin/invitations', (d: any) => d && setInvitations(d)],
      ['/api/v1/admin/platform-settings', (d: any) => setLaunchDate(d?.launch_date ? d.launch_date.slice(0, 16) : '')],
      ['/api/v1/admin/dashboard', (d: any) => d && setStats(d)],
      [`/api/v1/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`, (d: any) => d?.items && setUsers(d.items)],
      ['/api/v1/admin/jobs', (d: any) => d && setJobs(d)],
      ['/api/v1/admin/bids', (d: any) => d && setBids(d)],
      ['/api/v1/admin/disputes', (d: any) => d && setDisputes(d)],
      ['/api/v1/admin/reviews', (d: any) => d && setReviews(d)],
      ['/api/v1/admin/professionals', (d: any) => d && setProfessionals(d)],
      ['/api/v1/admin/security', (d: any) => d && setSecurity(d)],
      ['/api/v1/admin/audit-log', (d: any) => d && setAuditLog(d)],
      ['/api/v1/admin/staff', (d: any) => d && setStaff(d)],
    ];

    // Promise.allSettled en vez de Promise.all: si una sola pestaña falla
    // (p.ej. un endpoint que aún no existe en el backend desplegado), las
    // demás igualmente se rellenan en vez de quedarse todas en blanco.
    const results = await Promise.allSettled(
      endpoints.map(([path]) => client.apiCall.invoke(path, {}, 'GET'))
    );

    results.forEach((result, i) => {
      const [path, apply] = endpoints[i];
      if (result.status === 'fulfilled') {
        try {
          apply(result.value?.data);
        } catch (e) {
          console.error(`Admin: error aplicando datos de ${path}`, e);
        }
      } else {
        console.error(`Admin: fallo cargando ${path}`, result.reason);
      }
    });

    setLoading(false);
  };

  const handleAction = async (kycId: number, action: 'approve' | 'reject') => {
    setProcessing(kycId);
    try {
      const res = await client.apiCall.invoke('/api/v1/admin/kyc/action', { kyc_id: kycId, action }, 'POST');
      if (res?.data?.success) {
        toast.success(action === 'approve' ? '✅ Verificación aprobada' : '❌ Verificación rechazada');
        loadData();
      } else {
        toast.error('Error al procesar la acción');
      }
    } catch {
      toast.error('Error al procesar la acción');
    }
    setProcessing(null);
  };

  const handleBookingAction = async (bookingId: number, action: 'approve' | 'reject') => {
    setProcessing(bookingId);
    try {
      if (action === 'approve') {
        await client.apiCall.invoke(`/api/v1/admin/ad-bookings/${bookingId}/approve`, {}, 'POST');
        toast.success('Anuncio aprobado');
      } else {
        const reason = window.prompt('Motivo del rechazo:');
        if (reason === null) { setProcessing(null); return; }
        await client.apiCall.invoke(`/api/v1/admin/ad-bookings/${bookingId}/reject`, { reason }, 'POST');
        toast.success('Anuncio rechazado');
      }
      loadData();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Error al procesar la reserva.';
      toast.error(message);
    }
    setProcessing(null);
  };

  const handleUpdateSlot = async (slot: string, updates: { price_cents?: number; self_service_enabled?: boolean }) => {
    setSlotSaving(slot);
    try {
      await client.apiCall.invoke(`/api/v1/admin/ad-slots/${slot}`, updates, 'PUT');
      toast.success('Hueco actualizado');
      loadData();
    } catch {
      toast.error('No se pudo actualizar el hueco');
    }
    setSlotSaving(null);
  };

  const handleSaveHouseAd = async (slot: string, title: string, imageUrl: string, linkUrl: string) => {
    if (!title.trim() || !imageUrl.trim() || !linkUrl.trim()) {
      toast.error('Rellena título, imagen y enlace');
      return;
    }
    setSlotSaving(slot);
    try {
      await client.apiCall.invoke(`/api/v1/admin/house-ads/${slot}`, { title, image_url: imageUrl, link_url: linkUrl, active: true }, 'PUT');
      toast.success('Anuncio guardado');
      loadData();
    } catch {
      toast.error('No se pudo guardar el anuncio');
    }
    setSlotSaving(null);
  };

  const handleDeleteHouseAd = async (slot: string) => {
    if (!window.confirm('¿Quitar el anuncio de este hueco?')) return;
    setSlotSaving(slot);
    try {
      await client.apiCall.invoke(`/api/v1/admin/house-ads/${slot}`, {}, 'DELETE');
      toast.success('Anuncio retirado');
      loadData();
    } catch {
      toast.error('No se pudo quitar el anuncio');
    }
    setSlotSaving(null);
  };

  const handleCreateInvitation = async () => {
    if (!newInviteEmail.trim()) {
      toast.error('Escribe el email de la persona a invitar');
      return;
    }
    setProcessing('create-invitation');
    try {
      await client.apiCall.invoke('/api/v1/admin/invitations', { email: newInviteEmail.trim(), plan: newInvitePlan, months: newInviteMonths }, 'POST');
      toast.success('Invitación enviada');
      setNewInviteEmail('');
      loadData();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'No se pudo enviar la invitación.';
      toast.error(message);
    }
    setProcessing(null);
  };

  const handleRevokeInvitation = async (id: number) => {
    if (!window.confirm('¿Revocar esta invitación?')) return;
    setProcessing(id);
    try {
      await client.apiCall.invoke(`/api/v1/admin/invitations/${id}`, {}, 'DELETE');
      toast.success('Invitación revocada');
      loadData();
    } catch {
      toast.error('No se pudo revocar la invitación');
    }
    setProcessing(null);
  };

  const handleSaveLaunchDate = async () => {
    setProcessing('launch-date');
    try {
      await client.apiCall.invoke('/api/v1/admin/platform-settings', { launch_date: launchDate ? new Date(launchDate).toISOString() : null }, 'PUT');
      toast.success('Fecha de lanzamiento guardada');
      loadData();
    } catch {
      toast.error('No se pudo guardar la fecha');
    }
    setProcessing(null);
  };

  const handleBanProfessional = async (p: AdminProfessional) => {
    const reason = window.prompt('Motivo del baneo (opcional):') || undefined;
    setProcessing(p.id);
    try {
      await client.apiCall.invoke(`/api/v1/admin/users/${p.user_id}/ban`, { reason }, 'POST');
      toast.success('Usuario baneado');
      loadData();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'No se pudo banear.';
      toast.error(message);
    }
    setProcessing(null);
  };

  const handleDeleteProfessionalProfile = async (p: AdminProfessional) => {
    if (!window.confirm(`¿Borrar el perfil profesional de ${p.display_name}? (la cuenta de usuario no se borra, solo el perfil)`)) return;
    setProcessing(p.id);
    try {
      await client.apiCall.invoke(`/api/v1/admin/professionals/${p.id}`, {}, 'DELETE');
      toast.success('Perfil borrado');
      loadData();
    } catch {
      toast.error('No se pudo borrar el perfil');
    }
    setProcessing(null);
  };

  const handleUserSearch = () => {
    setLoading(true);
    loadData(userSearch);
  };

  const handleBanToggle = async (u: AdminUser) => {
    setProcessing(u.id);
    try {
      if (u.account_status === 'banned') {
        await client.apiCall.invoke(`/api/v1/admin/users/${u.id}/unban`, {}, 'POST');
        toast.success('Usuario desbaneado');
      } else {
        const reason = window.prompt('Motivo del baneo (opcional):') || undefined;
        await client.apiCall.invoke(`/api/v1/admin/users/${u.id}/ban`, { reason }, 'POST');
        toast.success('Usuario baneado');
      }
      loadData();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Error al procesar la acción.';
      toast.error(message);
    }
    setProcessing(null);
  };

  const handleDeleteUser = async (u: AdminUser) => {
    if (!window.confirm(`¿Borrar la cuenta de ${u.email} de forma permanente? Esta acción no se puede deshacer.`)) return;
    setProcessing(u.id);
    try {
      await client.apiCall.invoke(`/api/v1/admin/users/${u.id}`, {}, 'DELETE');
      toast.success('Cuenta borrada');
      loadData();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'No se pudo borrar la cuenta.';
      toast.error(message);
    }
    setProcessing(null);
  };

  const handleJobAction = async (jobId: number, action: 'remove' | 'restore' | 'delete') => {
    setProcessing(jobId);
    try {
      if (action === 'delete') {
        if (!window.confirm('¿Borrar este trabajo definitivamente?')) { setProcessing(null); return; }
        await client.apiCall.invoke(`/api/v1/admin/jobs/${jobId}`, {}, 'DELETE');
        toast.success('Trabajo borrado');
      } else {
        await client.apiCall.invoke(`/api/v1/admin/jobs/${jobId}/${action}`, {}, 'POST');
        toast.success(action === 'remove' ? 'Trabajo retirado' : 'Trabajo restaurado');
      }
      loadData();
    } catch {
      toast.error('Error al procesar el trabajo');
    }
    setProcessing(null);
  };

  const handleBidAction = async (bidId: number, action: 'cancel' | 'delete') => {
    if (action === 'delete' && !window.confirm('¿Borrar esta puja del registro?')) return;
    setProcessing(bidId);
    try {
      if (action === 'cancel') {
        await client.apiCall.invoke(`/api/v1/admin/bids/${bidId}/cancel`, {}, 'POST');
        toast.success('Puja anulada');
      } else {
        await client.apiCall.invoke(`/api/v1/admin/bids/${bidId}`, {}, 'DELETE');
        toast.success('Puja borrada');
      }
      loadData();
    } catch {
      toast.error('Error al procesar la puja');
    }
    setProcessing(null);
  };

  const handleResolveDispute = async (disputeId: number) => {
    const resolution = window.prompt('Resolución de la disputa:');
    if (!resolution) return;
    setProcessing(disputeId);
    try {
      await client.apiCall.invoke(`/api/v1/admin/disputes/${disputeId}/resolve`, { resolution, status: 'resolved' }, 'POST');
      toast.success('Disputa resuelta');
      loadData();
    } catch {
      toast.error('Error al resolver la disputa');
    }
    setProcessing(null);
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm('¿Borrar esta reseña?')) return;
    setProcessing(reviewId);
    try {
      await client.apiCall.invoke(`/api/v1/admin/reviews/${reviewId}`, {}, 'DELETE');
      toast.success('Reseña borrada');
      loadData();
    } catch {
      toast.error('Error al borrar la reseña');
    }
    setProcessing(null);
  };

  const handleAssignRole = async () => {
    if (!newStaffEmail.trim()) {
      toast.error('Escribe el email de la persona');
      return;
    }
    setProcessing('assign-role');
    try {
      await client.apiCall.invoke('/api/v1/admin/staff/assign-role', { email: newStaffEmail.trim(), role: newStaffRole }, 'POST');
      toast.success('Rol asignado');
      setNewStaffEmail('');
      loadData();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'No se pudo asignar el rol.';
      toast.error(message);
    }
    setProcessing(null);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-800"><CheckCircle className="h-3 w-3 mr-1" />Aprobado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rechazado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString('es') : '-');

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 bg-slate-50">
        <div className="container max-w-7xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl" style={{ fontFamily: 'Poppins, sans-serif' }}>Panel de Administración</h1>
              <p className="text-muted-foreground text-sm">Vista general de Agrivo, al minuto</p>
            </div>
          </div>

          <Tabs defaultValue="resumen">
            <TabsList className="mb-6 flex w-full overflow-x-auto justify-start h-auto p-1 gap-1">
              <TabsTrigger value="resumen" className="cursor-pointer shrink-0">Resumen</TabsTrigger>
              <TabsTrigger value="usuarios" className="cursor-pointer shrink-0">Usuarios ({stats?.users_total ?? 0})</TabsTrigger>
              <TabsTrigger value="trabajos" className="cursor-pointer shrink-0">Trabajos ({stats?.jobs_total ?? 0})</TabsTrigger>
              <TabsTrigger value="pujas" className="cursor-pointer shrink-0">Pujas ({bids.length})</TabsTrigger>
              <TabsTrigger value="disputas" className="cursor-pointer shrink-0">Disputas ({stats?.disputes_open ?? 0})</TabsTrigger>
              <TabsTrigger value="resenas" className="cursor-pointer shrink-0">Reseñas ({stats?.reviews_total ?? 0})</TabsTrigger>
              <TabsTrigger value="profesionales" className="cursor-pointer shrink-0">Profesionales ({stats?.professionals_total ?? 0})</TabsTrigger>
              <TabsTrigger value="publicidad" className="cursor-pointer shrink-0">Publicidad ({adBookings.filter(b => b.status === 'pending_approval').length})</TabsTrigger>
              <TabsTrigger value="kyc-pending" className="cursor-pointer shrink-0">KYC Pendientes ({pendingKyc.length})</TabsTrigger>
              <TabsTrigger value="kyc-all" className="cursor-pointer shrink-0">KYC Todas ({allKyc.length})</TabsTrigger>
              <TabsTrigger value="seguridad" className="cursor-pointer shrink-0">Seguridad</TabsTrigger>
              <TabsTrigger value="auditoria" className="cursor-pointer shrink-0">Auditoría</TabsTrigger>
              <TabsTrigger value="equipo" className="cursor-pointer shrink-0">Equipo ({staff.length})</TabsTrigger>
              <TabsTrigger value="invitaciones" className="cursor-pointer shrink-0">Invitaciones ({invitations.filter(i => i.status === 'pending').length})</TabsTrigger>
            </TabsList>

            {/* ===================== RESUMEN ===================== */}
            <TabsContent value="resumen">
              {stats ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-white"><CardContent className="p-5">
                    <p className="text-2xl font-bold">{stats.users_total}</p>
                    <p className="text-sm text-muted-foreground">Usuarios registrados</p>
                    <p className="text-xs text-emerald-600 mt-1">+{stats.users_last_7_days} en los últimos 7 días</p>
                  </CardContent></Card>
                  <Card className="bg-white"><CardContent className="p-5">
                    <p className="text-2xl font-bold">{stats.professionals_total}</p>
                    <p className="text-sm text-muted-foreground">Profesionales</p>
                  </CardContent></Card>
                  <Card className="bg-white"><CardContent className="p-5">
                    <p className="text-2xl font-bold">{stats.active_subscriptions}</p>
                    <p className="text-sm text-muted-foreground">Suscripciones activas</p>
                    <p className="text-xs text-muted-foreground mt-1">~{stats.mrr_estimate_eur.toFixed(0)}€ / mes estimados</p>
                  </CardContent></Card>
                  <Card className="bg-white"><CardContent className="p-5">
                    <p className="text-2xl font-bold">{stats.ad_bookings_active}</p>
                    <p className="text-sm text-muted-foreground">Anuncios activos</p>
                  </CardContent></Card>
                  <Card className="bg-white"><CardContent className="p-5">
                    <p className="text-2xl font-bold">{stats.jobs_active}</p>
                    <p className="text-sm text-muted-foreground">Trabajos activos</p>
                    <p className="text-xs text-muted-foreground mt-1">{stats.jobs_total} en total</p>
                  </CardContent></Card>
                  <Card className="bg-white"><CardContent className="p-5">
                    <p className="text-2xl font-bold">{stats.messages_total}</p>
                    <p className="text-sm text-muted-foreground">Mensajes</p>
                  </CardContent></Card>
                  <Card className="bg-white"><CardContent className="p-5">
                    <p className="text-2xl font-bold">{stats.disputes_open}</p>
                    <p className="text-sm text-muted-foreground">Disputas abiertas</p>
                  </CardContent></Card>
                  <Card className="bg-white"><CardContent className="p-5">
                    <p className="text-2xl font-bold">{stats.kyc_pending}</p>
                    <p className="text-sm text-muted-foreground">KYC pendientes</p>
                  </CardContent></Card>
                </div>
              ) : (
                <p className="text-muted-foreground">Cargando estadísticas...</p>
              )}
            </TabsContent>

            {/* ===================== USUARIOS ===================== */}
            <TabsContent value="usuarios">
              <div className="flex gap-2 mb-4 max-w-md">
                <Input
                  placeholder="Buscar por email o nombre..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUserSearch()}
                />
                <Button variant="outline" onClick={handleUserSearch} className="cursor-pointer">Buscar</Button>
              </div>
              <div className="space-y-2">
                {users.map((u) => (
                  <Card key={u.id} className="bg-white">
                    <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm">{u.name || u.email} <span className="text-xs text-muted-foreground">({u.email})</span></p>
                        <p className="text-xs text-muted-foreground">
                          {u.role} · Registrado {fmtDate(u.created_at)}
                          {u.plan && ` · Plan ${u.plan} (${u.subscription_status})`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={
                          u.account_status === 'banned' ? 'bg-red-100 text-red-800'
                          : u.account_status === 'suspended' ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                        }>{u.account_status}</Badge>
                        <Button size="sm" variant="outline" disabled={processing === u.id} className="cursor-pointer" onClick={() => handleBanToggle(u)}>
                          {u.account_status === 'banned' ? 'Desbanear' : 'Banear'}
                        </Button>
                        <Button size="sm" variant="destructive" disabled={processing === u.id} className="cursor-pointer" onClick={() => handleDeleteUser(u)}>
                          Borrar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {users.length === 0 && !loading && <p className="text-muted-foreground text-sm">No hay usuarios que coincidan.</p>}
              </div>
            </TabsContent>

            {/* ===================== TRABAJOS ===================== */}
            <TabsContent value="trabajos">
              <div className="space-y-2">
                {jobs.map((j) => (
                  <Card key={j.id} className="bg-white">
                    <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm">{j.title}</p>
                        <p className="text-xs text-muted-foreground">{j.category} · {j.location}, {j.country} · {fmtDate(j.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={j.status === 'removed' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}>{j.status}</Badge>
                        {j.status === 'removed' ? (
                          <Button size="sm" variant="outline" disabled={processing === j.id} className="cursor-pointer" onClick={() => handleJobAction(j.id, 'restore')}>Restaurar</Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled={processing === j.id} className="cursor-pointer" onClick={() => handleJobAction(j.id, 'remove')}>Retirar</Button>
                        )}
                        <Button size="sm" variant="destructive" disabled={processing === j.id} className="cursor-pointer" onClick={() => handleJobAction(j.id, 'delete')}>Borrar</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {jobs.length === 0 && !loading && <p className="text-muted-foreground text-sm">No hay trabajos publicados.</p>}
              </div>
            </TabsContent>

            {/* ===================== PUJAS ===================== */}
            <TabsContent value="pujas">
              <p className="text-sm text-muted-foreground mb-4">Registro completo de ofertas del sistema de subastas.</p>
              <div className="space-y-2">
                {bids.map((b) => (
                  <Card key={b.id} className="bg-white">
                    <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm">{b.amount.toFixed(2)} € — {b.job_title || `Trabajo #${b.job_id}`}</p>
                        <p className="text-xs text-muted-foreground">{b.bidder_email || b.user_id} · {fmtDate(b.created_at)}</p>
                        {b.message && <p className="text-xs text-muted-foreground italic mt-1">"{b.message}"</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={
                          b.status === 'accepted' ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'cancelled' ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                        }>{b.status}</Badge>
                        {b.status !== 'cancelled' && (
                          <Button size="sm" variant="outline" disabled={processing === b.id} className="cursor-pointer" onClick={() => handleBidAction(b.id, 'cancel')}>Anular</Button>
                        )}
                        <Button size="sm" variant="destructive" disabled={processing === b.id} className="cursor-pointer" onClick={() => handleBidAction(b.id, 'delete')}>Borrar</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {bids.length === 0 && !loading && <p className="text-muted-foreground text-sm">No hay pujas registradas.</p>}
              </div>
            </TabsContent>

            {/* ===================== DISPUTAS ===================== */}
            <TabsContent value="disputas">
              <div className="space-y-2">
                {disputes.map((d) => (
                  <Card key={d.id} className="bg-white">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-sm">{d.job_title} — {d.reason}</p>
                          <p className="text-xs text-muted-foreground mt-1">{d.description}</p>
                          {d.amount_disputed != null && <p className="text-xs text-muted-foreground">Importe en disputa: {d.amount_disputed.toFixed(2)} €</p>}
                          {d.resolution && <p className="text-xs text-emerald-700 mt-1">Resolución: {d.resolution}</p>}
                          <p className="text-xs text-muted-foreground mt-1">{fmtDate(d.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge className={d.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>{d.status}</Badge>
                          {d.status !== 'resolved' && (
                            <Button size="sm" disabled={processing === d.id} className="cursor-pointer bg-emerald-600 hover:bg-emerald-700" onClick={() => handleResolveDispute(d.id)}>Resolver</Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {disputes.length === 0 && !loading && <p className="text-muted-foreground text-sm">No hay disputas registradas.</p>}
              </div>
            </TabsContent>

            {/* ===================== RESEÑAS ===================== */}
            <TabsContent value="resenas">
              <div className="space-y-2">
                {reviews.map((r) => (
                  <Card key={r.id} className="bg-white">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)} — {r.reviewer_name || 'Anónimo'}</p>
                        <p className="text-xs text-muted-foreground mt-1">{r.comment}</p>
                        <p className="text-xs text-muted-foreground mt-1">{fmtDate(r.created_at)}</p>
                      </div>
                      <Button size="sm" variant="destructive" disabled={processing === r.id} className="cursor-pointer shrink-0" onClick={() => handleDeleteReview(r.id)}>Borrar</Button>
                    </CardContent>
                  </Card>
                ))}
                {reviews.length === 0 && !loading && <p className="text-muted-foreground text-sm">No hay reseñas registradas.</p>}
              </div>
            </TabsContent>

            {/* ===================== PROFESIONALES ===================== */}
            <TabsContent value="profesionales">
              <div className="space-y-2">
                {professionals.map((p) => (
                  <Card key={p.id} className="bg-white">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm">{p.display_name} {p.verified_kyc && <CheckCircle className="inline h-3.5 w-3.5 text-emerald-600 ml-1" />}</p>
                        <p className="text-xs text-muted-foreground">{p.email} · {p.country || 'Sin país'} · {p.jobs_completed ?? 0} trabajos · ★{(p.rating ?? 0).toFixed(1)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm" variant="outline" disabled={processing === p.id} className="cursor-pointer" onClick={() => handleBanProfessional(p)}>Banear</Button>
                        <Button size="sm" variant="destructive" disabled={processing === p.id} className="cursor-pointer" onClick={() => handleDeleteProfessionalProfile(p)}>Borrar perfil</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {professionals.length === 0 && !loading && <p className="text-muted-foreground text-sm">No hay profesionales registrados.</p>}
              </div>
            </TabsContent>

            {/* ===================== PUBLICIDAD ===================== */}
            <TabsContent value="publicidad">
              <div className="space-y-8">
                <div>
                  <h3 className="font-semibold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>Huecos publicitarios</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {adSlots.map((slot) => (
                      <Card key={slot.slot} className="bg-white">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{SLOT_LABELS[slot.slot] || slot.slot}</span>
                            {slot.occupied_until ? <Badge className="bg-amber-100 text-amber-800">Ocupado</Badge> : <Badge className="bg-emerald-100 text-emerald-800">Libre</Badge>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Precio (€/30d):</span>
                            <Input
                              type="number" step="0.01" defaultValue={(slot.price_cents / 100).toFixed(2)} className="h-8 w-24"
                              disabled={slotSaving === slot.slot}
                              onBlur={(e) => {
                                const cents = Math.round(parseFloat(e.target.value) * 100);
                                if (!Number.isNaN(cents) && cents !== slot.price_cents) handleUpdateSlot(slot.slot, { price_cents: cents });
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Venta self-service</span>
                            <Switch checked={slot.self_service_enabled} disabled={slotSaving === slot.slot} onCheckedChange={(checked) => handleUpdateSlot(slot.slot, { self_service_enabled: checked })} />
                          </div>
                          {slot.queue_length > 0 && <p className="text-xs text-muted-foreground">{slot.queue_length} en cola</p>}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>Contenido actual de cada hueco</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {adSlots.map((slot) => (
                      <HouseAdEditor
                        key={slot.slot}
                        slot={slot.slot}
                        current={houseAds.find((a) => a.slot === slot.slot)}
                        saving={slotSaving === slot.slot}
                        onSave={handleSaveHouseAd}
                        onDelete={handleDeleteHouseAd}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>Reservas de anunciantes</h3>
                  {adBookings.length > 0 ? (
                    <div className="space-y-3">
                      {adBookings.map((b) => (
                        <Card key={b.id} className="bg-white">
                          <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <img src={b.image_url} alt={b.title} className="h-12 w-20 object-cover rounded-md bg-slate-100" />
                                <div>
                                  <p className="font-medium text-sm">{b.title}</p>
                                  <p className="text-xs text-muted-foreground">{b.advertiser_name} ({b.advertiser_email}) · {SLOT_LABELS[b.slot] || b.slot} · {(b.amount_cents / 100).toFixed(2)} €</p>
                                  {b.status === 'rejected' && b.rejected_reason && <p className="text-xs text-red-600">{b.rejected_reason}</p>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge className={
                                  b.status === 'active' ? 'bg-emerald-100 text-emerald-800'
                                  : b.status === 'pending_approval' ? 'bg-amber-100 text-amber-800'
                                  : b.status === 'queued' ? 'bg-blue-100 text-blue-800'
                                  : b.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                                }>{b.status}</Badge>
                                {b.status === 'pending_approval' && (
                                  <>
                                    <Button size="sm" disabled={processing === b.id} className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer" onClick={() => handleBookingAction(b.id, 'approve')}>Aprobar</Button>
                                    <Button size="sm" variant="destructive" disabled={processing === b.id} className="cursor-pointer" onClick={() => handleBookingAction(b.id, 'reject')}>Rechazar</Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="bg-white"><CardContent className="p-10 text-center">
                      <Megaphone className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-muted-foreground">Todavía no hay reservas de anuncios</p>
                    </CardContent></Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ===================== KYC PENDIENTES ===================== */}
            <TabsContent value="kyc-pending">
              {loading ? (
                <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="animate-pulse h-32 bg-white rounded-xl" />)}</div>
              ) : pendingKyc.length > 0 ? (
                <div className="space-y-4">
                  {pendingKyc.map((kyc) => (
                    <Card key={kyc.id} className="bg-white">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center"><User className="h-5 w-5 text-emerald-700" /></div>
                              <div>
                                <h3 className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>{kyc.full_name}</h3>
                                <p className="text-xs text-muted-foreground">ID: {kyc.user_id?.slice(0, 8)}...</p>
                              </div>
                              {statusBadge(kyc.status)}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div><span className="text-muted-foreground">Documento:</span><p className="font-medium">{kyc.document_type}</p></div>
                              <div><span className="text-muted-foreground">Número:</span><p className="font-medium">{kyc.document_number}</p></div>
                              <div><span className="text-muted-foreground">País:</span><p className="font-medium">{kyc.country || '-'}</p></div>
                              <div><span className="text-muted-foreground">Especialidad:</span><p className="font-medium">{kyc.specialty || '-'}</p></div>
                              <div><span className="text-muted-foreground">Experiencia:</span><p className="font-medium">{kyc.years_experience ? `${kyc.years_experience} años` : '-'}</p></div>
                              <div><span className="text-muted-foreground">Certificaciones:</span><p className="font-medium">{kyc.certifications || '-'}</p></div>
                              <div><span className="text-muted-foreground">Fecha:</span><p className="font-medium">{fmtDate(kyc.created_at)}</p></div>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button onClick={() => handleAction(kyc.id, 'approve')} disabled={processing === kyc.id} className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer">
                              <CheckCircle className="h-4 w-4 mr-1" />Aprobar
                            </Button>
                            <Button onClick={() => handleAction(kyc.id, 'reject')} disabled={processing === kyc.id} variant="destructive" className="cursor-pointer">
                              <XCircle className="h-4 w-4 mr-1" />Rechazar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-white"><CardContent className="p-10 text-center">
                  <CheckCircle className="h-12 w-12 text-emerald-300 mx-auto mb-4" />
                  <h3 style={{ fontFamily: 'Poppins, sans-serif' }}>No hay verificaciones pendientes</h3>
                  <p className="text-muted-foreground mt-2">Todas las solicitudes han sido procesadas</p>
                </CardContent></Card>
              )}
            </TabsContent>

            {/* ===================== KYC TODAS ===================== */}
            <TabsContent value="kyc-all">
              {allKyc.length > 0 ? (
                <div className="space-y-3">
                  {allKyc.map((kyc) => (
                    <Card key={kyc.id} className="bg-white">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center"><FileText className="h-4 w-4 text-slate-600" /></div>
                            <div>
                              <span className="font-medium text-sm">{kyc.full_name}</span>
                              <p className="text-xs text-muted-foreground">{kyc.document_type} · {kyc.country || 'Sin país'} · {kyc.specialty || 'Sin especialidad'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">{fmtDate(kyc.created_at)}</span>
                            {statusBadge(kyc.status)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-white"><CardContent className="p-10 text-center">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay verificaciones registradas</p>
                </CardContent></Card>
              )}
            </TabsContent>

            {/* ===================== SEGURIDAD ===================== */}
            <TabsContent value="seguridad">
              {security ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="bg-white"><CardContent className="p-5">
                      <p className="text-2xl font-bold">{security.failed_logins_24h}</p>
                      <p className="text-sm text-muted-foreground">Logins fallidos (24h)</p>
                    </CardContent></Card>
                    <Card className="bg-white"><CardContent className="p-5">
                      <p className="text-2xl font-bold">{security.banned_users}</p>
                      <p className="text-sm text-muted-foreground">Usuarios baneados</p>
                    </CardContent></Card>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>Intentos de login recientes</h3>
                    <div className="space-y-1">
                      {security.recent_attempts.map((a, i) => (
                        <Card key={i} className="bg-white">
                          <CardContent className="p-3 flex items-center justify-between text-sm">
                            <span>{a.email} · {a.method} {a.ip_address && `· ${a.ip_address}`}</span>
                            <div className="flex items-center gap-2">
                              {a.reason && <span className="text-xs text-muted-foreground">{a.reason}</span>}
                              <Badge className={a.success ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>{a.success ? 'OK' : 'Fallo'}</Badge>
                              <span className="text-xs text-muted-foreground">{fmtDate(a.created_at)}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              ) : <p className="text-muted-foreground">Cargando...</p>}
            </TabsContent>

            {/* ===================== AUDITORÍA ===================== */}
            <TabsContent value="auditoria">
              <div className="space-y-1">
                {auditLog.map((a) => (
                  <Card key={a.id} className="bg-white">
                    <CardContent className="p-3 flex items-center justify-between text-sm">
                      <span><strong>{a.actor_email}</strong> — {a.action} {a.target && `→ ${a.target}`} {a.details && <span className="text-muted-foreground">({a.details})</span>}</span>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">{fmtDate(a.created_at)}</span>
                    </CardContent>
                  </Card>
                ))}
                {auditLog.length === 0 && !loading && <p className="text-muted-foreground text-sm">No hay acciones registradas todavía.</p>}
              </div>
            </TabsContent>

            {/* ===================== EQUIPO ===================== */}
            <TabsContent value="equipo">
              <Card className="bg-white mb-6">
                <CardHeader><CardTitle className="text-base">Asignar rol</CardTitle></CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-2">
                  <Input placeholder="Email de una cuenta ya registrada" value={newStaffEmail} onChange={(e) => setNewStaffEmail(e.target.value)} className="max-w-xs" />
                  <select value={newStaffRole} onChange={(e) => setNewStaffRole(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                    {STAFF_ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  <Button disabled={processing === 'assign-role'} className="cursor-pointer bg-emerald-600 hover:bg-emerald-700" onClick={handleAssignRole}>Asignar</Button>
                </CardContent>
              </Card>
              <div className="space-y-2">
                {staff.map((s) => (
                  <Card key={s.id} className="bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{s.name || s.email} <span className="text-xs text-muted-foreground">({s.email})</span></p>
                      </div>
                      <Badge className="bg-slate-100 text-slate-800">{s.role_label}</Badge>
                    </CardContent>
                  </Card>
                ))}
                {staff.length === 0 && !loading && <p className="text-muted-foreground text-sm">No hay más miembros del equipo aparte de ti.</p>}
              </div>
            </TabsContent>

            {/* ===================== INVITACIONES ===================== */}
            <TabsContent value="invitaciones">
              <Card className="bg-white mb-6">
                <CardHeader><CardTitle className="text-base">Fecha de lanzamiento de la plataforma</CardTitle></CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <p className="text-sm text-muted-foreground flex-1">
                    Los meses gratis de las invitaciones empiezan a contar desde esta fecha (o desde hoy, si ya pasó o no la pones).
                  </p>
                  <Input type="datetime-local" value={launchDate} onChange={(e) => setLaunchDate(e.target.value)} className="w-56" />
                  <Button disabled={processing === 'launch-date'} className="cursor-pointer bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveLaunchDate}>Guardar fecha</Button>
                </CardContent>
              </Card>

              <Card className="bg-white mb-6">
                <CardHeader><CardTitle className="text-base">Invitar por email</CardTitle></CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-2">
                  <Input placeholder="email@ejemplo.com" value={newInviteEmail} onChange={(e) => setNewInviteEmail(e.target.value)} className="max-w-xs" />
                  <select value={newInvitePlan} onChange={(e) => setNewInvitePlan(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="pro">Pro</option>
                    <option value="enterprise">Empresa</option>
                  </select>
                  <Input type="number" min={1} value={newInviteMonths} onChange={(e) => setNewInviteMonths(parseInt(e.target.value) || 1)} className="w-24" />
                  <span className="text-sm text-muted-foreground self-center">meses gratis</span>
                  <Button disabled={processing === 'create-invitation'} className="cursor-pointer bg-emerald-600 hover:bg-emerald-700" onClick={handleCreateInvitation}>Enviar invitación</Button>
                </CardContent>
              </Card>

              <div className="space-y-2">
                {invitations.map((inv) => (
                  <Card key={inv.id} className="bg-white">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm">{inv.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {inv.plan === 'enterprise' ? 'Empresa' : 'Pro'} · {inv.months} {inv.months === 1 ? 'mes' : 'meses'} gratis · {fmtDate(inv.created_at)}
                          {inv.redeemed_at && ` · canjeada ${fmtDate(inv.redeemed_at)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={
                          inv.status === 'redeemed' ? 'bg-emerald-100 text-emerald-800'
                          : inv.status === 'revoked' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }>{inv.status}</Badge>
                        {inv.status === 'pending' && (
                          <Button size="sm" variant="destructive" disabled={processing === inv.id} className="cursor-pointer" onClick={() => handleRevokeInvitation(inv.id)}>Revocar</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {invitations.length === 0 && !loading && <p className="text-muted-foreground text-sm">No hay invitaciones enviadas todavía.</p>}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
