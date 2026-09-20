import $ from '@fr0st/query';
import { BaseComponent, generateId, getDataset } from '@fr0st/ui';
import { getStrength } from './strength.js';

/**
 * @typedef {object} PasswordStrengthLevel
 * @property {string} class The CSS class applied to the progress bar.
 * @property {number} score The minimum score for the level.
 * @property {string} [text] The label displayed in the progress bar.
 */

/**
 * @callback PasswordStrengthScorer
 * @param {string} password The password.
 * @param {string[]} commonPasswords The common passwords.
 * @returns {number} The password strength, from 0 to 100.
 */

/**
 * @typedef {object} PasswordStrengthOptions
 * @property {string[]} [commonPasswords] Passwords to score as very weak.
 * @property {string|null} [container=null] The selector for the progress container.
 * @property {PasswordStrengthLevel[]} [levels] The ordered password-strength levels.
 * @property {PasswordStrengthScorer} [scorer] Calculates the password strength.
 * @property {boolean} [striped=false] Whether to display a striped progress bar.
 */

/**
 * Displays the strength of a password input as a progress bar.
 * @augments {BaseComponent<PasswordStrengthOptions>}
 */
export default class PasswordStrength extends BaseComponent {
    static classes = {
        progress: 'progress mt-2',
        progressBar: 'progress-bar',
        progressBarStriped: 'progress-bar-striped',
    };
    /** @type {PasswordStrengthOptions} */
    static defaults = {
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
        scorer: getStrength,
        striped: false,
    };

    #container;
    #describedBy;
    #form;
    #progress;
    #progressBar;
    #resetHandler;

    /**
     * Calculates the strength of a password.
     * @param {string} password The password.
     * @param {string[]} [commonPasswords=this.defaults.commonPasswords] Passwords to score as very weak.
     * @returns {number} The password strength, from 0 to 100.
     */
    static getStrength(password, commonPasswords = this.defaults.commonPasswords) {
        return getStrength(password, commonPasswords);
    }

    /**
     * Creates a PasswordStrength.
     * @param {HTMLElement} node The input node.
     * @param {PasswordStrengthOptions} [options] The PasswordStrength options.
     */
    constructor(node, options) {
        super(node, options);

        const overrides = { ...getDataset(node), ...options };

        // Replace supplied arrays instead of merging them with default entries.
        for (const key of ['levels', 'commonPasswords']) {
            if (Array.isArray(overrides[key])) {
                this.options[key].length = 0;
                $._extend(this.options[key], overrides[key]);
            }
        }

        this.#form = this.node.form;

        if (this.options.container) {
            this.#container = $.findOne(this.options.container);
        } else {
            this.#container = $.closest(this.node, ':not(.form-input):not(.input-group)').shift();
        }

        this.#render();
        this.#refresh();
        this.#events();
    }

    /** @inheritdoc */
    dispose() {
        $.remove(this.#progress);
        $.removeEvent(this.node, 'input.ui.passwordstrength');

        if (this.#form) {
            $.removeEvent(this.#form, 'reset.ui.passwordstrength', this.#resetHandler);
        }

        if (this.#describedBy === null) {
            $.removeAttribute(this.node, 'aria-describedby');
        } else {
            $.setAttribute(this.node, { 'aria-describedby': this.#describedBy });
        }

        this.#container = null;
        this.#form = null;
        this.#progress = null;
        this.#progressBar = null;
        this.#resetHandler = null;

        super.dispose();
    }

    /**
     * Gets the password strength.
     * @returns {number} The password strength, from 0 to 100.
     */
    getStrength() {
        const value = $.getValue(this.node);
        const strength = Number(this.options.scorer(
            value,
            this.options.commonPasswords,
        ));

        return Number.isFinite(strength) ?
            $._clamp(strength, 0, 100) :
            0;
    }

    /**
     * Attaches events for the PasswordStrength.
     */
    #events() {
        if (this.#form) {
            this.#resetHandler = (event) => {
                setTimeout(() => {
                    if (this.node && !event.defaultPrevented) {
                        this.#refresh();
                    }
                }, 0);
            };

            $.addEvent(this.#form, 'reset.ui.passwordstrength', this.#resetHandler);
        }

        $.addEvent(this.node, 'input.ui.passwordstrength', (_) => {
            this.#refresh();
        });
    }

    /**
     * Refreshes the password strength.
     */
    #refresh() {
        const strength = this.getStrength();

        const nextLevel = this.options.levels.findLast(
            (level) => strength >= level.score,
        );

        $.setStyle(this.#progressBar, { width: `${strength}%` });
        $.setAttribute(this.#progressBar, {
            'class': this.constructor.classes.progressBar,
            'aria-valuenow': strength,
        });

        $.addClass(this.#progressBar, nextLevel.class);

        if (this.options.striped) {
            $.addClass(this.#progressBar, this.constructor.classes.progressBarStriped);
        }

        $.setText(this.#progressBar, nextLevel.text ?? '');
    }

    /**
     * Renders the password strength element.
     */
    #render() {
        this.#describedBy = $.getAttribute(this.node, 'aria-describedby');
        this.#progress = $.create('div', {
            class: this.constructor.classes.progress,
        });

        const id = generateId('password-strength');

        this.#progressBar = $.create('div', {
            attributes: {
                'id': id,
                'role': 'progressbar',
                'aria-valuemin': 0,
                'aria-valuemax': 100,
            },
        });

        $.append(this.#progress, this.#progressBar);
        $.append(this.#container, this.#progress);

        const describedBy = [this.#describedBy, id]
            .filter(Boolean)
            .join(' ');

        $.setAttribute(this.node, { 'aria-describedby': describedBy });
    }
}
