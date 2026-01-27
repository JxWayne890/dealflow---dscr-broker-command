import { supabase } from '../lib/supabase';
import { WebsitePage, BrokerProfile } from '../types';

export const WebsiteService = {
    async getPublicSite(subdomain: string): Promise<{ profile: BrokerProfile; pages: WebsitePage[] } | null> {
        // 1. Get profile by subdomain
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('website_subdomain', subdomain)
            .single();

        if (profileError || !profileData) {
            console.error('Error fetching public site profile:', profileError);
            return null;
        }

        const profile = mapDbToProfile(profileData);

        // 2. Get published pages for this profile
        const { data: pagesData, error: pagesError } = await supabase
            .from('website_pages')
            .select('*')
            .eq('profile_id', profileData.id)
            .eq('is_published', true)
            .order('order', { ascending: true });

        if (pagesError) {
            console.error('Error fetching public site pages:', pagesError);
            // Return profile even if pages fail? No, site is broken without pages.
            // But maybe we return empty pages array?
            return { profile, pages: [] };
        }

        return {
            profile,
            pages: pagesData.map(mapDbToPage)
        };
    },

    async getPages(): Promise<WebsitePage[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('website_pages')
            .select('*')
            .eq('profile_id', user.id)
            .order('order', { ascending: true });

        if (error) {
            console.error('Error fetching pages:', error);
            return [];
        }

        return data.map(mapDbToPage);
    },

    async savePage(page: Partial<WebsitePage>): Promise<WebsitePage | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const dbPage = {
            profile_id: user.id,
            slug: page.slug,
            title: page.title,
            content: page.content,
            is_published: page.isPublished,
            order: page.order
        };

        let result;
        if (page.id) {
            // Update
            result = await supabase
                .from('website_pages')
                .update(dbPage)
                .eq('id', page.id)
                .select()
                .single();
        } else {
            // Insert
            result = await supabase
                .from('website_pages')
                .insert(dbPage)
                .select()
                .single();
        }

        if (result.error) {
            console.error('Error saving page:', result.error);
            return null;
        }

        return mapDbToPage(result.data);
    },

    async deletePage(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('website_pages')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting page:', error);
            return false;
        }
        return true;
    },

    async checkSubdomainAvailability(subdomain: string): Promise<boolean> {
        if (!subdomain || subdomain.length < 3) return false;

        // Check if reserved
        const reserved = ['www', 'admin', 'api', 'mail', 'blog', 'support', 'app'];
        if (reserved.includes(subdomain.toLowerCase())) return false;

        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('website_subdomain', subdomain)
            .maybeSingle();

        if (error) {
            console.error('Error checking subdomain:', error);
            return false;
        }

        // If data exists, it's taken. If null, it's available.
        return !data;
    },

    async submitLead(profileId: string, lead: { name: string; email: string; phone?: string }): Promise<void> {
        const { error } = await supabase.rpc('submit_public_lead', {
            p_profile_id: profileId,
            p_name: lead.name,
            p_email: lead.email,
            p_phone: lead.phone
        });

        if (error) {
            console.error('Error submitting public lead:', error);
            throw error;
        }
    }
};

// Helper mappers
const mapDbToPage = (row: any): WebsitePage => ({
    id: row.id,
    profileId: row.profile_id,
    slug: row.slug,
    title: row.title,
    content: row.content || {},
    isPublished: row.is_published,
    order: row.order
});

const mapDbToProfile = (row: any): BrokerProfile => ({
    id: row.id,
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
    subscriptionStatus: row.subscription_status || 'trial',
    websiteSubdomain: row.website_subdomain,
    websiteSettings: row.website_settings || {}
});
