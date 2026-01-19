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

        // 1. Find invite
        const { data: invite, error: fetchError } = await supabase
            .from('invites')
            .select('*')
            .eq('code', code.toUpperCase())
            .eq('is_used', false)
            .single();

        if (fetchError || !invite) throw new Error('Invalid or expired invite code');

        // 2. Update profile
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                role: 'assistant',
                parent_id: invite.broker_id,
                permissions: invite.permissions
            })
            .eq('id', user.id);

        if (updateError) throw updateError;

        // 3. Mark invite as used
        await supabase
            .from('invites')
            .update({ is_used: true })
            .eq('id', invite.id);
    }
}
