import React, { useState } from 'react';
import { Quote, QuoteStatus } from './types';
import { MOCK_QUOTES as INITIAL_QUOTES } from './constants';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { QuotesList } from './pages/QuotesList';
import { NewQuote } from './pages/NewQuote';
import { QuoteDetail } from './pages/QuoteDetail';
import { Investors } from './pages/Investors';
import { Analytics } from './pages/Analytics';
import { Investor } from './types';

// Defines the views available in the app
type View = 'dashboard' | 'quotes' | 'new_quote' | 'detail' | 'investors' | 'analytics';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  // App State - In a real app, this would be in a Context or Query Cache
  const [quotes, setQuotes] = useState<Quote[]>(INITIAL_QUOTES);
  const [investors, setInvestors] = useState<Investor[]>([
    { id: '1', name: 'Alex Rivera', email: 'alex@riveracapital.com', company: 'Rivera Capital', phone: '(555) 123-4567', properties: ['123 Main St, Austin, TX', '456 Oak Ave, Dallas, TX'] },
    { id: '2', name: 'Sarah Chen', email: 'sarah.chen@horizonprops.com', company: 'Horizon Properties', phone: '(555) 987-6543', properties: ['789 Pine Ln, Houston, TX'] },
    { id: '3', name: 'Mike Johnson', email: 'mike.j@buildright.com', company: 'BuildRight Inc.', phone: '(555) 456-7890', properties: [] }
  ]);

  // Navigation Handlers
  const handleNewQuote = () => setCurrentView('new_quote');
  const handleViewQuote = (id: string) => {
    setSelectedQuoteId(id);
    setCurrentView('detail');
  };
  const handleSaveQuote = (newQuote: Quote) => {
    setQuotes(prev => [newQuote, ...prev]);
    setCurrentView('dashboard');
  };
  const handleAddInvestor = (newInvestor: Investor) => {
    setInvestors(prev => [...prev, newInvestor]);
  };
  const handleUpdateStatus = (id: string, status: QuoteStatus) => {
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, status, followUpsEnabled: false } : q));
    setCurrentView('dashboard'); // Or stay on detail
  };

  const selectedQuote = quotes.find(q => q.id === selectedQuoteId);

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard quotes={quotes} onViewQuote={handleViewQuote} onNewQuote={handleNewQuote} />;
      case 'quotes':
        return <QuotesList quotes={quotes} onViewQuote={handleViewQuote} />;
      case 'new_quote':
        return <NewQuote investors={investors} onAddInvestor={handleAddInvestor} onCancel={() => setCurrentView('dashboard')} onSave={handleSaveQuote} />;
      case 'detail':
        if (!selectedQuote) return null; // Should ideally handle 404
        return <QuoteDetail quote={selectedQuote} onBack={() => setCurrentView('dashboard')} onUpdateStatus={handleUpdateStatus} />;
      case 'investors':
        return <Investors investors={investors} onAddInvestor={handleAddInvestor} />;
      case 'analytics':
        return <Analytics quotes={quotes} investors={investors} />;
      default:
        return <Dashboard quotes={quotes} onViewQuote={handleViewQuote} onNewQuote={handleNewQuote} />;
    }
  };

  return (
    <Layout
      currentView={currentView}
      onViewChange={setCurrentView}
      onNewQuote={handleNewQuote}
    >
      {renderContent()}
    </Layout>
  );
}