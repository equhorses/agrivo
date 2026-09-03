import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, User, LogOut, LayoutDashboard, MessageSquare, AlertTriangle, Shield } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BRAND } from '@/lib/constants';
import { useLocale, setLocale as setGlobalLocale, t, LOCALE_OPTIONS, type Locale } from '@/lib/i18n';

const client = createClient();

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [locale, changeLocale] = useLocale();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check auth in background - buttons show immediately
    client.auth
      .me()
      .then((res) => {
        if (res?.data) setUser(res.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = () => {
    client.auth.toLogin();
  };

  const handleLogout = async () => {
    await client.auth.logout();
    setUser(null);
    navigate('/');
  };

  const navLinks = [
    { href: '/', label: t('nav.home', locale) },
    { href: '/jobs', label: t('nav.jobs', locale) },
    { href: '/pros', label: t('nav.pros', locale) },
    { href: '/precios', label: t('nav.pricing', locale) },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-background/95 backdrop-blur-md shadow-sm border-b' : 'bg-background border-b border-transparent'}`}>
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="https://mgx-backend-cdn.metadl.com/generate/images/1410088/2026-07-07/sakrtaqcaiza/agrivo-favicon-logo.png"
            alt="Agrivo"
            className="h-9 w-9 rounded-lg object-contain"
          />
          <span className="font-bold text-xl tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {BRAND.name}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                isActive(link.href)
                  ? 'text-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs gap-1 cursor-pointer">
                {LOCALE_OPTIONS.find(l => l.value === locale)?.flag}
                <span className="uppercase">{locale}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {LOCALE_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => changeLocale(opt.value)}
                  className={`cursor-pointer ${locale === opt.value ? 'bg-emerald-50' : ''}`}
                >
                  <span className="mr-2">{opt.flag}</span>
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 cursor-pointer">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{user.nickname || user.email?.split('@')[0]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  {t('nav.dashboard', locale)}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/messages')} className="cursor-pointer">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {t('nav.messages', locale)}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/disputes')} className="cursor-pointer">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Disputas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer">
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Panel
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('nav.logout', locale)}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" onClick={handleLogin} className="cursor-pointer text-sm">
                {t('nav.login', locale)}
              </Button>
              <Button onClick={handleLogin} className="cursor-pointer text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                {t('nav.register', locale)}
              </Button>
            </>
          )}
        </div>

        {/* Mobile nav */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="cursor-pointer">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <div className="flex items-center gap-2 mb-8 mt-2">
              <img
                src="https://mgx-backend-cdn.metadl.com/generate/images/1410088/2026-07-07/sakrtaqcaiza/agrivo-favicon-logo.png"
                alt="Agrivo"
                className="h-8 w-8 rounded-lg object-contain"
              />
              <span className="font-bold text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>{BRAND.name}</span>
            </div>
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2.5 text-base font-medium rounded-md transition-colors cursor-pointer ${
                    isActive(link.href)
                      ? 'text-primary bg-primary/5'
                      : 'text-foreground hover:bg-muted/50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-3" />
              {/* Language in mobile */}
              <div className="flex items-center gap-2 px-3 py-2">
                {LOCALE_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={locale === opt.value ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => changeLocale(opt.value)}
                    className={`text-xs cursor-pointer ${locale === opt.value ? 'bg-emerald-600' : ''}`}
                  >
                    {opt.flag}
                  </Button>
                ))}
              </div>
              <hr className="my-3" />
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-base font-medium rounded-md hover:bg-muted/50 cursor-pointer">
                    {t('nav.dashboard', locale)}
                  </Link>
                  <Link to="/messages" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-base font-medium rounded-md hover:bg-muted/50 cursor-pointer">
                    {t('nav.messages', locale)}
                  </Link>
                  <Link to="/disputes" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-base font-medium rounded-md hover:bg-muted/50 cursor-pointer">
                    Disputas
                  </Link>
                  <Button variant="outline" onClick={handleLogout} className="mt-2 cursor-pointer">
                    {t('nav.logout', locale)}
                  </Button>
                </>
              ) : (
                <Button onClick={handleLogin} className="mt-2 cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-600">
                  {t('nav.login', locale)} / {t('nav.register', locale)}
                </Button>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}