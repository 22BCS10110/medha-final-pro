import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:medha_mobile/core/services/medha_api.dart';
import 'package:medha_mobile/core/services/medha_api_provider.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(medhaApi: ref.read(medhaApiProvider));
});

final authStateProvider = StreamProvider<User?>((ref) {
  return Supabase.instance.client.auth.onAuthStateChange.map((event) => event.session?.user);
});

/// Result from Google sign-in + Django token exchange.
class GoogleSignInResult {
  final bool isNewUser;
  final bool isProfileComplete;
  final Map<String, dynamic> userData;

  GoogleSignInResult({
    required this.isNewUser,
    required this.isProfileComplete,
    required this.userData,
  });
}

class AuthRepository {
  final SupabaseClient _client = Supabase.instance.client;
  final MedhaApi medhaApi;

  AuthRepository({required this.medhaApi});

  /// Sign in with Google via Supabase, then exchange token with Django.
  ///
  /// Returns [GoogleSignInResult] so the caller can decide whether to
  /// navigate to home or the complete-profile screen.
  Future<GoogleSignInResult> signInWithGoogle() async {
    // 1. Trigger Google sign-in via Supabase native OAuth
    final response = await _client.auth.signInWithOAuth(
      OAuthProvider.google,
      redirectTo: 'io.supabase.medha://login-callback/',
      authScreenLaunchMode: LaunchMode.externalApplication,
    );

    if (!response) {
      throw Exception('Google sign-in was cancelled');
    }

    // 2. Wait for the auth state to update with the session
    final session = await _waitForSession();

    // 3. Exchange Supabase token with Django backend
    final data = await medhaApi.exchangeSupabaseToken(session.accessToken);

    return GoogleSignInResult(
      isNewUser: data['created'] == true,
      isProfileComplete: data['is_profile_complete'] == true,
      userData: (data['user'] as Map<String, dynamic>?) ?? {},
    );
  }

  /// Wait for Supabase auth state to have a valid session after OAuth redirect.
  Future<Session> _waitForSession() async {
    // If session already exists, return it
    final existing = _client.auth.currentSession;
    if (existing != null) return existing;

    // Listen for auth state changes (OAuth redirect will trigger this)
    final completer = await _client.auth.onAuthStateChange
        .where((event) => event.session != null)
        .first;

    if (completer.session == null) {
      throw Exception('Failed to get session after Google sign-in');
    }
    return completer.session!;
  }

  Future<void> signIn(String email, String password) async {
    await _client.auth.signInWithPassword(email: email, password: password);
  }

  Future<void> signUp(String email, String password) async {
    await _client.auth.signUp(email: email, password: password);
  }

  Future<void> signOut() async {
    await medhaApi.clearToken();
    await _client.auth.signOut();
  }

  Future<void> sendOtp({
    required String phoneNumber,
    required void Function(String verificationId) onCodeSent,
    required void Function(String message) onError,
  }) async {
    try {
      await _client.auth.signInWithOtp(phone: phoneNumber);
      onCodeSent(phoneNumber);
    } catch (e) {
      onError(e.toString());
    }
  }

  Future<void> verifyOtp({
    required String phone,
    required String token,
  }) async {
    await _client.auth.verifyOTP(
      phone: phone,
      token: token,
      type: OtpType.sms,
    );
  }

  String? getCurrentToken() {
    return _client.auth.currentSession?.accessToken;
  }
}