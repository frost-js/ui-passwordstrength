(function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ?  factory(exports, require('@fr0st/ui'), require('@fr0st/query')) :
  typeof define === 'function' && define.amd ? define(['exports', '@fr0st/ui', '@fr0st/query'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.UI = global.UI || {}), global.UI,global.fQuery));
})(this, function(exports, _fr0st_ui, _fr0st_query) {
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
//#region \0rolldown/runtime.js
	var __create = Object.create;
	var __defProp = Object.defineProperty;
	var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
	var __getOwnPropNames = Object.getOwnPropertyNames;
	var __getProtoOf = Object.getPrototypeOf;
	var __hasOwnProp = Object.prototype.hasOwnProperty;
	var __copyProps = (to, from, except, desc) => {
		if (from && typeof from === "object" || typeof from === "function") {
			for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) {
					__defProp(to, key, {
						get: ((k) => from[k]).bind(null, key),
						enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
					});
				}
			}
		}
		return to;
	};
	var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
		value: mod,
		enumerable: true
	}) : target, mod));

//#endregion
_fr0st_query = __toESM(_fr0st_query, 1);

//#region src/helpers.js
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
				if (!sequence.length) sequence.push(char);
				sequence.push(nextChar);
			} else if (sequence.length) {
				sequences.push(sequence);
				sequence = [];
			}
		}
		if (sequence.length) sequences.push(sequence);
		return sequences;
	}
	/**
	* Calculates the strength of a password.
	* @param {string} password The password.
	* @returns {number} The password strength, from 0 to 100.
	*/
	function getStrength(password) {
		if (password.match(/^password/i)) password = password.substring(8);
		const length = password.length;
		let score = 0;
		if (length) score += length * 6;
		const upper = [];
		const lower = [];
		const numbers = [];
		const symbols = [];
		const dictionary = {};
		for (let i = 0; i < length; i++) {
			const char = password[i];
			const code = char.charCodeAt(0);
			if (code >= 48 && code <= 57) numbers.push(i);
			else if (code >= 65 && code <= 90) upper.push(i);
			else if (code >= 97 && code <= 122) lower.push(i);
			else symbols.push(i);
			if (!(char in dictionary)) dictionary[char] = 0;
			dictionary[char]++;
		}
		if (upper.length !== length && lower.length !== length) {
			if (upper.length) score += length - upper.length;
			if (lower.length) score += length - lower.length;
		}
		if (numbers.length !== length) score += numbers.length * 3;
		score += symbols.length * 6;
		for (const list of [numbers, symbols]) {
			const reward = list.filter((v) => v && v !== length - 1).length;
			score += reward * 3;
		}
		if (!numbers.length && !symbols.length) score -= length;
		if (!upper.length && !lower.length && !symbols.length) score -= length;
		if (!symbols.length) score -= length;
		const repeats = Object.values(dictionary).reduce((acc, count) => acc + count - 1, 0);
		if (repeats > 0) score -= repeats;
		if (length >= 2) {
			const matches = password.matchAll(/(.)\1+/g);
			for (const match of matches) score -= Math.min(match[0].length, 12) * 3;
			const lowerPassword = password.toLowerCase();
			const letterSequences = findSequences(lowerPassword, upper.concat(lower));
			for (const sequence of letterSequences) if (sequence.length > 2) score -= Math.min(sequence.length - 2, 16) * 3;
			const numberSequences = findSequences(lowerPassword, numbers);
			for (const sequence of numberSequences) if (sequence.length > 2) score -= Math.min(sequence.length - 2, 16) * 3;
		}
		return _fr0st_query.default._clamp(score, 0, 100);
	}

