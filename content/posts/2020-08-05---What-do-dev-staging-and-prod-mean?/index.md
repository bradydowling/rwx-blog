---
title:  "What do dev, staging, and prod mean?"
date: "2020-08-05T15:25:05.340Z"
template: "post"
draft: false
slug: "/posts/what-do-dev-prod-staging-mean/"
category: "Career"
tags:
- "Tutorial"
description: "When you write code, it has to make it out to your customer somehow, often with a few stages in between your editor and the customer's computer. In this post we'll walk through common ones and why they exist."
---

Basically prod, dev, and staging are just different places that developers run code. This could be code for anything like an API endpoint, a webpage, a web application, a mobile application, or something else entirely. For this post, I'll use spacejam.com (a search engine) as an example.

Prod means it’s production code that end users actually see. So if you go to spacejam.com, the code that renders that site is production code.

Staging is when you’re basically testing out code before it’s about to go to prod.

Dev is somewhere that code runs that is not necessarily local/on your machine but it’s also not necessarily about to go out to the production website.

These different stages don’t necessarily mean the code is living in one single place. For instance, “staging” for the _homepage_ of spacejam.com could be on a certain server in AWS, while “staging” for the _Planet B-ball page_ could be on a completely different server somewhere else. The actual infrastructure of each one is determined by the team that owns the code for that page or product.

The location for each of these things is important though. If I am testing the dev version of spacejam.com (for instance, on test.spacejam.com) and I want to test how the product purchase process is, I want to make sure that I won't _really_ be charged for a "purchase" I make in this development environment. If I'm not pointing my development environment at the right development purchase page and configuration then I might make an order that I was only  trying to test. Similarly, if my production site is somehow pointing to my development version of the store cart then my actual users won't be able to get my product and pay me money.

As you start to develop a page or product that requires more testing, it's helpful to have pre-prod environments. These environments can have all different kinds of names like development, staging, QA, or whatever else the person or team that owns them decides upon. But no matter the naming, setup or configuration, pre-prod stages are a way of testing your product before any changes get shipped out to your users.
