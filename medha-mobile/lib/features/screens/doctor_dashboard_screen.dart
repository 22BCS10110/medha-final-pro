import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';
import 'package:medha_mobile/core/widgets/enhanced_card.dart';
import 'package:medha_mobile/core/widgets/empty_state.dart';
import 'package:medha_mobile/features/home/home_repository.dart';

class DoctorDashboardScreen extends ConsumerWidget {
  const DoctorDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final apptsAsync = ref.watch(appointmentsProvider("doctor_self"));
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
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(appointmentsProvider("doctor_self"));
            await ref.read(appointmentsProvider("doctor_self").future);
          },
          color: cs.primary,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
            children: [
              // ── Greeting ──
              Text(greeting, style: tt.labelLarge?.copyWith(color: cs.onSurface.withValues(alpha: 0.5))),
              const SizedBox(height: 4),
              Text("Doctor Dashboard", style: tt.headlineMedium?.copyWith(fontWeight: FontWeight.w800)),
              const SizedBox(height: 24),

              // ── Stats Row ──
              Row(
                children: [
                  Expanded(
                    child: _StatCard(
                      label: "Today's Patients",
                      value: "12",
                      icon: Icons.people_rounded,
                      color: AppTheme.primary,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: _StatCard(
                      label: "Pending",
                      value: "3",
                      icon: Icons.pending_actions_rounded,
                      color: const Color(0xFFFB8C00),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: _StatCard(
                      label: "Completed",
                      value: "9",
                      icon: Icons.check_circle_rounded,
                      color: AppTheme.secondary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // ── Quick Actions ──
              Text("Quick Actions", style: tt.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: _DoctorAction(
                      icon: Icons.note_add_rounded,
                      label: "Add Notes",
                      color: AppTheme.primary,
                      onTap: () {},
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: _DoctorAction(
                      icon: Icons.medication_rounded,
                      label: "Prescriptions",
                      color: AppTheme.secondary,
                      onTap: () => context.push("/prescriptions"),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: _DoctorAction(
                      icon: Icons.description_rounded,
                      label: "Records",
                      color: const Color(0xFFFB8C00),
                      onTap: () => context.push("/records"),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // ── Today's Appointments ──
              Text("Today's Appointments", style: tt.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
              const SizedBox(height: 14),

              apptsAsync.when(
                loading: () => const Center(child: Padding(
                  padding: EdgeInsets.all(40),
                  child: CircularProgressIndicator(),
                )),
                error: (e, _) => EmptyState(
                  icon: Icons.error_outline_rounded,
                  title: "Couldn't load appointments",
                  subtitle: e.toString(),
                  actionLabel: "Retry",
                  onAction: () => ref.invalidate(appointmentsProvider("doctor_self")),
                ),
                data: (appts) {
                  if (appts.isEmpty) {
                    return const EmptyState(
                      icon: Icons.event_available_rounded,
                      title: "No appointments today",
                      subtitle: "Enjoy your free time!",
                    );
                  }
                  return ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: appts.length,
                    itemBuilder: (_, i) {
                      final a = appts[i];
                      final time = DateFormat('hh:mm a').format(a.scheduledAt.toLocal());
                      return EnhancedCard(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: cs.primary.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: Icon(Icons.person_rounded, color: cs.primary, size: 24),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    a.patientName ?? "Patient #${a.patientId}",
                                    style: tt.titleSmall,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    "$time • ${a.mode}",
                                    style: tt.bodySmall?.copyWith(color: cs.onSurface.withValues(alpha: 0.55)),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: _statusColor(a.status).withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(
                                a.status.toUpperCase(),
                                style: tt.labelSmall?.copyWith(
                                  color: _statusColor(a.status),
                                  fontWeight: FontWeight.w700,
                                  fontSize: 10,
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return AppTheme.secondary;
      case 'cancelled':
        return AppTheme.error;
      default:
        return AppTheme.primary;
    }
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
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
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
          Text(value, style: tt.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 2),
          Text(label, style: tt.labelSmall?.copyWith(color: AppTheme.onSurfaceVariant)),
        ],
      ),
    );
  }
}

class _DoctorAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _DoctorAction({required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: AppTheme.primary.withValues(alpha: 0.06),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: tt.labelSmall?.copyWith(fontWeight: FontWeight.w700, color: AppTheme.onSurface),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
