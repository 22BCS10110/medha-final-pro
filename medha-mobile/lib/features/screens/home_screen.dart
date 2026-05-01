import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:medha_mobile/core/models/domain_models.dart';
import 'package:medha_mobile/core/services/ai_service.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';
import 'package:medha_mobile/core/widgets/skeleton_loader.dart';
import 'package:medha_mobile/core/widgets/enhanced_card.dart';
import 'package:medha_mobile/features/home/home_repository.dart';
import 'package:medha_mobile/features/home/home_repository.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final apptsAsync = ref.watch(appointmentsProvider("guest_patient"));
    final aiAsync = ref.watch(aiHealthSummaryProvider);
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
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
            ref.invalidate(appointmentsProvider("guest_patient"));
            ref.invalidate(aiHealthSummaryProvider);
            await Future.wait([
              ref.read(appointmentsProvider("guest_patient").future),
              ref.read(aiHealthSummaryProvider.future),
            ]);
          },
          color: cs.primary,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
            children: [
              // ── Greeting Row ──
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          greeting,
                          style: tt.labelLarge?.copyWith(
                            color: cs.onSurface.withValues(alpha: 0.5),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Medha Health Intelligance',
                          style: tt.headlineMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  ),
                  _NotificationBell(onTap: () => context.push("/settings")),
                ],
              ),
              const SizedBox(height: 24),

              // ── Search Bar ──
              _SearchBar(onTap: () => context.push("/doctors")),
              const SizedBox(height: 24),

              // ── AI Health Summary ──
              _AiSummaryCard(aiAsync: aiAsync, onRetry: () => ref.invalidate(aiHealthSummaryProvider)),
              const SizedBox(height: 24),

              // ── Upcoming Appointment ──
              apptsAsync.when(
                loading: () => Container(
                  height: 150,
                  margin: const EdgeInsets.only(bottom: 24),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    color: AppTheme.surfaceContainerLow,
                  ),
                  child: const Center(child: CircularProgressIndicator()),
                ),
                error: (_, __) => const SizedBox.shrink(),
                data: (appts) {
                  if (appts.isEmpty) return const SizedBox.shrink();
                  final nextAppt = appts.first;
                  final apptDate = nextAppt.scheduledAt.toLocal();
                  final formattedDate = DateFormat('MMM dd, yyyy').format(apptDate);
                  final formattedTime = DateFormat('hh:mm a').format(apptDate);

                  return GestureDetector(
                    onTap: () => context.push("/appointments"),
                    child: GradientCard(
                      margin: const EdgeInsets.only(bottom: 24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              _PillBadge(
                                icon: Icons.schedule_rounded,
                                label: "Upcoming Care",
                              ),
                              const Spacer(),
                              Icon(
                                Icons.chevron_right_rounded,
                                color: Colors.white.withValues(alpha: 0.7),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.18),
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: const Icon(
                                  Icons.medical_services_rounded,
                                  color: Colors.white,
                                  size: 24,
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      nextAppt.doctorName ?? nextAppt.doctorId,
                                      style: tt.titleMedium?.copyWith(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w700,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      "$formattedDate at $formattedTime",
                                      style: tt.bodySmall?.copyWith(
                                        color: Colors.white.withValues(alpha: 0.78),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),

              // ── Quick Actions ──
              Text(
                "Quick Actions",
                style: tt.titleLarge?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 16),
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                mainAxisSpacing: 14,
                crossAxisSpacing: 14,
                childAspectRatio: 1.15,
                children: [
                  _ActionTile(
                    title: "Book Appointment",
                    icon: Icons.calendar_month_rounded,
                    onTap: () => context.push("/doctors"),
                  ),
                  _ActionTile(
                    title: "Emergency",
                    icon: Icons.sos_rounded,
                    color: AppTheme.error,
                    onTap: () => context.push("/emergency"),
                  ),
                  _ActionTile(
                    title: "Reports",
                    icon: Icons.description_rounded,
                    onTap: () => context.push("/records"),
                  ),
                  _ActionTile(
                    title: "Prescriptions",
                    icon: Icons.medication_rounded,
                    onTap: () => context.push("/prescriptions"),
                  ),
                  _ActionTile(
                    title: "Nearby Hospitals",
                    icon: Icons.local_hospital_rounded,
                    onTap: () => context.push("/hospitals"),
                  ),
                  _ActionTile(
                    title: "Chat",
                    icon: Icons.chat_bubble_outline_rounded,
                    onTap: () => context.push("/chat"),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // ── Health Vitals ──
              Text(
                "Health Insights",
                style: tt.titleLarge?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 14),
              _VitalsRow(),
            ],
          ),
        ),
      ),
    );
  }
}

// ── AI Summary Card ──────────────────────────────────────────────────
class _AiSummaryCard extends StatelessWidget {
  final AsyncValue<AiHealthSummary> aiAsync;
  final VoidCallback onRetry;

  const _AiSummaryCard({required this.aiAsync, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;

    return aiAsync.when(
      loading: () => _AiSummarySkeleton(),
      error: (_, __) => EnhancedCard(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Icon(Icons.auto_awesome_rounded, size: 32, color: cs.error),
            const SizedBox(height: 12),
            Text("Couldn't load AI insights", style: tt.titleSmall),
            const SizedBox(height: 8),
            TextButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text("Retry"),
            ),
          ],
        ),
      ),
      data: (summary) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: cs.primary.withValues(alpha: 0.08),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
          border: Border.all(
            color: cs.primary.withValues(alpha: 0.12),
            width: 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [cs.primary, cs.primaryContainer],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("AI Health Summary", style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
                      Text(
                        "Powered by Medha AI",
                        style: tt.labelSmall?.copyWith(color: cs.onSurface.withValues(alpha: 0.4)),
                      ),
                    ],
                  ),
                ),
                _RiskChip(riskLevel: summary.riskLevel),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              summary.summary,
              style: tt.bodyMedium?.copyWith(
                color: cs.onSurface.withValues(alpha: 0.75),
                height: 1.6,
              ),
            ),
            if (summary.recommendations.isNotEmpty) ...[
              const SizedBox(height: 16),
              ...summary.recommendations.take(3).map(
                    (rec) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.check_circle_rounded, size: 16, color: cs.secondary),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              rec,
                              style: tt.bodySmall?.copyWith(
                                color: cs.onSurface.withValues(alpha: 0.65),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
            ],
          ],
        ),
      ),
    );
  }
}

