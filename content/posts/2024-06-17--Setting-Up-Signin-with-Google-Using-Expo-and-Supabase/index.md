---
title: "Setting Up Sign-in with Google Using Expo and Supabase"
date: "2024-06-17T20:03:48.744Z"
template: "post"
draft: false
slug: "/posts/google-signin-expo-supabase/"
category: "Tutorial"
tags:
  - "Tutorial"
description: "A guide to getting Google OAuth credentials for Sign in with Google, helpful for React Native, Expo, and Supabase."
---

After _almost_ getting Google Signin working a few months ago, I went back at it now to give Android users a smoother onboarding experience in [Neurture](https://neurtureapp.com). As soon as I thought I got it working, I hit [this error](https://github.com/expo/expo-cli/issues/1450) and realized I needed a separate `google-services.json` file for my preview build.

This guide is a result of me not finding a single point of reference for setting up Google Sign-In with Expo and Supabase. This will walk you through how to set up Google Sign-In with Expo and Supabase. It takes some inspiration from the following resources, which are each helpful but not comprehensive on their own:

- [Expo docs for Google Authentication](https://docs.expo.dev/guides/google-authentication/)
- [EAS build error for Google Authentication](https://github.com/expo/expo-cli/issues/1450)
- [Supabase docs for Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google?queryGroups=platform&platform=react-native)
- [Supabase YouTube vid for Login with Google](https://www.youtube.com/watch?v=vojHmGUGUGc)
- [react-native-google-signin official docs](https://react-native-google-signin.github.io/docs/setting-up/get-config-file)
- [Stack Overflow question about getting the Expo keystore for Android](https://stackoverflow.com/questions/61119983/how-do-i-get-sha-1-certificate-in-expo)
- [Google Signin Using Supabase and React Native Expo](https://dev.to/fedorish/google-sign-in-using-supabase-and-react-native-expo-14jf)

Some guides above work for Firebase but I'm using Supabase 😬 Hopefully this helps you!

### Step 1: Set Up Your Google Cloud Project

1. **Create a Google Cloud Project:**

   - Go to the [Google Cloud Console](https://console.cloud.google.com/).
   - Create a new project or select an existing one.

2. **Add Android OAuth Client ID:**

   - Navigate to `APIs & Services > Credentials`.
   - Click `Create Credentials`, then choose `OAuth client ID`.
   - Select `Application type` as `Android`.

3. **Get the Package Name:**

   - Use the package name from your `app.json`/`app.config.js`/`app.config.ts` file (e.g., `com.myorg.myapp`).

4. **Get the SHA-1 Certificate Fingerprint:**

   - Run this command to get the fingerprint using Expo's command-line interface:

     ```sh
     npx eas-cli credentials
     ```

   - Choose Android
   - Choose the profile to configure (for me this was `preview`)
   - Choose **Keystore: Manage everything needed to build your project**
   - Choose **Set up a new keystore**
   - Give your keystore a name (e.g. `preview`) or use the randomly generated one
   - Copy your SHA-1 fingerprint

5. **Enter the SHA-1 and Package Name:**
   - Paste the SHA-1 fingerprint and package name into the appropriate fields.
   - Click `Create`.

Here’s how to fill out the form:

- **Application type:** Android
- **Name:** (e.g., Your App Name)
- **Package name:** com.myorg.myapp
- **SHA-1 certificate fingerprint:** (The one you got from the previous step)

### Step 2: Configure Supabase

1. **Add the Google OAuth Client ID to Supabase:**
   - In your Supabase project, go to `Authentication > Providers > Google`.
   - Paste the `OAuth Client ID` from your Google Cloud console into the `Authorized Client IDs` field in Supabase.

### Step 3: Update Your Expo App

1. **Install Expo Google Sign-In:**

   Add necessary dependencies:

   ```sh
   expo install expo-auth-session expo-google-auth-session
   ```

2. **Modify the `app.json`:**

   - Ensure you’ve specified the correct `googleServicesFile`.

     ```json
     {
       "expo": {
         "android": {
           "googleServicesFile": "./path-to-your/google-services.json"
         }
       }
     }
     ```

3. **Update Code To Use Google Sign-In:**

   Use the following in your React Native component:

   ```js
   import * as Google from "expo-auth-session/providers/google";
   import { useAuthRequest } from "expo-auth-session";
   import { supabase } from "../yourSupabaseClient";

   const SignIn = () => {
     const [request, response, promptAsync] = Google.useAuthRequest({
       expoClientId: "<YOUR-EXPO-CLIENT-ID>",
       androidClientId: "<YOUR-ANDROID-CLIENT-ID>",
       iosClientId: "<YOUR-IOS-CLIENT-ID>",
     });

     React.useEffect(() => {
       if (response?.type === "success") {
         const { authentication } = response;
         // Use Supabase Auth with Google Token
         supabase.auth
           .signIn({
             provider: "google",
             token: authentication.accessToken,
           })
           .then(() => {
             // Handle success
           })
           .catch((error) => {
             // Handle error
           });
       }
     }, [response]);

     return (
       <Button
         title="Sign In with Google"
         onPress={() => {
           promptAsync();
         }}
       />
     );
   };

   export default SignIn;
   ```

Ensure to replace `"<YOUR-EXPO-CLIENT-ID>"`, `"<YOUR-ANDROID-CLIENT-ID>"`, and `"<YOUR-IOS-CLIENT-ID>"` with the correct values from your Google Cloud console.

### Step 4: Create a Separate Google Services JSON for Staging

1. **Create a new project in Google Cloud for staging.**
2. **Repeat step 1 to create another `google-services.json` file for your staging app using the staging package name.**
3. **Add the staging `google-services.json` file similarly in your `app.json`.**

### Step 5: Build and Test

1. **Build your app:**

   ```sh
   expo build:android
   ```

2. **Test Google Sign-In using your development build.**

### Conclusion

Once confirmed to be working, you can compile your steps and findings into a detailed blog post to guide others.

Feel free to test these steps and let me know if you encounter any issues. I'll be here to help you troubleshoot.
