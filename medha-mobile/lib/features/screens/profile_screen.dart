import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';
import 'package:medha_mobile/features/auth/auth_repository.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;
    final isGuest = ref.watch(guestProvider);

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
          children: [
            // Header
            Text("Profile", style: tt.headlineMedium?.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 20),

            // ── Profile Hero ──
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.primary, AppTheme.primaryContainer],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primary.withValues(alpha: 0.25),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 32,
                    backgroundColor: Colors.white.withValues(alpha: 0.2),
                    child: const Icon(Icons.person_rounded, color: Colors.white, size: 34),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isGuest ? "Guest User" : "Patient",
                          style: tt.titleLarge?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          isGuest 
                            ? "Sign in to save records and edit your personal information."
                            : "Personal info, medical history,\nsaved doctors",
                          style: tt.bodySmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.78),
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (!isGuest)
                    GestureDetector(
                      onTap: () => context.push("/complete-profile"),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.18),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.edit_rounded, color: Colors.white, size: 20),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // ── Medical Summary ──
            Text("Medical Summary", style: tt.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _StatCard(
                    label: "Blood Type",
                    value: "O+",
                    icon: Icons.water_drop_rounded,
                    color: AppTheme.error,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _StatCard(
                    label: "Resting HR",
                    value: "72 bpm",
                    icon: Icons.favorite_rounded,
                    color: AppTheme.secondary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _StatCard(
                    label: "Allergies",
                    value: "1",
                    icon: Icons.warning_rounded,
                    color: const Color(0xFFFB8C00),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),


            // ── Menu Items ──
            Text("Account", style: tt.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 12),
            _MenuItem(
              icon: Icons.settings_rounded,
              label: "Settings",
              onTap: () => context.push("/settings"),
            ),
            const SizedBox(height: 10),
            _MenuItem(
              icon: Icons.event_note_rounded,
              label: "My Appointments",
              onTap: () => context.push("/appointments"),
            ),
            const SizedBox(height: 10),
            _MenuItem(
              icon: Icons.description_rounded,
              label: "Medical Records",
              onTap: () => context.push("/records"),
            ),
            const SizedBox(height: 10),
            _MenuItem(
              icon: Icons.medication_rounded,
              label: "Medicine Reminders",
              onTap: () => context.push("/reminders"),
            ),
            const SizedBox(height: 20),

            // ── Logout ──
            OutlinedButton.icon(
              onPressed: () async {
                await ref.read(authRepositoryProvider).signOut();
                if (context.mounted) context.go("/auth");
              },
              icon: const Icon(Icons.logout_rounded, size: 20),
              label: Text(
                "Logout",
                style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w700),
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.error,
                minimumSize: const Size.fromHeight(52),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                side: BorderSide(color: AppTheme.error.withValues(alpha: 0.25)),
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
    final tt = Theme.of(context).textTheme;
    final cardColor = Theme.of(context).cardColor;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(18),
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
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(height: 10),
          Text(value, style: tt.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 2),
          Text(label, style: tt.labelSmall?.copyWith(color: AppTheme.onSurfaceVariant)),
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
    final tt = Theme.of(context).textTheme;
    final cardColor = Theme.of(context).cardColor;
    return Material(
      color: cardColor,
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
              Expanded(
                child: Text(
                  label,
                  style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w600),
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
