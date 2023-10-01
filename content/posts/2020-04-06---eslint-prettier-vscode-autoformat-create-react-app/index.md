---
title:  "Setting up Create React App, VS Code, ESLint, and Prettier"
date: "2020-04-06T16:51:00.000Z"
template: "post"
draft: false
slug: "/posts/setting-up-create-react-app-vs-code-eslint-prettier/"
category: "Tutorials"
tags:
  - "JavaScript"
  - "Tutorials"
description: "A brief guide to configuring VS Code to automatically format code in your CRA app using ESLint and Prettier"
---

In this post we'll walk through how to setup a new or existing React project to automatically lint and format code. We'll be using VS Code as our editor, Create React App (CRA) to create our React application, and ESLint and Prettier to do the actual code formatting and linting.

One of the major benefits of Create React App is that it handles configuration of Webpack and several other dependencies for you, while you just get to consume this one dependency. Some guides for setting up automatic code formatting in VS Code with CRA (create-react-app) will ask you to "eject" from Create React App by running `npm run eject`. This takes away a lot of the benefits of Create React App and is irreversible so with this guide we'll avoid that. This will give us all the configuration benefits of CRA while also giving us the automatic code formatting we want from our other tools.

## Create our app

As "step 0", we'll go ahead and create our app, in case you're not using a preexisting application (which this tutorial should work with as well). We'll call it `clean-code-app` since the code will be formatted according to the standard we define.

```
$ npx create-react-app clean-code-app
$ cd clean-code-app
```

## Repository configuration

### Install eslint and prettier

Now that we have our application and we've changed directory into it, we'll want to install the packages and dependencies we need. Notably missing from the dependencies list that follows is `eslint`. `create-react-app` gives you an application with `eslint` preinstalled so we don't need to install that.

_**Note:** You can use `npm` or `yarn` to install packages. If you don't know the difference right now then don't worry, they'll both work well for you so just use `npm`._

#### npm
```
$ npm install --save-dev prettier eslint-loader eslint-config-prettier eslint-plugin-prettier eslint-plugin-react
```
#### yarn
```
$ yarn add --dev prettier eslint-loader eslint-config-prettier eslint-plugin-prettier eslint-plugin-react
```

Then to allow you (and VS Code) to easily lint and fix files in your repository, go ahead and add the following lines to your `package.json` file under the `scripts` key:

```
    "lint": "eslint './src/**/*.{js,jsx}'",
    "lint:fix": "eslint './src/**/*.{js,jsx}' --fix",
```

Now your `package.json` file will contain `scripts` and `devDependencies` sections that look something like this (though for existing projects, these sections will contain more entries):

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
    "prettier": "1.19.1"
  },
```

_**Note:** Don't worry about the package versions listed here. You will likely be installing later versions of each of these packages. As long as you run the `npm install` or `yarn add` command I included above, you're on your way._

### Configure eslint and prettier

Now we'll configure ESLint by adding a `.eslintrc.js` file. This will include entries in the `extends` section that will automatically apply rules to integrate Prettier and React formatting and linting. We're also setting values for `env`, `parserOptions`, and `rules` that will get you up and running. Once you finish this tutorial, it would be helpful to look at the full documentation for ESLint to see if you want to customize those items for your project.

_**Note:** As we add the recommended prettier configuration here, the [Prettier docs](https://prettier.io/docs/en/integrating-with-linters.html#eslint) specify that it needs to be last so Prettier can overwrite any other extensions in the `extends` object._

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
      'plugin:react/recommended',
      'plugin:prettier/recommended'
    ],
    plugins: [],
    // add your custom rules here
    rules: {
        "react/prop-types": 1
    }
  }
```

Prettier doesn't really need any configuration but let's give it at least one rule.

`.prettierrc`
```
{
    "singleQuote": true
}
```

## VS Code configuration

- Install the `prettier` and `eslint` VS Code extensions using the extensions panel (`Command` + `Shift` + `X`)
- Press `Command` + `Shift` + `P` then search for Open Settings (JSON) (if you can't find it, try [things mentioned here](https://stackoverflow.com/questions/54785520/vs-code-how-to-open-json-settings-with-defaults))
- Make sure `eslint` is installed globally using `npm install -g eslint` or `yarn global add eslint`

_**Note:** Normally you don't need to do a global install and you can use the ESLint dev dependency in your repository but because CRA hides it up, VS Code can't find the local binary_

Now we'll get ESLint and Prettier to perform their magic everytime you save a file. Add the following to your `settings.json`:

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

This next step is optional but many people prefer to lint files before they're committed. This ensures that files follow a certain format when they get are committed in Git so you won't have commits that are messing with your code formatting.

### Installing lint-staged

We'll install packages for linting staged files as part of a pre-commit git hook. This will prevent files from making it into the repository unless they are properly linted as we have configured.

_**Note: The `lint-staged` docs recommend using `npx mrm lint-staged` to install it but when I tried this I got an error that said `Cannot add lint-staged: only eslint, stylelint, prettier or custom rules are supported.` so I did the manual method. If you know the issue here then let me know via [email](mailto:readwriteexercise@gmail.com) or [Twitter](https://twitter.com/readwriteexrcis)._

#### npm
```
npm install --save-dev husky lint-staged
```

#### yarn
```
yarn add --dev husky lint-staged
```

Now add the following `husky` and `lint-staged` sections to your `package.json` file so it looks something like this:
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

And that's it. You should still have all the benefits of Create React App while having automatic code linting and formatting on save in VS Code. To test this, try removing a semicolon from one of your files, like `src/App.js`. [Here's a repository](https://github.com/bradydowling/eslint-prettier-create-react-app) where you can look at or clone the finished product.
