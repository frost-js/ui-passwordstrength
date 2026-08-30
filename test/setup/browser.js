/** @import { Page } from '@playwright/test'; */

/**
 * Resets the browser page and PasswordStrength defaults.
 * @param {Page} page The Playwright page.
 * @returns {Promise<void>} The promise.
 */
export async function resetPage(page) {
    await page.goto('/', {
        waitUntil: 'domcontentloaded',
    });

    const stateReset = await page.evaluate((_) => {
        if (!window.fQuery || !window.UI?.PasswordStrength) {
            return false;
        }

        window.$ = window.fQuery;

        UI.PasswordStrength.defaults.levels = [
            {
                score: 0,
                class: 'text-bg-danger',
                text: 'Very Weak',
            },
            {
                score: 20,
                class: 'text-bg-danger',
                text: 'Weak',
            },
            {
                score: 40,
                class: 'text-bg-warning',
                text: 'Normal',
            },
            {
                score: 60,
                class: 'text-bg-success',
                text: 'Strong',
            },
            {
                score: 80,
                class: 'text-bg-success',
                text: 'Very Strong',
            },
        ];
        UI.PasswordStrength.defaults.container = null;
        UI.PasswordStrength.defaults.striped = false;

        $.empty(document.body);

        return window.$ === window.fQuery &&
            typeof $.QuerySet.prototype.passwordstrength === 'function';
    });

    if (!stateReset) {
        throw new Error('Failed to restore PasswordStrength on the test page.');
    }

    await page.waitForFunction((_) => {
        const test = $.create('div', { class: 'text-center' });
        $.append(document.body, test);
        const ready = $.css(test, 'text-align') === 'center';
        $.remove(test);
        return ready;
    });
}
