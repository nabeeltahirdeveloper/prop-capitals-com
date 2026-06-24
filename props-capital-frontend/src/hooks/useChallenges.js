import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getChallenges } from '@/api/challenges';

/**
 * The one fetch hook for the buyable challenge catalog. Every surface (public
 * /challenges, Home, trader + public Buy Challenge) uses this so they share a
 * single `['challenges']` query cache — one network request, one source of
 * truth. Pass react-query options through if a caller needs them.
 */
export function useChallenges(options = {}) {
  return useQuery({
    queryKey: ['challenges'],
    queryFn: getChallenges,
    ...options,
  });
}

/**
 * Shared "Custom €" behavior. Encapsulates the price input state, the 1–1000
 * validation, the account-size derivation (price × 100) and the navigation to
 * the contact form — so the flow is identical on every surface that offers it.
 */
export function useCustomChallenge(initialPrice = '50') {
  const navigate = useNavigate();
  const [customPrice, setCustomPrice] = useState(initialPrice);

  const customPriceNumber = Number(customPrice);
  const isValid =
    Number.isFinite(customPriceNumber) &&
    customPriceNumber >= 1 &&
    customPriceNumber <= 1000;
  const customAccountSize = isValid ? Math.round(customPriceNumber * 100) : 0;

  const startCustomChallenge = () => {
    if (!isValid) return;
    const params = new URLSearchParams({
      subject: 'custom-challenge',
      price: String(customPriceNumber),
      accountSize: String(customAccountSize),
    });
    navigate(`/Contact?${params.toString()}`);
  };

  return {
    customPrice,
    setCustomPrice,
    customPriceNumber,
    isValid,
    customAccountSize,
    startCustomChallenge,
  };
}
