module.exports = {
    'env': {
        'commonjs': true,
        'es2021': true,
        'node': true,
        'mocha': true
    },
    'extends': [ 'eslint:recommended', 'plugin:mocha/recommended' ],
    'parserOptions': {
        'ecmaVersion': 12
    },
    'plugins': [
        'mocha'
    ],
    'rules': {
        'indent': [
            'error',
            4
        ],
        'linebreak-style': [
            'error',
            'unix'
        ],
        'quotes': [
            'error',
            'single'
        ],
        'semi': [
            'error',
            'always'
        ]
    }
};
