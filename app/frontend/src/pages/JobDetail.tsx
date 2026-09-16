import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@/lib/atomsClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { MapPin, Calendar, Clock, Ruler, DollarSign, Send, ArrowLeft, Check, X, Plus, MessageSquare, Star } from 'lucide-react';
import { toast } from 'sonner';
import { COUNTRIES, SEED_JOBS } from '@/lib/constants';
import UserIdentity from '@/components/UserIdentity';
import { formatAmount, formatBudgetRange, useMyCurrency } from '@/lib/currency';
import { t, useLocale } from '@/lib/i18n';

const client = createClient();

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [editingReview, setEditingReview] = useState(false);
  const myCurrency = useMyCurrency();
  const [locale] = useLocale();
  const [acceptedProfessionalProfileId, setAcceptedProfessionalProfileId] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [decidingBidId, setDecidingBidId] = useState<number | null>(null);

  // Los trabajos de ejemplo (SEED_JOBS) no existen en la base de datos —
  // se usan solo para que la plataforma no se vea vacía mientras crece.
  // Se pueden abrir y ver, pero no se puede pujar de verdad sobre ellos.
  const seedJob = SEED_JOBS.find((j) => j.id === id);
  const isSeedJob = !!seedJob;

  useEffect(() => {
    client.auth.me()
      .then((res) => { if (res?.data) setUser(res.data); })
      .catch(() => {});

    if (id) {
      loadJob();
      loadBids();
      loadExistingReview();
    }
  }, [id]);

  const loadExistingReview = async () => {
    if (isSeedJob) return;
    try {
      const res = await client.entities.reviews.queryAll({ query: { job_id: Number(id) }, limit: 1 });
      setExistingReview(res?.data?.items?.[0] || null);
    } catch {
      // sin reseña todavía
    }
  };

  const loadJob = async () => {
    if (seedJob) {
      setJob(seedJob);
      setLoading(false);
      return;
    }
    try {
      const res = await client.entities.jobs.queryAll({ query: { id: Number(id) }, limit: 1 });
      if (res?.data?.items?.[0]) {
        setJob(res.data.items[0]);
      }
    } catch {
      toast.error('Error al cargar el trabajo');
    } finally {
      setLoading(false);
    }
  };

  const loadBids = async () => {
    if (isSeedJob) {
      setBids([]);
      return;
    }
    try {
      const res = await client.entities.bids.queryAll({ query: { job_id: Number(id) }, sort: '-created_at' });
      setBids(res?.data?.items || []);
    } catch {
      // Failed to load bids
    }
  };

  useEffect(() => {
    const acceptedBid = bids.find((b) => b.status === 'accepted');
    if (!acceptedBid) {
      setAcceptedProfessionalProfileId(null);
      return;
    }
    client.entities.profiles.queryAll({ query: { user_id: acceptedBid.user_id }, limit: 1 })
      .then((res) => setAcceptedProfessionalProfileId(res?.data?.items?.[0]?.id ?? null))
      .catch(() => setAcceptedProfessionalProfileId(null));
  }, [bids]);

  const handleSubmitReview = async () => {
    if (!acceptedProfessionalProfileId) return;
    setSubmittingReview(true);
    try {
      await client.entities.reviews.create({
        data: {
          professional_id: String(acceptedProfessionalProfileId),
          job_id: Number(id),
          rating: reviewRating,
          comment: reviewComment.trim(),
          reviewer_name: user?.name || undefined,
        },
      });
      toast.success('¡Gracias por tu reseña!');
      loadExistingReview();
    } catch {
      toast.error('No se pudo enviar la reseña');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleStartEditReview = () => {
    setReviewRating(existingReview.rating);
    setReviewComment(existingReview.comment);
    setEditingReview(true);
  };

  const handleUpdateReview = async () => {
    if (!existingReview) return;
    setSubmittingReview(true);
    try {
      await client.entities.reviews.update(existingReview.id, {
        data: { rating: reviewRating, comment: reviewComment.trim() },
      });
      toast.success('Reseña actualizada');
      setEditingReview(false);
      loadExistingReview();
    } catch {
      toast.error('No se pudo actualizar la reseña');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!existingReview || !window.confirm('¿Borrar tu reseña?')) return;
    try {
      await client.entities.reviews.remove(existingReview.id);
      toast.success('Reseña borrada');
      setExistingReview(null);
      setReviewComment('');
      setReviewRating(5);
    } catch {
      toast.error('No se pudo borrar la reseña');
    }
  };

  const handleDecideBid = async (bidId: number, action: 'accept' | 'reject') => {
    setDecidingBidId(bidId);
    try {
      await client.apiCall.invoke(`/api/v1/entities/bids/${bidId}/${action}`, {}, 'POST');
      toast.success(action === 'accept' ? 'Oferta aceptada' : 'Oferta rechazada');
      await Promise.all([loadJob(), loadBids()]);
    } catch {
      toast.error('No se pudo actualizar la oferta');
    } finally {
      setDecidingBidId(null);
    }
  };

  const handleSubmitBid = async () => {
    if (isSeedJob) return; // por si acaso; la UI ya oculta el formulario
    if (!user) {
      client.auth.toLogin();
      return;
    }
    if (!bidAmount || Number(bidAmount) <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    setSubmitting(true);
    try {
      await client.entities.bids.create({
        data: {
          job_id: Number(id),
          amount: Number(bidAmount),
          message: bidMessage,
          status: 'pending',
        },
      });
      toast.success('¡Oferta enviada exitosamente!');
      setBidAmount('');
      setBidMessage('');
      loadBids();
    } catch {
      toast.error('Error al enviar la oferta');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-3/4" />
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-32 bg-slate-200 rounded" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-10 text-center">
          <h2>Trabajo no encontrado</h2>
          <Button onClick={() => navigate('/jobs')} className="mt-4 cursor-pointer">
            {t('createJob.backToJobs', locale)}
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const country = COUNTRIES.find(c => c.name === job.country);
  const isOwner = !isSeedJob && !!user && !!job.user_id && user.id === job.user_id;
  const deadlinePassed = !!job.bidding_ends_at && new Date(job.bidding_ends_at).getTime() < Date.now();
  const canReceiveBids = !isSeedJob && job.status === 'open' && !deadlinePassed;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 bg-slate-50">
        <div className="container">
          <Button variant="ghost" onClick={() => navigate('/jobs')} className="mb-6 cursor-pointer">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('createJob.backToJobs', locale)}
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Job Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white">
                <CardContent className="p-8">
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {country && <img src={country.flag} alt={country.name} className="h-5 w-auto rounded-sm" />}
                    {isSeedJob && <Badge variant="secondary">Ejemplo</Badge>}
                    <Badge variant="outline">{job.category}</Badge>
                    <Badge variant="outline">
                      {job.contract_type === 'reverse_auction' ? 'Subasta Inversa' : 'Precio Fijo'}
                    </Badge>
                    <Badge className={`${
                      job.status === 'open' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                      : job.status === 'expired' ? 'bg-slate-200 text-slate-700 hover:bg-slate-200'
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                    }`}>
                      {job.status === 'open' ? 'Abierto' : job.status === 'expired' ? 'Expirado' : 'En Progreso'}
                    </Badge>
                  </div>
                  <h1 className="text-2xl md:text-3xl mb-6">{job.title}</h1>

                  {!isSeedJob && job.user_id && (
                    <div className="flex items-center justify-between gap-3 mb-6 pb-6 border-b flex-wrap">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{t('jobDetail.publishedBy', locale)}</p>
                        <UserIdentity userId={job.user_id} />
                      </div>
                      {!isOwner && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/messages?with=${job.user_id}`)}
                          className="cursor-pointer"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {t('contact', locale)}
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border">
                      <MapPin className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('jobDetail.location', locale)}</p>
                        <p className="text-sm font-medium">{job.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border">
                      <Ruler className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('jobDetail.hectares', locale)}</p>
                        <p className="text-sm font-medium">{job.hectares || 'N/A'} ha</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border">
                      <DollarSign className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('jobDetail.budget', locale)}</p>
                        <p className="text-sm font-medium">{formatBudgetRange(job.budget_min, job.budget_max, myCurrency)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border">
                      <Calendar className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('jobDetail.published', locale)}</p>
                        <p className="text-sm font-medium">
                          {job.created_at ? new Date(job.created_at).toLocaleDateString('es') : 'Reciente'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border">
                      <Clock className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('jobDetail.biddingClose', locale)}</p>
                        <p className={`text-sm font-medium ${deadlinePassed ? 'text-red-600' : ''}`}>
                          {job.bidding_ends_at
                            ? `${new Date(job.bidding_ends_at).toLocaleString('es')}${deadlinePassed ? ` (${t('jobDetail.closed', locale)})` : ''}`
                            : t('jobDetail.noTimeLimit', locale)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>{t('jobDetail.description', locale)}</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {job.description}
                  </p>
                </CardContent>
              </Card>

              {/* Bids Section */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {t('jobDetail.offersReceived', locale)}
                    <Badge variant="secondary">{bids.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bids.length > 0 ? (
                    <div className="space-y-4">
                      {bids.map((bid) => {
                        const status = bid.status || 'pending';
                        return (
                          <div key={bid.id} className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 border">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <UserIdentity userId={bid.user_id} size="sm" />
                                <span className="font-bold text-emerald-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                  {formatAmount(bid.amount, myCurrency)}
                                </span>
                              </div>
                              {bid.message && (
                                <p className="text-sm text-muted-foreground mt-1">{bid.message}</p>
                              )}
                              <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
                                <p className="text-xs text-muted-foreground">
                                  {bid.created_at ? new Date(bid.created_at).toLocaleDateString('es') : ''}
                                </p>
                                <Badge
                                  variant={status === 'accepted' ? 'default' : 'outline'}
                                  className={status === 'accepted' ? 'bg-emerald-600 hover:bg-emerald-600' : status === 'rejected' ? 'text-muted-foreground' : ''}
                                >
                                  {t(`status.${status}`, locale)}
                                </Badge>
                              </div>
                              {isOwner && (
                                <div className="flex gap-2 mt-3">
                                  {status === 'pending' && (
                                    <>
                                      <Button
                                        size="sm"
                                        disabled={decidingBidId === bid.id}
                                        onClick={() => handleDecideBid(bid.id, 'accept')}
                                        className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                                      >
                                        <Check className="h-4 w-4 mr-1" />
                                        {t('jobDetail.accept', locale)}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={decidingBidId === bid.id}
                                        onClick={() => handleDecideBid(bid.id, 'reject')}
                                        className="cursor-pointer"
                                      >
                                        <X className="h-4 w-4 mr-1" />
                                        {t('jobDetail.reject', locale)}
                                      </Button>
                                    </>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => navigate(`/messages?with=${bid.user_id}`)}
                                    className="cursor-pointer"
                                  >
                                    <MessageSquare className="h-4 w-4 mr-1" />
                                    {t('jobDetail.respond', locale)}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-6">
                      {t('jobDetail.noOffersYet', locale)}
                    </p>
                  )}
                </CardContent>
              </Card>

              {isOwner && acceptedProfessionalProfileId && (
                <Card className="bg-white mt-6">
                  <CardHeader>
                    <CardTitle>{t('jobDetail.professionalReview', locale)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {existingReview ? (
                      editingReview ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button key={n} type="button" onClick={() => setReviewRating(n)} className="cursor-pointer">
                                <Star className={`h-7 w-7 ${n <= reviewRating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                              </button>
                            ))}
                          </div>
                          <Textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button onClick={handleUpdateReview} disabled={submittingReview || !reviewComment.trim()} className="cursor-pointer">
                              {submittingReview ? t('jobDetail.savingReview', locale) : t('jobDetail.saveChanges', locale)}
                            </Button>
                            <Button variant="outline" onClick={() => setEditingReview(false)} className="cursor-pointer">Cancelar</Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star key={n} className={`h-5 w-5 ${n <= existingReview.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{existingReview.comment}</p>
                          {existingReview.professional_response && (
                            <div className="bg-slate-50 border rounded-lg p-3 mb-3">
                              <p className="text-xs font-medium text-emerald-700 mb-1">{t('jobDetail.professionalResponse', locale)}</p>
                              <p className="text-sm text-muted-foreground">{existingReview.professional_response}</p>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={handleStartEditReview} className="cursor-pointer">{t('jobDetail.edit', locale)}</Button>
                            <Button size="sm" variant="outline" onClick={handleDeleteReview} className="cursor-pointer text-red-600">{t('jobDetail.delete', locale)}</Button>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          ¿Qué tal fue trabajar con esta persona? Tu reseña ayuda a otros a decidir.
                        </p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button key={n} type="button" onClick={() => setReviewRating(n)} className="cursor-pointer">
                              <Star className={`h-7 w-7 ${n <= reviewRating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                            </button>
                          ))}
                        </div>
                        <Textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder={t('jobDetail.reviewPlaceholder', locale)}
                          rows={3}
                        />
                        <Button
                          onClick={handleSubmitReview}
                          disabled={submittingReview || !reviewComment.trim()}
                          className="cursor-pointer"
                        >
                          {submittingReview ? t('jobDetail.sendingReview', locale) : t('jobDetail.publishReview', locale)}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Submit Bid */}
            <div className="space-y-6">
              <Card className="sticky top-24 bg-white">
                <CardHeader>
                  <CardTitle style={{ fontFamily: 'Poppins, sans-serif' }}>{t('jobDetail.sendOffer', locale)}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isSeedJob ? (
                    <div className="text-center py-4 space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {t('jobDetail.exampleJobNotice', locale)}
                      </p>
                      <Button
                        onClick={() => navigate('/jobs/new')}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 cursor-pointer"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {t('jobDetail.postRealJob', locale)}
                      </Button>
                    </div>
                  ) : isOwner ? (
                    <p className="text-center text-muted-foreground py-4">
                      {t('jobDetail.thisIsYourJob', locale)}
                    </p>
                  ) : canReceiveBids ? (
                    <>
                      <div>
                        <Label htmlFor="bid-amount">{t('jobDetail.yourOffer', locale)}</Label>
                        <Input
                          id="bid-amount"
                          type="number"
                          placeholder="Ej: 3500"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('jobDetail.range', locale)}: {formatBudgetRange(job.budget_min, job.budget_max, 'USD')}
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="bid-message">{t('jobDetail.optionalMessage', locale)}</Label>
                        <Textarea
                          id="bid-message"
                          placeholder="Describe tu experiencia y por qué eres el candidato ideal..."
                          value={bidMessage}
                          onChange={(e) => setBidMessage(e.target.value)}
                          className="mt-1"
                          rows={4}
                        />
                      </div>
                      <Button
                        onClick={handleSubmitBid}
                        disabled={submitting}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 cursor-pointer"
                      >
                        {submitting ? 'Enviando...' : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            {t('jobDetail.sendOfferBtn', locale)}
                          </>
                        )}
                      </Button>
                      {!user && (
                        <p className="text-xs text-center text-muted-foreground">
                          Debes iniciar sesión para enviar una oferta
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      {deadlinePassed ? t('jobDetail.deadlinePassedMsg', locale) : t('jobDetail.noLongerAccepting', locale)}
                    </p>
                  )}

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>{t('jobDetail.summary', locale)}</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('jobDetail.category', locale)}</span>
                      <span className="font-medium">{job.category}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('jobDetail.type', locale)}</span>
                      <span className="font-medium">
                        {job.contract_type === 'reverse_auction' ? 'Subasta Inversa' : 'Precio Fijo'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('jobDetail.offers', locale)}</span>
                      <span className="font-medium">{bids.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}