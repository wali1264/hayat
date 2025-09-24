import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

//=========== SUPABASE CLIENT ===========//
const supabaseUrl = 'https://uqokruakwmqfynszaine.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxb2tydWFrd21xZnluc3phaW5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0ODg5ODYsImV4cCI6MjA3MzA2NDk4Nn0.6hAotsw9GStdteP4NWcqvFmjCq8_81Y9IpGVkJx2dT0';
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

//=========== ICONS ===========//
const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.949a.75.75 0 00.95.826L10 8.185l-5.357 1.815a.75.75 0 00-.826.95l1.414 4.949a.75.75 0 00.95.826l11.45-3.815a.75.75 0 000-1.408L3.105 2.289z" />
    </svg>
);
const MicIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
        <path d="M5.5 8.5A.5.5 0 016 8v2a4 4 0 008 0V8a.5.5 0 011 0v2a5 5 0 01-5 5V17a.5.5 0 01-1 0v-2.5a5 5 0 01-5-5V8.5z" />
    </svg>
);
const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
);

//=========== MAIN REMOTE APP ===========//
const RemoteApp = () => {
    const [currentUser, setCurrentUser] = useState<string | null>(localStorage.getItem('hayat_remote_user'));
    const [commandText, setCommandText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    const handleSendCommand = async () => {
        if (!commandText.trim() || !currentUser) return;
        const command = {
            sent_by: currentUser,
            type: 'TEXT_COMMAND',
            payload: { text: commandText }
        };

        const { error } = await supabase.from('commands').insert(command);
        if (error) {
            alert(`خطا در ارسال دستور: ${error.message}`);
        } else {
            setCommandText('');
        }
    };
    
    // --- Speech Recognition ---
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech recognition not supported in this browser.");
            return;
        }
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.lang = 'fa-IR';
        recognitionRef.current.interimResults = false;
        recognitionRef.current.maxAlternatives = 1;

        recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setCommandText(transcript);
        };
        recognitionRef.current.onspeechend = () => {
            setIsListening(false);
        };
        recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('hayat_remote_user');
        setCurrentUser(null);
    };

    if (!currentUser) {
        return <LoginScreen onLoginSuccess={(username) => {
            localStorage.setItem('hayat_remote_user', username);
            setCurrentUser(username);
        }} />;
    }

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <header className="bg-white shadow-md p-4 flex justify-between items-center flex-shrink-0">
                <h1 className="font-bold text-lg text-teal-700">ریموت کنترل حیات</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold">{currentUser}</span>
                    <button onClick={handleLogout} title="خروج"><LogoutIcon /></button>
                </div>
            </header>
            <main className="flex-1 p-4 flex flex-col justify-end">
                {/* Command history would go here in the future */}
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-500">دستورات خود را ارسال کنید...</p>
                </div>
            </main>
            <footer className="p-4 bg-white border-t flex-shrink-0">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={commandText}
                        onChange={(e) => setCommandText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendCommand()}
                        placeholder="دستور خود را تایپ یا بیان کنید..."
                        className="w-full p-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                     <button onClick={toggleListening} className={`p-3 rounded-full ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-gray-700'}`}>
                        <MicIcon />
                    </button>
                    <button onClick={handleSendCommand} className="p-3 bg-teal-600 text-white rounded-full hover:bg-teal-700">
                        <SendIcon />
                    </button>
                </div>
            </footer>
        </div>
    );
};

//=========== LOGIN SCREEN ===========//
const LoginScreen = ({ onLoginSuccess }: { onLoginSuccess: (username: string) => void }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // NOTE: This performs a client-side check against data that should be in localStorage
        // of the MAIN application. This remote does not have access to that.
        // A real-world scenario would require an auth endpoint.
        // For this demo, we will use Supabase Auth for a more robust solution.

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: `${username}@example.com`, // Assuming email format
                password,
            });

            if (error) throw error;
            if (data.user) {
                 // We don't have direct access to the `users` table from the client due to RLS,
                 // so we'll just use the username from the input, which is validated by the successful login.
                 onLoginSuccess(username);
            }
        } catch (err: any) {
             setError('نام کاربری یا رمز عبور اشتباه است.');
        }
    };
    
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100 p-4">
            <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-2xl shadow-xl">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-teal-800">ورود به ریموت کنترل</h1>
                    <p className="mt-2 text-gray-500">از حساب کاربری اصلی خود استفاده کنید</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                     <div>
                        <label className="text-sm font-medium text-gray-700">نام کاربری</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">رمز عبور</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    <button type="submit" className="w-full py-3 px-4 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700">
                        ورود
                    </button>
                </form>
            </div>
        </div>
    );
};

//=========== RENDER APP ===========//
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}
const root = ReactDOM.createRoot(rootElement);
root.render(<RemoteApp />);
