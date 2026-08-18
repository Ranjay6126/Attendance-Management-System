import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

const InstallAppButton = () => {
    const [installPrompt, setInstallPrompt] = useState(null);

    useEffect(() => {
        const handleBeforeInstallPrompt = (event) => {
            event.preventDefault();
            setInstallPrompt(event);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstall = async () => {
        if (installPrompt) {
            installPrompt.prompt();
            await installPrompt.userChoice;
            setInstallPrompt(null);
            return;
        }

        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        window.alert(
            isIOS
                ? 'To install this app, tap Share and then Add to Home Screen.'
                : 'Use your browser menu and select Install app to add Employees Attendance Management System to this device.'
        );
    };

    return (
        <button
            type="button"
            onClick={handleInstall}
            className="flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-2 text-xs font-bold text-white transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/70"
            aria-label="Download Apps"
            title="Download Apps"
        >
            <Download size={16} />
            <span className="hidden sm:inline">Download Apps</span>
        </button>
    );
};

export default InstallAppButton;
