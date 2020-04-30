---
title:  "What is Webpack Externals?"
date: "2020-05-06T16:51:00.000Z"
layout: post
draft: true
path: "/posts/what-is-webpack-externals/"
category: "Tutorials"
tags:
  - "JavaScript"
  - "Tutorial"
description: "Webpack externals is a way of loading in dependencies that are not installed in the node_modules folder. There are a few key points to grasp about this concept to use it properly."
---

Webpack has a naming problem, just like the rest of the software world. One tricky name in the Webpack world is "Webpack externals". Webpack externals are simply variables that are declared outside out webpack (e.g. imported in a script tag in an HTML document) and then made available for use within a webpack bundle.

In practice, this means a webpack application can use a dependency without actually having it installed via NPM. Instead it would be imported some other way and Webpack will depend on that piece of code being accessible as a global variable. Webpack externals basically performs a mapping from that global variable to some other name you choose.

So if I load Vue into my HTML using a script tag then it would store it on window.Vue. Typically I would import Vue into my file like this:
```
import Vue from 'vue';
```

Webpack externals does a mapping here that basically takes that code and changes the from piece of it. So if I have the following as my 