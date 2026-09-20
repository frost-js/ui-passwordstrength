import { expect, test } from '#test';

test.describe('PasswordStrength forms', () => {
    test.describe('reset', () => {
        test.beforeEach(async ({ page }) => {
            await page.clock.install({ time: 0 });
            await page.clock.pauseAt(1000);
            await page.evaluate((_) => {
                document.body.innerHTML = '<form id="form"><div id="field"><input id="password" type="password" value="A1!"></div></form>';
                window.passwordStrengthResetCalls = 0;
                UI.PasswordStrength.init($.findOne('#password'), {
                    scorer: (value) => {
                        window.passwordStrengthResetCalls++;
                        return UI.PasswordStrength.getStrength(value);
                    },
                });
            });
        });

        for (const { initial, current, score, text } of [
            { initial: '', current: 'CorrectHorseBatteryStaple', score: 0, text: 'Very Weak' },
            { initial: 'A1!', current: 'CorrectHorseBatteryStaple', score: 14, text: 'Very Weak' },
            { initial: 'CorrectHorseBatteryStaple', current: 'password', score: 100, text: 'Very Strong' },
        ]) {
            test(`refreshes after resetting to ${initial || 'empty'}`, async ({ page }) => {
                await page.evaluate(({ initial, current }) => {
                    const password = $.findOne('#password');
                    password.defaultValue = initial;
                    $.setValue(password, current);
                    $.triggerEvent(password, 'input');
                    document.querySelector('#form').reset();
                }, { initial, current });
                await page.clock.runFor(1);

                await expect(page.locator('#password')).toHaveValue(initial);
                const progressBar = page.locator('.progress-bar');
                await expect(progressBar).toHaveAttribute('aria-valuenow', `${score}`);
                await expect(progressBar).toHaveAttribute('style', `width: ${score}%;`);
                await expect(progressBar).toHaveText(text);
            });
        }

        test('handles an input associated with an external form', async ({ page }) => {
            await page.evaluate((_) => {
                $.append(document.body, '<div id="field2"><input id="password2" form="form" value="CorrectHorseBatteryStaple"></div>');
                UI.PasswordStrength.init($.findOne('#password2'));
                $.setValue('#password2', 'password');
                $.triggerEvent('#password2', 'input');
                document.querySelector('#form').reset();
            });
            await page.clock.runFor(1);

            await expect(page.locator('#password2')).toHaveValue('CorrectHorseBatteryStaple');
            await expect(page.locator('#field2 .progress-bar')).toHaveAttribute('aria-valuenow', '100');
        });

        test('does not refresh when reset is canceled', async ({ page }) => {
            await page.locator('#password').fill('CorrectHorseBatteryStaple');
            await page.evaluate((_) => {
                window.passwordStrengthResetCalls = 0;
                const form = document.querySelector('#form');
                form.addEventListener('reset', (event) => event.preventDefault());
                form.reset();
            });
            await page.clock.runFor(1);

            await expect(page.locator('#password')).toHaveValue('CorrectHorseBatteryStaple');
            await expect(page.locator('.progress-bar')).toHaveAttribute('aria-valuenow', '100');
            expect(await page.evaluate((_) => window.passwordStrengthResetCalls)).toBe(0);
        });

        test('finishes a reset when a later reset is canceled', async ({ page }) => {
            await page.locator('#password').fill('CorrectHorseBatteryStaple');
            await page.evaluate((_) => {
                const form = document.querySelector('#form');
                form.reset();
                form.addEventListener('reset', (event) => event.preventDefault(), { once: true });
                form.reset();
            });
            await page.clock.runFor(1);

            await expect(page.locator('#password')).toHaveValue('A1!');
            await expect(page.locator('.progress-bar')).toHaveAttribute('aria-valuenow', '14');
            await expect(page.locator('.progress-bar')).toHaveText('Very Weak');
        });

        test('ignores a pending reset after disposal', async ({ page }) => {
            const errors = [];
            page.on('pageerror', (error) => errors.push(error.message));
            await page.evaluate((_) => {
                window.passwordStrengthResetCalls = 0;
                document.querySelector('#form').reset();
                $.getData('#password', 'passwordstrength').dispose();
            });
            await page.clock.runFor(1);

            await expect(page.locator('.progress')).toHaveCount(0);
            expect(await page.evaluate((_) => window.passwordStrengthResetCalls)).toBe(0);
            expect(errors).toEqual([]);
        });

        test('keeps other instances subscribed when one is disposed', async ({ page }) => {
            await page.evaluate((_) => {
                $.append('#form', '<div id="field2"><input id="password2" value="CorrectHorseBatteryStaple"></div>');
                UI.PasswordStrength.init($.findOne('#password2'));
                $.setValue('#password2', 'password');
                $.triggerEvent('#password2', 'input');
                $.getData('#password', 'passwordstrength').dispose();
                document.querySelector('#form').reset();
            });
            await page.clock.runFor(1);

            await expect(page.locator('#field .progress')).toHaveCount(0);
            await expect(page.locator('#password2')).toHaveValue('CorrectHorseBatteryStaple');
            await expect(page.locator('#field2 .progress-bar')).toHaveAttribute('aria-valuenow', '100');
            await expect(page.locator('#field2 .progress-bar')).toHaveText('Very Strong');
        });
    });
});
