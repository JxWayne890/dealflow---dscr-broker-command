import { supabase } from '../lib/supabase';
import { Permissions } from '../types';

export const InviteService = {
    async createInvite(permissions: Permissions): Promise<string> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const code = Math.random().toString(36).substring(2, 8).toUpperCase();

        const { error } = await supabase
            .from('invites')
            .insert({
                code,
                broker_id: user.id,
                permissions,
                is_used: false
            });

        if (error) throw error;
        return code;
    },

    async claimInvite(code: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const cleanCode = code.toUpperCase().trim();

        // 1. Check for organizational static code in profiles
        const { data: adminProfile, error: profileError } = await supabase
            .from('profiles')
            .select('id, permissions')
            .eq('invite_code', cleanCode)
            .eq('role', 'admin')
            .maybeSingle();

        if (adminProfile) {
            // Join using static organizational code
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    role: 'assistant',
                    parent_id: adminProfile.id,
                    permissions: {
                        dashboard: true,
                        quotes: true,
                        investors: true,
                        campaigns: true,
                        analytics: true
                    } // Default to all permissions for static join
                })
                .eq('id', user.id);

            if (updateError) throw updateError;
            return;
        }

        // 2. Fallback to legacy specific invites (if any)
        const { data: invite, error: fetchError } = await supabase
            .from('invites')
            .select('*')
            .eq('code', cleanCode)
            .eq('is_used', false)
            .maybeSingle();

        if (!adminProfile && (fetchError || !invite)) {
            throw new Error('Invalid or expired invite code');
        }

        if (invite) {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    role: 'assistant',
                    parent_id: invite.broker_id,
                    permissions: invite.permissions
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            await supabase
                .from('invites')
                .update({ is_used: true })
                .eq('id', invite.id);
        }
    }
}