//#endregion
//#region src/password-strength.js
/**
	* @typedef {object} PasswordStrengthLevel
	* @property {string} class The CSS class applied to the progress bar.
	* @property {number} score The minimum score for the level.
	* @property {string} [text] The label displayed in the progress bar.
	*/
	/**
	* @typedef {object} PasswordStrengthOptions
	* @property {string|null} [container=null] The selector for the progress container.
	* @property {PasswordStrengthLevel[]} [levels] The ordered password-strength levels.
	* @property {boolean} [striped=false] Whether to display a striped progress bar.
	*/
	/**
	* Displays the strength of a password input as a progress bar.
	* @augments {BaseComponent<PasswordStrengthOptions>}
	*/
	var PasswordStrength = class extends _fr0st_ui.BaseComponent {
		#container;
		#describedBy;
		#progress;
		#progressBar;
		/**
		* Calculates the strength of a password.
		* @param {string} password The password.
		* @returns {number} The password strength, from 0 to 100.
		*/
		static getStrength(password) {
			return getStrength(password);
		}
		/**
		* Creates a PasswordStrength.
		* @param {HTMLElement} node The input node.
		* @param {PasswordStrengthOptions} [options] The PasswordStrength options.
		*/
		constructor(node, options) {
			super(node, options);
			if (this.options.container) this.#container = _fr0st_query.default.findOne(this.options.container);
			else this.#container = _fr0st_query.default.closest(this.node, ":not(.form-input):not(.input-group)").shift();
			this.#render();
			this.#refresh();
			this.#events();
		}
		/** @inheritdoc */
		dispose() {
			_fr0st_query.default.remove(this.#progress);
			_fr0st_query.default.removeEvent(this.node, "input.ui.passwordstrength");
			if (this.#describedBy === null) _fr0st_query.default.removeAttribute(this.node, "aria-describedby");
			else _fr0st_query.default.setAttribute(this.node, { "aria-describedby": this.#describedBy });
			this.#container = null;
			this.#progress = null;
			this.#progressBar = null;
			super.dispose();
		}
		/**
		* Gets the password strength.
		* @returns {number} The password strength, from 0 to 100.
		*/
		getStrength() {
			const value = _fr0st_query.default.getValue(this.node);
			return this.constructor.getStrength(value);
		}
		/**
		* Attaches events for the PasswordStrength.
		*/
		#events() {
			_fr0st_query.default.addEvent(this.node, "input.ui.passwordstrength", (_) => {
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
			_fr0st_query.default.setStyle(this.#progressBar, { width: `${strength}%` });
			_fr0st_query.default.setAttribute(this.#progressBar, {
				"class": this.constructor.classes.progressBar,
				"aria-valuenow": strength
			});
			_fr0st_query.default.addClass(this.#progressBar, nextLevel.class);
			if (this.options.striped) _fr0st_query.default.addClass(this.#progressBar, this.constructor.classes.progressBarStriped);
			if (nextLevel.text) _fr0st_query.default.setText(this.#progressBar, nextLevel.text);
		}
		/**
		* Renders the password strength element.
		*/
		#render() {
			this.#describedBy = _fr0st_query.default.getAttribute(this.node, "aria-describedby");
			this.#progress = _fr0st_query.default.create("div", { class: this.constructor.classes.progress });
			const id = (0, _fr0st_ui.generateId)("password-strength");
			this.#progressBar = _fr0st_query.default.create("div", { attributes: {
				"id": id,
				"role": "progressbar",
				"aria-valuemin": 0,
				"aria-valuemax": 100
			} });
			_fr0st_query.default.append(this.#progress, this.#progressBar);
			_fr0st_query.default.append(this.#container, this.#progress);
			const describedBy = [this.#describedBy, id].filter(Boolean).join(" ");
			_fr0st_query.default.setAttribute(this.node, { "aria-describedby": describedBy });
		}
	};

//#endregion
//#region src/index.js
/** @import { PasswordStrengthOptions } from './password-strength.js'; */
	/** @type {PasswordStrengthOptions} */
	PasswordStrength.defaults = {
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
		striped: false
	};
	PasswordStrength.classes = {
		progress: "progress mt-2",
		progressBar: "progress-bar",
		progressBarStriped: "progress-bar-striped"
	};
	(0, _fr0st_ui.initComponent)("passwordstrength", PasswordStrength);
	var src_default = PasswordStrength;

//#endregion
exports.PasswordStrength = src_default;
});
//# sourceMappingURL=frost-ui-passwordstrength.js.map