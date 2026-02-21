# App Store Deployment Guide

This guide will help you deploy Body Count to the Apple App Store.

## Prerequisites

1. **Apple Developer Account** ($99/year)
   - Sign up at: https://developer.apple.com

2. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

3. **Login to Expo**
   ```bash
   eas login
   ```

## Step 1: Host Privacy Policy

Your privacy policy needs to be publicly accessible. Options:

### Option A: GitHub Pages (Recommended - Free)
1. Create a `gh-pages` branch:
   ```bash
   git checkout -b gh-pages
   git add privacy-policy.html
   git commit -m "Add privacy policy"
   git push origin gh-pages
   ```

2. Enable GitHub Pages:
   - Go to your repo: https://github.com/averydd/bctracker
   - Settings → Pages
   - Source: `gh-pages` branch
   - Your privacy policy will be at: `https://averydd.github.io/bctracker/privacy-policy.html`

3. Update `app.json`:
   ```json
   "ios": {
     "privacyPolicy": "https://averydd.github.io/bctracker/privacy-policy.html"
   }
   ```

### Option B: Host on Your Own Domain
If you have a website, upload `privacy-policy.html` and update the URL in `app.json`.

## Step 2: Update App Store Information

1. **Update Contact Email** in `privacy-policy.html`:
   - Replace `privacy@bodycount.app` with your real email

2. **Update `eas.json`**:
   - Replace `your-apple-id@example.com` with your Apple ID
   - Add your Apple Team ID (found in Apple Developer portal)

## Step 3: Configure App Store Connect

1. Go to: https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - **Platform**: iOS
   - **Name**: Body Count (or alternate name for compliance)
   - **Primary Language**: English
   - **Bundle ID**: com.avery.bodycount
   - **SKU**: bodycount-1.0.0

4. **Age Rating** - Set to **17+**:
   - Unrestricted Web Access: No
   - Simulated Gambling: No
   - Mature/Suggestive Themes: Yes
   - Sexual Content or Nudity: Yes (tracking sexual activity)

5. **App Information**:
   - **Category**: Health & Fitness (or Lifestyle)
   - **Privacy Policy URL**: https://averydd.github.io/bctracker/privacy-policy.html
   - **Subtitle**: Private intimate encounter tracker
   - **Keywords**: health, wellness, tracking, diary, journal, privacy

6. **App Description** (Compliance-friendly):
   ```
   Body Count is a privacy-focused personal health tracker designed for adults to monitor their intimate wellness journey.

   KEY FEATURES:
   • 📊 Personal statistics and insights
   • 👥 Partner relationship tracking
   • 📅 Calendar view of your history
   • 🏆 Personal milestones
   • 🧪 Health reminder system
   • 📥 Import/export your data
   • 🔒 Biometric security (Face ID)
   • 🌙 Dark mode interface

   PRIVACY FIRST:
   All data is stored locally on your device. We never collect, transmit, or store your information on external servers. Your privacy is completely protected.

   HEALTH & WELLNESS:
   Track important health information, set reminders, and maintain a private record of your personal wellness journey.

   This app is intended for adults 18+ only.
   ```

## Step 4: Create Screenshots

You need screenshots for App Store review:

1. **Required Sizes**:
   - 6.7" (iPhone 17 Pro Max): 1290 x 2796
   - 6.5" (iPhone 16 Plus): 1284 x 2778
   - 5.5" (iPhone 8 Plus): 1242 x 2208

2. **Take Screenshots** in simulator:
   ```bash
   # Run on iPhone 17 Pro Max simulator
   npx expo run:ios --device "iPhone 17 Pro Max"
   ```
   - Press `Cmd + S` to take screenshots
   - Screenshots saved to Desktop

3. **What to Screenshot**:
   - Home/Stats screen
   - Calendar view
   - Partner list (use generic/fake data)
   - Profile/achievements screen
   - Face ID security prompt

## Step 5: Build for TestFlight

1. **Build the app**:
   ```bash
   eas build --platform ios --profile production
   ```

2. **Wait for build** (15-30 minutes)
   - You'll get an email when it's done
   - Build will automatically upload to App Store Connect

3. **Test on TestFlight**:
   - Go to App Store Connect
   - Select your app → TestFlight tab
   - Add yourself as internal tester
   - Install TestFlight app on your iPhone
   - Test thoroughly

## Step 6: Submit for Review

1. **Complete App Store Connect**:
   - Add screenshots
   - Add app description
   - Set pricing (Free recommended)
   - Add privacy nutrition labels

2. **Privacy Nutrition Labels**:
   - Do you collect data? **NO**
   - All data is stored locally only

3. **Export Compliance**:
   - Uses encryption? **NO** (standard iOS encryption only)
   - No HTTPS calls, no custom encryption

4. **Submit for Review**:
   - Click "Submit for Review"
   - Review time: 1-3 days typically

## Step 7: Potential Rejection & Response

Apple may reject due to sexual content. If rejected:

### Response Strategy:
```
Dear App Review Team,

Body Count is a personal health and wellness tracker designed for adults to privately monitor their intimate health information, similar to period trackers or health journals.

Key points:
1. All data is stored locally - we do not collect or transmit any user data
2. The app is clearly marked 17+ with appropriate age gates
3. The app serves a legitimate health tracking purpose (STI test reminders, health statistics)
4. Content is not pornographic or explicit - it's clinical health tracking
5. Similar apps exist on the App Store (e.g., Clue, Flo, Eve)

We have ensured:
- No explicit imagery or content
- Health-focused language and UI
- Proper age rating (17+)
- Comprehensive privacy protections

We believe this app provides valuable health tracking functionality for adults and complies with App Store guidelines.

Thank you for your consideration.
```

### Alternative: Rebrand if Needed
If rejected multiple times, consider:
- Rename to "Intimacy Tracker" or "Wellness Journal"
- Emphasize health/wellness over sexual aspects
- Remove any slang terminology

## Step 8: After Approval

1. **Announce on social media** (optional)
2. **Monitor reviews** in App Store Connect
3. **Plan updates**:
   - Bug fixes
   - New features
   - iOS version updates

## Ongoing Maintenance

### For Updates:
```bash
# 1. Update version in app.json
# 2. Build new version
eas build --platform ios --profile production

# 3. Submit via App Store Connect
eas submit --platform ios
```

### Version Numbering:
- First update: 1.0.1 (bug fixes)
- Minor features: 1.1.0
- Major features: 2.0.0

## Troubleshooting

### Build Fails
- Check `eas.json` configuration
- Ensure all dependencies are installed
- Check Expo SDK compatibility

### App Store Rejection
- Read rejection reason carefully
- Address specific concerns
- Respond professionally
- Be willing to make changes

### TestFlight Issues
- Ensure proper provisioning
- Check bundle identifier matches
- Verify Apple Developer account is active

## Cost Breakdown

- Apple Developer Account: $99/year
- EAS Build (if using free tier): Free (30 builds/month)
- Hosting (GitHub Pages): Free
- Total: **$99/year**

## Support

- Expo Documentation: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build/introduction/
- App Store Guidelines: https://developer.apple.com/app-store/review/guidelines/

## Next Steps After Reading This Guide

1. [ ] Get Apple Developer account
2. [ ] Host privacy policy on GitHub Pages
3. [ ] Update app.json with privacy policy URL
4. [ ] Create App Store Connect listing
5. [ ] Build with EAS
6. [ ] Test on TestFlight
7. [ ] Submit for review
8. [ ] Respond to any rejections
9. [ ] Launch! 🚀
