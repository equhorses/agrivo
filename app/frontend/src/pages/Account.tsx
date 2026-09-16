import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@/lib/atomsClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { User, MessageSquare, Briefcase, CreditCard, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { COUNTRIES } from '@/lib/constants';
import { getBackendErrorMessage } from '@/lib/errors';
import { t, useLocale } from '@/lib/i18n';

const client = createClient();

const PLAN_LABEL: Record<string, string> = { free: 'Free', pro: 'Pro', enterprise: 'Empresa' };

export default function Account() {
  const navigate = useNavigate();
  const [locale] = useLocale();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [form, setForm] = useState({
    display_name: '', country: '', phone: '', description: '', avatar_url: '', currency: 'USD',
  });

  const [subscription, setSubscription] = useState<{
    plan: string | null; subscription_status: string | null;
    cancel_at_period_end: boolean | null; subscription_end_date: string | null;
  } | null>(null);
  const [subActionLoading, setSubActionLoading] = useState(false);

  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    client.auth.me()
      .then((res) => {
        if (!res?.data) {
          client.auth.toLogin();
        } else {
          setUser(res.data);
          loadAll();
        }
      })
      .catch(() => client.auth.toLogin());
  }, []);

  const loadAll = async () => {
    const [profileRes, subRes, jobsRes] = await Promise.allSettled([
      client.entities.profiles.queryMine({ limit: 1 }),
      client.payment.getMySubscription(),
      client.entities.jobs.queryMine({ sort: '-created_at', limit: 50 }),
    ]);

    if (profileRes.status === 'fulfilled') {
      const p = profileRes.value?.data?.items?.[0];
      if (p) {
        setProfileId(p.id);
        setForm({
          display_name: p.display_name || '',
          country: p.country || '',
          phone: p.phone || '',
          description: p.description || '',
          avatar_url: p.avatar_url || '',
          currency: p.currency || 'USD',
        });
      }
    }
    if (subRes.status === 'fulfilled') setSubscription(subRes.value.data);
    if (jobsRes.status === 'fulfilled') setMyJobs(jobsRes.value?.data?.items || []);
    setLoading(false);
  };

  const updateField = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const res = await client.storage.upload({
        file, bucket: 'avatars', path: `${user?.id || 'unknown'}/${Date.now()}-${file.name}`,
      });
      if (res?.data?.url) {
        updateField('avatar_url', res.data.url);
        toast.success('Foto subida');
      }
    } catch {
      toast.error('No se pudo subir la foto');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!form.display_name.trim() || !form.country) {
      toast.error('Nombre y país son obligatorios');
      return;
    }
    setSavingProfile(true);
    try {
      const data = {
        display_name: form.display_name.trim(),
        country: form.country,
        phone: form.phone.trim() || null,
        description: form.description.trim() || null,
        avatar_url: form.avatar_url || null,
        currency: form.currency,
        // Si ya existía perfil (por ejemplo profesional verificado por KYC),
        // no lo tocamos aquí — solo se fija la primera vez.
        ...(profileId ? {} : { role: 'client' }),
      };
      if (profileId) {
        await client.entities.profiles.update({ id: profileId, data });
      } else {
        const res = await client.entities.profiles.create({ data });
        if (res?.data?.id) setProfileId(res.data.id);
      }
      toast.success('Perfil guardado');
    } catch (err: any) {
      toast.error(getBackendErrorMessage(err, 'No se pudo guardar el perfil'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSubAction = async (action: 'cancel' | 'resume') => {
    setSubActionLoading(true);
    try {
      if (action === 'cancel') await client.payment.cancelSubscription();
      else await client.payment.resumeSubscription();
      const res = await client.payment.getMySubscription();
      setSubscription(res.data);
      toast.success(action === 'cancel' ? 'Suscripción programada para cancelarse' : 'Suscripción reanudada');
    } catch (err: any) {
      toast.error(getBackendErrorMessage(err, 'No se pudo actualizar la suscripción'));
    } finally {
      setSubActionLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await client.apiCall.invoke('/api/v1/users/account/delete', {}, 'POST');
      toast.success('Cuenta marcada para eliminación');
      await client.auth.logout();
      navigate('/');
    } catch (err: any) {
      toast.error(getBackendErrorMessage(err, 'No se pudo eliminar la cuenta'));
    } finally {
      setDeleting(false);
    }
  };

  if (!user) return null;

  const plan = subscription?.plan || 'free';
  const isStaff = ['admin', 'marketing', 'seguridad', 'moderacion', 'soporte'].includes(user.role);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8 bg-slate-50">
        <div className="container max-w-3xl">
          <h1 className="text-2xl md:text-3xl mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>{t('account.title', locale)}</h1>

          <Tabs defaultValue="perfil">
            <TabsList className="mb-6 flex-wrap h-auto">
              <TabsTrigger value="perfil" className="cursor-pointer"><User className="h-4 w-4 mr-1" />{t('account.tabProfile', locale)}</TabsTrigger>
              <TabsTrigger value="suscripcion" className="cursor-pointer"><CreditCard className="h-4 w-4 mr-1" />{t('account.tabSubscription', locale)}</TabsTrigger>
              <TabsTrigger value="anuncios" className="cursor-pointer"><Briefcase className="h-4 w-4 mr-1" />{t('account.tabAds', locale)}</TabsTrigger>
              <TabsTrigger value="cuenta" className="cursor-pointer">{t('account.tabAccount', locale)}</TabsTrigger>
            </TabsList>

            {/* ---- Perfil ---- */}
            <TabsContent value="perfil">
              <Card className="bg-white">
                <CardHeader><CardTitle>{t('account.profileData', locale)}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {!profileId && !isStaff && (
                    <p className="text-sm text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg p-3">
                      {t('account.incompleteProfile', locale)}
                    </p>
                  )}

                  <div className="flex items-center gap-4">
                    {form.avatar_url ? (
                      <img src={form.avatar_url} alt="avatar" className="h-16 w-16 rounded-full object-cover" />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                        <User className="h-8 w-8 text-emerald-700" />
                      </div>
                    )}
                    <div>
                      <Label htmlFor="avatar" className="cursor-pointer text-sm text-emerald-700 hover:underline">
                        {avatarUploading ? t('account.uploading', locale) : t('account.changePhoto', locale)}
                      </Label>
                      <input id="avatar" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="display_name">{t('account.name', locale)} *</Label>
                    <Input id="display_name" value={form.display_name} onChange={(e) => updateField('display_name', e.target.value)} className="mt-1" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>{t('account.country', locale)} *</Label>
                      <Select value={form.country} onValueChange={(v) => updateField('country', v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Selecciona un país" /></SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((c) => (
                            <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="phone">{t('account.phone', locale)}</Label>
                      <Input id="phone" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="Ej: +34 600 000 000" className="mt-1" />
                    </div>
                  </div>

                  <div>
                    <Label>{t('account.preferredCurrency', locale)}</Label>
                    <Select value={form.currency} onValueChange={(v) => updateField('currency', v)}>
                      <SelectTrigger className="mt-1 max-w-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      De momento es solo una preferencia guardada — los importes de trabajos y ofertas se
                      siguen mostrando en USD en toda la plataforma hasta que decidamos cómo hacer la conversión.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="description">{t('account.aboutYou', locale)}</Label>
                    <Textarea id="description" value={form.description} onChange={(e) => updateField('description', e.target.value)} rows={3} className="mt-1" />
                  </div>

                  <Button onClick={handleSaveProfile} disabled={savingProfile} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 cursor-pointer">
                    {savingProfile ? t('account.saving', locale) : t('account.saveChanges', locale)}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ---- Suscripción ---- */}
            <TabsContent value="suscripcion">
              <Card className="bg-white">
                <CardHeader><CardTitle>{t('account.yourSubscription', locale)}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge className="text-sm bg-emerald-600 hover:bg-emerald-600">{PLAN_LABEL[plan] || plan}</Badge>
                    {subscription?.cancel_at_period_end && (
                      <span className="text-sm text-amber-700">
                        Se cancela el {subscription.subscription_end_date ? new Date(subscription.subscription_end_date).toLocaleDateString('es') : 'próximo periodo'}
                      </span>
                    )}
                  </div>

                  {plan === 'free' ? (
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {t('account.onFreePlan', locale)}
                      </p>
                      <Button onClick={() => navigate('/precios')} className="cursor-pointer">{t('account.viewPlans', locale)}</Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {subscription?.cancel_at_period_end ? (
                        <Button variant="outline" disabled={subActionLoading} onClick={() => handleSubAction('resume')} className="cursor-pointer">
                          {t('account.resumeSubscription', locale)}
                        </Button>
                      ) : (
                        <Button variant="outline" disabled={subActionLoading} onClick={() => handleSubAction('cancel')} className="cursor-pointer">
                          {t('account.cancelSubscription', locale)}
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => navigate('/precios')} className="cursor-pointer">{t('account.changePlan', locale)}</Button>
                      {plan === 'enterprise' && (
                        <Button variant="outline" onClick={() => navigate('/analytics')} className="cursor-pointer">{t('account.viewAnalytics', locale)}</Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ---- Mis anuncios ---- */}
            <TabsContent value="anuncios">
              <Card className="bg-white">
                <CardHeader><CardTitle>{t('account.jobsPublished', locale)}</CardTitle></CardHeader>
                <CardContent>
                  {myJobs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('account.noJobsPublishedYet', locale)}</p>
                  ) : (
                    <div className="space-y-3">
                      {myJobs.map((job) => (
                        <div key={job.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border hover:border-emerald-200 cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
                          <div>
                            <p className="font-medium">{job.title}</p>
                            <p className="text-xs text-muted-foreground">{job.category}</p>
                          </div>
                          <Badge variant="outline">{job.status === 'open' ? 'Abierto' : job.status === 'expired' ? 'Expirado' : 'En Progreso'}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" onClick={() => navigate('/messages')} className="cursor-pointer">
                      <MessageSquare className="h-4 w-4 mr-1" />{t('account.goToMessages', locale)}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ---- Cuenta ---- */}
            <TabsContent value="cuenta">
              <Card className="bg-white border-red-200">
                <CardHeader><CardTitle className="text-red-700">{t('account.deleteAccount', locale)}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('account.deleteAccountWarning', locale)}
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="cursor-pointer">
                        <Trash2 className="h-4 w-4 mr-1" />{t('account.deleteMyAccount', locale)}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('account.deleteConfirmTitle', locale)}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('account.deleteConfirmDesc', locale)}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer">{t('common.cancel', locale)}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} disabled={deleting} className="bg-red-600 hover:bg-red-700 cursor-pointer">
                          {t('account.deleteConfirmYes', locale)}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
