import { Logo } from '../components/Logo';
import { Button } from '../components/Button';
import { sendInquiryEmail } from '../services/emailService';
import { useState } from 'react';
import { Icons } from '../components/Icons';

export const Inquiry = ({ isDark }: { isDark: boolean }) => {
    // Get initial type from URL
    const params = new URLSearchParams(window.location.search);
    const initialType = params.get('type') === 'commercial' ? 'Commercial License' : 'Private Ownership';

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        contactTime: '',
        inquiryType: initialType
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const options = ['Private Ownership', 'Commercial License', 'General Inquiry'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const result = await sendInquiryEmail(formData);

        if (result.success) {
            setSubmitted(true);
        } else {
            setError(result.error || 'Failed to send inquiry. Please try again.');
        }
        setIsSubmitting(false);
    };

    if (submitted) {
        return (
            <div className={`min-h-screen flex items-center justify-center p-6 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                <div className={`max-w-md w-full p-8 rounded-3xl ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'} border text-center shadow-2xl`}>
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Icons.Check className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-4`}>Inquiry Received!</h2>
                    <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} mb-8`}>
                        Thanks for reaching out, {formData.name}. We'll be in touch with you shortly at {formData.email}.
                    </p>
                    <Button
                        onClick={() => window.location.href = '/'}
                        className="w-full bg-banana-400 text-slate-950 font-bold hover:bg-banana-500"
                    >
                        Return Home
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen flex flex-col ${isDark ? 'bg-slate-950' : 'bg-slate-50'} transition-colors duration-500`}>
            <nav className={`px-6 py-6 md:px-12 flex items-center justify-between`}>
                <div onClick={() => window.location.href = '/'} className="cursor-pointer">
                    <Logo className="h-10 w-auto" variant='full' isDark={isDark} />
                </div>
                <button
                    onClick={() => window.location.href = '/'}
                    className={`text-sm font-medium ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    Back
                </button>
            </nav>

            <div className="flex-1 flex items-center justify-center p-6 pb-20">
                <div className={`max-w-xl w-full p-8 md:p-12 rounded-[2.5rem] ${isDark ? 'bg-slate-900/50 border-white/5' : 'bg-white border-slate-200'} border shadow-2xl backdrop-blur-xl`}>
                    <div className="text-center mb-10">
                        <h1 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'} mb-4 tracking-tight`}>Get Full Access</h1>
                        <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Fill out the form below and our team will contact you to discuss the Private or Commercial license options.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2 relative z-50">
                            <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'} ml-1`}>Inquiry Type</label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className={`w-full h-14 px-6 rounded-xl border flex items-center justify-between ${isDark ? 'bg-slate-950/50 border-white/10 text-white hover:border-banana-400' : 'bg-slate-50 border-slate-200 text-slate-900 hover:border-banana-400'} outline-none transition-all font-medium text-left`}
                                >
                                    <span>{formData.inquiryType}</span>
                                    <Icons.ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''} ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                                </button>

                                {isDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                                        <div className={`absolute top-full mt-2 left-0 w-full rounded-xl border shadow-xl z-20 overflow-hidden ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'}`}>
                                            {options.map((option) => (
                                                <button
                                                    key={option}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData({ ...formData, inquiryType: option });
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-6 py-4 text-sm font-medium transition-colors ${formData.inquiryType === option
                                                        ? (isDark ? 'bg-banana-400/10 text-banana-400' : 'bg-banana-50 text-banana-600')
                                                        : (isDark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50')
                                                        }`}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2 relative z-0">
                            <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'} ml-1`}>Full Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className={`w-full h-14 px-6 rounded-xl border ${isDark ? 'bg-slate-950/50 border-white/10 text-white focus:border-banana-400' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-banana-400'} outline-none transition-all font-medium`}
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-0">
                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'} ml-1`}>Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className={`w-full h-14 px-6 rounded-xl border ${isDark ? 'bg-slate-950/50 border-white/10 text-white focus:border-banana-400' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-banana-400'} outline-none transition-all font-medium`}
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'} ml-1`}>Phone Number</label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className={`w-full h-14 px-6 rounded-xl border ${isDark ? 'bg-slate-950/50 border-white/10 text-white focus:border-banana-400' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-banana-400'} outline-none transition-all font-medium`}
                                    placeholder="(555) 123-4567"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 relative z-0">
                            <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'} ml-1`}>Best Time to Contact</label>
                            <input
                                type="text"
                                required
                                value={formData.contactTime}
                                onChange={e => setFormData({ ...formData, contactTime: e.target.value })}
                                className={`w-full h-14 px-6 rounded-xl border ${isDark ? 'bg-slate-950/50 border-white/10 text-white focus:border-banana-400' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-banana-400'} outline-none transition-all font-medium`}
                                placeholder="e.g. Weekday mornings, After 5 PM EST"
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium text-center">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-16 bg-banana-400 hover:bg-banana-500 text-slate-950 font-black text-lg rounded-2xl shadow-lg hover:shadow-banana-400/20 transition-all mt-4"
                        >
                            {isSubmitting ? 'Sending Request...' : 'Submit Inquiry'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};
