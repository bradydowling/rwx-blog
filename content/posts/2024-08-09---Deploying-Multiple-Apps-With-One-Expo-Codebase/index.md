---
title: "Deploying Multiple Apps With One Expo Codebase"
date: "2024-08-09T20:03:48.744Z"
template: "post"
draft: false
slug: "/posts/deploy-multiple-apps-one-expo-codebase/"
category: "Tutorial"
tags:
  - "Tutorial"
description: "A brief walkthrough on an approach to using a single Expo codebase to deploy multiple apps to the App Store and Play Store."
---

I've been working on an Expo app that I felt would work really well for multiple different sets of content. So I wondered: Is it possible to have a single repository for your Expo app and ship multiple apps with different content and configurations?

The answer: Yes.

This can save you a lot of time and effort during development and maintenance. You do this using configuration files and environment variables to customize the content for each app. Here's a quick rundown on how you might do this:

1. **Project Structure**: Organize your project to separate the core functionality and the app-specific content.

   ```
   my-expo-app/
   ├── assets/
   │   ├── app1/
   │   └── app2/
   ├── src/
   │   ├── core/
   │   ├── app1/
   │   └── app2/
   ├── app.json
   ├── app.config.js
   └── package.json
   ```

2. **Configuration Files**: Use `app.config.js` instead of a static `app.json` so you can dynamically set configurations based on environment variables or other criteria.

   ```javascript
   // app.config.js
   export default ({ config }) => {
     let appConfig = {
       android: {
         package: "com.example.default",
       },
       ios: {
         bundleIdentifier: "com.example.default",
       },
       extra: {
         // Default extra configs
       },
     };

     if (process.env.APP_ENV === "app1") {
       appConfig = {
         ...appConfig,
         name: "App One",
         slug: "app-one",
         android: {
           package: "com.example.app1",
         },
         ios: {
           bundleIdentifier: "com.example.app1",
         },
         extra: {
           apiUrl: "https://api.app1.example.com",
           // Other app1-specific config
         },
       };
     } else if (process.env.APP_ENV === "app2") {
       appConfig = {
         ...appConfig,
         name: "App Two",
         slug: "app-two",
         android: {
           package: "com.example.app2",
         },
         ios: {
           bundleIdentifier: "com.example.app2",
         },
         extra: {
           apiUrl: "https://api.app2.example.com",
           // Other app2-specific config
         },
       };
     }

     return {
       ...config,
       ...appConfig,
     };
   };
   ```

3. **Environment Variables**: Set up environment variables to switch between different app configurations.

   ```bash
   // To build App One
   APP_ENV=app1 expo build:android
   APP_ENV=app1 expo build:ios

   // To build App Two
   APP_ENV=app2 expo build:android
   APP_ENV=app2 expo build:ios
   ```

4. **Conditional Logic**: In your application code, use the `extra` data in `app.config.js` to conditionally load different content or configurations.

   ```javascript
   import Constants from "expo-constants";

   const API_URL = Constants.manifest.extra.apiUrl;

   // Use API_URL in your app logic
   // Similarly, you can use other configurations stored in Constants.manifest.extra
   ```

5. **Assets and Content**: Manage different assets and content by conditionally importing them based on the environment.

   ```javascript
   let images;
   if (process.env.APP_ENV === "app1") {
     images = require("./assets/app1");
   } else if (process.env.APP_ENV === "app2") {
     images = require("./assets/app2");
   }

   export default images;
   ```

6. **Deployment**: Automate your CI/CD pipeline to pass the right environment variables and ensure consistent builds.

That's a really brief walkthrough of what the structure might look like. The big thing here is that `app.config.js` is your friend. Once you're switched over from `app.json`, you can do a lot more dynamic configuration based on environment variables or other criteria. From there, it's matter of simplifying your code as much as possible so your conditional logic doesn't turn your codebase into a mess. Good luck!
