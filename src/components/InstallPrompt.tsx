'use client';

import { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [isStandalone, setIsStandalone] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if the app is already installed/running in standalone mode
    const checkStandalone = () => {
      return window.matchMedia('(display-mode: standalone)').matches || 
             (window.navigator as any).standalone === true;
    };

    if (checkStandalone()) {
      setIsStandalone(true);
      return;
    }
    
    setIsStandalone(false);

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for beforeinstallprompt (Android Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPromptEvent(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show iOS prompt immediately since it doesn't support beforeinstallprompt
    if (isIosDevice) {
      setShowPrompt(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPromptEvent) return;
    
    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setInstallPromptEvent(null);
  };

  const dismiss = () => {
    setShowPrompt(false);
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.1)] p-4 z-50 rounded-t-2xl border-t border-gray-100 slide-up">
      <div className="max-w-md mx-auto relative">
        <button 
          onClick={dismiss} 
          className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200"
        >
          &times;
        </button>
        
        <div className="flex items-center gap-4 mb-3">
          <img src="/icon-192x192.png" alt="App Icon" className="w-12 h-12 rounded-xl shadow-sm" />
          <div>
            <h3 className="font-bold text-gray-900">Müllkalender Bedburg</h3>
            <p className="text-xs text-gray-500">Schneller Zugriff & Erinnerungen</p>
          </div>
        </div>

        {isIOS ? (
          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
            <p className="font-medium mb-1">App auf dem iPhone installieren:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Tippen Sie unten auf das <b>Teilen-Symbol</b> (Viereck mit Pfeil <span className="inline-block border border-gray-300 rounded px-1 pb-0.5">↑</span>)</li>
              <li>Wählen Sie <b>&quot;Zum Home-Bildschirm&quot;</b> <span className="inline-block border border-gray-300 rounded px-1 pb-0.5">+</span></li>
            </ol>
          </div>
        ) : (
          <button 
            onClick={handleInstallClick}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
          >
            Jetzt als App installieren
          </button>
        )}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .slide-up {
          animation: slideUp 0.5s ease-out forwards;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
