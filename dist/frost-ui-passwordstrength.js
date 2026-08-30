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

//#region src/password-strength.js
/**
	* PasswordStrength Class
	* @class
	*/
	var PasswordStrength = class extends _fr0st_ui.BaseComponent {
		/**
		* New PasswordStrength constructor.
		* @param {HTMLElement} node The input node.
		* @param {object} [options] The options to create the PasswordStrength with.
		*/
		constructor(node, options) {
			super(node, options);
			if (this._options.container) this._container = _fr0st_query.default.findOne(this._options.container);
			else this._container = _fr0st_query.default.closest(this._node, ":not(.form-input):not(.input-group)");
			this._render();
			this._refresh();
			this._events();
		}
		/**
		* Dispose the PasswordStrength.
		*/
		dispose() {
			_fr0st_query.default.remove(this._progress);
			_fr0st_query.default.removeEvent(this._node, "input.ui.passwordstrength");
			_fr0st_query.default.removeAttribute(this._node, "aria-describedby");
			this._container = null;
			this._progress = null;
			this._progressBar = null;
			super.dispose();
		}
		/**
		* Get the password strength.
		* @return {number} The password strength. (0, 100)
		*/
		getStrength() {
			const value = _fr0st_query.default.getValue(this._node);
			return this.constructor.getStrength(value);
		}
	};

//#endregion
//#region src/prototype/events.js
/**
	* Attach events for the PasswordStrength.
	*/
	function _events() {
		_fr0st_query.default.addEvent(this._node, "input.ui.passwordstrength", (_) => {
			this._refresh();
		});
	}

//#endregion
//#region src/prototype/helpers.js
/**
	* Refresh the password strength.
	*/
	function _refresh() {
		const strength = this.getStrength();
		let nextLevel;
		for (const level of this._options.levels) {
			if (strength < level.score) break;
			nextLevel = level;
		}
		_fr0st_query.default.setStyle(this._progressBar, { width: `${strength}%` });
		_fr0st_query.default.setAttribute(this._progressBar, {
			"class": this.constructor.classes.progressBar,
			"aria-valuenow": strength
		});
		_fr0st_query.default.addClass(this._progressBar, nextLevel.class);
		if (this._options.striped) _fr0st_query.default.addClass(this._progressBar, this.constructor.classes.progressBarStriped);
		if (nextLevel.text) _fr0st_query.default.setText(this._progressBar, nextLevel.text);
	}

//#endregion
//#region src/prototype/render.js
/**
	* Render the password strength element.
	*/
	function _render() {
		this._progress = _fr0st_query.default.create("div", { class: this.constructor.classes.progress });
		const id = (0, _fr0st_ui.generateId)("password-strength");
		this._progressBar = _fr0st_query.default.create("div", { attributes: {
			"id": id,
			"role": "progressbar",
			"aria-valuemin": 0,
			"aria-valuemax": 100
		} });
		_fr0st_query.default.append(this._progress, this._progressBar);
		_fr0st_query.default.append(this._container, this._progress);
		_fr0st_query.default.setAttribute(this._node, { "aria-describedby": id });
	}

//#endregion
//#region src/static/helpers.js
/**
	* Find character sequences in a string.
	* @param {string} string The input string.
	* @param {array} locations The character locations.
	* @return {array} The character sequences.
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
	* Get the strength of a password.
	* @param {string} password The password.
	* @return {number} The password strength.
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
//#region src/index.js
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
	PasswordStrength.getStrength = getStrength;
	var proto = PasswordStrength.prototype;
	proto._events = _events;
	proto._refresh = _refresh;
	proto._render = _render;
	(0, _fr0st_ui.initComponent)("passwordstrength", PasswordStrength);
	var src_default = PasswordStrength;

//#endregion
exports.PasswordStrength = src_default;
});
//# sourceMappingURL=frost-ui-passwordstrength.js.map