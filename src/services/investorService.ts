import { supabase } from '../lib/supabase';
import { Investor } from '../types';
import { ProfileService } from './profileService';

export const InvestorService = {
    async getInvestors(): Promise<Investor[]> {
        const { data, error } = await supabase
            .from('investors')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching investors:', error);
            throw error;
        }

        return data.map(mapDbToInvestor);
    },

    async createInvestor(investor: Partial<Investor>): Promise<Investor> {
        const orgId = await ProfileService.getOrganizationId();
        if (!orgId) throw new Error('User not authenticated');

        const dbInvestor = {
            ...mapInvestorToDb(investor),
            user_id: orgId
        };

        const { data, error } = await supabase
            .from('investors')
            .insert(dbInvestor)
            .select()
            .single();

        if (error) {
            console.error('Error creating investor:', error);
            throw error;
        }

        return mapDbToInvestor(data);
    }
};

const mapDbToInvestor = (row: any): Investor => ({
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company,
    phone: row.phone,
    properties: row.properties || []
});

const mapInvestorToDb = (investor: Partial<Investor>): any => {
    return {
        name: investor.name,
        email: investor.email,
        company: investor.company,
        phone: investor.phone,
        properties: investor.properties
    };
};
