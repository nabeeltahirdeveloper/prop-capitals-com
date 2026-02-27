import { useState, useRef, useCallback } from 'react';
import { Send } from 'lucide-react';
import { useTraderTheme } from '@/components/trader/TraderPanelLayout';

export default function MessageInput({ onSend, disabled, isPending }) {
  const { isDark } = useTraderTheme();
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isPending) return;
    onSend(trimmed);
    setValue('');
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [value, disabled, isPending, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`border-t p-3 flex items-end gap-2 ${
        isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'
      }`}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? 'This ticket is closed' : 'Type your message...'}
        disabled={disabled}
        className={`min-h-[40px] max-h-[120px] resize-none text-sm flex-1 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
          isDark
            ? 'bg-[#0a0d12] border border-white/10 text-white placeholder-gray-500'
            : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
        }`}
        rows={1}
      />
      <button
        onClick={handleSend}
        disabled={!value.trim() || disabled || isPending}
        className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center transition-all ${
          value.trim() && !disabled && !isPending
            ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12]'
            : isDark
              ? 'bg-white/10 text-gray-500'
              : 'bg-slate-100 text-slate-400'
        }`}
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}
