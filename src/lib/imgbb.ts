const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

export const uploadImageToImgBB = async (file: File): Promise<string> => {
    if (!IMGBB_API_KEY) {
        throw new Error('ImgBB API Key is missing. Please add VITE_IMGBB_API_KEY to your .env file.');
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error?.message || 'Failed to upload image');
        }

        // Return the display URL (or data.data.url for direct link)
        return data.data.url;
    } catch (error) {
        console.error('ImgBB Upload Error:', error);
        throw error;
    }
};
