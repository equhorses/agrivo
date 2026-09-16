import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@/lib/atomsClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Briefcase, MessageSquare, TrendingUp, Lock, Eye } from 'lucide-react';
import { t, useLocale } from '@/lib/i18n';

const client = createClient();

export default function Analytics() {
  const navigate = useNavigate();
  const [locale] = useLocale();
  const [user, setUser] = useState<any>(null);
  const [plan, setPlan] = useState('free');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [bidStats, setBidStats] = useState({ total: 0, pending: 0, accepted: 0, rejected: 0 });
  const [reviewCount, setReviewCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    client.auth.me()
      .then(async (res) => {
        if (!res?.data) {
          client.auth.toLogin();
          return;
        }
        setUser(res.data);

        const subRes = await client.payment.getMySubscription().catch(() => null);
        const myPlan = subRes?.data?.plan || 'free';
        setPlan(myPlan);
        if (myPlan !== 'enterprise') {
          setLoading(false);
          return;
        }

        const [profileRes, bidsRes, messagesRes] = await Promise.allSettled([
          client.entities.profiles.queryMine({ limit: 1 }),
          client.entities.bids.queryMine({ limit: 200 }),
          client.entities.messages.queryMine({ limit: 500 }),
        ]);

        let myProfile: any = null;
        if (profileRes.status === 'fulfilled') {
          myProfile = profileRes.value?.data?.items?.[0] || null;
          setProfile(myProfile);
        }

        if (bidsRes.status === 'fulfilled') {
          const bids = bidsRes.value?.data?.items || [];
          setBidStats({
            total: bids.length,
            pending: bids.filter((b: any) => b.status === 'pending').length,
            accepted: bids.filter((b: any) => b.status === 'accepted').length,
            rejected: bids.filter((b: any) => b.status === 'rejected').length,
          });
        }

        if (messagesRes.status === 'fulfilled') {
          setMessageCount(messagesRes.value?.data?.total || messagesRes.value?.data?.items?.length || 0);
        }

        if (myProfile) {
          try {
            const reviewsRes = await client.entities.reviews.queryAll({ query: { professional_id: String(myProfile.id) }, limit: 1 });
            setReviewCount(reviewsRes?.data?.total || 0);
          } catch {
            // sin reseñas todavía
          }
        }

        setLoading(false);
      })
      .catch(() => client.auth.toLogin());
  }, []);

  if (!user) return null;

  const winRate = bidStats.total > 0 ? Math.round((bidStats.accepted / bidStats.total) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>{t('analytics.title', locale)}</h1>

          {loading ? (
            <p className="text-muted-foreground">{t('analytics.loading', locale)}</p>
          ) : plan !== 'enterprise' ? (
            <Card className="bg-white">
              <CardContent className="p-10 text-center">
                <Lock className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('analytics.enterpriseOnly', locale)}</h3>
                <p className="text-muted-foreground mb-6">
                  {t('analytics.enterpriseOnlyDesc', locale)}
                </p>
                <Button onClick={() => navigate('/precios')} className="cursor-pointer">{t('analytics.viewPlans', locale)}</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />{t('analytics.rating', locale)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {profile?.rating ? profile.rating.toFixed(1) : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{reviewCount} {reviewCount === 1 ? t('analytics.review', locale) : t('analytics.reviews', locale)}</p>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-emerald-600" />{t('analytics.jobsCompleted', locale)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>{profile?.jobs_completed ?? 0}</p>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />{t('analytics.successRate', locale)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>{winRate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {bidStats.accepted} {t('analytics.won', locale)} {bidStats.total} {t('analytics.sent', locale)}
                    {bidStats.pending > 0 && ` · ${bidStats.pending} ${t('analytics.pending', locale)}`}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <Eye className="h-4 w-4 text-emerald-600" />{t('analytics.profileVisits', locale)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>{profile?.profile_views ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('analytics.sinceTracking', locale)}</p>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-emerald-600" />{t('analytics.messages', locale)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>{messageCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('analytics.sentAndReceived', locale)}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
