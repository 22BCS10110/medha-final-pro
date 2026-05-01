import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:medha_mobile/core/widgets/app_shell_scaffold.dart';
import 'package:medha_mobile/features/auth/auth_repository.dart';
import 'package:medha_mobile/features/screens/auth_screen.dart';
import 'package:medha_mobile/features/screens/admin_dashboard_screen.dart';
import 'package:medha_mobile/features/screens/appointment_confirmation_screen.dart';
import 'package:medha_mobile/features/screens/appointments_screen.dart';
import 'package:medha_mobile/features/screens/chat_screen.dart';
import 'package:medha_mobile/features/screens/doctor_dashboard_screen.dart';
import 'package:medha_mobile/features/screens/doctor_profile_screen.dart';
import 'package:medha_mobile/features/screens/doctor_list_screen.dart';
import 'package:medha_mobile/features/screens/emergency_screen.dart';
import 'package:medha_mobile/features/screens/home_screen.dart';
import 'package:medha_mobile/features/screens/hospital_list_screen.dart';
import 'package:medha_mobile/features/screens/medicine_reminders_screen.dart';
import 'package:medha_mobile/features/screens/medical_records_screen.dart';
import 'package:medha_mobile/features/screens/onboarding_screen.dart';
import 'package:medha_mobile/features/screens/complete_profile_screen.dart';
import 'package:medha_mobile/features/screens/prescriptions_screen.dart';
import 'package:medha_mobile/features/screens/profile_screen.dart';
import 'package:medha_mobile/features/screens/settings_screen.dart';
import 'package:medha_mobile/features/settings/app_settings_controller.dart';
import 'package:medha_mobile/core/models/domain_models.dart';

// ---------------------------------------------------------------------------
// AppNavigationNotifier — single source of truth for navigation state
//
// This ChangeNotifier bridges Riverpod providers (auth, guest, firstLaunch)
// to GoRouter's refreshListenable mechanism.  GoRouter re-evaluates its
// redirect callback whenever this notifier calls notifyListeners(), without
// the GoRouter instance itself being recreated.
// ---------------------------------------------------------------------------
class AppNavigationNotifier extends ChangeNotifier {
  User? _user;
  bool _isAuthLoading = true;
  bool _isGuest = false;
  bool _isFirstLaunch = true;

  User? get currentUser => _user;
  bool get isAuthLoading => _isAuthLoading;
  bool get isGuest => _isGuest;
  bool get isFirstLaunch => _isFirstLaunch;

  /// Called when Firebase auth state changes.
  /// Guards against no-op updates to prevent spurious refreshes.
  void updateAuth(User? user, bool loading) {
    if (_user?.uid == user?.uid && _isAuthLoading == loading) return;
    debugPrint('[AUTH STATE] user=${user?.email ?? 'null'}, loading=$loading');
    _user = user;
    _isAuthLoading = loading;
    notifyListeners();
  }

  void updateGuest(bool isGuest) {
    if (_isGuest == isGuest) return;
    debugPrint('[AUTH STATE] guest=$isGuest');
    _isGuest = isGuest;
    notifyListeners();
  }

  void updateFirstLaunch(bool value) {
    if (_isFirstLaunch == value) return;
    _isFirstLaunch = value;
    notifyListeners();
  }
}

/// Provides the single [AppNavigationNotifier] and wires up listeners to all
/// navigation-relevant Riverpod providers.
final appNavigationNotifierProvider =
    ChangeNotifierProvider<AppNavigationNotifier>((ref) {
  final notifier = AppNavigationNotifier();

  // Forward auth state changes (with duplicate guard inside updateAuth).
  ref.listen<AsyncValue<User?>>(
    authStateProvider,
    (_, next) => notifier.updateAuth(next.valueOrNull, next.isLoading),
    fireImmediately: true,
  );

  // Forward guest flag changes.
  ref.listen<bool>(
    guestProvider,
    (_, next) => notifier.updateGuest(next),
    fireImmediately: true,
  );

  // Forward first-launch flag changes.
  ref.listen<bool>(
    firstLaunchProvider,
    (_, next) => notifier.updateFirstLaunch(next),
    fireImmediately: true,
  );

  return notifier;
});

