/**
 * Translates notification titles and messages
 * @param {string} title - Notification title from backend
 * @param {string} body - Notification body/message from backend
 * @param {Function} t - Translation function from useTranslation hook
 * @returns {Object} - Translated title and message
 */
export function translateNotification(title, body, t) {
  // Default to original if translation function not provided
  if (!t) {
    return { title, message: body };
  }

  const titleLower = (title || '').toLowerCase();
  const bodyLower = (body || '').toLowerCase();

  // Extract dynamic values from body (percentages, amounts, account numbers)
  const extractPercentage = (text) => {
    const match = text.match(/(\d+\.?\d*)%/);
    return match ? match[1] : null;
  };

  const extractAmount = (text) => {
    const match = text.match(/\$([\d,]+\.?\d*)/);
    return match ? match[1] : null;
  };

  const extractAccountNumber = (text) => {
    const match = text.match(/#(\w+)/);
    return match ? match[1] : null;
  };

  // Translate title based on common patterns
  let translatedTitle = title;

  if (titleLower.includes('drawdown warning')) {
    translatedTitle = t('notifications.titles.drawdownWarning');
  } else if (titleLower.includes('payout approved')) {
    translatedTitle = t('notifications.titles.payoutApproved');
  } else if (titleLower.includes('payout rejected')) {
    translatedTitle = t('notifications.titles.payoutRejected');
  } else if (titleLower.includes('payout processed')) {
    translatedTitle = t('notifications.titles.payoutProcessed');
  } else if (titleLower.includes('phase 1 completed')) {
    translatedTitle = t('notifications.titles.phase1Completed');
  } else if (titleLower.includes('phase 2 completed')) {
    translatedTitle = t('notifications.titles.phase2Completed');
  } else if (titleLower.includes('account violation') || titleLower.includes('rule violation')) {
    translatedTitle = t('notifications.titles.accountViolation');
  } else if (titleLower.includes('account failed') || titleLower.includes('challenge failed')) {
    translatedTitle = t('notifications.titles.accountFailed');
  } else if (titleLower.includes('challenge purchased') || titleLower.includes('account created')) {
    translatedTitle = t('notifications.titles.challengePurchased');
  } else if (titleLower.includes('trading days milestone')) {
    translatedTitle = t('notifications.titles.tradingDaysMilestone');
  } else if (titleLower.includes('new challenge available')) {
    translatedTitle = t('notifications.titles.newChallengeAvailable');
  } else if (titleLower.includes('account scaling approved')) {
    translatedTitle = t('notifications.titles.accountScalingApproved');
  } else if (titleLower.includes('account scaling rejected')) {
    translatedTitle = t('notifications.titles.accountScalingRejected');
  } else if (titleLower.includes('account paused')) {
    translatedTitle = t('notifications.titles.accountPaused');
  } else if (titleLower.includes('account closed')) {
    translatedTitle = t('notifications.titles.accountClosed');
  } else if (titleLower.includes('account resumed')) {
    translatedTitle = t('notifications.titles.accountResumed');
  }

  // Translate message based on patterns
  let translatedMessage = body;
  let messageTranslated = false;

  // Drawdown warning messages (warning type)
  if (bodyLower.includes('daily drawdown') && bodyLower.includes('reached') && bodyLower.includes('manage your risk')) {
    const dailyPercent = extractPercentage(body);
    const accountNum = extractAccountNumber(body);
    const maxPercent = extractPercentage(bodyLower.split('maximum allowed is')[1] || '');
    if (dailyPercent && maxPercent) {
      translatedMessage = t('notifications.messages.dailyDrawdownWarning', {
        dailyPercent,
        accountNumber: accountNum || '',
        maxPercent
      });
      messageTranslated = true;
    }
  } else if (bodyLower.includes('overall drawdown') && bodyLower.includes('reached') && bodyLower.includes('manage your risk')) {
    const overallPercent = extractPercentage(body);
    const accountNum = extractAccountNumber(body);
    const maxPercent = extractPercentage(bodyLower.split('maximum allowed is')[1] || '');
    if (overallPercent && maxPercent) {
      translatedMessage = t('notifications.messages.overallDrawdownWarning', {
        overallPercent,
        accountNumber: accountNum || '',
        maxPercent
      });
      messageTranslated = true;
    }
  }
  // Account violation - daily drawdown (locked)
  else if (bodyLower.includes('daily drawdown') && bodyLower.includes('reached') && (bodyLower.includes('trading is locked') || bodyLower.includes('locked until'))) {
    const dailyPercent = extractPercentage(body);
    const accountNum = extractAccountNumber(body);
    const maxPercent = extractPercentage(bodyLower.split('maximum allowed is')[1] || '');
    if (dailyPercent && maxPercent) {
      translatedMessage = t('notifications.messages.dailyDrawdownViolation', {
        dailyPercent,
        accountNumber: accountNum || '',
        maxPercent
      });
      messageTranslated = true;
    }
  }
  // Account violation - overall drawdown (disqualified)
  else if (bodyLower.includes('overall drawdown') && bodyLower.includes('reached') && (bodyLower.includes('challenge disqualified') || bodyLower.includes('disqualified'))) {
    const overallPercent = extractPercentage(body);
    const accountNum = extractAccountNumber(body);
    const maxPercent = extractPercentage(bodyLower.split('maximum allowed is')[1] || '');
    if (overallPercent && maxPercent) {
      translatedMessage = t('notifications.messages.overallDrawdownViolation', {
        overallPercent,
        accountNumber: accountNum || '',
        maxPercent
      });
      messageTranslated = true;
    }
  }
  // Payout approved
  else if (bodyLower.includes('payout') && bodyLower.includes('approved')) {
    const amount = extractAmount(body);
    if (amount) {
      translatedMessage = t('notifications.messages.payoutApproved', { amount });
      messageTranslated = true;
    }
  }
  // Payout rejected
  else if (bodyLower.includes('payout') && bodyLower.includes('rejected')) {
    const amount = extractAmount(body);
    if (amount) {
      translatedMessage = t('notifications.messages.payoutRejected', { amount });
      messageTranslated = true;
    }
  }
  // Payout processed
  else if (bodyLower.includes('payout') && (bodyLower.includes('processed') || bodyLower.includes('transferred'))) {
    const amount = extractAmount(body);
    if (amount) {
      translatedMessage = t('notifications.messages.payoutProcessed', { amount });
      messageTranslated = true;
    }
  }
  // Phase 1 completed
  else if (bodyLower.includes('phase 1') && bodyLower.includes('completed')) {
    const accountSize = extractAmount(body);
    if (accountSize) {
      translatedMessage = t('notifications.messages.phase1Completed', { accountSize });
      messageTranslated = true;
    }
  }
  // Phase 2 completed
  else if (bodyLower.includes('phase 2') && bodyLower.includes('completed')) {
    const accountSize = extractAmount(body);
    if (accountSize) {
      translatedMessage = t('notifications.messages.phase2Completed', { accountSize });
      messageTranslated = true;
    }
  }
  // Trading days milestone - minimum requirement met
  else if (bodyLower.includes('trading days') && bodyLower.includes('minimum') && bodyLower.includes('requirement met')) {
    const tradingDays = body.match(/(\d+)\s+trading\s+days/)?.[1];
    const accountNum = extractAccountNumber(body);
    if (tradingDays) {
      translatedMessage = t('notifications.messages.tradingDaysMilestoneMet', {
        tradingDays,
        accountNumber: accountNum || ''
      });
      messageTranslated = true;
    }
  }
  // Trading days milestone - general milestone
  else if (bodyLower.includes('trading days') && (bodyLower.includes('keep up') || bodyLower.includes('great work'))) {
    const tradingDays = body.match(/(\d+)\s+trading\s+days/)?.[1];
    const accountNum = extractAccountNumber(body);
    if (tradingDays) {
      translatedMessage = t('notifications.messages.tradingDaysMilestone', {
        tradingDays,
        accountNumber: accountNum || ''
      });
      messageTranslated = true;
    }
  }
  // Challenge purchased
  else if (bodyLower.includes('challenge') && bodyLower.includes('purchased')) {
    const accountNum = extractAccountNumber(body);
    const startingBalance = extractAmount(body);
    if (accountNum && startingBalance) {
      // Extract challenge name if available
      const challengeMatch = body.match(/Your\s+(.+?)\s+challenge/);
      const challengeName = challengeMatch ? challengeMatch[1] : '';
      translatedMessage = t('notifications.messages.challengePurchased', {
        challengeName: challengeName || 'challenge',
        accountNumber: accountNum,
        startingBalance
      });
      messageTranslated = true;
    }
  }
  // Account scaling approved
  else if (bodyLower.includes('scaling') && bodyLower.includes('approved')) {
    const accountNum = extractAccountNumber(body);
    const oldBalance = extractAmount(body.split('increased from')[1]?.split('to')[0] || '');
    const newBalance = extractAmount(body.split('to $')[1] || '');
    if (accountNum && oldBalance && newBalance) {
      translatedMessage = t('notifications.messages.accountScalingApproved', {
        accountNumber: accountNum,
        oldBalance,
        newBalance
      });
      messageTranslated = true;
    }
  }
  // Account scaling rejected
  else if (bodyLower.includes('scaling') && bodyLower.includes('rejected')) {
    const accountNum = extractAccountNumber(body);
    if (accountNum) {
      translatedMessage = t('notifications.messages.accountScalingRejected', {
        accountNumber: accountNum
      });
      messageTranslated = true;
    }
  }
  // New challenge available
  else if (bodyLower.includes('new') && bodyLower.includes('challenge') && (bodyLower.includes('available') || bodyLower.includes('check out'))) {
    // Extract challenge name and account size
    const challengeMatch = body.match(/new\s+(.+?)\s+challenge/);
    const accountSizeMatch = body.match(/(\d{1,3}(?:,\d{3})*)\s+account\s+size/);
    const platformMatch = body.match(/on\s+(\w+)/);
    if (challengeMatch && accountSizeMatch) {
      let platformValue = (platformMatch && platformMatch[1] !== 'MT5') ? platformMatch[1] : (t('common.allPlatforms') || 'all platforms');
      translatedMessage = t('notifications.messages.newChallengeAvailable', {
        challengeName: challengeMatch[1],
        accountSize: accountSizeMatch[1],
        platform: platformValue
      });
      messageTranslated = true;
    }
  }
  // Generic account violation fallback
  else if (!messageTranslated && (bodyLower.includes('violation') || (bodyLower.includes('exceeded') && bodyLower.includes('drawdown')))) {
    const accountNum = extractAccountNumber(body);
    if (accountNum) {
      // Try to extract violation details
      const percentMatch = body.match(/(\d+\.?\d*)%/);
      const violationPercent = percentMatch ? percentMatch[1] : '';
      translatedMessage = t('notifications.messages.accountViolationGeneric', {
        accountNumber: accountNum,
        violationPercent: violationPercent ? ` (${violationPercent}%)` : ''
      });
      messageTranslated = true;
    }
  }
  // Account paused
  else if (!messageTranslated && bodyLower.includes('account') && bodyLower.includes('paused')) {
    const accountNum = extractAccountNumber(body);
    translatedMessage = t('notifications.messages.accountPaused', { accountNumber: accountNum || '' });
    messageTranslated = true;
  }
  // Account closed
  else if (!messageTranslated && bodyLower.includes('account') && bodyLower.includes('closed')) {
    const accountNum = extractAccountNumber(body);
    translatedMessage = t('notifications.messages.accountClosed', { accountNumber: accountNum || '' });
    messageTranslated = true;
  }
  // Account resumed
  else if (!messageTranslated && bodyLower.includes('account') && bodyLower.includes('resumed')) {
    const accountNum = extractAccountNumber(body);
    translatedMessage = t('notifications.messages.accountResumed', { accountNumber: accountNum || '' });
    messageTranslated = true;
  }

  // If message wasn't translated but title was, try a generic approach
  // This handles cases where the message format might be slightly different
  if (!messageTranslated && translatedTitle !== title) {
    // For now, keep original message if we can't match the pattern
    // This ensures we don't lose information
  }

  return {
    title: translatedTitle,
    message: translatedMessage
  };
}

