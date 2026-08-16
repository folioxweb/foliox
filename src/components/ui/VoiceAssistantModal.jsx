import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, X, TrendingUp, TrendingDown, Newspaper, FileText, ArrowRight } from 'lucide-react';
import { voiceService } from '../../services/voiceService';
import { api } from '../../services/apiClient';

/**
 * VoiceAssistantModal Component
 *
 * Provides a modern voice assistant interface that:
 * 1. Transcribes speech visually on screen.
 * 2. Processes query via instant client pattern matching or GAS backend (<50ms).
 * 3. Speaks back response via Web Speech Synthesis.
 * 4. Displays interactive data cards (Stock Price, P&L, News, Reports).
 */
export default function VoiceAssistantModal({ isOpen, onClose, portfolioData = null }) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'speaking' | 'error'
  const [transcript, setTranscript] = useState('');
  const [responseText, setResponseText] = useState('');
  const [resultData, setResultData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Automatically start listening when modal opens
  useEffect(() => {
    if (isOpen) {
      handleStartListening();
    } else {
      handleClose();
    }
  }, [isOpen]);

  const handleClose = () => {
    voiceService.stopListening();
    voiceService.stopSpeaking();
    setStatus('idle');
    if (onClose) onClose();
  };

  const handleStartListening = () => {
    voiceService.stopSpeaking();
    setErrorMessage('');
    setTranscript('');
    setResponseText('');
    setResultData(null);
    setStatus('listening');

    voiceService.startListening({
      onTranscript: ({ interim, final }) => {
        const text = final || interim;
        setTranscript(text);
        if (final && final.trim().length > 0) {
          processQuery(final.trim());
        }
      },
      onError: (err) => {
        setStatus('error');
        setErrorMessage(typeof err === 'string' ? err : 'Speech recognition error. Please try again.');
      },
      onEnd: () => {
        // If ended without transcript, return to idle
      }
    });
  };

  const handleStopListening = () => {
    voiceService.stopListening();
    if (transcript.trim().length > 0 && status === 'listening') {
      processQuery(transcript.trim());
    } else {
      setStatus('idle');
    }
  };

  const processQuery = async (userText) => {
    voiceService.stopListening();
    setStatus('processing');

    // Step 1: Try Instant Client-side Intent Parser (<10ms)
    const clientResult = voiceService.parseClientIntent(userText, portfolioData);

    if (clientResult) {
      speakAndShowResult(clientResult.speechText, clientResult.data, clientResult.intent);
      return;
    }

    // Step 2: Query Backend (GAS or Mock) if client didn't handle it
    try {
      const res = await api.sendVoiceQuery(userText);
      if (res && res.speechText) {
        speakAndShowResult(res.speechText, res.data, res.intent);
      } else {
        speakAndShowResult("I couldn't find an answer for that request.", null, 'UNKNOWN');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage("Network error processing query: " + (err.message || 'Unknown error'));
    }
  };

  const speakAndShowResult = (speech, data, intent) => {
    setResponseText(speech);
    setResultData({ intent, data });
    setStatus('speaking');

    voiceService.speakText(speech, {
      onEnd: () => setStatus('idle'),
      onError: () => setStatus('idle')
    });
  };

  const handleReplaySpeech = () => {
    if (responseText) {
      setStatus('speaking');
      voiceService.speakText(responseText, {
        onEnd: () => setStatus('idle'),
        onError: () => setStatus('idle')
      });
    }
  };

  const handleStopSpeech = () => {
    voiceService.stopSpeaking();
    setStatus('idle');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[var(--card-bg,#1E293B)] border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          style={{ background: 'var(--header-bg, #0F172A)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  status === 'listening' ? 'bg-red-400' : status === 'speaking' ? 'bg-emerald-400' : 'bg-slate-400'
                }`} />
                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                  status === 'listening' ? 'bg-red-500' : status === 'speaking' ? 'bg-emerald-500' : 'bg-slate-400'
                }`} />
              </span>
              <h3 className="text-base font-semibold text-white tracking-wide">Equity Voice Assistant</h3>
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* Visual Waveform / Listening Animation */}
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative flex items-center justify-center mb-3">
                <motion.button
                  type="button"
                  onClick={status === 'listening' ? handleStopListening : handleStartListening}
                  whileTap={{ scale: 0.9 }}
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all ${
                    status === 'listening'
                      ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/40'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/40'
                  }`}
                >
                  <Mic size={36} className={status === 'listening' ? 'animate-bounce' : ''} />
                </motion.button>
              </div>

              <p className="text-xs font-medium tracking-wider uppercase text-slate-400">
                {status === 'listening' && 'Listening... Speak now'}
                {status === 'processing' && 'Processing query...'}
                {status === 'speaking' && 'Speaking back...'}
                {status === 'idle' && 'Tap mic to ask a question'}
                {status === 'error' && 'Error'}
              </p>
            </div>

            {/* Transcript Box */}
            {transcript && (
              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">YOU SAID:</span>
                <p className="text-sm text-slate-200 italic font-normal">"{transcript}"</p>
              </div>
            )}

            {/* Error Display */}
            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-xl text-xs">
                {errorMessage}
              </div>
            )}

            {/* Assistant Written Response */}
            {responseText && (
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">ASSISTANT</span>
                  <div className="flex items-center gap-1">
                    {status === 'speaking' ? (
                      <button onClick={handleStopSpeech} className="text-emerald-400 hover:text-white p-1" title="Stop speech">
                        <VolumeX size={16} />
                      </button>
                    ) : (
                      <button onClick={handleReplaySpeech} className="text-emerald-400 hover:text-white p-1" title="Replay voice">
                        <Volume2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-100 leading-relaxed">{responseText}</p>
              </div>
            )}

            {/* Interactive Result Data Cards */}
            {resultData && resultData.data && (
              <div className="pt-2">
                {/* Stock Price Card */}
                {resultData.intent === 'STOCK_PRICE' && (
                  <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider">{resultData.data.symbol}</div>
                      <div className="text-lg font-bold text-white mt-0.5">{resultData.data.name || resultData.data.symbol}</div>
                      <div className="text-xs text-slate-400 mt-1">P&L: ₹{resultData.data.pnl ? resultData.data.pnl.toLocaleString('en-IN') : '0'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-extrabold text-white">₹{resultData.data.currentPrice ? resultData.data.currentPrice.toLocaleString('en-IN') : '0'}</div>
                      <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${
                        (resultData.data.dayChangePercent || 0) >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {(resultData.data.dayChangePercent || 0) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {Math.abs(resultData.data.dayChangePercent || 0).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                )}

                {/* Portfolio P&L Card */}
                {resultData.intent === 'PORTFOLIO_PNL' && (
                  <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/50 p-3 rounded-xl">
                      <div className="text-[10px] font-medium text-slate-400 uppercase">Current Value</div>
                      <div className="text-base font-bold text-white mt-1">₹{resultData.data.currentValue ? Math.round(resultData.data.currentValue).toLocaleString('en-IN') : '0'}</div>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-xl">
                      <div className="text-[10px] font-medium text-slate-400 uppercase">Total Profit</div>
                      <div className={`text-base font-bold mt-1 ${(resultData.data.profit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        ₹{resultData.data.profit ? Math.round(Math.abs(resultData.data.profit)).toLocaleString('en-IN') : '0'}
                      </div>
                    </div>
                  </div>
                )}

                {/* News Card */}
                {resultData.intent === 'NEWS' && Array.isArray(resultData.data) && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                      <Newspaper size={14} /> Top Headlines
                    </div>
                    {resultData.data.map((item, idx) => (
                      <a
                        key={idx}
                        href={item.link || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="block bg-slate-900/80 hover:bg-slate-800 p-3 rounded-xl border border-slate-800 transition-colors"
                      >
                        <div className="text-xs font-medium text-slate-200 line-clamp-2">{item.title}</div>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                          <span>{item.source || 'Market News'}</span>
                          <ArrowRight size={10} />
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Command Suggestions Footer */}
          <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex gap-2 overflow-x-auto text-[11px] text-slate-400 scrollbar-none">
            <span className="shrink-0 text-slate-400">Try saying:</span>
            <button
              onClick={() => processQuery("What is my portfolio P&L?")}
              className="shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 transition-colors"
            >
              "What is my portfolio P&L?"
            </button>
            <button
              onClick={() => processQuery("Today's performance")}
              className="shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 transition-colors"
            >
              "Today's performance"
            </button>
            <button
              onClick={() => processQuery("Top gainer stock")}
              className="shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 transition-colors"
            >
              "Top gainer stock"
            </button>
            <button
              onClick={() => processQuery("Price of Tata Motors")}
              className="shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 transition-colors"
            >
              "Price of Tata Motors"
            </button>
            <button
              onClick={() => processQuery("Fixed deposits summary")}
              className="shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 transition-colors"
            >
              "Fixed deposits summary"
            </button>
            <button
              onClick={() => processQuery("Mutual funds summary")}
              className="shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 transition-colors"
            >
              "Mutual funds summary"
            </button>
            <button
              onClick={() => processQuery("Highest sector exposure")}
              className="shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 transition-colors"
            >
              "Highest sector exposure"
            </button>
            <button
              onClick={() => processQuery("Show latest news")}
              className="shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 transition-colors"
            >
              "Show latest news"
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
