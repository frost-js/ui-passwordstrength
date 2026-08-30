const $ = globalThis.$;
const { PasswordStrength } = globalThis.UI;

const setTheme = (theme) => {
    if (theme === 'system') {
        $(document.documentElement).removeAttribute('data-ui-theme');
    } else {
        $(document.documentElement).setAttribute('data-ui-theme', theme);
    }

    $('[data-demo-theme]').setValue(theme);
};

const storedTheme = localStorage.getItem('frostui-passwordstrength-demo-theme');
setTheme(['light', 'dark'].includes(storedTheme) ? storedTheme : 'system');

$.ready(() => {
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

    $('[data-demo-theme]').addEvent('change', (event) => {
        const theme = $.getValue(event.currentTarget);

        if (theme === 'system') {
            localStorage.removeItem('frostui-passwordstrength-demo-theme');
        } else {
            localStorage.setItem('frostui-passwordstrength-demo-theme', theme);
        }

        setTheme(theme);
    });

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

    setTheme(document.documentElement.dataset.uiTheme || 'system');
});
