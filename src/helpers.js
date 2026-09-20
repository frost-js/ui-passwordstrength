const characterTypes = [
    { pattern: /\p{Ll}/u, type: 'lower' },
    { pattern: /\p{Lu}/u, type: 'upper' },
    { pattern: /\p{N}/u, type: 'number' },
];

const keyboardSequences = [
    '1234567890',
    'qwertyuiop',
    'asdfghjkl',
    'zxcvbnm',
].flatMap(
    (row) => [
        row,
        Array.from(row).reverse().join(''),
    ],
);

const leetCharacters = {
    '$': 's',
    '0': 'o',
    '3': 'e',
    '4': 'a',
    '5': 's',
    '7': 't',
    '@': 'a',
};

const lengthBands = [
    { end: 5, max: 19, min: 1, start: 1 },
    { end: 8, max: 39, min: 20, start: 6 },
    { end: 11, max: 59, min: 40, start: 9 },
    { end: 15, max: 79, min: 60, start: 12 },
    { end: 24, max: 100, min: 80, start: 16 },
];

/**
 * Clamps a value between a minimum and a maximum.
 * @param {number} value The value to clamp.
 * @param {number} min The minimum value of the clamped range.
 * @param {number} max The maximum value of the clamped range.
 * @returns {number} The clamped value.
 */
const clamp = (value, min, max) =>
    Math.max(
        min,
        Math.min(
            max,
            value,
        ),
    );

/**
 * Maps a value from one range to another.
 * @param {number} value The value to map.
 * @param {number} fromMin The minimum value of the current range.
 * @param {number} fromMax The maximum value of the current range.
 * @param {number} toMin The minimum value of the target range.
 * @param {number} toMax The maximum value of the target range.
 * @returns {number} The mapped value.
 */
const map = (value, fromMin, fromMax, toMin, toMax) =>
    (value - fromMin) *
    (toMax - toMin) /
    (fromMax - fromMin) +
    toMin;

/**
 * Gets the type of a password character.
 * @param {string} character The character.
 * @returns {string} The character type.
 */
const getCharacterType = (character) =>
    characterTypes.find(
        ({ pattern }) => pattern.test(character),
    )?.type || 'symbol';

/**
 * Gets a length-based password strength.
 * @param {string[]} characters The password characters.
 * @returns {number} The password strength.
 */
const getLengthStrength = (characters) => {
    const band = lengthBands.find(
        ({ end }) => characters.length <= end,
    ) || lengthBands.at(-1);
    const score = Math.round(
        map(
            Math.min(characters.length, band.end),
            band.start,
            band.end,
            band.min,
            band.max,
        ),
    );
    const diversity = new Set(
        characters.map(getCharacterType),
    ).size;

    return Math.min(
        score +
        (diversity - 1) * 2,
        band.max,
    );
};

/**
 * Gets the smallest repeated pattern.
 * @param {string[]} characters The password characters.
 * @returns {string[]|null} The repeated pattern.
 */
const getRepeatedPattern = (characters) => {
    const maxLength = Math.floor(characters.length / 2);

    for (let length = 1; length <= maxLength; length++) {
        if (
            characters.length % length === 0 &&
            characters.every(
                (character, index) =>
                    character === characters[index % length],
            )
        ) {
            return characters.slice(0, length);
        }
    }

    return null;
};

/**
 * Normalizes common password matching.
 * @param {string} password The password.
 * @returns {string} The normalized password.
 */
const normalizePassword = (password) =>
    String(password)
        .normalize('NFKC')
        .toLowerCase();

/**
 * Normalizes common leet substitutions.
 * @param {string} password The password.
 * @returns {string} The normalized password.
 */
const normalizeLeet = (password) =>
    Array.from(
        password,
        (character) => leetCharacters[character] || character,
    ).join('');

/**
 * Gets normalized variants used to match common passwords.
 * @param {string} password The normalized password.
 * @returns {Set<string>} The password variants.
 */
const getPasswordVariants = (password) => {
    const undecorated = password.replace(
        /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,
        '',
    );
    const variants = [
        undecorated,
        undecorated.replace(/^\d+|\d+$/g, ''),
    ];

    return new Set([
        ...variants,
        ...variants.map(normalizeLeet),
    ]);
};

/**
 * Gets the score for a common password.
 * @param {string} password The normalized password.
 * @param {string[]} commonPasswords The common passwords.
 * @returns {number|null} The common-password score.
 */
const getCommonPasswordStrength = (password, commonPasswords) => {
    const common = new Set(
        commonPasswords.map(normalizePassword),
    );

    if (common.has(password)) {
        return 0;
    }

    return Array.from(getPasswordVariants(password)).some(
        (variant) => common.has(variant),
    ) ? 5 : null;
};

/**
 * Checks whether characters form an ascending or descending sequence.
 * @param {string[]} characters The password characters.
 * @returns {boolean} Whether the characters form a sequence.
 */
const isSequence = (characters) => {
    const [first, second, third] = characters.map(
        (character) => character.toLowerCase(),
    );
    const type = getCharacterType(first);
    const direction = second.codePointAt(0) - first.codePointAt(0);

    return ['lower', 'number'].includes(type) &&
        getCharacterType(second) === type &&
        getCharacterType(third) === type &&
        Math.abs(direction) === 1 &&
        third.codePointAt(0) - second.codePointAt(0) === direction;
};

/**
 * Checks whether characters form a keyboard sequence.
 * @param {string[]} characters The password characters.
 * @returns {boolean} Whether the characters form a keyboard sequence.
 */
const isKeyboardSequence = (characters) => {
    const sequence = characters.join('').toLowerCase();

    return keyboardSequences.some(
        (keyboardSequence) => keyboardSequence.includes(sequence),
    );
};

/**
 * Checks whether characters form a predictable pattern.
 * @param {string[]} characters The password characters.
 * @returns {boolean} Whether the characters form a predictable pattern.
 */
const isPredictable = (characters) =>
    new Set(characters).size === 1 ||
    isSequence(characters) ||
    isKeyboardSequence(characters);

/**
 * Gets the number of characters in predictable patterns.
 * @param {string[]} characters The password characters.
 * @returns {number} The number of predictable characters.
 */
const getPredictableCount = (characters) =>
    new Set(
        characters
            .slice(0, -2)
            .flatMap(
                (_, index) =>
                    isPredictable(characters.slice(index, index + 3)) ?
                        [index, index + 1, index + 2] :
                        [],
            ),
    ).size;

/**
 * Calculates the strength of a password.
 * @param {string} password The password.
 * @param {string[]} [commonPasswords=[]] Passwords to score as very weak.
 * @returns {number} The password strength, from 0 to 100.
 */
export const getStrength = (password, commonPasswords = []) => {
    const normalizedPassword = password.normalize('NFKC');
    const characters = Array.from(normalizedPassword);

    if (!characters.length) {
        return 0;
    }

    const commonStrength = getCommonPasswordStrength(
        normalizedPassword.toLowerCase(),
        commonPasswords,
    );

    if (commonStrength !== null) {
        return commonStrength;
    }

    const score = getLengthStrength(characters);
    const repeatedPattern = getRepeatedPattern(characters);

    if (repeatedPattern?.length === 1) {
        return 0;
    }

    if (repeatedPattern) {
        return Math.min(
            score,
            getLengthStrength(repeatedPattern),
            15,
        );
    }

    const predictableCount = getPredictableCount(characters);

    if (predictableCount === characters.length) {
        return Math.min(score - predictableCount, 15);
    }

    return clamp(score - predictableCount, 0, 100);
};
