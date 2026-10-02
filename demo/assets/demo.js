const $ = globalThis.fQuery;
const { PasswordStrength } = globalThis.UI;
const themeKey = 'frostui-passwordstrength-demo-theme';

const setTheme = (theme) => {
    if (theme === 'system') {
        $(document.documentElement).removeAttribute('data-ui-theme');
    } else {
        $(document.documentElement).setAttribute('data-ui-theme', theme);
    }

    $('[data-demo-theme]').setValue(theme);
};

$.ready(() => {
    let storedTheme;

    try {
        storedTheme = localStorage.getItem(themeKey);
    } catch {
        // The demo remains usable when browser storage is unavailable.
    }

    const requestedTheme = new URLSearchParams(location.search).get('theme');
    const initialTheme = requestedTheme || storedTheme;
    setTheme(['light', 'dark'].includes(initialTheme) ? initialTheme : 'system');

    $('[data-demo-theme]').addEvent('change', (event) => {
        const theme = $.getValue(event.currentTarget);
        setTheme(theme);

        try {
            if (theme === 'system') {
                localStorage.removeItem(themeKey);
            } else {
                localStorage.setItem(themeKey, theme);
            }
        } catch {
            // Theme selection still applies for the current page.
        }
    });

    const customLevels = [
        {
            class: 'text-bg-danger',
            score: 0,
            text: 'Risky',
        },
        {
            class: 'text-bg-warning',
            score: 20,
            text: 'Improving',
        },
        {
            class: 'text-bg-info',
            score: 40,
            text: 'Fair',
        },
        {
            class: 'text-bg-primary',
            score: 60,
            text: 'Good',
        },
        {
            class: 'text-bg-success',
            score: 80,
            text: 'Excellent',
        },
    ];

    $('[data-ui-toggle="passwordstrength"]').passwordstrength();
    $('#custom-levels-password').passwordstrength({ levels: customLevels });
    $('#methods-password').passwordstrength();

    $('[data-demo-method]').addEvent('click', (event) => {
        const method = $.getDataset(event.currentTarget, 'demoMethod');
        const node = $.findOne('#methods-password');
        const current = $.getData(node, 'passwordstrength');

        switch (method) {
            case 'init':
                PasswordStrength.init(node);
                $.setText('#method-output', 'Initialized. Input changes now refresh the progress bar.');
                break;
            case 'getStrength': {
                const instance = PasswordStrength.init(node);
                $.setText('#method-output', `Instance strength: ${instance.getStrength()} / 100.`);
                break;
            }
            case 'dispose':
                if (current) {
                    current.dispose();
                    $.setText('#method-output', 'Disposed. Generated progress and events were removed.');
                } else {
                    $.setText('#method-output', 'Already disposed.');
                }
                break;
        }
    });

    const updateStaticScore = () => {
        const password = $.getValue('#static-password');
        const score = PasswordStrength.getStrength(password);
        $.setText('#static-output', `${score} / 100`);
    };

    $.addEvent('#static-password', 'input', updateStaticScore);
    updateStaticScore();
});
