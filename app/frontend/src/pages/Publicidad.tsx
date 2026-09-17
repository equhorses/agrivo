import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createClient } from '@/lib/atomsClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Upload, Loader2, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { t, useLocale } from '@/lib/i18n';

const client = createClient();

const STATUS_CLASS: Record<string, string> = {
  pending_payment: 'bg-muted text-muted-foreground',
  pending_approval: 'bg-amber-100 text-amber-700',
  queued: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-muted text-muted-foreground',
};

interface AdSlotAvailability {
  slot: string;
  price_cents: number;
  self_service_enabled: boolean;
  occupied_until: string | null;
  queue_length: number;
}

interface MyAdBooking {
  id: number;
  slot: string;
  title: string;
  status: string;
  amount_cents: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string | null;
  rejected_reason: string | null;
}

export default function Publicidad() {
  const [locale] = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<unknown>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [slots, setSlots] = useState<AdSlotAvailability[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [myBookings, setMyBookings] = useState<MyAdBooking[]>([]);

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [advertiserName, setAdvertiserName] = useState('');
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const booking = searchParams.get('booking');
    if (booking === 'success') {
      toast.success('¡Pago recibido! Tu anuncio queda pendiente de revisión antes de publicarse.');
      setSearchParams({}, { replace: true });
    } else if (booking === 'cancelled') {
      toast.info('Has cancelado la compra del hueco publicitario.');
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    checkAuth();
    loadSlots();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await client.auth.me();
      if (res?.data) {
        setUser(res.data);
        loadMyBookings();
      }
    } catch {
      // No ha iniciado sesión
    } finally {
      setAuthLoading(false);
    }
  };

  const loadSlots = async () => {
    setLoadingSlots(true);
    try {
      const { data } = await client.houseAds.listSlots();
      setSlots(data);
    } catch (err) {
      console.error('Error loading ad slots:', err);
      toast.error('No se pudieron cargar los huecos disponibles');
    } finally {
      setLoadingSlots(false);
    }
  };

  const loadMyBookings = async () => {
    try {
      const { data } = await client.houseAds.myBookings();
      setMyBookings(data as MyAdBooking[]);
    } catch (err) {
      console.error('Error loading my ad bookings:', err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona un archivo de imagen válido');
      return;
    }
    setUploading(true);
    try {
      const { data } = await client.storage.upload({
        file,
        bucket: 'ads',
        path: `${Date.now()}-${file.name}`,
      });
      setImageUrl(data.url);
    } catch (err) {
      console.error('Error uploading ad image:', err);
      toast.error('No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Inicia sesión para comprar un hueco publicitario');
      client.auth.toLogin();
      return;
    }
    if (!selectedSlot || !advertiserName.trim() || !title.trim() || !imageUrl || !linkUrl.trim()) {
      toast.error('Completa todos los campos, incluida la imagen');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await client.houseAds.bookSlot({
        slot: selectedSlot,
        advertiser_name: advertiserName.trim(),
        title: title.trim(),
        image_url: imageUrl,
        link_url: linkUrl.trim(),
      });
      window.location.href = data.url;
    } catch (err: unknown) {
      console.error('Error booking ad slot:', err);
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        t('ads.couldNotStartPayment', locale);
      toast.error(message);
      setSubmitting(false);
    }
  };

  const selectedSlotInfo = slots.find((s) => s.slot === selectedSlot);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Megaphone className="h-7 w-7 text-primary" /> {t('ads.title', locale)}
            </h1>
            <p className="text-muted-foreground">
              {t('ads.subtitle', locale)}
            </p>
          </div>

          {loadingSlots ? (
            <p className="text-sm text-muted-foreground">{t('ads.loadingSlots', locale)}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {slots.map((slot) => {
                const isFree = !slot.occupied_until;
                const isSelected = selectedSlot === slot.slot;
                return (
                  <Card
                    key={slot.slot}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'border-primary ring-1 ring-primary' : ''
                    } ${!slot.self_service_enabled ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={() => slot.self_service_enabled && setSelectedSlot(slot.slot)}
                  >
                    <CardHeader>
                      <CardTitle className="text-base">{t(`ads.slot.${slot.slot}`, locale)}</CardTitle>
                      <CardDescription>{(slot.price_cents / 100).toFixed(2)} € {t('ads.perDays', locale)}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!slot.self_service_enabled ? (
                        <Badge className="bg-muted text-muted-foreground">{t('ads.notAvailable', locale)}</Badge>
                      ) : isFree ? (
                        <Badge className="bg-green-100 text-green-700">{t('ads.freeNow', locale)}</Badge>
                      ) : (
                        <div className="space-y-1">
                          <Badge className="bg-amber-100 text-amber-700">
                            {t('ads.occupiedUntil', locale)} {new Date(slot.occupied_until as string).toLocaleDateString('es-ES')}
                          </Badge>
                          {slot.queue_length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {slot.queue_length} {t('ads.queueNote', locale)}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {selectedSlot && (
            <Card className="mb-10">
              <CardHeader>
                <CardTitle className="text-lg">
                  {t('ads.reserve', locale)}: {t(`ads.slot.${selectedSlot}`, locale)} — {selectedSlotInfo
                    ? (selectedSlotInfo.price_cents / 100).toFixed(2)
                    : '…'}{' '}
                  €
                </CardTitle>
                <CardDescription>
                  {selectedSlotInfo && !selectedSlotInfo.occupied_until
                    ? t('ads.willPublishSoon', locale)
                    : t('ads.queueExplain', locale)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="advertiser_name">{t('ads.businessName', locale)}</Label>
                  <Input
                    id="advertiser_name"
                    value={advertiserName}
                    onChange={(e) => setAdvertiserName(e.target.value)}
                    placeholder={t('ads.businessNamePlaceholder', locale)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">{t('ads.adTitle', locale)}</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('ads.adTitlePlaceholder', locale)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('ads.bannerImage', locale)}</Label>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t('ads.recommendedSize', locale)}
                  </p>
                  {imageUrl && (
                    <img src={imageUrl} alt={t('ads.preview', locale)} className="w-full max-h-32 object-cover rounded-md mb-2" />
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1" /> {uploading ? t('ads.uploading', locale) : t('ads.uploadImage', locale)}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link_url">{t('ads.clickLink', locale)}</Label>
                  <Input
                    id="link_url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                {authLoading ? (
                  <p className="text-sm text-muted-foreground">{t('ads.checkingSession', locale)}</p>
                ) : !user ? (
                  <Button className="w-full" onClick={() => client.auth.toLogin()}>
                    {t('ads.loginToContinue', locale)}
                  </Button>
                ) : (
                  <Button className="w-full" disabled={submitting || uploading} onClick={handleSubmit}>
                    {submitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                    {t('ads.payAndReserve', locale)}
                  </Button>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  {t('ads.anyProblem', locale)}{' '}
                  <a href="mailto:soporte@agrizia.com" className="text-emerald-700 hover:underline">
                    {t('ads.writeToSupport', locale)} soporte@agrizia.com
                  </a>
                </p>
              </CardContent>
            </Card>
          )}

          {user && myBookings.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">{t('ads.yourReservations', locale)}</h2>
              <div className="space-y-2">
                {myBookings.map((b) => {
                  const statusClass = STATUS_CLASS[b.status] || 'bg-muted';
                  return (
                    <Card key={b.id}>
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div>
                          <div className="font-medium">{b.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {t(`ads.slot.${b.slot}`, locale)} · {(b.amount_cents / 100).toFixed(2)} €
                          </div>
                          {b.status === 'rejected' && b.rejected_reason && (
                            <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                              <XCircle className="h-3 w-3" /> {b.rejected_reason}
                            </div>
                          )}
                          {b.status === 'active' && b.ends_at && (
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> {t('ads.publishedUntil', locale)}{' '}
                              {new Date(b.ends_at).toLocaleDateString('es-ES')}
                            </div>
                          )}
                          {b.status === 'queued' && (
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {t('ads.waitingForSlot', locale)}
                            </div>
                          )}
                        </div>
                        <Badge className={statusClass}>{t(`ads.status.${b.status}`, locale)}</Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
