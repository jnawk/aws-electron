module.exports = {
    "env": {
        "node": true,
        "browser": true,
        "es6": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaFeatures": {
            "experimentalObjectRestSpread": true,
            "jsx": true
        },
        "sourceType": "module"
    },
    "plugins": [
        "react"
    ],
    "rules": {
        "indent": [
            "error",
            4
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        "react/jsx-uses-vars": [
            "error"
        ],
        "react/jsx-uses-react": [
            "error"
        ],
         "no-console": [
            "error",
            {
                "allow": [
                    "log",
                    "error"
                ]
            }
        ]
    }
};
