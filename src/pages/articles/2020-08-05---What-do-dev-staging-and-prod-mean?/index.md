---
title:  "What do dev, staging, and prod mean?"
date: "2020-08-05T15:25:05.340Z"
layout: post
draft: true
path: "/posts/what-do-dev-prod-staging-mean/"
category: "Career"
tags:
- "Tutorial"
description: "When you write code, it has to make it out to your customer somehow, often with a few stages in between your editor and the customer's computer. In this post we'll walk through common ones and why they exist."
---

Basically prod, dev, and staging are just different places that developers run code. This could be code for anything like an API endpoint, a webpage, a web application, a mobile application, or something else entirely. For this post, I'll use spacejam.com (a search engine) as an example.

Prod means it’s production code that end users actually see. So if you go to spacejam.com, the code that renders that site is production code.

Staging is when you’re basically testing out code before it’s about to go to prod.

Dev is somewhere that code runs (that’s no necessarily local) but it’s not necessarily about to go out to prod

These different stages don’t necessarily mean the code is living in one place. For instance, “staging” for the homepage of spacejam.com could be on a certain server in AWS, while “staging” for the Planet B-ball page could be on a completely different server somewhere else. The actual implementation of them is determined by the team that owns that code, product, page, etc.

So in this instance, he gave you the endpoints and URLs for their different stages so we can correlate them with our different stages. The code that we have in staging should hit their staging endpoint, the code we have in prod should hit their prod endpoint, and the same goes for DEV

so for instance, with chat with a vet, we might be curious to test the chat feature, but if we’ve pointed our dev code to prod then we’re going to be chatting with actual vets in production that should be using their time to chat on chewy.com with real customers