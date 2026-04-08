<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into this Expo (React Native) app — a subscription management app built with Clerk auth and Expo Router.

## What was done

- Installed `posthog-react-native` and its required peer dependency `react-native-svg`
- Created `app.config.js` to expose PostHog credentials from `.env` via `expo-constants`
- Created `src/config/posthog.ts` with a fully configured PostHog client instance
- Wrapped the root layout (`app/_layout.tsx`) with `PostHogProvider` and added manual screen tracking for Expo Router
- Added `posthog.identify()` calls on sign-in and sign-up to correlate user identity across sessions
- Added `posthog.reset()` on sign-out to clear the anonymous/identified session
- Instrumented all key auth events across sign-in, sign-up, settings, and onboarding screens

## Events instrumented

| Event | Description | File |
|---|---|---|
| `user_signed_in` | User successfully signed in with email and password | `app/(auth)/sign-in.tsx` |
| `sign_in_failed` | User attempted to sign in but encountered an error | `app/(auth)/sign-in.tsx` |
| `email_verification_submitted` | User submitted MFA/email verification code during sign-in | `app/(auth)/sign-in.tsx` |
| `user_signed_up` | User successfully created a new account and verified their email | `app/(auth)/sign-up.tsx` |
| `sign_up_failed` | User attempted to create an account but encountered an error | `app/(auth)/sign-up.tsx` |
| `email_verification_failed` | User submitted an incorrect or expired email verification code | `app/(auth)/sign-up.tsx` |
| `user_signed_out` | User signed out from their account via the settings screen | `app/(tabs)/settings.tsx` |
| `onboarding_viewed` | User viewed the onboarding screen (top of conversion funnel) | `app/onboarding.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://eu.posthog.com/project/155737/dashboard/610683
- **Daily Sign-ins & Sign-ups**: https://eu.posthog.com/project/155737/insights/WcUdRD4D
- **Authentication Error Rate**: https://eu.posthog.com/project/155737/insights/HcbIbw0P
- **User Churn — Sign-outs Over Time**: https://eu.posthog.com/project/155737/insights/k7mWP2F1
- **Sign-up Conversion Funnel**: https://eu.posthog.com/project/155737/insights/DfBtvyT2
- **Onboarding → Sign-up → Sign-in Funnel**: https://eu.posthog.com/project/155737/insights/iKxr7Lqd

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
