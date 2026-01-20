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
        // 1. Get current User ID (Robust check)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const cleanCode = code.toUpperCase().trim();

        // 2. Call the Secure Backend Function (Bypasses RLS)
        const { error } = await supabase.rpc('claim_invite', {
            p_user_id: user.id,
            p_invite_code: cleanCode
        });

        if (error) {
            console.error('Invite Claim Verification Failed:', error);
            throw new Error(error.message || 'Invalid invite code or verification failed');
        }
    }
}