// ---------------------------------------------------------------------------
// appRouterProvider
//
// Uses ref.READ (not watch) for the notifier so this provider — and therefore
// the GoRouter — is created exactly ONCE and never rebuilt.  All redirect
// re-evaluations happen via GoRouter's refreshListenable subscription to the
// notifier, not via Riverpod provider rebuilds.
// ---------------------------------------------------------------------------
final appRouterProvider = Provider<GoRouter>((ref) {
  final navNotifier = ref.read(appNavigationNotifierProvider);

  return GoRouter(
    initialLocation: '/onboarding',
    refreshListenable: navNotifier,
    redirect: (context, state) {
      final location = state.matchedLocation;
      final user = navNotifier.currentUser;
      final isLoading = navNotifier.isAuthLoading;
      final isGuest = navNotifier.isGuest;
      final isFirstLaunch = navNotifier.isFirstLaunch;

      debugPrint(
        '[ROUTER] redirect: location=$location '
        'user=${user?.email ?? 'null'} '
        'loading=$isLoading '
        'guest=$isGuest '
        'firstLaunch=$isFirstLaunch',
      );

      // ── 1. Wait for auth to finish initialising ──────────────────────────
      // Never redirect while loading; waiting prevents a redirect to /auth
      // that would be immediately undone once the user loads.
      if (isLoading) {
        debugPrint('[ROUTER] Auth still loading — staying put');
        return null;
      }

      // ── 2. First-launch gate: onboarding must be completed ───────────────
      if (isFirstLaunch) {
        const target = '/onboarding';
        if (location == target) return null; // already there, no-op
        debugPrint('[ROUTER] REDIRECTING TO: $target (first launch)');
        return target;
      }

      // ── 3. Post-onboarding: leave the onboarding screen ─────────────────
      if (location == '/onboarding') {
        final target = (user != null || isGuest) ? '/home' : '/auth';
        debugPrint('[ROUTER] REDIRECTING TO: $target (post-onboarding)');
        return target;
      }

      final isAuthRoute = location == '/auth';
      final isSetupRoute = location == '/onboarding';
      final isProtectedRoute = !isSetupRoute && !isAuthRoute;

      // ── 4. Authenticated / guest users leave the auth screen ─────────────
      if ((user != null || isGuest) && isAuthRoute) {
        debugPrint('[ROUTER] REDIRECTING TO: /home (already authenticated/guest)');
        return '/home';
      }

      // ── 5. Unauthenticated non-guest users cannot access protected routes ─
      if (user == null && !isGuest && isProtectedRoute) {
        debugPrint('[ROUTER] REDIRECTING TO: /auth (not authenticated)');
        return '/auth';
      }

      // No redirect needed.
      return null;
    },
    routes: [
      GoRoute(path: '/onboarding', builder: (_, __) => const OnboardingScreen()),
      GoRoute(path: '/auth', builder: (_, __) => const AuthScreen()),
      GoRoute(path: '/complete-profile', builder: (_, __) => const CompleteProfileScreen()),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            AppShellScaffold(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
              routes: [GoRoute(path: '/home', builder: (_, __) => const HomeScreen())]),
          StatefulShellBranch(
              routes: [GoRoute(path: '/appointments', builder: (_, __) => const AppointmentsScreen())]),
          StatefulShellBranch(
              routes: [GoRoute(path: '/chat', builder: (_, __) => const ChatScreen())]),
          StatefulShellBranch(
              routes: [GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen())]),
        ],
      ),
      // Role-based dashboards (outside the main shell)
      GoRoute(path: '/doctor-dashboard', builder: (_, __) => const DoctorDashboardScreen()),
      GoRoute(path: '/admin-dashboard', builder: (_, __) => const AdminDashboardScreen()),
      GoRoute(path: '/doctors', builder: (_, __) => const DoctorListScreen()),
      GoRoute(path: '/hospitals', builder: (_, __) => const HospitalListScreen()),
      GoRoute(
        path: '/doctor-profile',
        builder: (_, state) => DoctorProfileScreen(doctor: state.extra as Doctor),
      ),
      GoRoute(
        path: '/appointment-confirmation',
        builder: (_, state) => AppointmentConfirmationScreen(
          payload: (state.extra as Map).cast<String, dynamic>(),
        ),
      ),
      GoRoute(path: '/emergency', builder: (_, __) => const EmergencyScreen()),
      GoRoute(path: '/records', builder: (_, __) => const MedicalRecordsScreen()),
      GoRoute(path: '/prescriptions', builder: (_, __) => const PrescriptionsScreen()),
      GoRoute(path: '/reminders', builder: (_, __) => const MedicineRemindersScreen()),
      GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
    ],
  );
});
