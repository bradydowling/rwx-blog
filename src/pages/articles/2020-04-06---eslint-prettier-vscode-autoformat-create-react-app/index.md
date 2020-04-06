---
title:  "Setting up Create React App, VS Code, ESLint, and Prettier"
date: "2020-04-06T16:51:00.000Z"
layout: post
draft: false
path: "/posts/setting-up-create-react-app-vs-code-eslint-prettier/"
category: "Tutorials"
tags:
  - "JavaScript"
  - "Tutorials"
description: "A brief guide to configuring VS Code to automatically format code in your CRA app using ESLint and Prettier"
---

In this post we'll walk through how to setup a new or existing React project to automatically lint and format code. We'll be using VS Code as our editor, Create React App (CRA) to create our React application, and ESLint and Prettier to do the actual code formatting and linting.

One of the major benefits of Create React App is that it handles configuration of Webpack and several other dependencies for you, while you just get to consume this one dependency. Some guides for setting up automatic code formatting in VS Code with CRA (create-react-app) will ask you to "eject" from Create React App by running `npm run eject`. This takes away a lot of the benefits of Create React App and is irreversible so with this guide we'll avoid that. This will gives us all the configuration benefits of CRA while also giving us the automatic code formatting we want from our other tools.

## Create our app

As "step 0", we'll go ahead and create our app, in case you're not using a preexisting application (which this tutorial should work with as well). We'll call it `clean-code-app` since the code will be formatted according to the standard we define.

```
$ npx create-react-app clean-code-app
$ cd clean-code-app
```

## Repository configuration

### Install eslint and prettier

Now that we have our application and we've changed directory into it, we'll want to install the packages and dependencies we need. Notably missing from the dependencies list that follows is `eslint`. `create-react-app` gives you an application with `eslint` preinstalled so we don't need to install that.

```
$ npm install --save-dev prettier eslint-loader eslint-config-prettier eslint-plugin-prettier eslint-plugin-react
```

> TODO: Mention the difference between a loader, a config, and a plugin.

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

**Note:** Don't worry about the package versions listed here. You will likely be installing later versions of each of these packages. As long as you run the `npm install` command I included above, you're on your way.

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
      'plugin:prettier/recommended',
      'plugin:react/recommended'
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
- Make sure `eslint` is installed globally (normally you can use the dev dependency in the repo but because CRA hides it up, VS Code can't find the local binary)
- Press `Command` + `Shift` + `P` then search for Open Settings (JSON) (if you can't find it, try [things mentioned here](https://stackoverflow.com/questions/54785520/vs-code-how-to-open-json-settings-with-defaults))

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

> TODO: Include the final output of important files and a Github repo link so people can copy/paste stuff.