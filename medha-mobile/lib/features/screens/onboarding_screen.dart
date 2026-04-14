import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:medha_mobile/features/settings/app_settings_controller.dart';

import 'package:medha_mobile/core/theme/app_theme.dart';
import 'package:medha_mobile/core/widgets/enhanced_card.dart';

class OnboardingScreen extends ConsumerWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;

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
                    GradientCard(
                      padding: const EdgeInsets.all(28),
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
                            style: tt.headlineMedium?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                              height: 1.15,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            "Experience healthcare redesigned through\nthe lens of empathy and precision.",
                            style: tt.bodySmall?.copyWith(
                              color: Colors.white.withValues(alpha: 0.82),
                              fontWeight: FontWeight.w500,
                              height: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 28),
                    // Feature rows
                    _FeatureRow(icon: Icons.calendar_month_rounded, title: "Book appointments easily"),
                    const SizedBox(height: 16),
                    _FeatureRow(icon: Icons.description_rounded, title: "Emergency help instantly"),
                    const SizedBox(height: 16),
                    _FeatureRow(icon: Icons.shield_rounded, title: "Digital records always with you"),
                    const SizedBox(height: 28),
                    // Trust badges
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        _TrustBadge(icon: Icons.lock_rounded, label: "Secure Data"),
                        SizedBox(width: 16),
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
                        backgroundColor: cs.primary,
                        foregroundColor: Colors.white,
                        minimumSize: const Size.fromHeight(56),
                        shape: const StadiumBorder(),
                        elevation: 0,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            "Continue",
                            style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w700, color: Colors.white),
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
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;
    return EnhancedCard(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: cs.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: cs.primary, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              title,
              style: tt.bodyMedium?.copyWith(fontWeight: FontWeight.w600, color: cs.onSurface),
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
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: cs.primary.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: cs.primary),
          const SizedBox(width: 6),
          Text(label, style: tt.labelSmall?.copyWith(fontWeight: FontWeight.w600, color: cs.primary)),
        ],
      ),
    );
  }
}
