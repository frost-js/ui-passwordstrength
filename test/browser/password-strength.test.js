import { expect, test } from '#test';

test.describe('PasswordStrength', () => {
    test.beforeEach(async ({ page }) => {
        await page.evaluate(() => {
            $.setHtml(document.body,
                '<div id="field"><div class="form-input"><input id="password" value="A1!"></div></div>' +
                '<div id="target"></div>' +
                '<div id="field2"><input id="password2"></div>',
            );
        });
    });

    test.describe('#init', () => {
        for (const { name, init } of [
            { name: 'class', init: () => UI.PasswordStrength.init($.findOne('#password')) },
            { name: 'QuerySet', init: () => $('#password').passwordstrength() },
        ]) {
            test(`creates and registers a PasswordStrength (${name})`, async ({ page }) => {
                const instance = await page.evaluateHandle(init);
                expect(await instance.evaluate((value) => value instanceof UI.PasswordStrength)).toBe(true);
                expect(await instance.evaluate((value) => $.getData('#password', 'passwordstrength') === value)).toBe(true);
                await expect(page.locator('#field .progress')).toHaveCount(1);
            });
        }

        test('creates multiple PasswordStrengths (QuerySet)', async ({ page }) => {
            expect(await page.evaluate(() => {
                $('input').passwordstrength();
                return ['#password', '#password2'].every((selector) =>
                    $.getData(selector, 'passwordstrength') instanceof UI.PasswordStrength,
                );
            })).toBe(true);
        });

        test('returns the first PasswordStrength (QuerySet)', async ({ page }) => {
            expect(await page.evaluate(() => {
                const passwordStrength = $('input').passwordstrength();
                return passwordStrength === $.getData('#password', 'passwordstrength');
            })).toBe(true);
        });

        test('reuses an existing PasswordStrength', async ({ page }) => {
            expect(await page.evaluate(() => {
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
            expect(await page.evaluate(() => {
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
            await page.evaluate(() => {
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
            await page.evaluate(() => {
                const password = $.findOne('#password');
                $.setAttribute(password, { 'aria-describedby': 'hint error' });
                UI.PasswordStrength.init(password);
            });

            const progressId = await page.locator('.progress-bar').getAttribute('id');
            await expect(page.locator('#password'))
                .toHaveAttribute('aria-describedby', `hint error ${progressId}`);
        });

        test.describe('failed initialization', () => {
            test.beforeEach(async ({ page }) => {
                await page.evaluate(() => {
                    $.setHtml(document.body,
                        '<form id="lifecycle-form"><label for="lifecycle-input">Label</label>' +
                        '<input id="lifecycle-input" tabindex="7" aria-hidden="false" aria-describedby="hint" type="text"></form>',
                    );
                    window.resetCalls = 0;
                    $.addEvent('#lifecycle-form', 'reset.ui.passwordstrength', () => window.resetCalls++);
                });
            });

            test('rolls back an invalid container selector', async ({ page }) => {
                await expect(page.evaluate(() =>
                    UI.PasswordStrength.init($.findOne('#lifecycle-input'), { container: '[' }),
                )).rejects.toThrow();

                expect(await page.evaluate(() => $.hasData('#lifecycle-input', 'passwordstrength'))).toBe(false);
                await expect(page.locator('#lifecycle-input')).not.toHaveClass(/\bvisually-hidden\b/);
                await expect(page.locator('#lifecycle-input')).toHaveAttribute('tabindex', '7');
                await expect(page.locator('#lifecycle-input')).toHaveAttribute('aria-hidden', 'false');
                await expect(page.locator('#lifecycle-input')).toHaveAttribute('aria-describedby', 'hint');
                await expect(page.locator('#lifecycle-form > label')).not.toHaveAttribute('id');
                await expect(page.locator('#lifecycle-form > *')).toHaveCount(2);

                await page.evaluate(() => $.triggerEvent('#lifecycle-form', 'reset.ui.passwordstrength'));
                expect(await page.evaluate(() => window.resetCalls)).toBe(1);

                expect(await page.evaluate(() => {
                    const node = $.findOne('#lifecycle-input');
                    const instance = UI.PasswordStrength.init(node);
                    return $.getData(node, 'passwordstrength') === instance;
                })).toBe(true);
            });

            test('rolls back a scorer failure', async ({ page }) => {
                await expect(page.evaluate(() =>
                    UI.PasswordStrength.init($.findOne('#lifecycle-input'), { scorer: () => {
                        throw new Error('Scorer failed');
                    } }),
                )).rejects.toThrow();

                expect(await page.evaluate(() => $.hasData('#lifecycle-input', 'passwordstrength'))).toBe(false);
                await expect(page.locator('#lifecycle-input')).not.toHaveClass(/\bvisually-hidden\b/);
                await expect(page.locator('#lifecycle-input')).toHaveAttribute('tabindex', '7');
                await expect(page.locator('#lifecycle-input')).toHaveAttribute('aria-hidden', 'false');
                await expect(page.locator('#lifecycle-input')).toHaveAttribute('aria-describedby', 'hint');
                await expect(page.locator('#lifecycle-form > label')).not.toHaveAttribute('id');
                await expect(page.locator('#lifecycle-form > *')).toHaveCount(2);

                await page.evaluate(() => $.triggerEvent('#lifecycle-form', 'reset.ui.passwordstrength'));
                expect(await page.evaluate(() => window.resetCalls)).toBe(1);

                expect(await page.evaluate(() => {
                    const node = $.findOne('#lifecycle-input');
                    const instance = UI.PasswordStrength.init(node);
                    return $.getData(node, 'passwordstrength') === instance;
                })).toBe(true);
            });
        });
    });

    test.describe('#dispose', () => {
        test('ignores repeated disposal after reinitialization', async ({ page }) => {
            expect(await page.evaluate(() => {
                const node = $.findOne('#password');
                const first = UI.PasswordStrength.init(node);
                first.dispose();
                first.dispose();
                const second = UI.PasswordStrength.init(node);
                first.dispose();
                return $.getData(node, 'passwordstrength') === second;
            })).toBe(true);
        });
        for (const { name, dispose } of [
            { name: 'class', dispose: (instance) => instance.dispose() },
            { name: 'QuerySet', dispose: () => $('#password').passwordstrength('dispose') },
        ]) {
            test(`removes the PasswordStrength and generated markup (${name})`, async ({ page }) => {
                const instance = await page.evaluateHandle(() =>
                    UI.PasswordStrength.init($.findOne('#password')));
                await page.evaluate(dispose, instance);

                expect(await instance.evaluate((value) => ({
                    hasData: $.hasData('#password', 'passwordstrength'),
                    node: value.node,
                    options: value.options,
                }))).toEqual({ hasData: false, node: null, options: null });
                await expect(page.locator('#password')).not.toHaveAttribute('aria-describedby');
                await expect(page.locator('.progress')).toHaveCount(0);
            });
        }

        for (const { name, describedBy } of [
            { name: 'existing', describedBy: 'hint error' },
            { name: 'empty', describedBy: '' },
            { name: 'absent', describedBy: null },
        ]) {
            test(`restores ${name} aria-describedby state`, async ({ page }) => {
                await page.evaluate((describedBy) => {
                    const password = $.findOne('#password');
                    if (describedBy !== null) {
                        $.setAttribute(password, 'aria-describedby', describedBy);
                    }
                    UI.PasswordStrength.init(password).dispose();
                }, describedBy);

                const password = page.locator('#password');
                if (describedBy === null) {
                    await expect(password).not.toHaveAttribute('aria-describedby');
                } else {
                    await expect(password).toHaveAttribute('aria-describedby', describedBy);
                }
            });
        }

        test('removes the input event handler', async ({ page }) => {
            expect(await page.evaluate(() => {
                const password = $.findOne('#password');
                const passwordStrength = UI.PasswordStrength.init(password);
                let calls = 0;
                passwordStrength.getStrength = () => {
                    calls++;
                    return 100;
                };
                passwordStrength.dispose();
                $.triggerEvent(password, 'input');
                return calls;
            })).toBe(0);
        });
    });

    test.describe('#getStrength', () => {
        for (const { name, getStrength } of [
            { name: 'class', getStrength: () => UI.PasswordStrength.init($.findOne('#password')).getStrength() },
            { name: 'QuerySet', getStrength: () => $('#password').passwordstrength('getStrength') },
        ]) {
            test(`gets the password strength (${name})`, async ({ page }) => {
                expect(await page.evaluate(getStrength)).toBe(14);
            });
        }
    });

    test.describe('events', () => {
        test('refreshes when the password changes', async ({ page }) => {
            await page.evaluate(() => {
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

    test.describe('option resolution', () => {
        test('prefers option arrays over data attribute arrays', async ({ page }) => {
            expect(await page.evaluate(() => {
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
    });

    test.describe('commonPasswords option', () => {
        for (const source of ['options', 'data attributes']) {
            for (const { name, commonPasswords } of [
                { name: 'custom', commonPasswords: ['projectsecret'] },
                { name: 'empty', commonPasswords: [] },
            ]) {
                test(`replaces defaults with a ${name} list (${source})`, async ({ page }) => {
                    expect(await page.evaluate(({ source, commonPasswords }) => {
                        const password = $.findOne('#password');
                        $.setValue(password, 'password');
                        if (source === 'data attributes') {
                            $.setDataset(password, 'uiCommonPasswords', commonPasswords);
                        }
                        const instance = UI.PasswordStrength.init(
                            password,
                            source === 'options' ? { commonPasswords } : undefined,
                        );
                        return {
                            commonPasswords: instance.options.commonPasswords,
                            score: instance.getStrength(),
                        };
                    }, { source, commonPasswords })).toEqual({ commonPasswords, score: 39 });
                });
            }
        }

        for (const { name, options = {}, attributes = {} } of [
            { name: 'option', options: { commonPasswords: ['projectsecret'] } },
            { name: 'data attribute', attributes: { 'data-ui-common-passwords': '["projectsecret"]' } },
        ]) {
            test(`recognizes a custom common password (${name})`, async ({ page }) => {
                await page.evaluate(({ options, attributes }) => {
                    const password = $.findOne('#password');
                    $.setValue(password, 'ProjectSecret');
                    for (const [name, value] of Object.entries(attributes)) {
                        $.setAttribute(password, name, value);
                    }
                    UI.PasswordStrength.init(password, options);
                }, { options, attributes });

                await expect(page.locator('.progress-bar')).toHaveAttribute('aria-valuenow', '0');
            });
        }
    });

    test.describe('container option', () => {
        for (const { name, options = {}, attributes = {}, target } of [
            { name: 'default', target: '#field' },
            { name: 'option', options: { container: '#target' }, target: '#target' },
            { name: 'data attribute', attributes: { 'data-ui-container': '#target' }, target: '#target' },
        ]) {
            test(`uses the ${name} container`, async ({ page }) => {
                await page.evaluate(({ options, attributes }) => {
                    const password = $.findOne('#password');
                    for (const [name, value] of Object.entries(attributes)) {
                        $.setAttribute(password, name, value);
                    }
                    UI.PasswordStrength.init(password, options);
                }, { options, attributes });

                await expect(page.locator(`${target} > .progress`)).toHaveCount(1);
            });
        }
    });

    test.describe('levels option', () => {
        for (const { score, className, text } of [
            { score: 0, className: 'text-bg-danger', text: 'Very Weak' },
            { score: 19, className: 'text-bg-danger', text: 'Very Weak' },
            { score: 20, className: 'text-bg-danger', text: 'Weak' },
            { score: 39, className: 'text-bg-danger', text: 'Weak' },
            { score: 40, className: 'text-bg-warning', text: 'Normal' },
            { score: 59, className: 'text-bg-warning', text: 'Normal' },
            { score: 60, className: 'text-bg-success', text: 'Strong' },
            { score: 79, className: 'text-bg-success', text: 'Strong' },
            { score: 80, className: 'text-bg-success', text: 'Very Strong' },
            { score: 100, className: 'text-bg-success', text: 'Very Strong' },
        ]) {
            test(`renders the default level for score ${score}`, async ({ page }) => {
                await page.evaluate((score) => {
                    const password = $.findOne('#password');
                    $.setValue(password, `${score}`);
                    UI.PasswordStrength.init(password, { scorer: (value) => Number(value) });
                }, score);

                const progressBar = page.locator('.progress-bar');
                await expect(progressBar).toHaveCount(1);
                await expect(progressBar).toHaveClass(`progress-bar ${className}`);
                await expect(progressBar).toHaveText(text);
                await expect(progressBar).toHaveAttribute('aria-valuenow', `${score}`);
                await expect(progressBar).toHaveAttribute('style', `width: ${score}%;`);
            });
        }

        for (const source of ['options', 'data attributes']) {
            for (const text of ['', 'Custom']) {
                test(`renders a ${text ? 'custom' : 'blank'} level label (${source})`, async ({ page }) => {
                    await page.evaluate(({ source, text }) => {
                        const password = $.findOne('#password');
                        $.setValue(password, '');
                        const levels = [{ class: 'text-bg-primary', score: 0, text }];
                        if (source === 'data attributes') {
                            $.setDataset(password, 'uiLevels', levels);
                        }
                        UI.PasswordStrength.init(password, source === 'options' ? { levels } : undefined);
                    }, { source, text });

                    const progressBar = page.locator('.progress-bar');
                    await expect(progressBar).toHaveClass('progress-bar text-bg-primary');
                    await expect(progressBar).toHaveText(text);
                });
            }
        }

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

        for (const { name, score } of [
            { name: 'empty', score: '20' },
            { name: 'omitted', score: '0' },
        ]) {
            test(`clears previous text for an ${name} label`, async ({ page }) => {
                await page.evaluate(() => {
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

                await password.fill(score);
                await expect(progressBar).toHaveAttribute('aria-valuenow', score);
                await expect(progressBar).toHaveText('');

                await password.fill('100');
                await expect(progressBar).toHaveText('Very Strong');
            });
        }
    });

    test.describe('scorer option', () => {
        test('works with scorer option', async ({ page }) => {
            await page.evaluate(() => {
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

            expect(await page.evaluate(() =>
                window.passwordStrengthScorerArguments)).toEqual({
                commonPassword: 'projectsecret',
                value: 'A1!',
            });

            const progressBar = page.locator('.progress-bar');
            await expect(progressBar).toHaveAttribute('aria-valuenow', '55');
            await expect(progressBar).toHaveAttribute('style', 'width: 55%;');
            await expect(progressBar).toHaveText('Normal');
        });

        for (const { name, result, expected } of [
            { name: 'negative', result: -20, expected: 0 },
            { name: 'above maximum', result: 120, expected: 100 },
            { name: 'NaN', result: Number.NaN, expected: 0 },
            { name: 'positive infinity', result: Number.POSITIVE_INFINITY, expected: 0 },
            { name: 'negative infinity', result: Number.NEGATIVE_INFINITY, expected: 0 },
        ]) {
            test(`normalizes a ${name} scorer result`, async ({ page }) => {
                expect(await page.evaluate((result) => {
                    const instance = UI.PasswordStrength.init($.findOne('#password'), {
                        scorer: () => result,
                    });
                    return instance.getStrength();
                }, result)).toBe(expected);

                const progressBar = page.locator('.progress-bar');
                await expect(progressBar).toHaveAttribute('aria-valuenow', `${expected}`);
                await expect(progressBar).toHaveAttribute('style', `width: ${expected}%;`);
            });
        }
    });

    test.describe('striped option', () => {
        for (const { name, options = {}, attributes = {}, striped } of [
            { name: 'default', striped: false },
            { name: 'option', options: { striped: true }, striped: true },
            { name: 'data attribute', attributes: { 'data-ui-striped': 'true' }, striped: true },
        ]) {
            test(`renders stripes according to the ${name}`, async ({ page }) => {
                await page.evaluate(({ options, attributes }) => {
                    const password = $.findOne('#password');
                    for (const [name, value] of Object.entries(attributes)) {
                        $.setAttribute(password, name, value);
                    }
                    UI.PasswordStrength.init(password, options);
                }, { options, attributes });

                const progressBar = page.locator('.progress-bar');
                if (striped) {
                    await expect(progressBar).toHaveClass(/\bprogress-bar-striped\b/);
                } else {
                    await expect(progressBar).not.toHaveClass(/\bprogress-bar-striped\b/);
                }
            });
        }
    });
});
