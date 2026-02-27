import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

export default function MessageInput({ onSend, disabled, isPending }) {
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
    <div className="border-t border-border bg-card p-3 flex items-end gap-2">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? 'This ticket is closed' : 'Type your message...'}
        disabled={disabled}
        className="min-h-[40px] max-h-[120px] resize-none bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm flex-1"
        rows={1}
      />
      <Button
        onClick={handleSend}
        disabled={!value.trim() || disabled || isPending}
        size="icon"
        className="h-10 w-10 shrink-0 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white disabled:opacity-50"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}
