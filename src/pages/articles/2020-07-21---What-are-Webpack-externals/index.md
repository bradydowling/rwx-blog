---
title:  "What is Webpack Externals?"
date: "2020-07-21T16:51:00.000Z"
layout: post
draft: false
path: "/posts/what-is-webpack-externals/"
category: "Tutorials"
tags:
  - "JavaScript"
  - "Tutorial"
  - "Micro-frontends"
  - "Webpack"
description: "Webpack externals is a way of loading in dependencies that are not installed in the node_modules folder. There are a few key points to grasp about this concept to use it properly."
---

Webpack has a naming problem, just like the rest of the (software) world. One tricky name in the Webpack world is "Webpack externals". Webpack externals are simply variables that are declared outside of Webpack (e.g. imported in a script tag in an HTML document) and then made available for use within a Webpack bundle.

In practice, this means a Webpack application can use a dependency without actually having it included in the Webpack bundle. Instead it would be imported some other way (e.g. a script tag referencing a CDN) and Webpack will assume that dependency will be accessible as a global variable. Webpack externals basically performs a mapping from that global variable to some key you specify in config.

## The process

So in order to consume Vue via a CDN from my Webpack bundle I would do the following:

1. Load my dependency (Vue) into my HTML
1. Configure `externals`, mapping the global that's set from the CDN script to the import string I'd like to use
1. Import using the import string from my `externals` mapping

### Loading the dependency

```html
<script src="<script src="https://cdn.jsdelivr.net/npm/vue/dist/vue.js"></script>">
```

### Configure externals

```js
module.exports = {
  externals: {
    vue: 'Vue'
  }
};
```

### Import the dependency

Since I loaded Vue into my HTML using a script tag, Vue is stored on window.Vue. So now when my code says:

```js
import Vue from 'vue';
```

Webpack externals does a mapping here that basically takes that code and changes the `from` piece of it to match the key that I already configured. So Webpack is essentially changing this behind the scenes to:

```js
import Vue from 'myVueKey';
```
