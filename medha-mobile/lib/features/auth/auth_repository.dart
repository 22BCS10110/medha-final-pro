import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:medha_mobile/core/services/medha_api.dart';
import 'package:medha_mobile/core/services/medha_api_provider.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(medhaApi: ref.read(medhaApiProvider));
});

final authStateProvider = StreamProvider<User?>((ref) {
  // Use a custom transformer to suppress duplicate emissions with the same UID.
  // Firebase can fire authStateChanges() multiple times for token refreshes
  // without the user identity actually changing; filtering these out prevents
  // unnecessary router re-evaluations.
  User? lastSeen;
  return FirebaseAuth.instance.authStateChanges().where((user) {
    final changed = user?.uid != lastSeen?.uid;
    if (changed) lastSeen = user;
    return changed;
  });
});

final guestProvider = StateNotifierProvider<GuestNotifier, bool>((ref) {
  return GuestNotifier();
});

class GuestNotifier extends StateNotifier<bool> {
  GuestNotifier() : super(false) {
    _loadGuestState();
  }

  Future<void> _loadGuestState() async {
    final prefs = await SharedPreferences.getInstance();
    state = prefs.getBool('is_guest') ?? false;
  }

  Future<void> setGuest(bool isGuest) async {
    state = isGuest;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('is_guest', isGuest);
  }
}

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
  final MedhaApi medhaApi;

  AuthRepository({required this.medhaApi});

  /// Sign in with Google via Firebase, then exchange ID token with Django.
  ///
  /// Returns [GoogleSignInResult] so the caller can decide whether to
  /// navigate to home or the complete-profile screen.
  Future<GoogleSignInResult> signInWithGoogle() async {
    final GoogleSignInAccount? googleUser = await GoogleSignIn(
      clientId: '361020649489-4tm4o784in6lqjs7cekbt6ql45fobb6e.apps.googleusercontent.com',
    ).signIn();
    if (googleUser == null) {
      throw Exception('Google sign-in was cancelled');
    }

    final googleAuth = await googleUser.authentication;
    final credential = GoogleAuthProvider.credential(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );

    final userCredential =
        await FirebaseAuth.instance.signInWithCredential(credential);

    final idToken = await userCredential.user?.getIdToken();
    if (idToken == null) throw Exception('Failed to get Firebase token');

    // TEMP debug
    // ignore: avoid_print
    print('Firebase login success');

    // Exchange Firebase ID token with Django backend
    final data = await medhaApi.exchangeFirebaseToken(idToken);

    return GoogleSignInResult(
      isNewUser: data['created'] == true,
      isProfileComplete: data['is_profile_complete'] == true,
      userData: (data['user'] as Map<String, dynamic>?) ?? {},
    );
  }

  Future<void> signIn(String email, String password) async {
    await FirebaseAuth.instance.signInWithEmailAndPassword(email: email, password: password);
  }

  Future<void> signUp(String email, String password, {String? name, String? phone}) async {
    final userCredential = await FirebaseAuth.instance.createUserWithEmailAndPassword(
      email: email,
      password: password,
    );
    
    // Attempt to update profile name
    if (name != null && name.isNotEmpty) {
      await userCredential.user?.updateDisplayName(name);
    }
  }

  Future<void> signOut() async {
    await medhaApi.clearToken();
    await GoogleSignIn().signOut();
    await FirebaseAuth.instance.signOut();
  }

  Future<String?> getCurrentToken() async {
    return await FirebaseAuth.instance.currentUser?.getIdToken();
  }
}