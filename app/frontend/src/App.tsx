import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Login from './pages/Login';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import CreateJob from './pages/CreateJob';
import Professionals from './pages/Professionals';
import ProProfile from './pages/ProProfile';
import Pricing from './pages/Pricing';
import Dashboard from './pages/Dashboard';
import Account from './pages/Account';
import Messages from './pages/Messages';
import Disputes from './pages/Disputes';
import PaymentSuccess from './pages/PaymentSuccess';
import KycVerification from './pages/KycVerification';
import AuthCallback from './pages/AuthCallback';
import AuthError from './pages/AuthError';
import Legal from './pages/Legal';
import Admin from './pages/Admin';
import Downloads from './pages/Downloads';
import Publicidad from './pages/Publicidad';

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<Login />} />
    <Route path="/jobs" element={<Jobs />} />
    <Route path="/jobs/new" element={<CreateJob />} />
    <Route path="/jobs/:id" element={<JobDetail />} />
    <Route path="/pros" element={<Professionals />} />
    <Route path="/pros/:id" element={<ProProfile />} />
    <Route path="/precios" element={<Pricing />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/account" element={<Account />} />
    <Route path="/messages" element={<Messages />} />
    <Route path="/disputes" element={<Disputes />} />
    <Route path="/payment-success" element={<PaymentSuccess />} />
    <Route path="/kyc" element={<KycVerification />} />
    <Route path="/auth/callback" element={<AuthCallback />} />
    <Route path="/auth/error" element={<AuthError />} />
    <Route path="/legal/:page" element={<Legal />} />
    <Route path="/admin" element={<Admin />} />
    <Route path="/descargas" element={<Downloads />} />
    <Route path="/publicidad" element={<Publicidad />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
export { AppRoutes };