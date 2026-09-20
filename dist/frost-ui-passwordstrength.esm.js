import { BaseComponent, generateId, getDataset, initComponent } from "@fr0st/ui";
import $ from "@fr0st/query";

//#region src/helpers.js
var characterTypes = [
	{
		pattern: /\p{Ll}/u,
		type: "lower"
	},
	{
		pattern: /\p{Lu}/u,
		type: "upper"
	},
	{
		pattern: /\p{N}/u,
		type: "number"
	}
];
var keyboardSequences = [
	"1234567890",
	"qwertyuiop",
	"asdfghjkl",
	"zxcvbnm"
].flatMap((row) => [row, Array.from(row).reverse().join("")]);
var leetCharacters = {
	"$": "s",
	"0": "o",
	"3": "e",
	"4": "a",
	"5": "s",
	"7": "t",
	"@": "a"
};
var lengthBands = [
	{
		end: 5,
		max: 19,
		min: 1,
		start: 1
	},
	{
		end: 8,
		max: 39,
		min: 20,
		start: 6
	},
	{
		end: 11,
		max: 59,
		min: 40,
		start: 9
	},
	{
		end: 15,
		max: 79,
		min: 60,
		start: 12
	},
	{
		end: 24,
		max: 100,
		min: 80,
		start: 16
	}
];
/**
* Clamps a value between a minimum and a maximum.
* @param {number} value The value to clamp.
* @param {number} min The minimum value of the clamped range.
* @param {number} max The maximum value of the clamped range.
* @returns {number} The clamped value.
*/
var clamp = (value, min, max) => Math.max(min, Math.min(max, value));
/**
* Maps a value from one range to another.
* @param {number} value The value to map.
* @param {number} fromMin The minimum value of the current range.
* @param {number} fromMax The maximum value of the current range.
* @param {number} toMin The minimum value of the target range.
* @param {number} toMax The maximum value of the target range.
* @returns {number} The mapped value.
*/
var map = (value, fromMin, fromMax, toMin, toMax) => (value - fromMin) * (toMax - toMin) / (fromMax - fromMin) + toMin;
/**
* Gets the type of a password character.
* @param {string} character The character.
* @returns {string} The character type.
*/
var getCharacterType = (character) => characterTypes.find(({ pattern }) => pattern.test(character))?.type || "symbol";
/**
* Gets a length-based password strength.
* @param {string[]} characters The password characters.
* @returns {number} The password strength.
*/
var getLengthStrength = (characters) => {
	const band = lengthBands.find(({ end }) => characters.length <= end) || lengthBands.at(-1);
	const score = Math.round(map(Math.min(characters.length, band.end), band.start, band.end, band.min, band.max));
	const diversity = new Set(characters.map(getCharacterType)).size;
	return Math.min(score + (diversity - 1) * 2, band.max);
};
/**
* Gets the smallest repeated pattern.
* @param {string[]} characters The password characters.
* @returns {string[]|null} The repeated pattern.
*/
var getRepeatedPattern = (characters) => {
	const maxLength = Math.floor(characters.length / 2);
	for (let length = 1; length <= maxLength; length++) if (characters.length % length === 0 && characters.every((character, index) => character === characters[index % length])) return characters.slice(0, length);
	return null;
};
/**
* Normalizes common password matching.
* @param {string} password The password.
* @returns {string} The normalized password.
*/
var normalizePassword = (password) => String(password).normalize("NFKC").toLowerCase();
/**
* Normalizes common leet substitutions.
* @param {string} password The password.
* @returns {string} The normalized password.
*/
var normalizeLeet = (password) => Array.from(password, (character) => leetCharacters[character] || character).join("");
/**
* Gets normalized variants used to match common passwords.
* @param {string} password The normalized password.
* @returns {Set<string>} The password variants.
*/
var getPasswordVariants = (password) => {
	const undecorated = password.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
	const variants = [undecorated, undecorated.replace(/^\d+|\d+$/g, "")];
	return /* @__PURE__ */ new Set([...variants, ...variants.map(normalizeLeet)]);
};
/**
* Gets the score for a common password.
* @param {string} password The normalized password.
* @param {string[]} commonPasswords The common passwords.
* @returns {number|null} The common-password score.
*/
var getCommonPasswordStrength = (password, commonPasswords) => {
	const common = new Set(commonPasswords.map(normalizePassword));
	if (common.has(password)) return 0;
	return Array.from(getPasswordVariants(password)).some((variant) => common.has(variant)) ? 5 : null;
};
/**
* Checks whether characters form an ascending or descending sequence.
* @param {string[]} characters The password characters.
* @returns {boolean} Whether the characters form a sequence.
*/
var isSequence = (characters) => {
	const [first, second, third] = characters.map((character) => character.toLowerCase());
	const type = getCharacterType(first);
	const direction = second.codePointAt(0) - first.codePointAt(0);
	return ["lower", "number"].includes(type) && getCharacterType(second) === type && getCharacterType(third) === type && Math.abs(direction) === 1 && third.codePointAt(0) - second.codePointAt(0) === direction;
};
/**
* Checks whether characters form a keyboard sequence.
* @param {string[]} characters The password characters.
* @returns {boolean} Whether the characters form a keyboard sequence.
*/
var isKeyboardSequence = (characters) => {
	const sequence = characters.join("").toLowerCase();
	return keyboardSequences.some((keyboardSequence) => keyboardSequence.includes(sequence));
};
/**
* Checks whether characters form a predictable pattern.
* @param {string[]} characters The password characters.
* @returns {boolean} Whether the characters form a predictable pattern.
*/
var isPredictable = (characters) => new Set(characters).size === 1 || isSequence(characters) || isKeyboardSequence(characters);
/**
* Gets the number of characters in predictable patterns.
* @param {string[]} characters The password characters.
* @returns {number} The number of predictable characters.
*/
var getPredictableCount = (characters) => new Set(characters.slice(0, -2).flatMap((_, index) => isPredictable(characters.slice(index, index + 3)) ? [
	index,
	index + 1,
	index + 2
] : [])).size;
/**
* Calculates the strength of a password.
* @param {string} password The password.
* @param {string[]} [commonPasswords=[]] Passwords to score as very weak.
* @returns {number} The password strength, from 0 to 100.
*/
var getStrength = (password, commonPasswords = []) => {
	const normalizedPassword = password.normalize("NFKC");
	const characters = Array.from(normalizedPassword);
	if (!characters.length) return 0;
	const commonStrength = getCommonPasswordStrength(normalizedPassword.toLowerCase(), commonPasswords);
	if (commonStrength !== null) return commonStrength;
	const score = getLengthStrength(characters);
	const repeatedPattern = getRepeatedPattern(characters);
	if (repeatedPattern?.length === 1) return 0;
	if (repeatedPattern) return Math.min(score, getLengthStrength(repeatedPattern), 15);
	const predictableCount = getPredictableCount(characters);
	return clamp(score - predictableCount, 0, predictableCount === characters.length ? 15 : 100);
};

