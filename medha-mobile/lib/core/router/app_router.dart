import 'package:flutter/material.dart';
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

final appRouterProvider = Provider<GoRouter>((ref) {
  final isFirstLaunch = ref.watch(firstLaunchProvider);
  final auth = ref.watch(authStateProvider);
  final isGuest = ref.watch(guestProvider);
  final currentUser = auth.asData?.value;
  final isAuthLoading = auth.isLoading;

  debugPrint("🛣️ ROUTER: State change detected - FirstLaunch: $isFirstLaunch, AuthLoading: $isAuthLoading, User: ${currentUser?.email}, Guest: $isGuest");

  return GoRouter(
    initialLocation: "/onboarding",
    redirect: (context, state) {
      final location = state.matchedLocation;
      debugPrint("🎯 REDIRECT: location: $location");
      final isSetupRoute = location == "/onboarding";
      final isAuthRoute = location == "/auth";
      final isProtectedRoute = !isSetupRoute && !isAuthRoute;

      // Keep onboarding only for first launch.
      if (isFirstLaunch) {
        return location == "/onboarding" ? null : "/onboarding";
      }

      // Once onboarding is done, don't allow going back to it automatically.
      if (location == "/onboarding") {
        if (!isGuest && isAuthLoading) return null;
        return (currentUser == null && !isGuest) ? "/auth" : "/home";
      }

      if (!isGuest && isAuthLoading) return null;

      // Logged-in or Guest users should not stay on auth screens.
      if ((currentUser != null || isGuest) && isAuthRoute) return "/home";

      // Logged-out users cannot access protected routes.
      if (currentUser == null && !isGuest && isProtectedRoute) return "/auth";

      return null;
    },
    routes: [
      GoRoute(path: "/onboarding", builder: (_, __) => const OnboardingScreen()),
      GoRoute(path: "/auth", builder: (_, __) => const AuthScreen()),
      GoRoute(path: "/complete-profile", builder: (_, __) => const CompleteProfileScreen()),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => AppShellScaffold(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(routes: [GoRoute(path: "/home", builder: (_, __) => const HomeScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: "/appointments", builder: (_, __) => const AppointmentsScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: "/chat", builder: (_, __) => const ChatScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: "/profile", builder: (_, __) => const ProfileScreen())]),
        ],
      ),
      // Role-based dashboards (accessible outside the main shell)
      GoRoute(path: "/doctor-dashboard", builder: (_, __) => const DoctorDashboardScreen()),
      GoRoute(path: "/admin-dashboard", builder: (_, __) => const AdminDashboardScreen()),
      GoRoute(path: "/doctors", builder: (_, __) => const DoctorListScreen()),
      GoRoute(path: "/hospitals", builder: (_, __) => const HospitalListScreen()),
      GoRoute(
        path: "/doctor-profile",
        builder: (_, state) => DoctorProfileScreen(doctor: state.extra as Doctor),
      ),
      GoRoute(
        path: "/appointment-confirmation",
        builder: (_, state) => AppointmentConfirmationScreen(
          payload: (state.extra as Map).cast<String, dynamic>(),
        ),
      ),
      GoRoute(path: "/emergency", builder: (_, __) => const EmergencyScreen()),
      GoRoute(path: "/records", builder: (_, __) => const MedicalRecordsScreen()),
      GoRoute(path: "/prescriptions", builder: (_, __) => const PrescriptionsScreen()),
      GoRoute(path: "/reminders", builder: (_, __) => const MedicineRemindersScreen()),
      GoRoute(path: "/settings", builder: (_, __) => const SettingsScreen()),
    ],
  );
});
