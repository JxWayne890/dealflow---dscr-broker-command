import dotenv from 'dotenv';
dotenv.config();
import { QuoteService } from './src/services/quoteService';
import { supabase } from './src/lib/supabase';

async function cleanupDuplicates() {
    console.log('Fetching quotes...');
    const quotes = await QuoteService.getQuotes();
    console.log(`Found ${quotes.length} total quotes.`);

    const seen = new Set();
    const toDelete = [];

    // Criteria for duplication: Same investor, same property address, same loan amount, same rate, same status?
    // Let's be a bit more strict: same investor name/email, property address, city, state, loan amount, rate, deal type.

    for (const q of quotes) {
        const key = `${q.investorName}|${q.investorEmail}|${q.propertyAddress}|${q.propertyCity}|${q.propertyState}|${q.loanAmount}|${q.rate}|${q.dealType}|${q.status}`;

        if (seen.has(key)) {
            toDelete.push(q.id);
        } else {
            seen.add(key);
        }
    }

    console.log(`Identified ${toDelete.length} duplicates to remove.`);

    if (toDelete.length > 0) {
        for (const id of toDelete) {
            console.log(`Deleting quote ${id}...`);
            const { error } = await supabase.from('quotes').delete().eq('id', id);
            if (error) console.error(`Error deleting ${id}:`, error);
        }
        console.log('Cleanup complete.');
    } else {
        console.log('No duplicates found based on strict criteria.');
    }
}

cleanupDuplicates().catch(console.error);
