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

After _almost_ getting Google Signin working a few months ago, I went back at it to give Android users a smoother onboarding experience in [Neurture](https://neurtureapp.com). As soon as I thought I got it working, I hit [this error](https://github.com/expo/expo-cli/issues/1450) and _thought_ I needed a separate `google-services.json` file for my preview build (I didn't 😅).

This guide is a result of me not finding a single point of reference for setting up Google Sign-In with Expo and Supabase. This will walk you through how to set up Google Sign-In with Expo and Supabase. It takes some inspiration from the following resources, which are each helpful but not comprehensive on their own:

- [Expo docs for Google Authentication](https://docs.expo.dev/guides/google-authentication/)
- [EAS build error for Google Authentication](https://github.com/expo/expo-cli/issues/1450)
- [Supabase docs for Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google?queryGroups=platform&platform=react-native)
- [Supabase YouTube vid for Login with Google](https://www.youtube.com/watch?v=vojHmGUGUGc)
- [react-native-google-signin official docs](https://react-native-google-signin.github.io/docs/setting-up/get-config-file)
- [Stack Overflow question about getting the Expo keystore for Android](https://stackoverflow.com/questions/61119983/how-do-i-get-sha-1-certificate-in-expo)
- [Google Signin Using Supabase and React Native Expo](https://dev.to/fedorish/google-sign-in-using-supabase-and-react-native-expo-14jf)
- [DEVELOPER_ERROR with Google Sign-In](https://github.com/react-native-google-signin/google-signin/issues/1192)

Some guides above work for Firebase but I'm using Supabase 😬 Hopefully this helps you!

**Note:** Supabase doesn't currently support signing in with Google on iOS so this guide is for Android only. There's a YouTube comment from Supabase that you can see below that references [a Github issue](https://github.com/openid/AppAuth-iOS/pull/788) which has since been fixed. Perhaps Supabase will implement a fix for this in the future.

![](Screenshot%202024-07-17%20at%209.31.47%20AM.png)

### Step 1: Set Up Your Google Cloud Project

1. **Create a Google Cloud Project:**

   - Go to the [Google Cloud Console](https://console.cloud.google.com/).
   - Create a new project or select an existing one.

2. **Configure the OAuth Consent Screen:**

   - In the Google Cloud Console, navigate to `APIs & Services > OAuth consent screen`.
   - Select your user type and click `Create`.
   - Fill out the necessary information, such as App name, User support email, and Developer contact information.
   - Add scopes if necessary, which by default include "email" and "profile".
   - Save and continue.

3. **Add OAuth Client ID:**

   - Navigate to `APIs & Services > Credentials`.
   - Click `Create Credentials`, then choose `OAuth client ID`.
   - Select `Application type` as `Web application`.
   - Enter your application name.
   - Under "Authorized redirect URIs," add:
     ```
     https://{YOUR_PROJECT_REFERENCE_ID}.supabase.co/auth/v1/callback
     ```
   - Click `Create`.

4. **Add Android OAuth Client ID:**

   - Navigate to `APIs & Services > Credentials`.
   - Click `Create Credentials`, then choose `OAuth client ID`.
   - Select `Application type` as `Android`.

5. **Get the Package Name:**

   - Use the package name from your `app.json`/`app.config.js`/`app.config.ts` file (e.g., `com.myorg.myapp`).

6. **Get the SHA-1 Certificate Fingerprint:**

   - Get the SHA-1 certificate fingerprint by running `eas credentials` from the project root. Select Android as the platform, then select your build profile.
   - Run this command to get the fingerprint using Expo's command-line interface:
     ```sh
     eas credentials
     ```
   - Choose Android
   - Choose the profile to configure (for me this was `preview`)
   - Choose **Keystore: Manage everything needed to build your project**
   - Choose **Set up a new keystore**
   - Give your keystore a name (e.g., `preview` or `production`) or use the randomly generated one
   - Copy your SHA-1 fingerprint

7. **Enter the SHA-1 and Package Name:**

   - Paste the SHA-1 fingerprint and package name into the appropriate fields in the Google Cloud Console.
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
   - Add necessary dependencies:
     ```sh
     npx expo install @react-native-google-signin/google-signin
     ```

**Note:** Since we're using Supabase and Expo, you don't need to modify the `app.json` or use a `google-services.json` file. This is a step you'll find in other guides that use Firebase but you can skip that.

2. **Update Code To Use Google Sign-In:**

   - Use the following in your React Native component (for me this is an `Auth` screen):

```js
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from "@react-native-google-signin/google-signin";

import { supabase } from "../yourSupabaseClient";

GoogleSignin.configure({
  webClientId:
      <WEB_CLIENT_ID_FROM_GOOGLE_CONSOLE>,
});

const LoginComponent = () => {
  const onGoogleLogin = async () => {
    setLoading(true);

    try {
        await GoogleSignin.hasPlayServices();
        const userInfo = await GoogleSignin.signIn();

        const { error, data } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: userInfo.idToken,
        });

        if (!data.user) {
            Alert.alert("Error signing in with Google");
            return;
        }

        if (error) {
            throw error;
        }

        console.log("Signed in!"); // This is where the user is signed in so do whatever you would like here
    } catch (error) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            // user cancelled the login flow
        } else if (error.code === statusCodes.IN_PROGRESS) {
            // operation (e.g. sign in) is in progress already
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            // play services not available or outdated
        } else {
            // some other error happened
        }
    } finally {
        setLoading(false);
    }
};

  return (
    <View>
    {Platform.OS === "android" ? (
        <>
            <GoogleSigninButton
                onPress={onGoogleLogin}
                size={GoogleSigninButton.Size.Wide}
                color={
                    GoogleSigninButton.Color.Dark
                }
                disabled={loading}
                style={[styles.button]}
            />
        </>
    ) : null}
    </View>
  );
};

export default SignIn;
```

Ensure to replace `<WEB_CLIENT_ID_FROM_GOOGLE_CONSOLE>` with the correct value from your Google Cloud console.

### Step 4: Build and Test

1. **Build your app:**

   ```sh
   expo build:android
   ```

2. **Test Google Sign-In using your development build.**

   - Run your app on an Android emulator or physical device.
   - Click the Google Sign-In button and verify that you can sign in successfully.

### Common Issues and Troubleshooting

1. **Error: DEVELOPER_ERROR**

   This error often indicates a problem with the SHA-1 certificate fingerprint or the OAuth client configuration.

   - Ensure that you are using the correct SHA-1 fingerprint. If you are using Expo managed credentials, you can retrieve the correct SHA-1 by running:
     ```sh
     eas credentials
     ```
   - Make sure to add both the debug and release SHA-1 fingerprints to the Google Cloud Console.
   - Use the Web client ID, not the Android client ID, in your `GoogleSignin.configure` call.

2. **Error: Must specify an idToken or an accessToken**

   - This usually means that the wrong client ID is being used. Ensure that you are using the Web client ID from the Google Cloud Console.
