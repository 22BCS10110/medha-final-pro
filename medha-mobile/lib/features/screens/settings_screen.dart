import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';
import 'package:medha_mobile/features/auth/auth_repository.dart';
import 'package:medha_mobile/features/settings/app_settings_controller.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => context.canPop() ? context.pop() : context.go("/home"),
        ),
        title: Text("Settings", style: tt.titleLarge),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
        children: [
          // ── Account Settings ──
          _SectionHeader(title: "Account", icon: Icons.person_rounded),
          const SizedBox(height: 12),
          _SettingsItem(
            icon: Icons.notifications_rounded,
            label: "Notifications",
            subtitle: "Manage push notifications",
            onTap: () {},
          ),
          const SizedBox(height: 10),
          _SettingsItem(
            icon: Icons.medication_rounded,
            label: "Medicine Reminders",
            subtitle: "Set medication schedules",
            onTap: () => context.push("/reminders"),
          ),
          const SizedBox(height: 24),

          // ── Privacy & Security ──
          _SectionHeader(title: "Privacy & Security", icon: Icons.shield_rounded),
          const SizedBox(height: 12),
          _SettingsItem(
            icon: Icons.lock_rounded,
            label: "Change Password",
            subtitle: "Update your account password",
            onTap: () {},
          ),
          const SizedBox(height: 10),
          _SettingsItem(
            icon: Icons.fingerprint_rounded,
            label: "Biometric Lock",
            subtitle: "Secure app with fingerprint",
            onTap: () {},
          ),
          const SizedBox(height: 10),
          _SettingsItem(
            icon: Icons.privacy_tip_rounded,
            label: "Privacy Policy",
            subtitle: "Read our privacy policy",
            onTap: () {},
          ),
          const SizedBox(height: 10),
          _SettingsItem(
            icon: Icons.description_rounded,
            label: "Terms of Service",
            subtitle: "Read our terms",
            onTap: () {},
          ),
          const SizedBox(height: 24),

          // ── About ──
          _SectionHeader(title: "About", icon: Icons.info_rounded),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primary.withValues(alpha: 0.06),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppTheme.primary, AppTheme.primaryContainer],
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.health_and_safety_rounded, color: Colors.white, size: 22),
                    ),
                    const SizedBox(width: 14),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("Medha Health Intelligance", style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
                        Text("Version 1.0.0", style: tt.labelSmall?.copyWith(color: AppTheme.onSurfaceVariant)),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Text(
                  "Your trusted AI-powered healthcare companion. Built with care for your well-being.",
                  style: tt.bodySmall?.copyWith(
                    color: cs.onSurface.withValues(alpha: 0.6),
                    height: 1.6,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // ── Sign Out ──
          OutlinedButton.icon(
            onPressed: () async {
              await ref.read(authRepositoryProvider).signOut();
              if (context.mounted) context.go("/auth");
            },
            icon: const Icon(Icons.logout_rounded, size: 20),
            label: Text("Sign Out", style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppTheme.error,
              minimumSize: const Size.fromHeight(52),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              side: BorderSide(color: AppTheme.error.withValues(alpha: 0.25)),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final IconData icon;
  const _SectionHeader({required this.title, required this.icon});

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    return Row(
      children: [
        Icon(icon, size: 20, color: AppTheme.primary),
        const SizedBox(width: 8),
        Text(title, style: tt.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
      ],
    );
  }
}

class _SettingsItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subtitle;
  final VoidCallback onTap;
  const _SettingsItem({required this.icon, required this.label, required this.subtitle, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
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
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label, style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
                    Text(subtitle, style: tt.labelSmall?.copyWith(color: AppTheme.onSurfaceVariant)),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded, color: AppTheme.onSurface.withValues(alpha: 0.3)),
            ],
          ),
        ),
      ),
    );
  }
}

