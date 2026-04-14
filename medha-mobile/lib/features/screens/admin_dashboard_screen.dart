import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';
import 'package:medha_mobile/core/widgets/enhanced_card.dart';

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;
    final now = DateTime.now();
    final greeting = now.hour < 12
        ? 'Good Morning'
        : now.hour < 17
            ? 'Good Afternoon'
            : 'Good Evening';

    return Scaffold(
      backgroundColor: cs.surface,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
          children: [
            // ── Greeting ──
            Text(greeting, style: tt.labelLarge?.copyWith(color: cs.onSurface.withValues(alpha: 0.5))),
            const SizedBox(height: 4),
            Text("Admin Dashboard", style: tt.headlineMedium?.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 24),

            // ── Overview Cards ──
            Row(
              children: [
                Expanded(
                  child: _OverviewCard(
                    title: "Total Users",
                    value: "1,247",
                    change: "+12%",
                    icon: Icons.people_rounded,
                    color: AppTheme.primary,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: _OverviewCard(
                    title: "Appointments",
                    value: "384",
                    change: "+8%",
                    icon: Icons.event_note_rounded,
                    color: AppTheme.secondary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: _OverviewCard(
                    title: "Doctors",
                    value: "56",
                    change: "+3",
                    icon: Icons.medical_services_rounded,
                    color: const Color(0xFFFB8C00),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: _OverviewCard(
                    title: "Hospitals",
                    value: "12",
                    change: "—",
                    icon: Icons.local_hospital_rounded,
                    color: AppTheme.tertiary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // ── System Health ──
            Text("System Health", style: tt.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 14),
            EnhancedCard(
              child: Column(
                children: [
                  _SystemRow(label: "API Response", value: "142ms", icon: Icons.speed_rounded, color: AppTheme.secondary),
                  const SizedBox(height: 14),
                  _SystemRow(label: "Database", value: "Healthy", icon: Icons.storage_rounded, color: AppTheme.secondary),
                  const SizedBox(height: 14),
                  _SystemRow(label: "Auth Service", value: "Online", icon: Icons.shield_rounded, color: AppTheme.secondary),
                  const SizedBox(height: 14),
                  _SystemRow(label: "AI Service", value: "Active", icon: Icons.auto_awesome_rounded, color: AppTheme.primary),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // ── Quick Admin Actions ──
            Text("Management", style: tt.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 14),
            _AdminAction(
              icon: Icons.person_add_rounded,
              label: "Manage Users",
              subtitle: "Add, edit, or remove user accounts",
              onTap: () {},
            ),
            const SizedBox(height: 10),
            _AdminAction(
              icon: Icons.analytics_rounded,
              label: "Analytics",
              subtitle: "View usage statistics and reports",
              onTap: () {},
            ),
            const SizedBox(height: 10),
            _AdminAction(
              icon: Icons.settings_rounded,
              label: "System Settings",
              subtitle: "Configure system parameters",
              onTap: () {},
            ),
            const SizedBox(height: 10),
            _AdminAction(
              icon: Icons.notifications_rounded,
              label: "Notifications",
              subtitle: "Manage alerts and push notifications",
              onTap: () {},
            ),
          ],
        ),
      ),
    );
  }
}

class _OverviewCard extends StatelessWidget {
  final String title;
  final String value;
  final String change;
  final IconData icon;
  final Color color;

  const _OverviewCard({
    required this.title,
    required this.value,
    required this.change,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    return Container(
      padding: const EdgeInsets.all(18),
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
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppTheme.secondary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  change,
                  style: tt.labelSmall?.copyWith(
                    color: AppTheme.secondary,
                    fontWeight: FontWeight.w700,
                    fontSize: 10,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(value, style: tt.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 2),
          Text(title, style: tt.labelSmall?.copyWith(color: AppTheme.onSurfaceVariant)),
        ],
      ),
    );
  }
}

class _SystemRow extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _SystemRow({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    return Row(
      children: [
        Icon(icon, size: 20, color: color),
        const SizedBox(width: 12),
        Expanded(child: Text(label, style: tt.bodyMedium?.copyWith(fontWeight: FontWeight.w600))),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(999),
          ),
          child: Text(
            value,
            style: tt.labelSmall?.copyWith(color: color, fontWeight: FontWeight.w700),
          ),
        ),
      ],
    );
  }
}

class _AdminAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subtitle;
  final VoidCallback onTap;

  const _AdminAction({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.onTap,
  });

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
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
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
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label, style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: tt.bodySmall?.copyWith(color: AppTheme.onSurfaceVariant),
                    ),
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
