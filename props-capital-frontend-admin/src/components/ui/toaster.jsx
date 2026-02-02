import { useToast } from "@/components/ui/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  // Filter out closed toasts
  const openToasts = toasts.filter((toast) => toast.open !== false);

  return (
    <ToastProvider>
      {openToasts.map(function ({ id, title, description, action, onOpenChange, open, ...props }) {
        const handleClose = (e) => {
          e?.preventDefault();
          e?.stopPropagation();
          console.log('Dismissing toast:', id);
          // Call onOpenChange if it exists (Radix UI pattern)
          if (onOpenChange) {
            onOpenChange(false);
          }
          // Also call dismiss directly
          dismiss(id);
        };

        return (
          <Toast 
            key={id} 
            {...props}
            data-toast-id={id}
            onOpenChange={onOpenChange}
            open={open}
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose onClick={handleClose} />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
} 