class _AiSummarySkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              SkeletonLoader(width: 42, height: 42, borderRadius: BorderRadius.circular(12)),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SkeletonLoader(width: 140, height: 14, borderRadius: BorderRadius.circular(7)),
                  const SizedBox(height: 6),
                  SkeletonLoader(width: 100, height: 10, borderRadius: BorderRadius.circular(5)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          SkeletonLoader(width: double.infinity, height: 12, borderRadius: BorderRadius.circular(6)),
          const SizedBox(height: 8),
          SkeletonLoader(width: double.infinity, height: 12, borderRadius: BorderRadius.circular(6)),
          const SizedBox(height: 8),
          SkeletonLoader(width: 200, height: 12, borderRadius: BorderRadius.circular(6)),
        ],
      ),
    );
  }
}

class _RiskChip extends StatelessWidget {
  final String riskLevel;
  const _RiskChip({required this.riskLevel});

  @override
  Widget build(BuildContext context) {
    Color color;
    IconData icon;
    switch (riskLevel) {
      case 'high':
        color = AppTheme.error;
        icon = Icons.warning_rounded;
        break;
      case 'moderate':
        color = const Color(0xFFFB8C00);
        icon = Icons.info_rounded;
        break;
      default:
        color = AppTheme.secondary;
        icon = Icons.verified_rounded;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            riskLevel.toUpperCase(),
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w700,
                  fontSize: 10,
                ),
          ),
        ],
      ),
    );
  }
}

// ── Reusable sub-widgets ─────────────────────────────────────────────
class _NotificationBell extends StatelessWidget {
  final VoidCallback onTap;
  const _NotificationBell({required this.onTap});

  @override
  Widget build(BuildContext context) {
    final cardColor = Theme.of(context).cardColor;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: AppTheme.primary.withValues(alpha: 0.06),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Stack(
          children: [
            const Icon(Icons.notifications_none_rounded, color: AppTheme.primary, size: 22),
            Positioned(
              right: 0,
              top: 0,
              child: Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: AppTheme.error,
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SearchBar extends StatelessWidget {
  final VoidCallback onTap;
  const _SearchBar({required this.onTap});

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final cardColor = Theme.of(context).cardColor;
    return Container(
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primary.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: TextField(
        readOnly: true,
        onTap: onTap,
        decoration: InputDecoration(
          prefixIcon: const Icon(Icons.search_rounded, size: 22, color: AppTheme.primary),
          hintText: "Search doctors, hospitals...",
          hintStyle: tt.bodyMedium?.copyWith(
            color: AppTheme.onSurface.withValues(alpha: 0.35),
          ),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        ),
      ),
    );
  }
}

class _PillBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  const _PillBadge({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: Colors.white),
          const SizedBox(width: 4),
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                ),
          ),
        ],
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color? color;
  final VoidCallback onTap;

  const _ActionTile({
    required this.title,
    required this.icon,
    required this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppTheme.primary;
    final tt = Theme.of(context).textTheme;
    final cardColor = Theme.of(context).cardColor;
    return Container(
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primary.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: c.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(icon, color: c, size: 24),
                ),
                const Spacer(),
                Text(
                  title,
                  style: tt.labelLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                    color: AppTheme.onSurface,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _VitalsRow extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    return Row(
      children: [
        Expanded(
          child: _VitalCard(
            label: "Heart Rate",
            value: "72 bpm",
            icon: Icons.favorite_rounded,
            color: AppTheme.secondary,
            status: "Normal",
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: _VitalCard(
            label: "Blood Type",
            value: "O+",
            icon: Icons.water_drop_rounded,
            color: AppTheme.primary,
            status: "Recorded",
          ),
        ),
      ],
    );
  }
}

class _VitalCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final String status;

  const _VitalCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.status,
  });

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final cardColor = Theme.of(context).cardColor;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardColor,
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
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  status,
                  style: tt.labelSmall?.copyWith(
                    color: color,
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
          Text(
            label,
            style: tt.labelSmall?.copyWith(color: AppTheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}