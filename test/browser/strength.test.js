import { expect, test } from '#test';

test.describe('PasswordStrength.getStrength', () => {
    test.describe('representative scores', () => {
        for (const { password, expected } of [
            { password: '', expected: 0 },
            { password: 'password', expected: 0 },
            { password: 'password123', expected: 0 },
            { password: 'Password1!', expected: 5 },
            { password: 'p@ssw0rd1!', expected: 5 },
            { password: 'a', expected: 1 },
            { password: '😀', expected: 1 },
            { password: 'aa', expected: 0 },
            { password: 'abab', expected: 6 },
            { password: 'A1!', expected: 14 },
            { password: 'aA1!', expected: 19 },
            { password: 'aBcD123!', expected: 32 },
            { password: '😀Password1!', expected: 5 },
            { password: 'CorrectHorseBatteryStaple', expected: 100 },
        ]) {
            test(`scores ${JSON.stringify(password)} as ${expected}`, async ({ page }) => {
                expect(await page.evaluate(
                    (password) => UI.PasswordStrength.getStrength(password),
                    password,
                )).toBe(expected);
            });
        }
    });

    test.describe('length weighting', () => {
        for (const { password, expected } of [
            { password: 'gT7!', expected: 19 },
            { password: 'gT7!mQ2#', expected: 39 },
            { password: 'gT7!mQ2#vR4^', expected: 66 },
            { password: 'gT7!mQ2#vR4^xP9%', expected: 86 },
            { password: 'gT7!mQ2#vR4^xP9%kN6&', expected: 96 },
            { password: 'gT7!mQ2#vR4^xP9%kN6&cH8*', expected: 100 },
        ]) {
            test(`scores ${password.length} varied characters`, async ({ page }) => {
                expect(await page.evaluate(
                    (password) => UI.PasswordStrength.getStrength(password),
                    password,
                )).toBe(expected);
            });
        }
    });

    test.describe('common-password lists', () => {
        for (const { name, password, commonPasswords, expected } of [
            { name: 'default', password: 'FrostJS', expected: 32 },
            { name: 'empty', password: 'password', commonPasswords: [], expected: 39 },
            { name: 'custom', password: 'FrostJS', commonPasswords: ['frostjs'], expected: 0 },
        ]) {
            test(`uses the ${name} list`, async ({ page }) => {
                expect(await page.evaluate(
                    ({ password, commonPasswords }) => UI.PasswordStrength.getStrength(password, commonPasswords),
                    { password, commonPasswords },
                )).toBe(expected);
            });
        }
    });

    test.describe('common-password variants', () => {
        for (const { password, commonPassword } of [
            { password: '@dministrator', commonPassword: 'administrator' },
            { password: '$ecret', commonPassword: 'secret' },
            { password: 'acces$', commonPassword: 'access' },
            { password: '@password!', commonPassword: 'password' },
            { password: 'p@ssw0rd1!', commonPassword: 'password' },
            { password: '@dministrator!', commonPassword: 'administrator' },
            { password: '!@dministrator', commonPassword: 'administrator' },
            { password: '!@dministrator!', commonPassword: 'administrator' },
            { password: '@dministrator1', commonPassword: 'administrator' },
            { password: '!@dministrator1!', commonPassword: 'administrator' },
            { password: '@dministrator123!', commonPassword: 'administrator' },
            { password: '123@dministrator!', commonPassword: 'administrator' },
            { password: '$ecret!', commonPassword: 'secret' },
            { password: '!acces$', commonPassword: 'access' },
            { password: '!acces$!', commonPassword: 'access' },
            { password: '!acces$123!', commonPassword: 'access' },
        ]) {
            test(`recognizes ${JSON.stringify(password)}`, async ({ page }) => {
                expect(await page.evaluate(
                    ({ password, commonPassword }) => UI.PasswordStrength.getStrength(password, [commonPassword]),
                    { password, commonPassword },
                )).toBe(5);
            });
        }
    });

    test.describe('repeated characters and patterns', () => {
        for (const { name, password, expected } of [
            { name: 'consecutive characters', password: 'aaaaaa', expected: 0 },
            { name: 'long consecutive characters', password: '11111111111111111111', expected: 0 },
            { name: 'repeated pairs', password: 'abab', expected: 6 },
            { name: 'repeated sequences', password: 'abcabcabc', expected: 10 },
        ]) {
            test(`penalizes ${name}`, async ({ page }) => {
                expect(await page.evaluate(
                    (password) => UI.PasswordStrength.getStrength(password),
                    password,
                )).toBe(expected);
            });
        }
    });

    test.describe('sequences and keyboard patterns', () => {
        for (const { name, password, expected } of [
            { name: 'ascending letters', password: 'abcd', expected: 11 },
            { name: 'nonsequential letters', password: 'abxd', expected: 15 },
            { name: 'nonsequential numbers', password: '1245', expected: 15 },
            { name: 'ascending numbers', password: '1234', expected: 11 },
            { name: 'descending letters', password: 'dcba', expected: 11 },
            { name: 'descending numbers', password: '4321', expected: 11 },
            { name: 'keyboard rows', password: 'asdfgh', expected: 14 },
            { name: 'unrelated letters', password: 'afkpuz', expected: 20 },
        ]) {
            test(`scores ${name}`, async ({ page }) => {
                expect(await page.evaluate(
                    (password) => UI.PasswordStrength.getStrength(password),
                    password,
                )).toBe(expected);
            });
        }
    });

    test.describe('fully predictable score bounds', () => {
        for (const { length, expected } of [
            { length: 12, expected: 15 },
            { length: 48, expected: 4 },
            { length: 50, expected: 0 },
            { length: 60, expected: 0 },
            { length: 100, expected: 0 },
        ]) {
            test(`clamps two runs of ${length} characters`, async ({ page }) => {
                expect(await page.evaluate(
                    (length) => UI.PasswordStrength.getStrength('a'.repeat(length) + 'b'.repeat(length)),
                    length,
                )).toBe(expected);
            });
        }
    });
});
