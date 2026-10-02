# Frost UI PasswordStrength

[![CI](https://github.com/frost-js/ui-passwordstrength/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/frost-js/ui-passwordstrength/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/frost-js/ui-passwordstrength/branch/main/graph/badge.svg)](https://codecov.io/gh/frost-js/ui-passwordstrength)
[![npm version](https://img.shields.io/npm/v/%40fr0st%2Fui-passwordstrength?style=flat-square)](https://www.npmjs.com/package/@fr0st/ui-passwordstrength)
[![npm downloads](https://img.shields.io/npm/dm/%40fr0st%2Fui-passwordstrength?style=flat-square)](https://www.npmjs.com/package/@fr0st/ui-passwordstrength)
[![JS gzip size](https://img.badgesize.io/frost-js/ui-passwordstrength/main/dist/frost-ui-passwordstrength.min.js?compression=gzip&label=JS%20gzip%20size&style=flat-square)](https://github.com/frost-js/ui-passwordstrength/blob/main/dist/frost-ui-passwordstrength.min.js)
[![license](https://img.shields.io/github/license/frost-js/ui-passwordstrength?style=flat-square)](./LICENSE)

Password-strength indicator for Frost UI with configurable thresholds, semantic feedback, accessible progress state, and instance or static scoring APIs.

## Highlights

- Live scoring driven by the password input's native `input` event
- Automatic refresh after a form reset, unless the reset is canceled
- Configurable ordered thresholds, labels, and Frost UI semantic color classes
- Default or explicit progress-container placement
- Optional UI v4 striped progress treatment
- Accessible progress markup with reversible `aria-describedby` integration
- Public instance and static scoring methods with an optional custom scorer
- Configurable common-password penalties with a small built-in list
- Native `PasswordStrength` class and `passwordstrength` fQuery plugin
- Existing-instance reuse with frozen resolved options
- Prebuilt ESM and UMD bundles with source maps
- No component-specific CSS or Sass
- JSDoc-powered IntelliSense

Explore [the demo](./demo/index.html) for interactive examples.

## Installation

### Browser projects / bundlers

```bash
npm i @fr0st/ui-passwordstrength
```

Frost UI PasswordStrength's package entry point is ESM-only and requires a browser DOM. Import the default `PasswordStrength` export and the stylesheets in browser projects and bundlers.

```js
import '@fr0st/ui/dist/frost-ui.min.css';
import PasswordStrength from '@fr0st/ui-passwordstrength';
```

`@fr0st/ui` and `@fr0st/query` are peer dependencies so the component shares the application's instances.

### Browser (ESM)

The ESM bundle imports `@fr0st/ui` and `@fr0st/query`. fQuery also imports `@fr0st/core`, so map all three dependencies when loading the bundle directly in a browser:

```html
<link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/@fr0st/ui@latest/dist/frost-ui.min.css">
<script type="importmap">
{
    "imports": {
        "@fr0st/core": "https://cdn.jsdelivr.net/npm/@fr0st/core@latest/dist/frost-core.esm.min.js",
        "@fr0st/query": "https://cdn.jsdelivr.net/npm/@fr0st/query@latest/dist/fquery.esm.min.js",
        "@fr0st/ui": "https://cdn.jsdelivr.net/npm/@fr0st/ui@latest/dist/frost-ui.esm.min.js"
    }
}
</script>
<script type="module">
    import PasswordStrength from 'https://cdn.jsdelivr.net/npm/@fr0st/ui-passwordstrength@latest/dist/frost-ui-passwordstrength.esm.min.js';
</script>
```

### Browser (UMD)

Load the bundles from your own copy or a CDN:

```html
<link
    rel="stylesheet"
    href="/path/to/dist/frost-ui.min.css">
<script src="/path/to/dist/frost-ui-bundle.min.js"></script>
<script src="/path/to/dist/frost-ui-passwordstrength.min.js"></script>
<!-- or -->
<link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/@fr0st/ui@latest/dist/frost-ui.min.css">
<script src="https://cdn.jsdelivr.net/npm/@fr0st/ui@latest/dist/frost-ui-bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@fr0st/ui-passwordstrength@latest/dist/frost-ui-passwordstrength.min.js"></script>
<script>
    const { PasswordStrength } = globalThis.UI;
</script>
```

The UMD bundle adds `PasswordStrength` to the existing `globalThis.UI` object. Load Frost UI's all-in-one bundle first; it supplies the `UI` and `fQuery` globals.

The package root resolves to the prebuilt ESM bundle. Published files under `dist/` and `src/` are also available through matching package subpaths.

## Usage

Start with a normal password input inside a Frost UI form control. By default, PasswordStrength inserts its progress markup into the closest ancestor that is not `.form-input` or `.input-group`:

```html
<div id="password-field">
    <div class="form-input">
        <label for="password">Password</label>
        <input
            class="input-outline"
            id="password"
            name="password"
            type="password"
            autocomplete="new-password">
        <div class="form-text">Use a long, unique password.</div>
    </div>
</div>
```

```js
import PasswordStrength from '@fr0st/ui-passwordstrength';

const passwordStrength = PasswordStrength.init(
    document.querySelector('#password'),
);

console.log(passwordStrength.getStrength());
```

Calling `PasswordStrength.init()` again for the same input returns its existing instance. Dispose the current instance before reinitializing the input with different options.

The indicator renders the initial value and refreshes on `input` events. After changing the input's value in JavaScript, dispatch an `input` event to refresh the indicator; `getStrength()` only returns the current score.

Form resets refresh the indicator after the browser restores the input's default value. This refresh is deferred until after the reset event finishes and is skipped if the reset is canceled. Inputs associated with a form through the `form` attribute are also supported.

## Options

Options are resolved in this order:

1. Component defaults
2. The element's `data-ui-*` attributes
3. Options passed to `PasswordStrength.init()`

Resolved `instance.options` are shallow-frozen.

Supplied `levels` and `commonPasswords` arrays replace the corresponding defaults completely, including when supplied through data attributes. Arrays passed through JavaScript options take precedence over arrays from data attributes. Supplied arrays and level objects are copied into the resolved configuration.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `commonPasswords` | `string[]` | `PasswordStrength.defaults.commonPasswords` | Passwords the built-in scorer treats as very weak. Matching is case-insensitive and recognizes simple decorations and common leet substitutions. |
| `container` | `string \| null` | `null` | CSS selector for the element that receives the generated progress markup. `null` uses the closest field container. |
| `levels` | `PasswordStrengthLevel[]` | See below | Ordered score thresholds with a semantic class and optional label. |
| `scorer` | `(password, commonPasswords) => number` | Built-in scorer | Calculate a score for the current password. Results are normalized and clamped between `0` and `100`. |
| `striped` | `boolean` | `false` | Apply UI's `progress-bar-striped` class to the generated progress bar. |

The default common-password list is intentionally small to keep the bundle lightweight. Pass `commonPasswords: []` to disable list matching while retaining the other scoring rules. To extend the default list with application-specific terms, include the defaults explicitly:

```js
PasswordStrength.init(node, {
    commonPasswords: [
        ...PasswordStrength.defaults.commonPasswords,
        'example-company',
        'example-product',
    ],
});
```

Provide `scorer` to replace the built-in heuristic without adding a scoring dependency to the base bundle. The callback receives the current password and resolved `commonPasswords` option:

```js
PasswordStrength.init(node, {
    scorer: (password, commonPasswords) => {
        if (commonPasswords.includes(password.toLowerCase())) {
            return 0;
        }

        return Math.min(password.length * 5, 100);
    },
});
```

Each level has a numeric `score`, a CSS `class`, and an optional `text` label. An empty or omitted label clears the previous label. Defaults are ordered from lowest to highest threshold:

| Score | Class | Text |
| ---: | --- | --- |
| `0` | `text-bg-danger` | Very Weak |
| `20` | `text-bg-danger` | Weak |
| `40` | `text-bg-warning` | Normal |
| `60` | `text-bg-success` | Strong |
| `80` | `text-bg-success` | Very Strong |

Provide a complete array when replacing all default levels:

```js
const passwordStrength = PasswordStrength.init(node, {
    container: '#password-strength-output',
    levels: [
        { score: 0, class: 'text-bg-danger', text: 'Risky' },
        { score: 20, class: 'text-bg-warning', text: 'Improving' },
        { score: 40, class: 'text-bg-info', text: 'Fair' },
        { score: 60, class: 'text-bg-primary', text: 'Good' },
        { score: 80, class: 'text-bg-success', text: 'Excellent' },
    ],
    striped: true,
});
```

Provide at least one level, starting at `0`, and sort levels by ascending score. The last level whose threshold is less than or equal to the score is selected. Scores are clamped between `0` and `100`.

## Data attributes

Use kebab-case `data-ui-*` attributes for serializable options. Arrays and objects use JSON. Supply callbacks and DOM nodes through JavaScript.

| Attribute | Example |
| --- | --- |
| `data-ui-common-passwords` | `data-ui-common-passwords='["password","example-company"]'` |
| `data-ui-container` | `data-ui-container="#password-strength-output"` |
| `data-ui-levels` | `data-ui-levels='[{"score":0,"class":"text-bg-danger","text":"Risky"}]'` |
| `data-ui-striped` | `data-ui-striped="true"` |

```html
<input
    id="password"
    type="password"
    data-ui-toggle="passwordstrength"
    data-ui-container="#password-strength-output"
    data-ui-striped="true">

<div id="password-strength-output"></div>
```

```js
import $ from '@fr0st/query';
import '@fr0st/ui-passwordstrength';

$('[data-ui-toggle="passwordstrength"]').passwordstrength();
```

Data attributes configure options; they do not initialize PasswordStrength by themselves. Initialize the component through the class or fQuery plugin. Changing an option's data attribute after initialization does not reconfigure the existing instance.

## Methods

| Method | Returns | Description |
| --- | --- | --- |
| `PasswordStrength.init(node, options?)` | `PasswordStrength` | Return the existing instance for an element or create one. |
| `dispose()` | `void` | Remove generated markup, input and form-reset listeners, and registered component state, then restore the original ARIA state. |
| `getStrength()` | `number` | Score the instance input's current value from `0` to `100`. |

```js
const passwordStrength = PasswordStrength.init(node, {
    striped: true,
});

const score = passwordStrength.getStrength();

passwordStrength.dispose();
```

## Static API

Use `PasswordStrength.getStrength(password, commonPasswords?)` to run the built-in scorer without creating an instance or rendering progress markup:

```js
const score = PasswordStrength.getStrength('CorrectHorseBatteryStaple');

console.log(score); // 100
```

The static method always uses the built-in scorer and returns a score from `0` to `100`. It uses `PasswordStrength.defaults.commonPasswords` unless a replacement list is supplied as the second argument. An instance's custom `scorer` and options do not change the static method.

The built-in scorer treats length as the primary strength factor. It heavily penalizes configured common passwords and simple variants, repeated characters and substrings, ascending and descending sequences, and keyboard-row patterns. Character variety provides only a small adjustment within each length band. Unicode is normalized with NFKC and counted by code point.

Common-password matches after case and Unicode normalization score `0`; recognized variants score `5`. Variant matching handles decorations, numeric prefixes or suffixes, and common leet substitutions, including combinations such as:

```js
PasswordStrength.getStrength('administrator', ['administrator']); // 0
PasswordStrength.getStrength('@dministrator!', ['administrator']); // 5
PasswordStrength.getStrength('!@dministrator123!', ['administrator']); // 5
```

It is a lightweight UI feedback heuristic, not an entropy estimate, breach check, or substitute for application security policy.

## Lifecycle

Calling `PasswordStrength.init()` again for the same element returns its existing instance. Dispose the current instance before reinitializing with different options.

An instance exposes its original element as `instance.node` and its shallow-frozen resolved configuration as `instance.options`. Both become `null` after disposal.

`dispose()` releases resources owned by the component and removes its registered instance. Repeated disposal is safe and does not affect a new instance initialized on the same element. Use a new instance before calling other methods after disposal.

If initialization fails, the component releases resources it created and removes its registered instance before rethrowing the error. The element can then be initialized again.

## fQuery API

Importing PasswordStrength registers `passwordstrength` on `fQuery.QuerySet`:

```js
import $ from '@fr0st/query';
import '@fr0st/ui-passwordstrength';

const passwordStrength = $('#password').passwordstrength({
    striped: true,
});

const score = $('#password').passwordstrength('getStrength');

$('#password').passwordstrength('dispose');
```

Pass an options object to initialize every matched element, or pass a public method name followed by its arguments. The first component or method result is returned.

## Accessibility

- The generated indicator uses `role="progressbar"` with `aria-valuemin="0"`, `aria-valuemax="100"`, and an updated `aria-valuenow` score.
- The active level's text is rendered inside the progress bar when the level supplies a label.
- A unique generated progress ID is appended to the input's existing `aria-describedby` value instead of replacing it.
- Disposal restores the original `aria-describedby` state exactly, including absent and empty values.
- Disposal also removes the generated progress markup, namespaced input and form-reset listeners, and registered component data.
- The original password input remains the interactive and submitted form control.

Applications remain responsible for meaningful labels, password requirements, validation feedback, and error messages. Treat the displayed score as guidance rather than proof that a password is safe.

## Themes and RTL

Frost UI follows the user's preferred color scheme by default. Set `data-ui-theme="light"` or `data-ui-theme="dark"` on the document or an ancestor to select a theme explicitly.

PasswordStrength uses Frost UI progress and semantic color classes. Labels and progress markup follow the surrounding text direction.

## Development

Install dependencies with `npm ci`, then install Playwright browsers with `npx playwright install --with-deps`.

```bash
npm test
npm run lint
npm run build
```

`npm test` rebuilds the bundles, then runs the Playwright suite in Chromium, Firefox, and WebKit. `npm run test:browser` runs the suite against the existing bundles, so rebuild after changing source files.

After building, `npm run test:coverage` runs Chromium tests and writes coverage reports to `coverage/`.

`npm run test:headed` and `npm run test:ui` also use the existing bundles and open headed browsers or the Playwright UI.

To view the demo, open `demo/index.html` in your browser after building.

## License

Frost UI PasswordStrength is released under the [MIT License](./LICENSE).
