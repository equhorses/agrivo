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
import { toast } from 'sonner';
import { getBackendErrorMessage } from '@/lib/errors';
import { t, useLocale } from '@/lib/i18n';

const client = createClient();

export default function Support() {
  const navigate = useNavigate();
  const [locale] = useLocale();
  const [user, setUser] = useState<any>(null);
  const [plan, setPlan] = useState<string>('free');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<{ priority: boolean } | null>(null);

  useEffect(() => {
    client.auth.me()
      .then((res) => {
        if (!res?.data) {
          client.auth.toLogin();
        } else {
          setUser(res.data);
        }
      })
      .catch(() => client.auth.toLogin());

    client.payment.getMySubscription()
      .then((res) => setPlan(res?.data?.plan || 'free'))
      .catch(() => {});
  }, []);

  const isPriorityPlan = plan === 'pro' || plan === 'enterprise';

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Rellena el asunto y el mensaje');
      return;
    }
    setSubmitting(true);
    try {
      const res = await client.apiCall.invoke('/api/v1/users/support/contact', {
        subject: subject.trim(), message: message.trim(),
      }, 'POST');
      setSent({ priority: !!res?.data?.priority });
      toast.success('Mensaje enviado al equipo de Agrizia');
    } catch (err: any) {
      toast.error(getBackendErrorMessage(err, 'No se pudo enviar la consulta'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 bg-slate-50">
        <div className="max-w-xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl md:text-3xl" style={{ fontFamily: 'Poppins, sans-serif' }}>{t('support.title', locale)}</h1>
            {isPriorityPlan && <Badge className="bg-amber-500 hover:bg-amber-500">{t('support.priority', locale)}</Badge>}
          </div>
          <p className="text-muted-foreground mb-6">
            {isPriorityPlan
              ? t('support.priorityNote', locale)
              : t('support.normalNote', locale)}
          </p>

          <Card className="bg-white">
            <CardHeader><CardTitle>{t('support.yourQuery', locale)}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {sent ? (
                <div className="text-center py-6">
                  <p className="text-lg font-medium mb-2">{t('support.sent', locale)}</p>
                  <p className="text-muted-foreground mb-4">
                    {t('support.willReply', locale)}{sent.priority ? t('support.withPriority', locale) : ''}.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={() => navigate('/messages')} className="cursor-pointer">{t('support.goToMessages', locale)}</Button>
                    <Button variant="outline" onClick={() => { setSent(null); setSubject(''); setMessage(''); }} className="cursor-pointer">{t('support.writeAnother', locale)}</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="subject">{t('support.subject', locale)}</Label>
                    <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t('support.subjectPlaceholder', locale)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="message">{t('support.message', locale)}</Label>
                    <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={6} placeholder={t('support.messagePlaceholder', locale)} className="mt-1" />
                  </div>
                  <Button onClick={handleSubmit} disabled={submitting} className="w-full cursor-pointer">
                    {submitting ? t('support.sending', locale) : t('support.sendQuery', locale)}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    {t('support.alsoWriteTo', locale)}{' '}
                    <a href="mailto:soporte@agrivo.com" className="text-emerald-700 hover:underline">soporte@agrivo.com</a>
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
