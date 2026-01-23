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

    async onboardingUpdate(userId: string, updates: Partial<BrokerProfile>): Promise<void> {
        const { error } = await supabase.rpc('update_onboarding_profile', {
            p_user_id: userId,
            p_name: updates.name || null,
            p_company: updates.company || null,
            p_title: updates.title || null,
            p_phone: updates.phone || null,
            p_website: updates.website || null,
            p_role: updates.role || null,
            p_onboarding_status: updates.onboardingStatus || null
        });

        if (error) {
            console.error('Onboarding Update Failed:', error);
            throw error;
        }
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
    },

    async getOrganizationId(): Promise<string | null> {
        const profile = await this.getProfile();
        if (!profile) return null;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        return profile.parentId || user.id;
    },

    async checkEmailPrefixAvailable(prefix: string): Promise<{ available: boolean; suggestions: string[] }> {
        const { data, error } = await supabase.rpc('check_email_prefix_available', {
            prefix_to_check: prefix
        });

        if (error) {
            console.error('Error checking email prefix:', error);
            return { available: false, suggestions: [] };
        }

        // RPC returns array of rows, we want the first one
        const result = data?.[0] || { available: false, suggestions: [] };
        return {
            available: result.available ?? false,
            suggestions: result.suggestions ?? []
        };
    },

    async getAllProfiles(): Promise<(BrokerProfile & { id: string; createdAt: string })[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching all profiles:', error);
            return [];
        }

        return data.map((row: any) => ({
            ...mapDbToProfile(row),
            id: row.id,
            createdAt: row.created_at
        }));
    },

    async incrementEmailCount(): Promise<{ success: boolean; newCount: number }> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, newCount: 0 };

        const { error } = await supabase.rpc('increment_email_count', { user_id: user.id });

        if (error) {
            console.error('Error incrementing email count:', error);
            return { success: false, newCount: 0 };
        }

        // Fetch updated count
        const { data } = await supabase
            .from('profiles')
            .select('emails_sent')
            .eq('id', user.id)
            .single();

        return { success: true, newCount: data?.emails_sent || 0 };
    },

    async canSendEmail(): Promise<{ allowed: boolean; emailsSent: number; limit: number }> {
        const FREE_TRIAL_LIMIT = 50;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { allowed: false, emailsSent: 0, limit: FREE_TRIAL_LIMIT };

        const { data } = await supabase
            .from('profiles')
            .select('emails_sent, subscription_status')
            .eq('id', user.id)
            .single();

        const emailsSent = data?.emails_sent || 0;
        const status = data?.subscription_status || 'trial';

        // Active subscribers have no limit
        if (status === 'active') {
            return { allowed: true, emailsSent, limit: Infinity };
        }

        // Trial users have a limit
        return {
            allowed: emailsSent < FREE_TRIAL_LIMIT,
            emailsSent,
            limit: FREE_TRIAL_LIMIT
        };
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
    theme: row.theme || 'light',
    senderEmailPrefix: row.sender_email_prefix,
    role: row.role || 'admin',
    parentId: row.parent_id,
    permissions: row.permissions,
    inviteCode: row.invite_code,
    onboardingStatus: row.onboarding_status,
    emailsSent: row.emails_sent || 0,
    subscriptionStatus: row.subscription_status || 'trial'
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
    if (profile.theme !== undefined) db.theme = profile.theme;
    if (profile.senderEmailPrefix !== undefined) db.sender_email_prefix = profile.senderEmailPrefix;
    if (profile.role !== undefined) db.role = profile.role;
    if (profile.parentId !== undefined) db.parent_id = profile.parentId;
    if (profile.permissions !== undefined) db.permissions = profile.permissions;
    if (profile.inviteCode !== undefined) db.invite_code = profile.inviteCode;
    if (profile.onboardingStatus !== undefined) db.onboarding_status = profile.onboardingStatus;
    return db;
};
