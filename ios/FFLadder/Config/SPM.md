# Supabase Swift SDK via SPM (Placeholder Instructions)

1. In Xcode, open `Package Dependencies` and add:
   - URL: `https://github.com/supabase-community/supabase-swift.git`
   - Version: Up to Next Major
2. Link the `Supabase` product to the `FFLadder` app target.
3. Configure build settings to include `Config/Secrets.xcconfig` with:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. Once added, update `SupabaseClientProvider` to return a configured client.


