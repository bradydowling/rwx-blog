---
title:  "Working with a Recruiting Agency: The Good, the Bad, and the Ugly"
date: "2020-02-05T16:51:00.000Z"
layout: post
draft: true
path: "/posts/recruiting-agency-good-bad-ugly/"
category: "Interviewing"
tags:
  - "Interviewing"
  - "Career"
description: "Stuff"
---

Set up autoformatting with VS Code and stuff.

- Make sure local npm packages are installed
 - Delete your `node_modules` directory and your `package-lock.json` file if those already exist
 - Run `npm install`


## Repository configuration

### Install necessary dependencies

Install the packages we need:

```
$ npm install eslint-config-prettier eslint-loader eslint-plugin-prettier eslint-plugin-react prettier
```

TODO: Mention the difference between a loader, a config, and a plugin.

Now your `package.json` file will contain `scripts` and `devDependencies` sections that look something like this:

```
  "scripts": {
    "lint": "eslint './src/**/*.{js,jsx}'",
    "lint:fix": "eslint './src/**/*.{js,jsx}' --fix",
  },
  "devDependencies": {
    "eslint-config-prettier": "^6.10.0",
    "eslint-loader": "^3.0.3",
    "eslint-plugin-prettier": "^3.1.2",
    "eslint-plugin-react": "^7.18.3",
    "husky": "^4.2.3",
    "lint-staged": "^10.0.8",
    "prettier": "1.19.1"
  },
```

Add the following lines to your package.json file under the `scripts` key:
```
    "lint": "eslint './src/**/*.{js,jsx}'",
    "lint:fix": "eslint './src/**/*.{js,jsx}' --fix",
```

### Configure eslint and prettier

`.eslintrc.js`

```
module.exports = {
    root: true,
    env: {
      browser: true,
      node: true
    },
    parserOptions: {
      parser: 'babel-eslint',
      ecmaVersion: 2018,
      sourceType: 'module'
    },
    extends: [
      'prettier',
      'plugin:prettier/recommended',
      'plugin:react/recommended'
    ],
    plugins: [
        'react',
        'prettier'
    ],
    // add your custom rules here
    rules: {
        "react/prop-types": 1
    }
  }
```

`.prettierrc`
```
{
    "singleQuote": true
}
```

## VS Code configuration

- Install the `prettier` and `eslint` VS Code extensions using the extensions panel (`Command` + `Shift` + `X`)
- Make sure `eslint` is installed globally (normally you can use the dev dependency in the repo but because CRA hides it up, VS Code can't find the local binary)
- Press `Command` + `Shift` + `P` then search for Open Settings (JSON) (if you can't find it, try [things mentioned here](https://stackoverflow.com/questions/54785520/vs-code-how-to-open-json-settings-with-defaults))
- Add the following to your `settings.json`:

```
{
    "editor.formatOnSave": false,
    // turn it off for JS and JSX, we will do this via eslint
    "[javascript]": {
        "editor.formatOnSave": false
    },
    "[javascriptreact]": {
        "editor.formatOnSave": false
    },
    // tell the ESLint plugin to run on save
    "eslint.validate": [ "html", "javascript", "javascriptreact"],
    // Optional BUT IMPORTANT: If you have the prettier extension enabled for other languages like CSS and HTML, turn it off for JS since we are doing it through Eslint already
    "prettier.disableLanguages": [
        "javascript", "javascriptreact"
    ],
    "eslint.workingDirectories": [
        {
            "mode": "auto"
        }
    ],
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
    }
}
```

## Changes to Git

First let's make sure we don't commit our `.eslintcache` file that will show up sometimes by adding the following line to your `.gitignore` file:
```
.eslintcache
```

Now we will install packages for linting staged files as part of a pre-commit git hook. This will prevent files from making it into the repository unless they are properly linted as we configured above.

### Automatic (recommended) method
Use the command from the `lint-staged` repo to set it up:
```
$ npx mrm lint-staged
```
This essentially performs everything in that's done in the manual method, but this does it automatically 😁

### Manual method
```
npm install husky lint-staged
```

Now your `package.json` file will contain `husky` and `lint-staged` sections that look something like this:
```
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.js": "eslint --cache --fix"
  }
```

TODO: Include the final output of important files so people can copy/paste stuff.