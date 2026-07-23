/* ============================================================================
 * Lunar Festival Check (lunar-check.js)
 * ============================================================================
 * Lightweight hardcoded lunar calendar lookup to avoid massive dependencies.
 * Checks for New Year, Lunar New Year's Eve, Lunar Jan 1-3, and Lunar Jan 15.
 * ============================================================================ */

function isFireworksFestival() {
    const today = new Date();
    
    // Check hash for forced test mode
    if (window.location.hash.includes('celebration')) {
        return true;
    }

    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const date = today.getDate();

    // 1. Gregorian New Year (Jan 1)
    if (month === 1 && date === 1) {
        return true;
    }

    // 2. Lunar Dates (Hardcoded Spring Festival dates 2024-2038)
    const lunarNewYears = {
        2024: '2024-02-10', 2025: '2025-01-29', 2026: '2026-02-17',
        2027: '2027-02-06', 2028: '2028-01-26', 2029: '2029-02-13',
        2030: '2030-02-03', 2031: '2031-01-23', 2032: '2032-02-11',
        2033: '2033-01-31', 2034: '2034-02-19', 2035: '2035-02-08',
        2036: '2036-01-28', 2037: '2037-02-15', 2038: '2038-02-04'
    };

    const lnyString = lunarNewYears[year];
    if (!lnyString) return false;

    // Create dates localized at midnight to avoid timezone shift issues
    const todayMidnight = new Date(year, month - 1, date).getTime();
    
    // Parse LNY string locally
    const [lnyY, lnyM, lnyD] = lnyString.split('-').map(Number);
    const lnyDate = new Date(lnyY, lnyM - 1, lnyD).getTime();

    const dayInMs = 24 * 60 * 60 * 1000;
    const diffDays = Math.round((todayMidnight - lnyDate) / dayInMs);

    // diffDays mapping:
    // -1 : Lunar Eve (除夕)
    //  0 : Lunar Jan 1 (初一)
    //  1 : Lunar Jan 2 (初二)
    //  2 : Lunar Jan 3 (初三)
    // 14 : Lunar Jan 15 (十五)
    
    const validOffsets = [-1, 0, 1, 2, 14];
    return validOffsets.includes(diffDays);
}

// Global exposure
window.isFireworksFestival = isFireworksFestival;
