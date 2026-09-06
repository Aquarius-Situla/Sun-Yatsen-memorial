/* ============================================================================
 * Private Sun Yat-sen Memorial Hall — Calendar & Festivals Module (calendar.js)
 * ============================================================================
 * COMMENTING STANDARDS
 * 1. Block comments only. Inline comments (//) are strictly prohibited.
 * 2. Section dividers use the === banner format.
 * 3. All prose is written in English.
 * ============================================================================ */

import { SPECIAL_MEMORIAL_DAYS } from './audio-player.js';
import { isMobileLayout } from './device-detect.js?v=20260907b';

/* ============================================================================
 * Republic of China Calendar Formatting
 * ============================================================================ */
export function displayMinguoDate(targetEl) {
    if (!targetEl) targetEl = document.getElementById('minguo-date-display');
    if (!targetEl) return;

    const now        = new Date();
    const minguoYear = now.getFullYear() - 1911;
    const month      = now.getMonth() + 1;
    const date       = now.getDate();
    const days       = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const dayOfWeek  = days[now.getDay()];

    targetEl.innerText = `中華民國 ${minguoYear} 年 ${month} 月 ${date} 日 (${dayOfWeek})`;
}

/* ============================================================================
 * Festival Banner & Mode Resolution
 * ============================================================================ */
export function initFestivalBanner(navBannerEl, onFestivalTrigger) {
    if (!navBannerEl) return;

    const url          = window.location.href.toLowerCase();
    const now          = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDate  = now.getDate();
    const currentYear  = now.getFullYear();

    let bannerText   = '';
    let isFestival   = false;
    let festivalPage = '';

    /* Highest Priority: URL Routing */
    for (const item of SPECIAL_MEMORIAL_DAYS) {
        if (url.includes(item.urlKeyword.toLowerCase())) {
            bannerText   = item.getBanner(currentYear, item.dates[0]);
            isFestival   = true;
            festivalPage = item.festivalPage || '';
            break;
        }
    }

    /* Secondary Priority: Current Date Matching */
    if (!isFestival) {
        for (const item of SPECIAL_MEMORIAL_DAYS) {
            for (const d of item.dates) {
                if (d.month === currentMonth && d.date === currentDate) {
                    bannerText   = item.getBanner(currentYear, d);
                    isFestival   = true;
                    festivalPage = item.festivalPage || '';
                    break;
                }
            }
            if (isFestival) break;
        }
    }

    if (isFestival && bannerText) {
        navBannerEl.innerText = bannerText;
        document.body.classList.add('has-festival');

        /* Elevate the banner to an accessible link if a festival page exists */
        if (festivalPage) {
            navBannerEl.style.cursor = 'pointer';
            navBannerEl.setAttribute('role',       'link');
            navBannerEl.setAttribute('tabindex',   '0');
            navBannerEl.setAttribute('aria-label', `${bannerText}——點擊了解更多`);
            navBannerEl.setAttribute('data-href', festivalPage);
            navBannerEl.addEventListener('click',   (e) => {
                if (isMobileLayout() && typeof window.__triggerMobileNav === 'function') {
                    e.preventDefault();
                    window.__triggerMobileNav(festivalPage, 'library');
                    return;
                }
                window.location.href = festivalPage;
            });
            navBannerEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (isMobileLayout() && typeof window.__triggerMobileNav === 'function') {
                        window.__triggerMobileNav(festivalPage, 'library');
                        return;
                    }
                    window.location.href = festivalPage;
                }
            });
        }

        if (typeof onFestivalTrigger === 'function') {
            onFestivalTrigger();
        }
    } else {
        navBannerEl.innerText = '';
        document.body.classList.remove('has-festival');
    }

    /* Developer testing hook via URL hash */
    if (window.location.hash.includes('celebration') && typeof onFestivalTrigger === 'function') {
        onFestivalTrigger();
    }
}
