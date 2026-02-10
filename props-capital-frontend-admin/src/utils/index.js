
export function createPageUrl(pageName) {
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
}

export function getPlatform(account, fallback = 'MT5') {
    if (!account) return fallback;
    const challenge = account.challenge || {};


    // Prioritize account-level platform fields
    const platform = account.platform ||
        account.tradingPlatform ||
        account.trading_platform ||
        account.brokerPlatform;


    if (platform) return platform;

    // Fallback to challenge platform, but handle the 'MT5' default with caution
    const challengePlatform = challenge.platform || challenge.tradingPlatform;

    // If we have a challenge platform that isn't the suspicious default, or if it's all we have
    return challengePlatform || fallback;
}
