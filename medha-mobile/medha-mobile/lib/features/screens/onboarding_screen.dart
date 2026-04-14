import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:medha_mobile/features/settings/app_settings_controller.dart';
import 'package:medha_mobile/l10n/app_localizations.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';

class OnboardingScreen extends ConsumerWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverFillRemaining(
              hasScrollBody: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 40, 24, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
              // Hero gradient header
              Container(
                padding: const EdgeInsets.all(28),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppTheme.primary, AppTheme.primaryContainer],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.18),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Icon(Icons.health_and_safety_rounded, color: Colors.white, size: 30),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      "The Clinical\nSanctuary.",
                      style: GoogleFonts.manrope(
                        color: Colors.white,
                        fontSize: 30,
                        fontWeight: FontWeight.w800,
                        height: 1.15,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      "Experience healthcare redesigned through\nthe lens of empathy and precision.",
                      style: GoogleFonts.plusJakartaSans(
                        color: Colors.white.withValues(alpha: 0.82),
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),
              // Feature rows
              _FeatureRow(
                icon: Icons.calendar_month_rounded,
                title: l10n.onboardingTitle1,
              ),
              const SizedBox(height: 16),
              _FeatureRow(
                icon: Icons.description_rounded,
                title: l10n.onboardingTitle2,
              ),
              const SizedBox(height: 16),
              _FeatureRow(
                icon: Icons.shield_rounded,
                title: l10n.onboardingTitle3,
              ),
              const SizedBox(height: 28),
              // Trust badges
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _TrustBadge(icon: Icons.lock_rounded, label: "Secure Data"),
                  const SizedBox(width: 16),
                  _TrustBadge(icon: Icons.verified_rounded, label: "Verified Doctors"),
                ],
              ),
              const Spacer(),
              // CTA
              FilledButton(
                onPressed: () async {
                  await ref.read(firstLaunchProvider.notifier).markDone();
                  if (context.mounted) context.go("/auth");
                },
                style: FilledButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(56),
                  shape: const StadiumBorder(),
                  elevation: 0,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      l10n.continueText,
                      style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, fontSize: 16),
                    ),
                    const SizedBox(width: 8),
                    const Icon(Icons.arrow_forward_rounded, size: 20),
                  ],
                ),
              ),
                    const SizedBox(height: 8),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FeatureRow extends StatelessWidget {
  final IconData icon;
  final String title;
  const _FeatureRow({required this.icon, required this.title});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: AppTheme.primary, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              title,
              style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600, fontSize: 15, color: AppTheme.onSurface),
            ),
          ),
        ],
      ),
    );
  }
}

class _TrustBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  const _TrustBadge({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: AppTheme.primary.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: AppTheme.primary),
          const SizedBox(width: 6),
          Text(label, style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.primary)),
        ],
      ),
    );
  }
}
