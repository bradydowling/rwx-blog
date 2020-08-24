---
title:  "Cache busting vs cache invalidation"
date: "2020-08-24T14:48:19.375Z"
layout: post
draft: false
path: "/posts/cache-busting-vs-cache-invalidation/"
category: "Tutorial"
tags:
- "Tutorial"
description: "What are the technical differences and pros and cons when comparing cache busting and cache invalidation from a CDN?"
---

Page load speed is important for any website, for user experience, SEO, and several other reasons. One way of speeding up page load times is through caching and there are several different ways to do caching of your website. In this post I'll talk specifically about the different between cache busting and cache invalidation, including where each of those happens and what advantage each has.

## Cache busting

Cache busting is essentially when you change the name of your static assets (the files on your page) so the user's browser knows that this is a file that should be downloaded afresh. If you're using Webpack, a common way to do this would be to include a hash in the file name.

So if I have a component called `MyButton` then Webpack might create a file called `MyButton.9347239.js`. The next time I build my site, if I've changed the button it will create the file with a different hash in the middle, such as `MyButton.2384012.js`. This signifies to the browser that this is a new file that it has never seen before so it should be downloaded.

Without the hash, the filename might just be `MyButton.js` and when it's updated it would still be `MyButton.js`. This would be more difficult for the browser to tell that this is a new file and could cause the user to get the old button component, not the new one.

## Cache invalidation

Cache invalidation is done on the CDN (content delivery network) level. For instance, let's say I am storing an image in AWS S3 called `profile.jpg`. When users go to my site, my site gets my profile image from the CDN. The CDN is a faster way of delivering this image to my users.

The next time I deploy my site, with a fresh new `profile.jpg` file, I want to make sure my users will see the updates. Because I am serving this image from my CDN, I can tell the CDN to invalidate the cache. This basically says to the CDN, "When someone comes here to get this profile image, don't give them the thing you got last time. Now you need to get the new version from S3."

## Pros and Cons

The major benefit of cache invalidation is that it can be simpler than cache busting. When you create a new version of an asset, you can invalidate the cache in the CDN and then your users will get the latest version.

The drawback is that your users still have to make a request to the CDN to get those assets, so they can't just use a file their browsers have cached locally on their machine. This means they still need to make a network request to get that file.

For cache busting, the configuration is a little more difficult. Setting it up in Webpack is pretty straight forward but still requires some Webpack knowledge. And if you're going to be using that file in several different places (for instance, on a separate micro frontend) then you'll need some way of updating the references to that filename that has now been changed. You could use import maps, which are a good solution but add complexity.

While it can be more complex to setup, it can also offer improved performance for users. Since the browser can expect that the same filename means the file is unchanged, it doesn't need to make an HTTP request at all if the file hasn't change, it can simply use the locally cached version.

## Conclusion

Caching is a complex topic and we've only scratched the surface in this post. In order to decide how you want to implement caching for your web application, you should research several different caching methods thoroughly. But I hope this post gives you a slightly better understand of how cache busting and cache invalidation work and how they can be beneficial.