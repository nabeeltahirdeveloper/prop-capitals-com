import React, { useEffect, useState } from 'react';
import { useChallenges } from '@/contexts/ChallengesContext';
import CommonTerminalWrapper from './CommonTerminalWrapper';
import MT5TradingArea from './MT5TradingArea';
import BybitTerminal from './BybitTerminal';
import TradeLockerComingSoon from './TradeLockerComingSoon';
import PT5Terminal from '@/pages/TradingTerminal';
import MT5Login from './MT5Login';
import { useToast } from '@/components/ui/use-toast';
import {
  processPlatformLogin,
  resetPlatformPassword,
  validatePlatformAccess,
} from '@/api/auth';
import { usePlatformTokensStore } from '@/lib/stores/platform-tokens.store';

const MT5TerminalContent = ({ selectedChallenge }) => {
  return (
    <CommonTerminalWrapper>
      <MT5TradingArea selectedChallenge={selectedChallenge} />
    </CommonTerminalWrapper>
  );
};

const MT5Terminal = () => {
  const { selectedChallenge, loading } = useChallenges();
  const { toast } = useToast();

  const accountId = selectedChallenge?.id;
  const platformToken = usePlatformTokensStore(
    (state) => (accountId ? state.platformTokens?.[accountId] : null)
  );
  const setPlatfromToken = usePlatformTokensStore(
    (state) => state.setPlatfromToken
  );
  const clearPlatfromToken = usePlatformTokensStore(
    (state) => state.clearPlatfromToken
  );

  const [isTokenChecking, setIsTokenChecking] = useState(false);
  const [hasValidPlatformAccess, setHasValidPlatformAccess] = useState(false);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  useEffect(() => {
    let isActive = true;

    if (loading || !accountId) {
      setIsTokenChecking(false);
      setHasValidPlatformAccess(false);
      return () => {
        isActive = false;
      };
    }

    if (!platformToken) {
      setIsTokenChecking(false);
      setHasValidPlatformAccess(false);
      return () => {
        isActive = false;
      };
    }

    setHasValidPlatformAccess(false);
    setIsTokenChecking(true);

    validatePlatformAccess(accountId, platformToken)
      .then(() => {
        if (!isActive) return;
        setHasValidPlatformAccess(true);
      })
      .catch(() => {
        if (!isActive) return;
        clearPlatfromToken(accountId);
        setHasValidPlatformAccess(false);
      })
      .finally(() => {
        if (isActive) {
          setIsTokenChecking(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [accountId, clearPlatfromToken, loading, platformToken]);

  const handlePlatformLogin = async (email, password) => {
    if (!accountId) return;

    setIsSubmittingLogin(true);
    try {
      const response = await processPlatformLogin(accountId, email, password);
      const nextPlatformToken = response?.platformToken;

      if (!nextPlatformToken) {
        throw new Error('No platform access token received');
      }

      setPlatfromToken(accountId, nextPlatformToken);
      setHasValidPlatformAccess(true);

      toast({
        title: 'MT5 connected',
        description: 'Platform access granted for this account.',
      });
    } catch (error) {
      toast({
        title: 'MT5 login failed',
        description:
          error?.message || 'Unable to login to MT5 for this account.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!accountId) return;

    setIsSendingReset(true);
    try {
      const response = await resetPlatformPassword(accountId);
      toast({
        title: 'Reset sent',
        description:
          response?.message || 'A new platform password was sent to your email.',
      });
    } catch (error) {
      toast({
        title: 'Reset failed',
        description: error?.message || 'Unable to reset platform password.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  if (loading || !selectedChallenge) {
    return <MT5TerminalContent selectedChallenge={selectedChallenge} />;
  }

  if (isTokenChecking) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-amber-500" />
          <p className="text-sm text-slate-500">Validating MT5 access...</p>
        </div>
      </div>
    );
  }

  if (!hasValidPlatformAccess) {
    return (
      <MT5Login
        onPlatformLogin={handlePlatformLogin}
        onPasswordReset={handlePasswordReset}
        isSubmitting={isSubmittingLogin}
        isResetting={isSendingReset}
      />
    );
  }

  return <MT5TerminalContent selectedChallenge={selectedChallenge} />;
};

const BybitTerminalWrapper = () => {
  const { selectedChallenge } = useChallenges();

  return (
    <CommonTerminalWrapper>
      <BybitTerminal selectedChallenge={selectedChallenge} />
    </CommonTerminalWrapper>
  );
};

const PT5TerminalWrapper = () => {
  return (
    <CommonTerminalWrapper>
      <PT5Terminal />
    </CommonTerminalWrapper>
  );
};

const TradingTerminal = () => {
  const { selectedChallenge } = useChallenges();

  const platform = (selectedChallenge?.platform || 'mt5').toLowerCase();

  switch (platform) {
    case 'tradelocker':
      return <TradeLockerComingSoon />;
    case 'bybit':
      return <BybitTerminalWrapper />;
    case 'pt5':
      return <PT5TerminalWrapper />;
    case 'mt5':
    default:
      return <MT5Terminal />;
  }
};

export default TradingTerminal;
