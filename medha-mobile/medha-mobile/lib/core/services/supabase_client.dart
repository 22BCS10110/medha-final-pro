import 'package:supabase_flutter/supabase_flutter.dart';

/// Supabase client singleton for the Medha Health app.
/// This is the only place where Supabase is initialized in the mobile app.
class SupabaseClient {
  SupabaseClient._();

  static const String _supabaseUrl = 'https://mnwhjlgjncmdcjewktuo.supabase.co';
  static const String _supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ud2hqbGdqbmNtZGNqZXdrdHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMDEyOTAsImV4cCI6MjA5MDg3NzI5MH0.Ieucdm23X2umTxXXapzyBJko6_A-08GojQCEOv75pkY';

  static Future<void> initialize() async {
    await Supabase.initialize(
      url: _supabaseUrl,
      anonKey: _supabaseAnonKey,
      authOptions: const FlutterAuthClientOptions(
        authFlowType: AuthFlowType.pkce,
      ),
    );
  }

  static SupabaseClient get instance => SupabaseClient._();

  Supabase get client => Supabase.instance;
}