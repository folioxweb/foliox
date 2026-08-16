import React, { useState, useEffect, useRef } from 'react';
import { X, Mic } from 'lucide-react';
import { api } from '../services/apiClient';

const VoiceAssistant = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  
  // Track modes
  const [isManualListening, setIsManualListening] = useState(false);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(localStorage.getItem('wakeWordEnabled') === 'true');
  
  const recognitionRef = useRef(null);
  const waitingForCommandRef = useRef(false);
  
  const wakeWordEnabledRef = useRef(wakeWordEnabled);
  const isSpeakingRef = useRef(isSpeaking);
  const isManualListeningRef = useRef(isManualListening);
  const audioUnlockedRef = useRef(false);

  // Sync refs
  useEffect(() => { wakeWordEnabledRef.current = wakeWordEnabled; }, [wakeWordEnabled]);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
  useEffect(() => { isManualListeningRef.current = isManualListening; }, [isManualListening]);

  // Listen to Settings toggle
  useEffect(() => {
    const handleToggle = () => setWakeWordEnabled(localStorage.getItem('wakeWordEnabled') === 'true');
    window.addEventListener('wakeWordToggled', handleToggle);
    return () => window.removeEventListener('wakeWordToggled', handleToggle);
  }, []);

  // Async Voice Loader & iOS Audio Unlocker
  useEffect(() => {
    if (!window.speechSynthesis) return;

    // Load voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) setVoices(availableVoices);
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // Unlock audio for iOS Safari / PWA
    const unlockAudio = () => {
      if (audioUnlockedRef.current) return;
      
      window.speechSynthesis.resume();
      const utterance = new SpeechSynthesisUtterance('');
      utterance.volume = 0; // Silent
      window.speechSynthesis.speak(utterance);
      audioUnlockedRef.current = true;
      
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // Initialize Speech Engine
  const startEngine = (manual = false) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Cleanup previous instance safely
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try { recognitionRef.current.abort(); } catch (e) {}
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.continuous = manual ? false : true;
    
    recognition.onresult = async (event) => {
      if (isSpeakingRef.current) return;
      
      const current = event.resultIndex;
      let resultTranscript = event.results[current][0].transcript.toLowerCase().trim();
      
      // Phonetics correction
      resultTranscript = resultTranscript.replace(/\bapple 3i\b/g, 'affle')
                                         .replace(/\bapple 3\b/g, 'affle')
                                         .replace(/\bapple free\b/g, 'affle')
                                         .replace(/\baffle 3i\b/g, 'affle');
                                         
      console.log("[VoiceAssistant] Heard:", resultTranscript);
      
      if (manual) {
        setIsManualListening(false);
        setTranscript(resultTranscript);
        await handleVoiceQuery(resultTranscript);
      } else {
        if (resultTranscript.includes('disable assistant') || resultTranscript.includes('turn off assistant')) {
          localStorage.setItem('wakeWordEnabled', 'false');
          window.dispatchEvent(new Event('wakeWordToggled'));
          if (window.speechSynthesis) window.speechSynthesis.cancel();
          speakText("Voice Assistant disabled.");
          return;
        }

        if (resultTranscript.includes('stop assistant') || resultTranscript.includes('never mind')) {
          if (window.speechSynthesis) window.speechSynthesis.cancel();
          waitingForCommandRef.current = false;
          setTranscript('Standby for "Hey Assistant"...');
          return;
        }

        const wakeWords = [
          'hey assistant', 'hi assistant', 'okay assistant', 
          'assistant'
        ];
        const matchedWakeWord = wakeWords.find(w => resultTranscript.includes(w));
        
        if (matchedWakeWord) {
          const query = resultTranscript.split(matchedWakeWord).pop().trim();
          if (query.length > 3) {
            waitingForCommandRef.current = true;
            setTranscript(query);
            await handleVoiceQuery(query);
          } else {
            waitingForCommandRef.current = true;
            const hour = new Date().getHours();
            const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
            speakText(`${greeting}, how may I help you?`);
            setTranscript(`${greeting}, how may I help you?`);
          }
        } else if (waitingForCommandRef.current && !isSpeakingRef.current) {
          setTranscript(resultTranscript);
          await handleVoiceQuery(resultTranscript);
        }
      }
    };
    
    recognition.onend = () => {
      if (manual) setIsManualListening(false);
      
      // Auto-restart wake word loop if applicable
      if (wakeWordEnabledRef.current && !isManualListeningRef.current) {
        // slight delay to prevent rapid-fire loop crashes
        setTimeout(() => startEngine(false), 200);
      }
    };

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') console.error("Speech Error:", e.error);
    }
    
    recognitionRef.current = recognition;
    try { recognition.start(); } catch (e) { console.error("Failed to start mic:", e); }
  };

  // Manage Lifecycle when States Change
  useEffect(() => {
    if (isManualListening) {
      startEngine(true);
    } else if (wakeWordEnabled) {
      startEngine(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    };
  }, [wakeWordEnabled, isManualListening]);

  // Auto-hide transcript
  useEffect(() => {
    let timeout;
    if (transcript && !isProcessing && !isSpeaking && !isManualListening) {
      timeout = setTimeout(() => {
        setTranscript('');
      }, 4000); 
    }
    return () => clearTimeout(timeout);
  }, [transcript, isProcessing, isSpeaking, isManualListening]);

  const speakText = (text) => {
    if (!window.speechSynthesis) return;

    // iOS Hack: Resume audio context before speaking async responses
    window.speechSynthesis.resume();
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    // Ensure voices are loaded, fallback if not
    let currentVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
    
    // Attempt to find Samantha strictly, or any female en voice as fallback
    let selectedVoice = currentVoices.find(v => v.name.includes('Samantha'));
    if (!selectedVoice) {
      selectedVoice = currentVoices.find(v => (v.name.includes('Female') || v.name.includes('Victoria') || v.name.includes('Karen') || v.name.includes('Moira') || v.name.includes('Rishi') || v.name.includes('Zira') || v.name.includes('Tessa') || v.name.includes('Google US English')) && v.lang.includes('en'));
    }
    
    // Explicit iOS Voice fallback as suggested
    if (!selectedVoice && currentVoices.length > 0) {
       selectedVoice = currentVoices.find(v => v.lang === "en-IN") ||
                       currentVoices.find(v => v.lang.startsWith("en")) ||
                       currentVoices[0];
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.rate = 1.05;
    utterance.pitch = 1.15;

    window.speechSynthesis.speak(utterance);
  };

  const handleClose = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsManualListening(false);
    waitingForCommandRef.current = false;
    setTranscript(wakeWordEnabled ? 'Standby for "Hey Assistant"...' : '');
  };

  const handleVoiceQuery = async (queryText) => {
    setIsProcessing(true);
    try {
      const response = await api.sendVoiceQuery(queryText);
      const speechText = response?.speechText || response?.data?.speechText || "I couldn't process your request.";
      setTranscript(speechText);
      speakText(speechText);
    } catch (error) {
      console.error("Error processing voice query", error);
      setTranscript("Sorry, I ran into an error connecting to the server.");
      speakText("Sorry, I ran into an error connecting to the server.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleManualListen = () => {
    if (isManualListening) {
      setIsManualListening(false);
    } else {
      handleClose();
      setIsManualListening(true);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
      {/* Transcript bubble */}
      {(transcript || isProcessing || isManualListening) && transcript !== '' && (
        <div className="pointer-events-auto relative backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 p-4 pt-6 rounded-2xl shadow-2xl text-sm max-w-[280px] animate-fade-in border border-white/40 dark:border-slate-700/50">
          
          {/* Close Button */}
          {!isProcessing && !isManualListening && (
            <button 
              onClick={handleClose}
              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={14} />
            </button>
          )}

          {isProcessing ? (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
            </div>
          ) : (
            <p className="leading-relaxed">{isManualListening && !transcript ? "Listening..." : transcript}</p>
          )}
        </div>
      )}
      
      {/* Manual Mic Button */}
      <button 
        onClick={toggleManualListen}
        style={{ backgroundColor: isManualListening ? '#ef4444' : '#059669' }}
        className={`pointer-events-auto flex items-center justify-center text-white shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 w-14 h-14 rounded-full opacity-100
          ${isManualListening ? 'animate-pulse' : ''}`}
        aria-label="Toggle Manual Voice Request"
      >
        <Mic size={24} />
      </button>
    </div>
  );
};

export default VoiceAssistant;
