import { expect, test } from '#test';
import { resetPage } from '../setup/browser.js';

test.beforeEach(async ({ page }) => {
    await resetPage(page);
});

test.describe('PasswordStrength', () => {
    test.beforeEach(async ({ page }) => {
        await page.evaluate((_) => {
            $.setHTML(
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
                return {
                    progressCount: $.find('.progress', '#field').length,
                    sameInstance: first === second,
                    striped: second.options.striped,
                };
            })).toEqual({
                progressCount: 1,
                sameInstance: true,
                striped: true,
            });
        });

        test('exposes frozen default options', async ({ page }) => {
            expect(await page.evaluate((_) => {
                const password = $.findOne('#password');
                const passwordStrength = UI.PasswordStrength.init(password);
                return {
                    container: passwordStrength.options.container,
                    frozen: Object.isFrozen(passwordStrength.options),
                    levels: passwordStrength.options.levels,
                    node: passwordStrength.node === password,
                    striped: passwordStrength.options.striped,
                };
            })).toEqual({
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
                striped: false,
            });
        });

        test('renders the initial strength', async ({ page }) => {
            expect(await page.evaluate((_) => {
                const password = $.findOne('#password');
                UI.PasswordStrength.init(password);
                const progress = $.findOne('.progress');
                const progressBar = $.findOne('.progress-bar');
                return {
                    className: progressBar.className,
                    describedBy: $.getAttribute(password, 'aria-describedby'),
                    id: progressBar.id,
                    maximum: $.getAttribute(progressBar, 'aria-valuemax'),
                    minimum: $.getAttribute(progressBar, 'aria-valuemin'),
                    progressClass: progress.className,
                    role: $.getAttribute(progressBar, 'role'),
                    score: $.getAttribute(progressBar, 'aria-valuenow'),
                    text: $.getText(progressBar),
                    width: progressBar.style.width,
                };
            })).toEqual(expect.objectContaining({
                className: 'progress-bar text-bg-danger',
                maximum: '100',
                minimum: '0',
                progressClass: 'progress mt-2',
                role: 'progressbar',
                score: '32',
                text: 'Weak',
                width: '32%',
            }));

            const aria = await page.evaluate((_) => {
                const password = $.findOne('#password');
                const progressBar = $.findOne('.progress-bar');
                return {
                    describedBy: $.getAttribute(password, 'aria-describedby'),
                    id: progressBar.id,
                };
            });
            expect(aria.id).toMatch(/^password-strength/);
            expect(aria.describedBy).toBe(aria.id);
        });

        test('appends the generated ID to aria-describedby', async ({ page }) => {
            const aria = await page.evaluate((_) => {
                const password = $.findOne('#password');
                $.setAttribute(password, { 'aria-describedby': 'hint error' });
                UI.PasswordStrength.init(password);
                const progressBar = $.findOne('.progress-bar');
                return {
                    describedBy: $.getAttribute(password, 'aria-describedby'),
                    id: progressBar.id,
                };
            });
            expect(aria.describedBy).toBe(`hint error ${aria.id}`);
        });
    });

    test.describe('#dispose', () => {
        test('removes the PasswordStrength and generated markup', async ({ page }) => {
            expect(await page.evaluate((_) => {
                const password = $.findOne('#password');
                const passwordStrength = UI.PasswordStrength.init(password);
                const progress = $.findOne('.progress');
                passwordStrength.dispose();
                return {
                    describedBy: $.getAttribute(password, 'aria-describedby'),
                    hasData: $.hasData(password, 'passwordstrength'),
                    node: passwordStrength.node,
                    options: passwordStrength.options,
                    progressConnected: $.isConnected(progress),
                };
            })).toEqual({
                describedBy: null,
                hasData: false,
                node: null,
                options: null,
                progressConnected: false,
            });
        });

        test('restores existing aria-describedby state', async ({ page }) => {
            expect(await page.evaluate((_) => {
                const password = $.findOne('#password');
                $.setAttribute(password, { 'aria-describedby': 'hint error' });
                const passwordStrength = UI.PasswordStrength.init(password);
                passwordStrength.dispose();
                return $.getAttribute(password, 'aria-describedby');
            })).toBe('hint error');
        });

        test('restores empty and absent aria-describedby state', async ({ page }) => {
            expect(await page.evaluate((_) => {
                const password = $.findOne('#password');
                const password2 = $.findOne('#password2');
                $.setAttribute(password, { 'aria-describedby': '' });
                const first = UI.PasswordStrength.init(password);
                const second = UI.PasswordStrength.init(password2);
                first.dispose();
                second.dispose();
                return {
                    absent: $.getAttribute(password2, 'aria-describedby'),
                    empty: $.getAttribute(password, 'aria-describedby'),
                };
            })).toEqual({
                absent: null,
                empty: '',
            });
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
            })).toBe(32);
        });

        test('gets the password strength (query)', async ({ page }) => {
            expect(await page.evaluate((_) =>
                $('#password').passwordstrength('getStrength'))).toBe(32);
        });
    });

    test.describe('.getStrength', () => {
        test('returns representative scores', async ({ page }) => {
            expect(await page.evaluate((_) => [
                '',
                'password',
                'password123',
                'a',
                'A',
                '1',
                '!',
                'aa',
                'abab',
                'A1!',
                'aA1!',
                'aBcD123!',
                '😀Password1!',
            ].map((password) => [
                password,
                UI.PasswordStrength.getStrength(password),
            ]))).toEqual([
                ['', 0],
                ['password', 0],
                ['password123', 12],
                ['a', 4],
                ['A', 4],
                ['1', 4],
                ['!', 12],
                ['aa', 1],
                ['abab', 14],
                ['A1!', 32],
                ['aA1!', 42],
                ['aBcD123!', 81],
                ['😀Password1!', 100],
            ]);
        });

        test('penalizes repeated and consecutive characters', async ({ page }) => {
            expect(await page.evaluate((_) => ({
                consecutive: UI.PasswordStrength.getStrength('aaaa'),
                repeated: UI.PasswordStrength.getStrength('abab'),
                shortConsecutive: UI.PasswordStrength.getStrength('aa'),
            }))).toEqual({
                consecutive: 1,
                repeated: 14,
                shortConsecutive: 1,
            });
        });

        test('penalizes sequential letters and numbers', async ({ page }) => {
            expect(await page.evaluate((_) => ({
                letters: UI.PasswordStrength.getStrength('abcd'),
                nonSequentialLetters: UI.PasswordStrength.getStrength('abxd'),
                nonSequentialNumbers: UI.PasswordStrength.getStrength('1245'),
                numbers: UI.PasswordStrength.getStrength('1234'),
            }))).toEqual({
                letters: 10,
                nonSequentialLetters: 16,
                nonSequentialNumbers: 22,
                numbers: 16,
            });
        });

        test('rewards mixed character classes', async ({ page }) => {
            expect(await page.evaluate((_) => ({
                basic: UI.PasswordStrength.getStrength('A1!'),
                mixed: UI.PasswordStrength.getStrength('aBcD123!'),
                repeatedMixed: UI.PasswordStrength.getStrength('Aa1!Aa1!'),
            }))).toEqual({
                basic: 32,
                mixed: 81,
                repeatedMixed: 83,
            });
        });

        test('clamps scores to the supported range', async ({ page }) => {
            expect(await page.evaluate((_) => {
                const scores = [
                    '',
                    'CorrectHorseBatteryStaple',
                    'Tr0ub4dor&3',
                    '😀Password1!',
                ].map((password) => UI.PasswordStrength.getStrength(password));
                return {
                    maximum: Math.max(...scores),
                    minimum: Math.min(...scores),
                    valid: scores.every((score) => score >= 0 && score <= 100),
                };
            })).toEqual({
                maximum: 100,
                minimum: 0,
                valid: true,
            });
        });
    });

    test.describe('events', () => {
        test('refreshes when the password changes', async ({ page }) => {
            expect(await page.evaluate((_) => {
                const password = $.findOne('#password');
                UI.PasswordStrength.init(password);
                const progressBar = $.findOne('.progress-bar');
                const before = {
                    score: $.getAttribute(progressBar, 'aria-valuenow'),
                    text: $.getText(progressBar),
                    width: progressBar.style.width,
                };
                $.setValue(password, 'CorrectHorseBatteryStaple');
                $.triggerEvent(password, 'input');
                return {
                    after: {
                        score: $.getAttribute(progressBar, 'aria-valuenow'),
                        text: $.getText(progressBar),
                        width: progressBar.style.width,
                    },
                    before,
                };
            })).toEqual({
                after: {
                    score: '100',
                    text: 'Very Strong',
                    width: '100%',
                },
                before: {
                    score: '32',
                    text: 'Weak',
                    width: '32%',
                },
            });
        });
    });

    test.describe('container option', () => {
        test('uses the closest field container by default', async ({ page }) => {
            expect(await page.evaluate((_) => {
                UI.PasswordStrength.init($.findOne('#password'));
                return $.findOne('.progress').parentElement.id;
            })).toBe('field');
        });

        test('works with container option', async ({ page }) => {
            expect(await page.evaluate((_) => {
                UI.PasswordStrength.init(
                    $.findOne('#password'),
                    { container: '#target' },
                );
                return $.findOne('.progress').parentElement.id;
            })).toBe('target');
        });

        test('works with container option (data-ui-container)', async ({ page }) => {
            expect(await page.evaluate((_) => {
                const password = $.findOne('#password');
                $.setDataset(password, { uiContainer: '#target' });
                const passwordStrength = UI.PasswordStrength.init(password);
                return {
                    container: passwordStrength.options.container,
                    frozen: Object.isFrozen(passwordStrength.options),
                    parent: $.findOne('.progress').parentElement.id,
                };
            })).toEqual({
                container: '#target',
                frozen: true,
                parent: 'target',
            });
        });
    });

    test.describe('levels option', () => {
        test('renders the default level boundaries', async ({ page }) => {
            expect(await page.evaluate((_) => {
                const levels = [
                    '',
                    'aaaaaaAaA',
                    'aaaaaaAA!',
                    'aaaaaA1!a',
                    'aaaa1!1!A',
                    'aaA1!1!1!',
                ];
                return levels.map((value) => {
                    const container = $.create('div');
                    const password = $.create('input', { value });
                    $.append(container, password);
                    $.append(document.body, container);
                    UI.PasswordStrength.init(password);
                    const progressBar = $.findOne('.progress-bar', container);
                    return {
                        className: progressBar.className,
                        score: Number($.getAttribute(progressBar, 'aria-valuenow')),
                        text: $.getText(progressBar),
                        width: progressBar.style.width,
                    };
                });
            })).toEqual([
                { className: 'progress-bar text-bg-danger', score: 0, text: 'Very Weak', width: '0%' },
                { className: 'progress-bar text-bg-danger', score: 20, text: 'Weak', width: '20%' },
                { className: 'progress-bar text-bg-warning', score: 40, text: 'Normal', width: '40%' },
                { className: 'progress-bar text-bg-success', score: 60, text: 'Strong', width: '60%' },
                { className: 'progress-bar text-bg-success', score: 80, text: 'Very Strong', width: '80%' },
                { className: 'progress-bar text-bg-success', score: 100, text: 'Very Strong', width: '100%' },
            ]);
        });

        test('works with levels option', async ({ page }) => {
            expect(await page.evaluate((_) => {
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
                const progressBar = $.findOne('.progress-bar');
                return {
                    className: progressBar.className,
                    text: $.getText(progressBar),
                };
            })).toEqual({
                className: 'progress-bar text-bg-primary',
                text: '',
            });
        });

        test('works with levels option (data-ui-levels)', async ({ page }) => {
            expect(await page.evaluate((_) => {
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
                const passwordStrength = UI.PasswordStrength.init(password);
                const progressBar = $.findOne('.progress-bar');
                return {
                    className: progressBar.className,
                    frozen: Object.isFrozen(passwordStrength.options),
                    level: passwordStrength.options.levels[0],
                    text: $.getText(progressBar),
                };
            })).toEqual({
                className: 'progress-bar text-bg-primary',
                frozen: true,
                level: {
                    class: 'text-bg-primary',
                    score: 0,
                    text: 'Custom',
                },
                text: 'Custom',
            });
        });
    });

    test.describe('striped option', () => {
        test('does not render stripes by default', async ({ page }) => {
            expect(await page.evaluate((_) => {
                UI.PasswordStrength.init($.findOne('#password'));
                return $.hasClass('.progress-bar', 'progress-bar-striped');
            })).toBe(false);
        });

        test('works with striped option', async ({ page }) => {
            expect(await page.evaluate((_) => {
                UI.PasswordStrength.init(
                    $.findOne('#password'),
                    { striped: true },
                );
                return $.hasClass('.progress-bar', 'progress-bar-striped');
            })).toBe(true);
        });

        test('works with striped option (data-ui-striped)', async ({ page }) => {
            expect(await page.evaluate((_) => {
                const password = $.findOne('#password');
                $.setDataset(password, { uiStriped: true });
                const passwordStrength = UI.PasswordStrength.init(password);
                return {
                    frozen: Object.isFrozen(passwordStrength.options),
                    striped: passwordStrength.options.striped,
                    stripedClass: $.hasClass('.progress-bar', 'progress-bar-striped'),
                };
            })).toEqual({
                frozen: true,
                striped: true,
                stripedClass: true,
            });
        });
    });
});
