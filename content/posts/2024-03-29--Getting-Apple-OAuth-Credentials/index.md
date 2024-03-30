---
title:  "How to Get Apple OAuth Credentials for Sign in with Apple"
date: "2024-03-29T20:03:48.744Z"
template: "post"
draft: false
slug: "/posts/getting-apple-oauth-credentials/"
category: "Tutorial"
tags:
- "Tutorial"
description: "A guide to getting Apple OAuth credentials for Sign in with Apple, helpful for React Native, Expo, and Supabase."
---

This guide is to help you get the necessary credentials to use Apple's Sign in with Apple feature in your app. This is useful for React Native, Expo, and Supabase users. This will walk you through how to fill out the form on Supabase at https://supabase.com/dashboard/project/yourprojectid/auth/providers under Apple.

If you have any issues with this, you'll also want to consult [this Supabase help page](https://supabase.com/docs/guides/auth/social-login/auth-apple#generate-a-client_secret).

## Service ID (for OAuth)
This is a unique identifier for your app that is used during the OAuth flow. You create one in the Apple Developer portal.
- Go to the [Apple Developer portal](https://developer.apple.com/).
- Click on the ["Certificates, Identifiers & Profiles"](https://developer.apple.com/account/resources/certificates/list) section.
- Click on Identifiers on the left.

At this point, you'll want to have an App ID with Sign in with Apple enabled. Then on top of that you'll want to have a Service ID that is linked to the App ID

- If you have an existing App ID, add "Sign in with Apple" to it.
- If you don't have an existing App ID, create a new one and enable "Sign in with Apple."
- Create a new Service ID and enable "Sign in with Apple."
- Link the Service ID to the App ID.
- Add any domains/subdomains you want and for the return URL add the Callback URL on your Supabase providers page under the Apple section.

The name of the Service ID (not app ID) is the one you'll use in Supabase.


## Secret Key (for OAuth)
A secret key is used to create a client secret that is needed for making token requests to Apple's servers.
- Under the same "Certificates, Identifiers & Profiles" section on the Apple Developer portal, go to "Keys."
- Click on the "+" button to create a new key.
- Give it a name, select "Sign in with Apple," and then choose the primary App ID.
- Click "Configure" and link the key to your Service ID.
- After configuring, click "Save," and then "Continue."
- Click "Register" to create the key.
- You will then be presented with a "Download" button. Download the file, since this is your only chance to get it. This file will be used to generate the client secret.
- Go to https://supabase.com/docs/guides/auth/social-login/auth-apple#generate-a-client_secret and follow the instructions on the bottom to generate the client secret JWT

## Authorized Client IDs
This is just your app's bundle ID (e.g. `com.example.app`).

## Callback URL (for OAuth)
This what you used when setting up your Service ID.
