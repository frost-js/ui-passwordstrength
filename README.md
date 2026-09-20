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
- Configurable ordered thresholds, labels, and Frost UI semantic color classes
- Default or explicit progress-container placement
- Optional UI v4 striped progress treatment
- Existing-instance reuse with frozen resolved options
- Accessible progress markup with reversible `aria-describedby` integration
- Native `PasswordStrength` class and `passwordstrength` fQuery plugin
- Public instance and static scoring methods with an optional custom scorer
- Configurable common-password penalties with a small built-in list
- Prebuilt ESM and UMD bundles with source maps
- No component-specific CSS or Sass
- JSDoc-powered IntelliSense

## Installation

### Browser projects / bundlers

Install PasswordStrength with its Frost UI 4 and fQuery 5 peers:

```bash
npm i @fr0st/ui-passwordstrength @fr0st/ui @fr0st/query
```

The package root resolves to the compiled ESM bundle. Import the Frost UI stylesheet and the default component export:

```js
import '@fr0st/ui/dist/frost-ui.min.css';
import PasswordStrength from '@fr0st/ui-passwordstrength';

const passwordStrength = PasswordStrength.init(
    document.querySelector('#password'),
    {
        striped: true,
    },
);
```

`@fr0st/ui` and `@fr0st/query` are peer dependencies so the component shares the application's UI and fQuery instances. The package root, `dist/*`, and `src/*` are available through package exports.

PasswordStrength requires a browser DOM or a compatible DOM environment configured through fQuery. Server-rendered applications should load the component on the client.

### Browser (ESM)

The ESM bundle imports `@fr0st/ui` and `@fr0st/query`. Frost UI and fQuery also require `@fr0st/core`, so map all three dependencies when loading the bundle directly in a browser:

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

    PasswordStrength.init(document.querySelector('#password'));
</script>
```

### Browser (UMD)

Load Frost UI's all-in-one bundle before PasswordStrength. The UI bundle supplies both the `UI` and `fQuery` globals expected by the component:

```html
<link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/@fr0st/ui@latest/dist/frost-ui.min.css">

<script src="https://cdn.jsdelivr.net/npm/@fr0st/ui@latest/dist/frost-ui-bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@fr0st/ui-passwordstrength@latest/dist/frost-ui-passwordstrength.min.js"></script>
<script>
    const passwordStrength = UI.PasswordStrength.init(
        document.querySelector('#password'),
    );
</script>
```

The UMD bundle adds `PasswordStrength` to the existing `globalThis.UI` object. It expects `globalThis.UI` and `globalThis.fQuery` to exist before it loads. If the non-bundled Frost UI build is used instead, load fQuery, Frost UI, and PasswordStrength in that order.

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

## Options

Options are resolved in this order:

1. Component defaults
2. The input's `data-ui-*` attributes
3. Options passed to `PasswordStrength.init()`

Resolved `instance.options` are frozen.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `commonPasswords` | `string[]` | See below | Passwords the built-in scorer treats as very weak. Matching is case-insensitive and recognizes simple decorations and common leet substitutions. |
| `container` | `string \| null` | `null` | CSS selector for the element that receives the generated progress markup. `null` uses the closest field container. |
| `levels` | `PasswordStrengthLevel[]` | See below | Ordered score thresholds with a semantic class and optional label. |
| `scorer` | `(password, commonPasswords) => number` | Built-in scorer | Calculate a score for the current password. Results are normalized and clamped between `0` and `100`. |
| `striped` | `boolean` | `false` | Apply UI's `progress-bar-striped` class to the generated progress bar. |

The default common-password list is intentionally small to keep the bundle lightweight. Extend it with application-specific terms:

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

Each level has a numeric `score`, a CSS `class`, and an optional `text` label. Defaults are ordered from lowest to highest threshold:

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

The first level should start at `0`, and levels should be sorted by ascending score. Scores are clamped between `0` and `100`.

## Data attributes

Serializable options can be supplied through `data-ui-*` attributes. Structured values such as `commonPasswords` and `levels` use JSON. The `scorer` callback must be supplied through JavaScript.

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

The component still needs to be initialized through the class or fQuery plugin. The demo uses `data-ui-toggle="passwordstrength"` as a shared initialization selector:

```js
$('[data-ui-toggle="passwordstrength"]').passwordstrength();
```

The `data-ui-toggle` attribute does not initialize PasswordStrength by itself.

## Methods

| Method | Returns | Description |
| --- | --- | --- |
| `PasswordStrength.init(node, options?)` | `PasswordStrength` | Return the existing instance for an input or create one. |
| `getStrength()` | `number` | Score the instance input's current value from `0` to `100`. |
| `dispose()` | `void` | Remove generated markup, input events, and registered component state, then restore the original ARIA state. |

```js
const passwordStrength = PasswordStrength.init(node, {
    striped: true,
});

const score = passwordStrength.getStrength();

passwordStrength.dispose();
```

An instance also exposes its original input as `instance.node` and its frozen resolved configuration as `instance.options`. Both become `null` after disposal.

## Static API

Use `PasswordStrength.getStrength(password, commonPasswords?)` to run the built-in scorer without creating an instance or rendering progress markup:

```js
const score = PasswordStrength.getStrength('CorrectHorseBatteryStaple');

console.log(score); // 100
```

The built-in scorer treats length as the primary strength factor. It heavily penalizes configured common passwords and simple variants, repeated characters and substrings, ascending and descending sequences, and keyboard-row patterns. Character variety provides only a small adjustment within each length band. Unicode is normalized and counted by code point.

It is a lightweight UI feedback heuristic, not an entropy estimate, breach check, or substitute for application security policy.

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

Pass an options object to initialize every matched input, or pass a public method name followed by its arguments. The first component or method result is returned.

## Accessibility

- The generated indicator uses `role="progressbar"` with `aria-valuemin="0"`, `aria-valuemax="100"`, and an updated `aria-valuenow` score.
- The active level's text is rendered inside the progress bar when the level supplies a label.
- A unique generated progress ID is appended to the input's existing `aria-describedby` value instead of replacing it.
- Disposal restores the original `aria-describedby` state exactly, including absent and empty values.
- Disposal also removes the generated progress markup, namespaced input listener, and registered component data.
- The original password input remains the interactive and submitted form control.

Applications remain responsible for meaningful labels, password requirements, validation feedback, and error messages. Treat the displayed score as guidance rather than proof that a password is safe.

## Development

```bash
npm test
npm run lint
npm run build
```

`npm test` builds the bundles and runs the Playwright suite in Chromium, Firefox, and WebKit.

## License

Frost UI PasswordStrength is released under the [MIT License](./LICENSE).
