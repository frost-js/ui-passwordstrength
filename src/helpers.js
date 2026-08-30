import $ from '@fr0st/query';

/**
 * Finds character sequences in a string.
 * @param {string} string The input string.
 * @param {number[]} locations The character locations.
 * @returns {string[][]} The character sequences.
 */
function findSequences(string, locations) {
    const sequences = [];
    let sequence = [];

    for (let i = 0; i < locations.length - 1; i++) {
        const current = locations[i];
        const next = locations[i + 1];
        const distance = next - current;

        const char = string[current];
        const nextChar = string[next];
        const charDistance = nextChar.charCodeAt(0) - char.charCodeAt(0);

        if (distance === 1 && charDistance === 1) {
            if (!sequence.length) {
                sequence.push(char);
            }
            sequence.push(nextChar);
        } else if (sequence.length) {
            sequences.push(sequence);
            sequence = [];
        }
    }

    if (sequence.length) {
        sequences.push(sequence);
    }

    return sequences;
}

/**
 * Calculates the strength of a password.
 * @param {string} password The password.
 * @returns {number} The password strength, from 0 to 100.
 */
export function getStrength(password) {
    if (password.match(/^password/i)) {
        password = password.substring(8);
    }

    const length = password.length;

    let score = 0;

    if (length) {
        score += length * 6;
    }

    const upper = [];
    const lower = [];
    const numbers = [];
    const symbols = [];
    const dictionary = {};

    for (let i = 0; i < length; i++) {
        const char = password[i];
        const code = char.charCodeAt(0);

        if (code >= 48 && code <= 57) {
            numbers.push(i);
        } else if (code >= 65 && code <= 90) {
            upper.push(i);
        } else if (code >= 97 && code <= 122) {
            lower.push(i);
        } else {
            symbols.push(i);
        }

        if (!(char in dictionary)) {
            dictionary[char] = 0;
        }

        dictionary[char]++;
    }

    // reward upper/lower case
    if (upper.length !== length && lower.length !== length) {
        if (upper.length) {
            score += length - upper.length;
        }

        if (lower.length) {
            score += length - lower.length;
        }
    }

    // reward numbers
    if (numbers.length !== length) {
        score += numbers.length * 3;
    }

    // reward symbols
    score += symbols.length * 6;

    // reward inner numbers/symbols
    for (const list of [numbers, symbols]) {
        const reward = list.filter((v) => v && v !== length - 1).length;
        score += reward * 3;
    }

    // punish only letters
    if (!numbers.length && !symbols.length) {
        score -= length;
    }

    // punish only numbers
    if (!upper.length && !lower.length && !symbols.length) {
        score -= length;
    }

    // punish no symbols
    if (!symbols.length) {
        score -= length;
    }

    // repeating characters
    const repeats = Object.values(dictionary)
        .reduce((acc, count) => acc + count - 1, 0);

    if (repeats > 0) {
        score -= repeats;
    }

    if (length >= 2) {
        // consecutive characters
        const matches = password.matchAll(/(.)\1+/g);

        for (const match of matches) {
            score -= Math.min(match[0].length, 12) * 3;
        }

        const lowerPassword = password.toLowerCase();

        // sequential letters
        const letters = upper.concat(lower);
        const letterSequences = findSequences(lowerPassword, letters);
        for (const sequence of letterSequences) {
            if (sequence.length > 2) {
                score -= (Math.min(sequence.length - 2, 16)) * 3;
            }
        }

        // sequential numbers
        const numberSequences = findSequences(lowerPassword, numbers);
        for (const sequence of numberSequences) {
            if (sequence.length > 2) {
                score -= (Math.min(sequence.length - 2, 16)) * 3;
            }
        }
    }

    return $._clamp(score, 0, 100);
}
