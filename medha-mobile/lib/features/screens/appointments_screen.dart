import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';
import 'package:medha_mobile/core/widgets/empty_state.dart';
import 'package:medha_mobile/core/widgets/skeleton_loader.dart';
import 'package:medha_mobile/core/widgets/enhanced_card.dart';
import 'package:medha_mobile/core/widgets/status_badge.dart';
import 'package:medha_mobile/features/home/home_repository.dart';

class AppointmentsScreen extends ConsumerWidget {
  const AppointmentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appointmentsAsync = ref.watch(appointmentsProvider("guest_patient"));
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: cs.surface,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "My Appointments",
                    style: tt.headlineMedium?.copyWith(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    "Manage your health appointments",
                    style: tt.bodyMedium?.copyWith(
                      color: cs.onSurface.withValues(alpha: 0.5),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Appointments list
            Expanded(
              child: appointmentsAsync.when(
                loading: () => ListView.builder(
                  itemCount: 4,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemBuilder: (_, __) => const AppointmentCardSkeleton(),
                ),
                error: (error, _) => EmptyState(
                  icon: Icons.error_outline_rounded,
                  title: 'Unable to load appointments',
                  subtitle: error.toString(),
                  actionLabel: 'Retry',
                  onAction: () => ref.invalidate(appointmentsProvider("guest_patient")),
                ),
                data: (appointments) {
                  if (appointments.isEmpty) {
                    return const EmptyState(
                      icon: Icons.event_busy_rounded,
                      title: 'No appointments yet',
                      subtitle: 'Book your first appointment to get started',
                      actionLabel: 'Book Appointment',
                    );
                  }

                  return RefreshIndicator(
                    onRefresh: () async {
                      ref.invalidate(appointmentsProvider("guest_patient"));
                      await ref.read(appointmentsProvider("guest_patient").future);
                    },
                    color: cs.primary,
                    child: ListView.builder(
                      itemCount: appointments.length,
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                      itemBuilder: (_, i) {
                        final appointment = appointments[i];
                        return _EnhancedAppointmentCard(
                          appointment: appointment,
                          onStatusChange: (status) async {
                            final cache = ref.read(localCacheProvider);
                            await updateAppointmentStatus(
                              cache: cache,
                              appointmentId: appointment.id,
                              status: status,
                            );
                            ref.invalidate(appointmentsProvider("guest_patient"));
                          },
                        );
                      },
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EnhancedAppointmentCard extends StatelessWidget {
  final dynamic appointment;
  final Function(String) onStatusChange;

  const _EnhancedAppointmentCard({
    required this.appointment,
    required this.onStatusChange,
  });

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;
    final isCompleted = appointment.status == "completed";
    final isCancelled = appointment.status == "cancelled";

    Color statusColor;
    if (isCompleted) {
      statusColor = AppTheme.secondary;
    } else if (isCancelled) {
      statusColor = AppTheme.error;
    } else {
      statusColor = cs.primary;
    }

    final dateTime = appointment.scheduledAt.toLocal();
    final formattedDate = DateFormat('MMM dd, yyyy').format(dateTime);
    final formattedTime = DateFormat('hh:mm a').format(dateTime);

    return EnhancedCard(
      margin: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(
                  Icons.medical_services_rounded,
                  color: statusColor,
                  size: 24,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      appointment.doctorId,
                      style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(
                          Icons.videocam_rounded,
                          size: 14,
                          color: cs.onSurface.withValues(alpha: 0.5),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          appointment.mode,
                          style: tt.bodySmall?.copyWith(
                            color: cs.onSurface.withValues(alpha: 0.55),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              if (!isCompleted && !isCancelled)
                PopupMenuButton<String>(
                  onSelected: onStatusChange,
                  icon: Icon(
                    Icons.more_vert_rounded,
                    color: cs.onSurface.withValues(alpha: 0.35),
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  itemBuilder: (_) => [
                    const PopupMenuItem(
                      value: "cancelled",
                      child: Row(
                        children: [
                          Icon(Icons.cancel_rounded, size: 18, color: Colors.red),
                          SizedBox(width: 8),
                          Text("Cancel"),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: "completed",
                      child: Row(
                        children: [
                          Icon(Icons.check_circle_rounded, size: 18, color: Colors.green),
                          SizedBox(width: 8),
                          Text("Mark Complete"),
                        ],
                      ),
                    ),
                  ],
                ),
            ],
          ),
          const SizedBox(height: 14),

          // Date and time info
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppTheme.surfaceContainerLow,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Row(
                    children: [
                      Icon(Icons.calendar_today_rounded, size: 16, color: cs.primary),
                      const SizedBox(width: 8),
                      Text(
                        formattedDate,
                        style: tt.bodySmall?.copyWith(fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
                Container(
                  width: 1,
                  height: 16,
                  color: AppTheme.outlineVariant.withValues(alpha: 0.5),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Row(
                    children: [
                      Icon(Icons.access_time_rounded, size: 16, color: cs.primary),
                      const SizedBox(width: 8),
                      Text(
                        formattedTime,
                        style: tt.bodySmall?.copyWith(fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Status badge
          StatusBadge(status: appointment.status),
        ],
      ),
    );
  }
}