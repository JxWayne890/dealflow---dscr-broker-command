import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Quote, QuoteStatus, View } from './types';
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
import { QuoteService } from './services/quoteService';
import { InvestorService } from './services/investorService';
import { ProfileService } from './services/profileService';
import { useToast } from './contexts/ToastContext';
import { BrokerProfile, Investor } from './types';

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
  const [currentQuoteFilter, setCurrentQuoteFilter] = useState<string>('all');
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  // Data State
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [profile, setProfile] = useState<BrokerProfile | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Fetch Data on Session Change
  useEffect(() => {
    if (session) {
      setLoadingData(true);
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

  const selectedQuote = quotes.find(q => q.id === selectedQuoteId);

  const renderContent = () => {
    // Public views don't use the layout sidebar
    if (currentView === 'public_schedule') {
      if (!selectedQuote) return <div className="p-20 text-center">Quote not found.</div>;
      return <PublicSchedule quote={selectedQuote} />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard quotes={quotes} onViewQuote={handleViewQuote} onNewQuote={handleNewQuote} onNavigate={handleNavigate} />;
      case 'quotes':
        return <QuotesList quotes={quotes} onViewQuote={handleViewQuote} onUpdateStatus={handleUpdateStatus} initialFilter={currentQuoteFilter} />;
      case 'new_quote':
        return <NewQuote investors={investors} onAddInvestor={handleAddInvestor} onCancel={() => setCurrentView('dashboard')} onSave={handleSaveQuote} />;
      case 'detail':
        if (!selectedQuote) return null; // Should ideally handle 404
        return <QuoteDetail quote={selectedQuote} onBack={() => setCurrentView('dashboard')} onUpdateStatus={handleUpdateStatus} />;
      case 'investors':
        return <Investors investors={investors} onAddInvestor={handleAddInvestor} />;
      case 'analytics':
        return <Analytics quotes={quotes} investors={investors} />;
      case 'settings':
        return <Settings onProfileUpdate={setProfile} />;
      case 'campaigns':
        return <Campaigns
          onEdit={(id) => { setSelectedCampaignId(id); setCurrentView('campaign_editor'); }}
          onNew={() => { setSelectedCampaignId(null); setCurrentView('campaign_editor'); }}
        />;
      case 'campaign_editor':
        return <CampaignEditor
          campaignId={selectedCampaignId}
          onBack={() => { setSelectedCampaignId(null); setCurrentView('campaigns'); }}
        />;
      default:
        return <Dashboard quotes={quotes} onViewQuote={handleViewQuote} onNewQuote={handleNewQuote} />;
    }
  };

  if (isLoadingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">Loading...</div>;
  }

  // Handle Public Links (e.g. Schedule) without requiring login
  if (window.location.search.includes('view=schedule')) {
    const params = new URLSearchParams(window.location.search);
    const quoteId = params.get('quoteId');
    const quote = quotes.find(q => q.id === quoteId);
    if (quote) return <PublicSchedule quote={quote} />;
  }

  return (
    <>
      {session ? (
        <Layout
          currentView={currentView}
          onViewChange={setCurrentView}
          onNewQuote={handleNewQuote}
          profile={profile}
        >
          {renderContent()}
        </Layout>
      ) : (
        <Login />
      )}
    </>
  );
}