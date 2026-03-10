import { supabase } from '../lib/supabase';
import { EducationTutorial } from '../types';

export const educationService = {
    async getTutorials(): Promise<EducationTutorial[]> {
        const { data, error } = await supabase
            .from('education_tutorials')
            .select('*')
            .order('order_index', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching tutorials:', error);
            return [];
        }

        return (data || []).map(row => ({
            id: row.id,
            title: row.title,
            description: row.description,
            videoUrl: row.video_url,
            category: row.category,
            thumbnailUrl: row.thumbnail_url,
            orderIndex: row.order_index,
            createdAt: row.created_at
        }));
    },

    async addTutorial(tutorial: Omit<EducationTutorial, 'id' | 'createdAt'>): Promise<EducationTutorial | null> {
        const { data, error } = await supabase
            .from('education_tutorials')
            .insert({
                title: tutorial.title,
                description: tutorial.description,
                video_url: tutorial.videoUrl,
                category: tutorial.category,
                thumbnail_url: tutorial.thumbnailUrl,
                order_index: tutorial.orderIndex
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding tutorial:', error);
            throw error;
        }

        return {
            id: data.id,
            title: data.title,
            description: data.description,
            videoUrl: data.video_url,
            category: data.category,
            thumbnailUrl: data.thumbnail_url,
            orderIndex: data.order_index,
            createdAt: data.created_at
        };
    },

    async updateTutorial(id: string, updates: Partial<EducationTutorial>): Promise<void> {
        const dbUpdates: any = {};
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.videoUrl !== undefined) dbUpdates.video_url = updates.videoUrl;
        if (updates.category !== undefined) dbUpdates.category = updates.category;
        if (updates.thumbnailUrl !== undefined) dbUpdates.thumbnailUrl = updates.thumbnailUrl;
        if (updates.orderIndex !== undefined) dbUpdates.order_index = updates.orderIndex;

        const { error } = await supabase
            .from('education_tutorials')
            .update(dbUpdates)
            .eq('id', id);

        if (error) {
            console.error('Error updating tutorial:', error);
            throw error;
        }
    },

    async deleteTutorial(id: string): Promise<void> {
        const { error } = await supabase
            .from('education_tutorials')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting tutorial:', error);
            throw error;
        }
    }
};
