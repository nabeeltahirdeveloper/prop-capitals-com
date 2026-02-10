import React from 'react';
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { XCircle, AlertTriangle, Shield } from 'lucide-react';

export default function ViolationPopup({ 
  isOpen, 
  onClose, 
  type = 'warning', // 'warning' | 'violation'
  title,
  message,
  details
}) {
  const isViolation = type === 'violation';

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className={`${
        isViolation 
          ? 'bg-red-950 border-red-500/50' 
          : 'bg-amber-950 border-amber-500/50'
      } max-w-md`}>
        <AlertDialogHeader>
          <div className="flex flex-col items-center text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
              isViolation 
                ? 'bg-red-500/20' 
                : 'bg-amber-500/20'
            }`}>
              {isViolation 
                ? <XCircle className="w-12 h-12 text-red-500" />
                : <AlertTriangle className="w-12 h-12 text-amber-500" />
              }
            </div>
            <AlertDialogTitle className={`text-2xl font-bold ${
              isViolation ? 'text-red-400' : 'text-amber-400'
            }`}>
              {title || (isViolation ? 'Challenge Failed' : 'Warning')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300 mt-2 text-base">
              {message || (isViolation 
                ? 'A rule violation has been detected on your account.' 
                : 'You are approaching a rule limit.'
              )}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        {details && (
          <div className={`p-4 rounded-lg mt-4 ${
            isViolation ? 'bg-red-500/10' : 'bg-amber-500/10'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Shield className={`w-4 h-4 ${isViolation ? 'text-red-400' : 'text-amber-400'}`} />
              <span className={`font-medium ${isViolation ? 'text-red-400' : 'text-amber-400'}`}>
                Details
              </span>
            </div>
            <p className="text-slate-300 text-sm">{details}</p>
          </div>
        )}

        <AlertDialogFooter className="mt-6">
          <AlertDialogAction asChild>
            <Button 
              onClick={onClose}
              className={`w-full ${
                isViolation 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-amber-500 hover:bg-amber-600'
              } text-white`}
            >
              {isViolation ? 'I Understand' : 'Continue Trading'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}