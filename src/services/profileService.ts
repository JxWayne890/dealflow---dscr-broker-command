import { supabase } from '../lib/supabase';
import { BrokerProfile } from '../types';

export const ProfileService = {
    async getProfile(): Promise<BrokerProfile | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            return null;
        }

        return mapDbToProfile(data);
    },

    async updateProfile(updates: Partial<BrokerProfile>): Promise<BrokerProfile> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        const dbUpdates = mapProfileToDb(updates);

        const { data, error } = await supabase
            .from('profiles')
            .update(dbUpdates)
            .eq('id', user.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating profile:', error);
            throw error;
        }

        return mapDbToProfile(data);
    },

    async getTeam(): Promise<BrokerProfile[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('parent_id', user.id);

        if (error) {
            console.error('Error fetching team:', error);
            return [];
        }

        return data.map(mapDbToProfile);
    }
};

const mapDbToProfile = (row: any): BrokerProfile => ({
    name: row.name || '',
    email: row.email || '',
    company: row.company || '',
    phone: row.phone || '',
    website: row.website || '',
    logoUrl: row.logo_url,
    headshotUrl: row.headshot_url,
    title: row.title || '',
    timezone: row.timezone || 'UTC',
    role: row.role || 'admin',
    parentId: row.parent_id,
    permissions: row.permissions
});

const mapProfileToDb = (profile: Partial<BrokerProfile>): any => {
    const db: any = {};
    if (profile.name !== undefined) db.name = profile.name;
    if (profile.company !== undefined) db.company = profile.company;
    if (profile.phone !== undefined) db.phone = profile.phone;
    if (profile.website !== undefined) db.website = profile.website;
    if (profile.logoUrl !== undefined) db.logo_url = profile.logoUrl;
    if (profile.headshotUrl !== undefined) db.headshot_url = profile.headshotUrl;
    if (profile.title !== undefined) db.title = profile.title;
    if (profile.timezone !== undefined) db.timezone = profile.timezone;
    if (profile.role !== undefined) db.role = profile.role;
    if (profile.parentId !== undefined) db.parent_id = profile.parentId;
    if (profile.permissions !== undefined) db.permissions = profile.permissions;
    return db;
};
