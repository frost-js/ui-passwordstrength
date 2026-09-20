import { expect, test } from '#test';
import { resetPage } from '../setup/browser.js';

test.beforeEach(async ({ page }) => {
    await resetPage(page);
});

test.describe('PasswordStrength', () => {
    test.beforeEach(async ({ page }) => {
        await page.evaluate((_) => {
            $.setHtml(
                document.body,
                '<div id="field"><div class="form-input"><input id="password" value="A1!"></div></div>' +
                    '<div id="target"></div>' +
                    '<div id="field2"><input id="password2"></div>',
            );
        });
    });

    test.describe('#init', () => {
        test('creates a PasswordStrength', async ({ page }) => {
            expect(await page.evaluate((_) => {
                const password = $.findOne('#password');
                return UI.PasswordStrength.init(password) instanceof UI.PasswordStrength;
            })).toBe(true);
        });

        test('creates a PasswordStrength (query)', async ({ page }) => {
            expect(await page.evaluate((_) =>
                $('#password').passwordstrength() instanceof UI.PasswordStrength)).toBe(true);
        });

        test('creates multiple PasswordStrengths (query)', async ({ page }) => {
            expect(await page.evaluate((_) => {
                $('input').passwordstrength();
                return ['#password', '#password2'].every((selector) =>
                    $.getData(selector, 'passwordstrength') instanceof UI.PasswordStrength,
                );
            })).toBe(true);
        });

        test('returns the first PasswordStrength (query)', async ({ page }) => {
            expect(await page.evaluate((_) => {
                const passwordStrength = $('input').passwordstrength();
                return passwordStrength === $.getData('#password', 'passwordstrength');
            })).toBe(true);
        });

        test('reuses an existing PasswordStrength', async ({ page }) => {
            expect(await page.evaluate((_) => {
                const password = $.findOne('#password');
                const first = UI.PasswordStrength.init(password, { striped: true });
                const second = UI.PasswordStrength.init(password, { striped: false });
                return first === second;
            })).toBe(true);
            await expect(page.locator('#field .progress')).toHaveCount(1);
            await expect(page.locator('.progress-bar'))
                .toHaveClass(/\bprogress-bar-striped\b/);
        });

        test('exposes frozen default options', async ({ page }) => {
            expect(await page.evaluate((_) => {
                const password = $.findOne('#password');
                const passwordStrength = UI.PasswordStrength.init(password);
                return {
                    commonPasswords: passwordStrength.options.commonPasswords,
                    container: passwordStrength.options.container,
                    frozen: Object.isFrozen(passwordStrength.options),
                    levels: passwordStrength.options.levels,
                    node: passwordStrength.node === password,
                    scorer: passwordStrength.options.scorer ===
                        UI.PasswordStrength.defaults.scorer,
                    striped: passwordStrength.options.striped,
                };
            })).toEqual({
                commonPasswords: [
                    '123456',
                    '12345678',
                    '123456789',
                    '1234567890',
                    '000000',
                    '111111',
                    'abc123',
                    'admin',
                    'dragon',
                    'iloveyou',
                    'letmein',
                    'monkey',
                    'password',
                    'password1',
                    'password123',
                    'qwerty',
                    'qwerty123',
                    'welcome',
                ],
                container: null,
                frozen: true,
                levels: [
                    { class: 'text-bg-danger', score: 0, text: 'Very Weak' },
                    { class: 'text-bg-danger', score: 20, text: 'Weak' },
                    { class: 'text-bg-warning', score: 40, text: 'Normal' },
                    { class: 'text-bg-success', score: 60, text: 'Strong' },
                    { class: 'text-bg-success', score: 80, text: 'Very Strong' },
                ],
                node: true,
                scorer: true,
                striped: false,
            });
        });

        test('renders the initial strength', async ({ page }) => {
            await page.evaluate((_) => {
                UI.PasswordStrength.init($.findOne('#password'));
            });

            const password = page.locator('#password');
            const progress = page.locator('.progress');
            const progressBar = page.locator('.progress-bar');

            await expect(progress).toHaveClass('progress mt-2');
            await expect(progressBar).toHaveClass('progress-bar text-bg-danger');
            await expect(progressBar).toHaveAttribute('aria-valuemax', '100');
            await expect(progressBar).toHaveAttribute('aria-valuemin', '0');
            await expect(progressBar).toHaveAttribute('aria-valuenow', '14');
            await expect(progressBar).toHaveAttribute('id', /^password-strength/);
            await expect(progressBar).toHaveAttribute('role', 'progressbar');
            await expect(progressBar).toHaveAttribute('style', 'width: 14%;');
            await expect(progressBar).toHaveText('Very Weak');

            const progressId = await progressBar.getAttribute('id');
            await expect(password).toHaveAttribute('aria-describedby', progressId);
        });

        test('appends the generated ID to aria-describedby', async ({ page }) => {
            await page.evaluate((_) => {
                const password = $.findOne('#password');
                $.setAttribute(password, { 'aria-describedby': 'hint error' });
                UI.PasswordStrength.init(password);
            });

            const progressId = await page.locator('.progress-bar').getAttribute('id');
            await expect(page.locator('#password'))
                .toHaveAttribute('aria-describedby', `hint error ${progressId}`);
        });
    });

    test.describe('#dispose', () => {
        test('removes the PasswordStrength and generated markup', async ({ page }) => {
            const state = await page.evaluate((_) => {
                const password = $.findOne('#password');
                const passwordStrength = UI.PasswordStrength.init(password);
                passwordStrength.dispose();
                return {
                    hasData: $.hasData(password, 'passwordstrength'),
                    node: passwordStrength.node,
                    options: passwordStrength.options,
                };
            });

            expect(state).toEqual({
                hasData: false,
                node: null,
                options: null,
            });
            await expect(page.locator('#password')).not.toHaveAttribute('aria-describedby');
            await expect(page.locator('.progress')).toHaveCount(0);
        });

        test('restores existing aria-describedby state', async ({ page }) => {
            await page.evaluate((_) => {
                const password = $.findOne('#password');
                $.setAttribute(password, { 'aria-describedby': 'hint error' });
                const passwordStrength = UI.PasswordStrength.init(password);
                passwordStrength.dispose();
            });

            await expect(page.locator('#password'))
                .toHaveAttribute('aria-describedby', 'hint error');
        });

        test('restores empty and absent aria-describedby state', async ({ page }) => {
            await page.evaluate((_) => {
                const password = $.findOne('#password');
                const password2 = $.findOne('#password2');
                $.setAttribute(password, { 'aria-describedby': '' });
                const first = UI.PasswordStrength.init(password);
                const second = UI.PasswordStrength.init(password2);
                first.dispose();
                second.dispose();
            });

            await expect(page.locator('#password')).toHaveAttribute('aria-describedby', '');
            await expect(page.locator('#password2')).not.toHaveAttribute('aria-describedby');
        });

        test('removes the input event handler', async ({ page }) => {
            expect(await page.evaluate((_) => {
                const password = $.findOne('#password');
                const passwordStrength = UI.PasswordStrength.init(password);
                let calls = 0;
                passwordStrength.getStrength = (_) => {
                    calls++;
                    return 100;
                };
                passwordStrength.dispose();
                $.triggerEvent(password, 'input');
                return calls;
            })).toBe(0);
        });

        test('removes the PasswordStrength (query)', async ({ page }) => {
            expect(await page.evaluate((_) => {
                $('#password').passwordstrength();
                $('#password').passwordstrength('dispose');
                return $.hasData('#password', 'passwordstrength');
            })).toBe(false);
        });
    });

    test.describe('#getStrength', () => {
        test('gets the password strength', async ({ page }) => {
            expect(await page.evaluate((_) => {
                const passwordStrength = UI.PasswordStrength.init($.findOne('#password'));
                return passwordStrength.getStrength();
            })).toBe(14);
        });

        test('gets the password strength (query)', async ({ page }) => {
            expect(await page.evaluate((_) =>
                $('#password').passwordstrength('getStrength'))).toBe(14);
        });
    });

    test.describe('.getStrength', () => {
        test('returns representative scores', async ({ page }) => {
            expect(await page.evaluate((_) => [
                '',
                'password',
                'password123',
                'Password1!',
                'p@ssw0rd1!',
                'a',
                '😀',
                'aa',
                'abab',
                'A1!',
                'aA1!',
                'aBcD123!',
                '😀Password1!',
                'CorrectHorseBatteryStaple',
            ].map((password) => [
                password,
                UI.PasswordStrength.getStrength(password),
            ]))).toEqual([
                ['', 0],
                ['password', 0],
                ['password123', 0],
                ['Password1!', 5],
                ['p@ssw0rd1!', 5],
                ['a', 1],
                ['😀', 1],
                ['aa', 0],
                ['abab', 6],
                ['A1!', 14],
                ['aA1!', 19],
                ['aBcD123!', 32],
                ['😀Password1!', 5],
                ['CorrectHorseBatteryStaple', 100],
            ]);
        });

        test('penalizes repeated characters and patterns', async ({ page }) => {
            expect(await page.evaluate((_) => ({
                consecutive: UI.PasswordStrength.getStrength('aaaaaa'),
                longConsecutive: UI.PasswordStrength.getStrength(
                    '11111111111111111111',
                ),
                repeated: UI.PasswordStrength.getStrength('abab'),
                repeatedPattern: UI.PasswordStrength.getStrength('abcabcabc'),
            }))).toEqual({
                consecutive: 0,
                longConsecutive: 0,
                repeated: 6,
                repeatedPattern: 10,
            });
        });

        test('penalizes sequences and keyboard patterns', async ({ page }) => {
            expect(await page.evaluate((_) => ({
                letters: UI.PasswordStrength.getStrength('abcd'),
                nonSequentialLetters: UI.PasswordStrength.getStrength('abxd'),
                nonSequentialNumbers: UI.PasswordStrength.getStrength('1245'),
                numbers: UI.PasswordStrength.getStrength('1234'),
                reverseLetters: UI.PasswordStrength.getStrength('dcba'),
                reverseNumbers: UI.PasswordStrength.getStrength('4321'),
                row: UI.PasswordStrength.getStrength('asdfgh'),
                unrelated: UI.PasswordStrength.getStrength('afkpuz'),
            }))).toEqual({
                letters: 11,
                nonSequentialLetters: 15,
                nonSequentialNumbers: 15,
                numbers: 11,
                reverseLetters: 11,
                reverseNumbers: 11,
                row: 14,
                unrelated: 20,
            });
        });

        test('clamps fully predictable passwords between zero and fifteen', async ({ page }) => {
            expect(await page.evaluate((_) =>
                [12, 48, 50, 60, 100].map((length) =>
                    UI.PasswordStrength.getStrength('a'.repeat(length) + 'b'.repeat(length)),
                )))
                .toEqual([15, 4, 0, 0, 0]);
        });

        test('uses length as the primary strength factor', async ({ page }) => {
            expect(await page.evaluate((_) => [
                'gT7!',
                'gT7!mQ2#',
                'gT7!mQ2#vR4^',
                'gT7!mQ2#vR4^xP9%',
                'gT7!mQ2#vR4^xP9%kN6&',
                'gT7!mQ2#vR4^xP9%kN6&cH8*',
            ].map((password) => UI.PasswordStrength.getStrength(password))))
                .toEqual([19, 39, 66, 86, 96, 100]);
        });

        test('recognizes boundary substitutions and decorations in common passwords', async ({ page }) => {
            expect(await page.evaluate((_) => [
                ['@dministrator', 'administrator'],
                ['$ecret', 'secret'],
                ['acces$', 'access'],
                ['@password!', 'password'],
                ['p@ssw0rd1!', 'password'],
            ].map(([password, commonPassword]) =>
                UI.PasswordStrength.getStrength(password, [commonPassword]),
            )))
                .toEqual([5, 5, 5, 5, 5]);
        });

        test('recognizes combined boundary substitutions and decorations', async ({ page }) => {
            expect(await page.evaluate((_) => [
                ['@dministrator!', 'administrator'],
                ['!@dministrator', 'administrator'],
                ['!@dministrator!', 'administrator'],
                ['@dministrator1', 'administrator'],
                ['!@dministrator1!', 'administrator'],
                ['@dministrator123!', 'administrator'],
                ['123@dministrator!', 'administrator'],
                ['$ecret!', 'secret'],
                ['!acces$', 'access'],
                ['!acces$!', 'access'],
                ['!acces$123!', 'access'],
            ].map(([password, commonPassword]) =>
                UI.PasswordStrength.getStrength(password, [commonPassword]),
            )))
                .toEqual([5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]);
        });

        test('works with a custom common-password list', async ({ page }) => {
            expect(await page.evaluate((_) => ({
                defaultList: UI.PasswordStrength.getStrength('FrostJS'),
                emptyList: UI.PasswordStrength.getStrength('password', []),
                customList: UI.PasswordStrength.getStrength(
                    'FrostJS',
                    ['frostjs'],
                ),
            }))).toEqual({
                defaultList: 32,
                emptyList: 39,
                customList: 0,
            });
        });
    });

    test.describe('events', () => {
        test('refreshes when the password changes', async ({ page }) => {
            await page.evaluate((_) => {
                UI.PasswordStrength.init($.findOne('#password'));
            });

            const password = page.locator('#password');
            const progressBar = page.locator('.progress-bar');

            await expect(progressBar).toHaveAttribute('aria-valuenow', '14');
            await expect(progressBar).toHaveAttribute('style', 'width: 14%;');
            await expect(progressBar).toHaveText('Very Weak');

            await password.fill('CorrectHorseBatteryStaple');

            await expect(progressBar).toHaveAttribute('aria-valuenow', '100');
            await expect(progressBar).toHaveAttribute('style', 'width: 100%;');
            await expect(progressBar).toHaveText('Very Strong');
        });
    });

    test.describe('form reset', () => {
        test.beforeEach(async ({ page }) => {
            await page.clock.install({ time: 0 });
            await page.clock.pauseAt(1000);
            await page.evaluate((_) => {
                $.setHtml(document.body, '<form id="form"><div id="field"><input id="password" type="password" value="A1!"></div></form>');
                window.passwordStrengthResetCalls = 0;
                UI.PasswordStrength.init($.findOne('#password'), {
                    scorer: (value) => {
                        window.passwordStrengthResetCalls++;
                        return UI.PasswordStrength.getStrength(value);
                    },
                });
            });
        });

        for (const { initial, score, text } of [
            { initial: '', score: 0, text: 'Very Weak' },
            { initial: 'A1!', score: 14, text: 'Very Weak' },
            { initial: 'CorrectHorseBatteryStaple', score: 100, text: 'Very Strong' },
        ]) {
            test(`refreshes after resetting to ${initial || 'empty'}`, async ({ page }) => {
                await page.evaluate(({ initial, score }) => {
                    const password = $.findOne('#password');
                    password.defaultValue = initial;
                    $.setValue(password, score === 100 ? 'password' : 'CorrectHorseBatteryStaple');
                    $.triggerEvent(password, 'input');
                    document.querySelector('#form').reset();
                }, { initial, score });
                await page.clock.runFor(1);

                await expect(page.locator('#password')).toHaveValue(initial);
                const progressBar = page.locator('.progress-bar');
                await expect(progressBar).toHaveAttribute('aria-valuenow', `${score}`);
                await expect(progressBar).toHaveAttribute('style', `width: ${score}%;`);
                await expect(progressBar).toHaveText(text);
            });
        }

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
    });

    test.describe('commonPasswords option', () => {
        for (const source of ['options', 'data attributes']) {
            test(`replaces common-password arrays from ${source}`, async ({ page }) => {
                expect(await page.evaluate((source) =>
                    [['projectsecret'], []].map((commonPasswords, index) => {
                        const password = $.findOne(index ? '#password2' : '#password');
                        $.setValue(password, 'password');

                        if (source === 'data attributes') {
                            $.setDataset(password, { uiCommonPasswords: commonPasswords });
                        }

                        const instance = UI.PasswordStrength.init(
                            password,
                            source === 'options' ? { commonPasswords } : undefined,
                        );

                        return {
                            commonPasswords: instance.options.commonPasswords,
                            score: instance.getStrength(),
                        };
                    }), source)).toEqual([
                    { commonPasswords: ['projectsecret'], score: 39 },
                    { commonPasswords: [], score: 39 },
                ]);
            });
        }

        test('works with commonPasswords option', async ({ page }) => {
            await page.evaluate((_) => {
                const password = $.findOne('#password');
                $.setValue(password, 'ProjectSecret');
                UI.PasswordStrength.init(password, {
                    commonPasswords: ['projectsecret'],
                });
            });

            await expect(page.locator('.progress-bar'))
                .toHaveAttribute('aria-valuenow', '0');
        });

        test('works with commonPasswords option (data-ui-common-passwords)', async ({ page }) => {
            await page.evaluate((_) => {
                const password = $.findOne('#password');
                $.setValue(password, 'ProjectSecret');
                $.setDataset(password, {
                    uiCommonPasswords: ['projectsecret'],
                });
                UI.PasswordStrength.init(password);
            });

            await expect(page.locator('.progress-bar'))
                .toHaveAttribute('aria-valuenow', '0');
        });
    });

    test.describe('scorer option', () => {
        test('works with scorer option', async ({ page }) => {
            await page.evaluate((_) => {
                const password = $.findOne('#password');
                UI.PasswordStrength.init(password, {
                    commonPasswords: [
                        ...UI.PasswordStrength.defaults.commonPasswords,
                        'projectsecret',
                    ],
                    scorer: (value, commonPasswords) => {
                        window.passwordStrengthScorerArguments = {
                            commonPassword: commonPasswords.at(-1),
                            value,
                        };
                        return 55;
                    },
                });
            });

            expect(await page.evaluate((_) =>
                window.passwordStrengthScorerArguments)).toEqual({
                commonPassword: 'projectsecret',
                value: 'A1!',
            });

            const progressBar = page.locator('.progress-bar');
            await expect(progressBar).toHaveAttribute('aria-valuenow', '55');
            await expect(progressBar).toHaveAttribute('style', 'width: 55%;');
            await expect(progressBar).toHaveText('Normal');
        });

        test('normalizes invalid scorer results', async ({ page }) => {
            await page.evaluate((_) => {
                UI.PasswordStrength.init($.findOne('#password'), {
                    scorer: (_) => Number.NaN,
                });
            });

            await expect(page.locator('.progress-bar'))
                .toHaveAttribute('aria-valuenow', '0');
        });
    });

    test.describe('container option', () => {
        test('uses the closest field container by default', async ({ page }) => {
            await page.evaluate((_) => {
                UI.PasswordStrength.init($.findOne('#password'));
            });

            await expect(page.locator('#field > .progress')).toHaveCount(1);
        });

        test('works with container option', async ({ page }) => {
            await page.evaluate((_) => {
                UI.PasswordStrength.init(
                    $.findOne('#password'),
                    { container: '#target' },
                );
            });

            await expect(page.locator('#target > .progress')).toHaveCount(1);
        });

        test('works with container option (data-ui-container)', async ({ page }) => {
            await page.evaluate((_) => {
                const password = $.findOne('#password');
                $.setDataset(password, { uiContainer: '#target' });
                UI.PasswordStrength.init(password);
            });

            await expect(page.locator('#target > .progress')).toHaveCount(1);
        });
    });

    test.describe('levels option', () => {
        test('clears previous text for empty and omitted labels', async ({ page }) => {
            await page.evaluate((_) => {
                const password = $.findOne('#password');
                $.setValue(password, '100');
                UI.PasswordStrength.init(password, {
                    scorer: (value) => Number(value),
                    levels: [
                        { score: 0, class: 'text-bg-danger' },
                        { score: 20, class: 'text-bg-warning', text: '' },
                        { score: 80, class: 'text-bg-success', text: 'Very Strong' },
                    ],
                });
            });

            const password = page.locator('#password');
            const progressBar = page.locator('.progress-bar');
            await expect(progressBar).toHaveText('Very Strong');

            for (const score of ['20', '0']) {
                await password.fill(score);
                await expect(progressBar).toHaveAttribute('aria-valuenow', score);
                await expect(progressBar).toHaveText('');

                await password.fill('100');
                await expect(progressBar).toHaveText('Very Strong');
            }
        });

        for (const source of ['options', 'data attributes']) {
            test(`replaces level arrays from ${source}`, async ({ page }) => {
                expect(await page.evaluate((source) => {
                    const password = $.findOne('#password');
                    const levels = [
                        { score: 0, class: 'text-bg-danger', text: 'Bad' },
                        { score: 50, class: 'text-bg-success', text: 'Good' },
                    ];
                    const options = { scorer: (value) => Number(value) };
                    $.setValue(password, '100');

                    if (source === 'data attributes') {
                        $.setDataset(password, { uiLevels: levels });
                    } else {
                        options.levels = levels;
                    }

                    const instance = UI.PasswordStrength.init(password, options);
                    levels[1].text = 'Changed';

                    return instance.options.levels;
                }, source)).toEqual([
                    { score: 0, class: 'text-bg-danger', text: 'Bad' },
                    { score: 50, class: 'text-bg-success', text: 'Good' },
                ]);

                const progressBar = page.locator('.progress-bar');
                await expect(progressBar).toHaveText('Good');
                await expect(progressBar).toHaveClass('progress-bar text-bg-success');

                await page.locator('#password').fill('25');
                await expect(progressBar).toHaveText('Bad');
                await expect(progressBar).toHaveClass('progress-bar text-bg-danger');
            });
        }

        test('prefers option arrays over data attribute arrays', async ({ page }) => {
            expect(await page.evaluate((_) => {
                const password = $.findOne('#password');
                $.setDataset(password, {
                    uiCommonPasswords: ['password', 'projectsecret'],
                    uiLevels: [
                        { score: 0, class: 'text-bg-danger', text: 'Bad' },
                        { score: 50, class: 'text-bg-success', text: 'Good' },
                    ],
                });
                $.setValue(password, 'password');

                const instance = UI.PasswordStrength.init(password, {
                    commonPasswords: [],
                    levels: [{ score: 0, class: 'text-bg-primary' }],
                });

                return {
                    commonPasswords: instance.options.commonPasswords,
                    levels: instance.options.levels,
                    score: instance.getStrength(),
                };
            })).toEqual({
                commonPasswords: [],
                levels: [{ score: 0, class: 'text-bg-primary' }],
                score: 39,
            });

            await expect(page.locator('.progress-bar')).toHaveText('');
            await expect(page.locator('.progress-bar'))
                .toHaveClass('progress-bar text-bg-primary');
        });

        test('renders the default level boundaries', async ({ page }) => {
            await page.evaluate((_) => {
                const scores = [0, 20, 40, 60, 80, 100];
                scores.forEach((score) => {
                    const container = $.create('div');
                    const password = $.create('input', { value: `${score}` });
                    $.append(container, password);
                    $.append(document.body, container);
                    UI.PasswordStrength.init(password, {
                        scorer: (value) => Number.parseInt(value, 10),
                    });
                });
            });

            const expected = [
                { className: 'progress-bar text-bg-danger', score: 0, text: 'Very Weak', width: '0%' },
                { className: 'progress-bar text-bg-danger', score: 20, text: 'Weak', width: '20%' },
                { className: 'progress-bar text-bg-warning', score: 40, text: 'Normal', width: '40%' },
                { className: 'progress-bar text-bg-success', score: 60, text: 'Strong', width: '60%' },
                { className: 'progress-bar text-bg-success', score: 80, text: 'Very Strong', width: '80%' },
                { className: 'progress-bar text-bg-success', score: 100, text: 'Very Strong', width: '100%' },
            ];
            const progressBars = page.locator('.progress-bar');

            await expect(progressBars).toHaveCount(expected.length);
            await expect(progressBars).toHaveClass(expected.map(({ className }) => className));
            await expect(progressBars).toHaveText(expected.map(({ text }) => text));

            for (const [index, { score, width }] of expected.entries()) {
                const progressBar = progressBars.nth(index);
                await expect(progressBar).toHaveAttribute('aria-valuenow', `${score}`);
                await expect(progressBar).toHaveAttribute('style', `width: ${width};`);
            }
        });

        test('works with levels option', async ({ page }) => {
            await page.evaluate((_) => {
                const password = $.findOne('#password');
                $.setValue(password, '');
                UI.PasswordStrength.init(
                    password,
                    {
                        levels: [
                            {
                                class: 'text-bg-primary',
                                score: 0,
                                text: '',
                            },
                        ],
                    },
                );
            });

            const progressBar = page.locator('.progress-bar');
            await expect(progressBar).toHaveClass('progress-bar text-bg-primary');
            await expect(progressBar).toHaveText('');
        });

        test('works with levels option (data-ui-levels)', async ({ page }) => {
            await page.evaluate((_) => {
                const password = $.findOne('#password');
                $.setValue(password, '');
                $.setDataset(password, {
                    uiLevels: [
                        {
                            class: 'text-bg-primary',
                            score: 0,
                            text: 'Custom',
                        },
                    ],
                });
                UI.PasswordStrength.init(password);
            });

            const progressBar = page.locator('.progress-bar');
            await expect(progressBar).toHaveClass('progress-bar text-bg-primary');
            await expect(progressBar).toHaveText('Custom');
        });
    });

    test.describe('striped option', () => {
        test('does not render stripes by default', async ({ page }) => {
            await page.evaluate((_) => {
                UI.PasswordStrength.init($.findOne('#password'));
            });

            await expect(page.locator('.progress-bar'))
                .not.toHaveClass(/\bprogress-bar-striped\b/);
        });

        test('works with striped option', async ({ page }) => {
            await page.evaluate((_) => {
                UI.PasswordStrength.init(
                    $.findOne('#password'),
                    { striped: true },
                );
            });

            await expect(page.locator('.progress-bar'))
                .toHaveClass(/\bprogress-bar-striped\b/);
        });

        test('works with striped option (data-ui-striped)', async ({ page }) => {
            await page.evaluate((_) => {
                const password = $.findOne('#password');
                $.setDataset(password, { uiStriped: true });
                UI.PasswordStrength.init(password);
            });

            await expect(page.locator('.progress-bar'))
                .toHaveClass(/\bprogress-bar-striped\b/);
        });
    });
});
