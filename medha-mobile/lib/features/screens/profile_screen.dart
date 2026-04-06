import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';
import 'package:medha_mobile/features/auth/auth_repository.dart';
import 'package:medha_mobile/features/settings/app_settings_controller.dart';
import 'package:medha_mobile/l10n/app_localizations.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
          children: [
            // Header
            Text(l10n.profile, style: GoogleFonts.manrope(fontSize: 26, fontWeight: FontWeight.w800, color: AppTheme.onSurface)),
            const SizedBox(height: 20),
            // Profile hero
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.primary, AppTheme.primaryContainer],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: Colors.white.withValues(alpha: 0.2),
                    child: const Icon(Icons.person_rounded, color: Colors.white, size: 30),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("Patient", style: GoogleFonts.manrope(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800)),
                        const SizedBox(height: 4),
                        Text(
                          "Personal info, medical history,\nsaved doctors",
                          style: GoogleFonts.plusJakartaSans(color: Colors.white.withValues(alpha: 0.78), fontSize: 13, fontWeight: FontWeight.w500, height: 1.4),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            // Medical summary
            Text("Medical Summary", style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w800, color: AppTheme.onSurface)),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _StatCard(label: "Blood Type", value: "O+", icon: Icons.water_drop_rounded, color: AppTheme.tertiary)),
                const SizedBox(width: 12),
                Expanded(child: _StatCard(label: "Resting HR", value: "72 bpm", icon: Icons.favorite_rounded, color: const Color(0xFF43A047))),
                const SizedBox(width: 12),
                Expanded(child: _StatCard(label: "Allergies", value: "1", icon: Icons.warning_rounded, color: Colors.orange)),
              ],
            ),
            const SizedBox(height: 20),
            // Menu items
            Text("Account", style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w800, color: AppTheme.onSurface)),
            const SizedBox(height: 12),
            _MenuItem(icon: Icons.translate_rounded, label: l10n.changeLanguage, onTap: () async {
              final current = Localizations.localeOf(context).languageCode;
              await ref.read(appLocaleProvider.notifier).setLocale(Locale(current == "en" ? "hi" : "en"));
            }),
            const SizedBox(height: 10),
            _MenuItem(icon: Icons.settings_rounded, label: "Settings", onTap: () => context.push("/settings")),
            const SizedBox(height: 10),
            _MenuItem(icon: Icons.event_note_rounded, label: "My Appointments", onTap: () => context.push("/appointments")),
            const SizedBox(height: 10),
            _MenuItem(icon: Icons.description_rounded, label: "Medical Records", onTap: () => context.push("/records")),
            const SizedBox(height: 20),
            // Logout
            OutlinedButton.icon(
              onPressed: () async {
                await ref.read(authRepositoryProvider).signOut();
                if (context.mounted) context.go("/auth");
              },
              icon: const Icon(Icons.logout_rounded, size: 20),
              label: Text(l10n.logout, style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700)),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.tertiary,
                minimumSize: const Size.fromHeight(52),
                shape: const StadiumBorder(),
                side: BorderSide(color: AppTheme.tertiary.withValues(alpha: 0.25)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  const _StatCard({required this.label, required this.value, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(height: 10),
          Text(value, style: GoogleFonts.manrope(fontWeight: FontWeight.w800, fontSize: 16, color: AppTheme.onSurface)),
          const SizedBox(height: 2),
          Text(label, style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w500, fontSize: 11, color: AppTheme.onSurface.withValues(alpha: 0.5))),
        ],
      ),
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _MenuItem({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: AppTheme.primary, size: 20),
              ),
              const SizedBox(width: 14),
              Expanded(child: Text(label, style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600, fontSize: 15, color: AppTheme.onSurface))),
              Icon(Icons.chevron_right_rounded, color: AppTheme.onSurface.withValues(alpha: 0.3)),
            ],
          ),
        ),
      ),
    );
  }
}
