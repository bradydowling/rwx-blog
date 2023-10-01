---
title:  "How to trust self-signed certificates on macOS"
date: "2020-09-04T11:51:01.267Z"
template: "post"
draft: false
slug: "/posts/trust-self-signed-certificates-macos/"
category: "Tutorial"
tags:
- "Tutorial"
- "SSL"
- "HTTPS"
description: "A quick walkthrough on getting macOS to trust certificates that you or someone else you trust has created"
---

HTTPS and SSL are important for security and it's great that most browsers require or strongly encourage them to be used. This can be a little tricky, though, when you're doing local development and you keep getting console errors about localhost not having SSL enabled. If you create a self-signed certificate with something like [mkcert](https://github.com/FiloSottile/mkcert) then you're halfway there.

The rest of the battle is getting your web server to use the certificate (which will depend on what kind of server you're using) and getting your system to trust your certificate.

To make sure your system and browsers (including Chrome, Firefox, Safari, Edge, etc.) will accept your certificate as valid, you can follow these steps:

1. Open Keychain Access and the `All Items` category (lower left)
1. Locate your self-signed certificate file (`.pem`, `.p12`, or something else) in Finder
1. Drag your certificate file from Finder to Keychain Access, in the list on the right
1. Open Certificates on the very bottom left
1. Find the certificate you just dragged in and double click it (if there's a dropdown arrow on the left then just ignore that, we want the top level one)
1. Click the Trust dropdown arrow then change `When using this certificate` from `System Defaults` to `Always Trust`

Here's a video that might also be helpful:

<iframe width="560" height="315" src="https://www.youtube.com/embed/TGrX8XgSuZ4" frameborder="0" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

Now if you're running anything on localhost that's using your self-signed certificate, you can open that in any browser and you should see in the address bar that this is now a trusted site!
