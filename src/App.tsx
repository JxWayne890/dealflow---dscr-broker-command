import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Quote, QuoteStatus, View, Investor } from './types';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { QuotesList } from './pages/QuotesList';
import { NewQuote } from './pages/NewQuote';
import { QuoteDetail } from './pages/QuoteDetail';
import { Investors } from './pages/Investors';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { PublicSchedule } from './pages/PublicSchedule';
import { Campaigns } from './pages/Campaigns';
import { CampaignEditor } from './pages/CampaignEditor';
import { Team } from './pages/Team';
import { AuthModal } from './components/AuthModal';
import { QuoteService } from './services/quoteService';
import { InvestorService } from './services/investorService';
import { ProfileService } from './services/profileService';
import { useToast } from './contexts/ToastContext';
import { BrokerProfile } from './types';

export default function App() {
  const { showToast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoadingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [currentQuoteFilter, setCurrentQuoteFilter] = useState<string>('All');
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  // Theme State (Lifted from Layout)
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };
  // Data State
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [profile, setProfile] = useState<BrokerProfile | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Fetch Data on Session Change
  useEffect(() => {
    if (session) {
      setLoadingData(true);
      setCurrentView('dashboard'); // Always start on dashboard after login
      Promise.all([
        QuoteService.getQuotes(),
        InvestorService.getInvestors(),
        ProfileService.getProfile()
      ]).then(([fetchedQuotes, fetchedInvestors, fetchedProfile]) => {
        setQuotes(fetchedQuotes);
        setInvestors(fetchedInvestors);
        setProfile(fetchedProfile);
      }).finally(() => setLoadingData(false));
    } else {
      setQuotes([]);
      setInvestors([]);
    }
  }, [session]);

  // Navigation Handlers
  const handleNewQuote = () => setCurrentView('new_quote');
  const handleViewQuote = (id: string) => {
    setSelectedQuoteId(id);
    setCurrentView('detail');
  };

  const handleNavigate = (view: View, filter?: string) => {
    if (filter) setCurrentQuoteFilter(filter);
    setCurrentView(view);
  };

  const handleSaveQuote = async (newQuote: Quote) => {
    try {
      const saved = await QuoteService.createQuote(newQuote);
      setQuotes(prev => [saved, ...prev]);
      setCurrentView('dashboard');
      showToast('Quote saved successfully', 'success');
    } catch (e) {
      console.error("Failed to save quote", e);
      showToast("Failed to save quote", 'error');
    }
  };

  const handleAddInvestor = async (newInvestor: Investor) => {
    try {
      const saved = await InvestorService.createInvestor(newInvestor);
      setInvestors(prev => [...prev, saved]);
      showToast('Investor saved successfully', 'success');
    } catch (e) {
      console.error("Failed to save investor", e);
      showToast("Failed to save investor", 'error');
    }
  };
  const handleUpdateInvestor = async (id: string, updates: Partial<Investor>) => {
    // Optimistic update
    setInvestors(prev => prev.map(inv => inv.id === id ? { ...inv, ...updates } : inv));
    try {
      await InvestorService.updateInvestor(id, updates);
      showToast('Investor updated successfully', 'success');
    } catch (e) {
      console.error("Failed to update investor", e);
      showToast("Failed to update investor", 'error');
    }
  };

  const handleDeleteInvestor = async (id: string) => {
    // Optimistic update
    setInvestors(prev => prev.filter(inv => inv.id !== id));
    try {
      await InvestorService.deleteInvestor(id);
      showToast('Investor removed', 'success');
    } catch (e) {
      console.error("Failed to delete investor", e);
      showToast("Failed to remove investor", 'error');
    }
  };

  const handleBulkDeleteInvestors = async (ids: string[]) => {
    // Optimistic update
    setInvestors(prev => prev.filter(inv => !ids.includes(inv.id)));
    try {
      await InvestorService.deleteInvestors(ids);
      showToast(`${ids.length} investors removed`, 'success');
    } catch (e) {
      console.error("Failed to bulk delete investors", e);
      showToast("Failed to remove investors", 'error');
    }
  };

  const handleUpdateStatus = async (id: string, status: QuoteStatus) => {
    // Optimistic update
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, status, followUpsEnabled: false } : q));

    try {
      await QuoteService.updateQuote(id, { status, followUpsEnabled: false });
      showToast('Quote status updated', 'success');
    } catch (e) {
      console.error("Failed to update status", e);
      showToast("Failed to update status", 'error');
    }
  };

  const handleUpdateQuote = async (id: string, updates: Partial<Quote>) => {
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
    try {
      await QuoteService.updateQuote(id, updates);
    } catch (e) {
      console.error("Failed to update quote", e);
      showToast("Failed to update quote", 'error');
    }
  };

  const selectedQuote = quotes.find(q => q.id === selectedQuoteId);

  const renderContent = () => {
    // Public views don't use the layout sidebar
    if (currentView === 'public_schedule') {
      if (!selectedQuote) return <div className="p-20 text-center">Quote not found.</div>;
      return <PublicSchedule quote={selectedQuote} />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard quotes={quotes} investors={investors} onViewQuote={handleViewQuote} onNewQuote={handleNewQuote} onNavigate={handleNavigate} profile={profile} isDark={isDark} />;
      case 'quotes':
        return <QuotesList quotes={quotes} investors={investors} onViewQuote={handleViewQuote} onUpdateStatus={handleUpdateStatus} initialFilter={currentQuoteFilter} />;
      case 'new_quote':
        return <NewQuote investors={investors} onAddInvestor={handleAddInvestor} onCancel={() => setCurrentView('dashboard')} onSave={handleSaveQuote} />;
      case 'detail':
        if (!selectedQuote) return null; // Should ideally handle 404
        return <QuoteDetail quote={selectedQuote} onBack={() => setCurrentView('dashboard')} onUpdateStatus={handleUpdateStatus} onUpdateQuote={handleUpdateQuote} />;
      case 'investors':
        return (
          <Investors
            investors={investors}
            onAddInvestor={handleAddInvestor}
            onUpdateInvestor={handleUpdateInvestor}
            onDeleteInvestor={handleDeleteInvestor}
            onBulkDeleteInvestors={handleBulkDeleteInvestors}
            isAdmin={profile?.role === 'admin'}
          />
        );
      case 'analytics':
        return <Analytics quotes={quotes} investors={investors} onViewQuote={handleViewQuote} />;
      case 'settings':
        return <Settings onProfileUpdate={setProfile} currentProfile={profile} />;
      case 'campaigns':
        return <Campaigns
          onEdit={(id) => { setSelectedCampaignId(id); setCurrentView('campaign_editor'); }}
          onNew={() => { setSelectedCampaignId(null); setCurrentView('campaign_editor'); }}
          isAdmin={profile?.role === 'admin'}
        />;
      case 'campaign_editor':
        return <CampaignEditor
          campaignId={selectedCampaignId}
          onBack={() => { setSelectedCampaignId(null); setCurrentView('campaigns'); }}
        />;
      case 'team':
        return <Team profile={profile} />;
      default:
        return (
          <Dashboard
            quotes={quotes}
            investors={investors}
            onViewQuote={handleViewQuote}
            onNewQuote={handleNewQuote}
            onNavigate={(view, filter) => {
              setCurrentView(view);
              if (filter) {
                const newParams = new URLSearchParams(window.location.search);
                newParams.set('filter', filter);
                window.history.pushState(null, '', `?${newParams.toString()}`);
              }
            }}
            profile={profile}
            isDark={isDark}
          />
        );
    }
  };

  if (isLoadingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-muted">Loading...</div>;
  }

  // Handle Public Links (e.g. Schedule) without requiring login
  if (window.location.search.includes('view=schedule')) {
    const params = new URLSearchParams(window.location.search);
    const quoteId = params.get('quoteId');
    const quote = quotes.find(q => q.id === quoteId);
    if (quote) return <PublicSchedule quote={quote} />;
  }

  // Determine if we should show forced onboarding
  // We check session AND if profile has loaded (or is still loading)
  // FIX: Don't show modal just because data is loading. Wait for profile.
  const isNewlyAuthenticated = !!session && !profile && !loadingData;
  const needsOnboarding = !!session && !!profile && profile.onboardingStatus !== 'active';
  const showOnboarding = isNewlyAuthenticated || needsOnboarding;

  const onboardingStatus = profile?.onboardingStatus || (isNewlyAuthenticated ? 'joined' : undefined);

  return (
    <>
      {session ? (
        <>
          <Layout
            currentView={currentView}
            onViewChange={setCurrentView}
            onNewQuote={handleNewQuote}
            profile={profile}
            isDark={isDark}
            toggleTheme={toggleTheme}
          >
            {renderContent()}
          </Layout>

          {showOnboarding && (
            <AuthModal
              isOpen={true}
              onClose={() => { }} // Cannot close until active
              initialStatus={onboardingStatus}
            />
          )}
        </>
      ) : (
        <Login />
      )}
    </>
  );
}