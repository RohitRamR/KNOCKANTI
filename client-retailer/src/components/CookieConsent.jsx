import { useState, useEffect } from 'react';

const CookieConsent = () => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookieConsent');
        if (!consent) {
            setShow(true);
        }
    }, []);

    const acceptCookies = () => {
        localStorage.setItem('cookieConsent', 'true');
        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="text-sm">
                <p>We use cookies to ensure you get the best experience on our website. By continuing to use this site, you agree to our use of cookies.</p>
            </div>
            <button
                onClick={acceptCookies}
                className="bg-orange-600 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-orange-700 transition whitespace-nowrap"
            >
                Got it!
            </button>
        </div>
    );
};

export default CookieConsent;
