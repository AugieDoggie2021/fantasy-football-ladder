import Foundation

#if canImport(Supabase)
import Supabase
#endif

enum SupabaseClientProvider {
    #if canImport(Supabase)
    private static var cached: SupabaseClient?
    #endif
    
    static func supabaseURL() -> URL? {
        if let urlString = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String,
           let url = URL(string: urlString) {
            return url
        }
        return nil
    }
    
    static func supabaseAnonKey() -> String? {
        Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String
    }
    
    static func client() -> Any? {
        #if canImport(Supabase)
        if let cached { return cached }
        guard let url = supabaseURL(), let key = supabaseAnonKey() else { return nil }
        let client = SupabaseClient(supabaseURL: url, supabaseKey: key)
        cached = client
        return client
        #else
        return nil
        #endif
    }
}