//#endregion
//#region src/password-strength.js
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
var PasswordStrength = class extends BaseComponent {
	static classes = {
		progress: "progress mt-2",
		progressBar: "progress-bar",
		progressBarStriped: "progress-bar-striped"
	};
	/** @type {PasswordStrengthOptions} */
	static defaults = {
		commonPasswords: [
			"123456",
			"12345678",
			"123456789",
			"1234567890",
			"000000",
			"111111",
			"abc123",
			"admin",
			"dragon",
			"iloveyou",
			"letmein",
			"monkey",
			"password",
			"password1",
			"password123",
			"qwerty",
			"qwerty123",
			"welcome"
		],
		levels: [
			{
				score: 0,
				class: "text-bg-danger",
				text: "Very Weak"
			},
			{
				score: 20,
				class: "text-bg-danger",
				text: "Weak"
			},
			{
				score: 40,
				class: "text-bg-warning",
				text: "Normal"
			},
			{
				score: 60,
				class: "text-bg-success",
				text: "Strong"
			},
			{
				score: 80,
				class: "text-bg-success",
				text: "Very Strong"
			}
		],
		container: null,
		scorer: getStrength,
		striped: false
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
		const overrides = {
			...getDataset(node),
			...options
		};
		for (const key of ["levels", "commonPasswords"]) if (Array.isArray(overrides[key])) {
			this.options[key].length = 0;
			$._extend(this.options[key], overrides[key]);
		}
		this.#form = this.node.form;
		if (this.options.container) this.#container = $.findOne(this.options.container);
		else this.#container = $.closest(this.node, ":not(.form-input):not(.input-group)").shift();
		this.#render();
		this.#refresh();
		this.#events();
	}
	/** @inheritdoc */
	dispose() {
		$.remove(this.#progress);
		$.removeEvent(this.node, "input.ui.passwordstrength");
		if (this.#form) $.removeEvent(this.#form, "reset.ui.passwordstrength", this.#resetHandler);
		if (this.#describedBy === null) $.removeAttribute(this.node, "aria-describedby");
		else $.setAttribute(this.node, { "aria-describedby": this.#describedBy });
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
		const strength = Number(this.options.scorer(value, this.options.commonPasswords));
		return Number.isFinite(strength) ? $._clamp(strength, 0, 100) : 0;
	}
	/**
	* Attaches events for the PasswordStrength.
	*/
	#events() {
		if (this.#form) {
			this.#resetHandler = (event) => {
				setTimeout(() => {
					if (this.node && !event.defaultPrevented) this.#refresh();
				}, 0);
			};
			$.addEvent(this.#form, "reset.ui.passwordstrength", this.#resetHandler);
		}
		$.addEvent(this.node, "input.ui.passwordstrength", (_) => {
			this.#refresh();
		});
	}
	/**
	* Refreshes the password strength.
	*/
	#refresh() {
		const strength = this.getStrength();
		let nextLevel;
		for (const level of this.options.levels) {
			if (strength < level.score) break;
			nextLevel = level;
		}
		$.setStyle(this.#progressBar, { width: `${strength}%` });
		$.setAttribute(this.#progressBar, {
			"class": this.constructor.classes.progressBar,
			"aria-valuenow": strength
		});
		$.addClass(this.#progressBar, nextLevel.class);
		if (this.options.striped) $.addClass(this.#progressBar, this.constructor.classes.progressBarStriped);
		$.setText(this.#progressBar, nextLevel.text ?? "");
	}
	/**
	* Renders the password strength element.
	*/
	#render() {
		this.#describedBy = $.getAttribute(this.node, "aria-describedby");
		this.#progress = $.create("div", { class: this.constructor.classes.progress });
		const id = generateId("password-strength");
		this.#progressBar = $.create("div", { attributes: {
			"id": id,
			"role": "progressbar",
			"aria-valuemin": 0,
			"aria-valuemax": 100
		} });
		$.append(this.#progress, this.#progressBar);
		$.append(this.#container, this.#progress);
		const describedBy = [this.#describedBy, id].filter(Boolean).join(" ");
		$.setAttribute(this.node, { "aria-describedby": describedBy });
	}
};

//#endregion
//#region src/index.js
initComponent("passwordstrength", PasswordStrength);
var src_default = PasswordStrength;

//#endregion
export { src_default as default };
//# sourceMappingURL=frost-ui-passwordstrength.esm.js.map