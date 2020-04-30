---
title:  "What are Webpack Federated Modules?"
date: "2020-05-06T16:51:00.000Z"
layout: post
draft: true
path: "/posts/what-are-webpack-federated-modules/"
category: "Tutorials"
tags:
  - "JavaScript"
  - "Tutorial"
description: "Webpack federated modules is another way of loading in dependencies that are not installed in the node_modules folder. But they're also a way of _consuming_ external dependencies and they're not just limited to components."
---

Webpack has a naming problem, just like the rest of the software world. Much of the confusion around federated modules comes because of the name and because the name "externals" was already taken. But understanding what the word "federated" means will help us get a better idea of what federated modules are.

## What does federated even mean?
Normally when I hear the word federated I think of authentication. I think of a user being federated and logged in. **Federated modules have nothing to do with logging in or user authentication**. This was the first reason federated modules was confusing to me. No name will be perfect for this feature but other names that might work would be "shared" or "public" modules.

Federated modules as a feature was inspired by GraphQL federation, which basically allows you to have multiple different GraphQL sources of data joined together as one "federation". I'm not a GraphQL expert and I've never used federation so if you're curious about that you'll have to read up on it.

Being "federated" literally means "To cause to join into a league, federal union, or similar association." With user federation, this means that a user has been authenticated as someone with a registered account to the app. With GraphQL federation, it would mean that there are several different data sources that are joined into one main data source.

## What are federated modules?
With that knowledge in mind, we now have a better base for understanding what "federated" modules are in Webpack. A federated module is a piece of code that Webpack bundles up for consumption by outside sources. It can still be used within the rest of the codebase of this package so it can be consumed "internally" as well. It is federated in the sense that it is part of the output of your build, just like all the rest of your code is.

What makes federated modules special is that are externally consumable (not to be confused with Webpack externals).