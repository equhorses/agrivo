import { Link } from 'react-router-dom';
import { BRAND, COUNTRIES, CATEGORIES } from '@/lib/constants';
import { t, useLocale } from '@/lib/i18n';

export default function Footer() {
  const [locale] = useLocale();
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img
                src="https://mgx-backend-cdn.metadl.com/generate/images/1410088/2026-07-07/sakrtaqcaiza/agrivo-favicon-logo.png"
                alt="Agrizia"
                className="h-8 w-8 rounded-lg object-contain"
              />
              <span className="font-bold text-lg text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>{BRAND.name}</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {t('footer.weConnect', locale)} {t('footer.techForField', locale)}
            </p>
            <div className="flex flex-wrap gap-2">
              {COUNTRIES.slice(0, 6).map((c) => (
                <img key={c.code} src={c.flag} alt={c.name} className="h-5 w-auto rounded-sm opacity-70 hover:opacity-100 transition-opacity" />
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold text-white mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>{t('footer.platform', locale)}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/jobs" className="hover:text-white transition-colors cursor-pointer">{t('nav.jobs', locale)}</Link></li>
              <li><Link to="/pros" className="hover:text-white transition-colors cursor-pointer">{t('nav.pros', locale)}</Link></li>
              <li><Link to="/precios" className="hover:text-white transition-colors cursor-pointer">{t('nav.pricing', locale)}</Link></li>
              <li><Link to="/jobs/new" className="hover:text-white transition-colors cursor-pointer">{t('jobs.publish', locale)}</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-white mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>{t('footer.services', locale)}</h4>
            <ul className="space-y-2.5 text-sm">
              {CATEGORIES.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link to={`/jobs?category=${cat.name}`} className="hover:text-white transition-colors cursor-pointer">
                    {cat.icon} {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>{t('footer.legal', locale)}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/legal/terminos" className="hover:text-white transition-colors cursor-pointer">{t('legal.terms', locale)}</Link></li>
              <li><Link to="/legal/privacidad" className="hover:text-white transition-colors cursor-pointer">{t('legal.privacy', locale)}</Link></li>
              <li><Link to="/legal/cookies" className="hover:text-white transition-colors cursor-pointer">{t('legal.cookies', locale)}</Link></li>
              <li><Link to="/legal/contacto" className="hover:text-white transition-colors cursor-pointer">{t('legal.contact', locale)}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} {BRAND.name}. {t('footer.rights', locale)}
          </p>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>{t('footer.made', locale)}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}