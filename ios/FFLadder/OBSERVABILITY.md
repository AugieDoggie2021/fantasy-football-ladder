# Observability Choices

Crash reporting: Firebase Crashlytics (optionally Sentry)
Analytics: Amplitude (or Segment proxying to Amplitude)

Notes:
- Add SDKs via SPM or CocoaPods (prefer SPM where available).
- Ensure privacy manifest coverage; declare reasons if required by SDKs.
- Disable analytics in Debug by default; gate with build config.




