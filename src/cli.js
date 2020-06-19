export function cli(args) { // eslint-disable-line
  const title = 'What is Webpack Externals'
  const path = 'what-is-webpack-externals'
  const description = 'what-is-webpack-externals'
  const postTemplate = // eslint-disable-line
`---
title:  "${title}"
date: "${(new Date()).toISOString()}"
layout: post
draft: true
path: "/posts/${path}/"
category: "Tutorials"
tags:
  - "Tutorial"
description: "${description}"
---

This is where the content of the post should go
`
}
