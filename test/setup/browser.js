/** @import { Page } from '@playwright/test'; */

/**
 * Resets the browser page.
 * @param {Page} page The Playwright page.
 * @returns {Promise<void>} The promise.
 */
export async function resetPage(page) {
    await page.goto('/', {
        waitUntil: 'domcontentloaded',
    });

    const initialized = await page.evaluate((_) => {
        if (!window.fQuery || !window.UI?.PasswordStrength) {
            return false;
        }

        window.$ = window.fQuery;

        return window.$ === window.fQuery &&
            typeof $.QuerySet.prototype.passwordstrength === 'function';
    });

    if (!initialized) {
        throw new Error('Failed to initialize PasswordStrength on the test page.');
    }

    await page.waitForFunction((_) => {
        const test = $.create('div', { class: 'text-center' });
        $.append(document.body, test);
        const ready = $.css(test, 'text-align') === 'center';
        $.remove(test);
        return ready;
    });
}
