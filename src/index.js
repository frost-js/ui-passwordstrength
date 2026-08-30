/** @import { PasswordStrengthOptions } from './password-strength.js'; */

import { initComponent } from '@fr0st/ui';
import PasswordStrength from './password-strength.js';

/** @type {PasswordStrengthOptions} */
PasswordStrength.defaults = {
    levels: [
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
    ],
    container: null,
    striped: false,
};

PasswordStrength.classes = {
    progress: 'progress mt-2',
    progressBar: 'progress-bar',
    progressBarStriped: 'progress-bar-striped',
};

initComponent('passwordstrength', PasswordStrength);

export default PasswordStrength;
