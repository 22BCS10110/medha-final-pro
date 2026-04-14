import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';
import 'package:medha_mobile/core/models/domain_models.dart';
import 'package:medha_mobile/core/widgets/enhanced_card.dart';
import 'package:medha_mobile/features/home/home_repository.dart';

class DoctorProfileScreen extends ConsumerStatefulWidget {
  final Doctor doctor;
  const DoctorProfileScreen({super.key, required this.doctor});

  @override
  ConsumerState<DoctorProfileScreen> createState() => _DoctorProfileScreenState();
}

class _DoctorProfileScreenState extends ConsumerState<DoctorProfileScreen> {
  DateTime selectedDate = DateTime.now().add(const Duration(days: 1));
  String selectedSlot = "10:00";
  String mode = "online";

  static const slots = ["09:30", "10:00", "10:30", "11:00", "17:00", "17:30"];

  @override
  Widget build(BuildContext context) {
    final d = widget.doctor;
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => context.canPop() ? context.pop() : context.go("/doctors"),
        ),
        title: Text("Doctor Profile", style: tt.titleLarge),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
        children: [
          // Doctor hero card
          GradientCard(
            child: Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: Colors.white.withValues(alpha: 0.18),
                  child: const Icon(Icons.medical_services_rounded, size: 30, color: Colors.white),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        d.name,
                        style: tt.titleLarge?.copyWith(color: Colors.white, fontWeight: FontWeight.w800),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 6),
                      Text(
                        "${d.specialty} • ${d.experienceYears} yrs",
                        style: tt.bodySmall?.copyWith(color: Colors.white.withValues(alpha: 0.82), fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.18),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          "⭐ ${d.rating.toStringAsFixed(1)}",
                          style: tt.labelSmall?.copyWith(color: Colors.white, fontWeight: FontWeight.w700),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // About
          EnhancedCard(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("About", style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                Text(
                  d.about.isEmpty ? "Experienced specialist with patient-focused care." : d.about,
                  style: tt.bodyMedium?.copyWith(color: cs.onSurface.withValues(alpha: 0.65), height: 1.6),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Appointment selection
          EnhancedCard(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("Book Appointment", style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 16),

                // Date picker
                GestureDetector(
                  onTap: () async {
                    final value = await showDatePicker(
                      context: context,
                      initialDate: selectedDate,
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 30)),
                    );
                    if (value != null) setState(() => selectedDate = value);
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceContainerLow,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.calendar_month_rounded, size: 20, color: AppTheme.primary),
                        const SizedBox(width: 12),
                        Text(
                          "${selectedDate.year}-${selectedDate.month.toString().padLeft(2, '0')}-${selectedDate.day.toString().padLeft(2, '0')}",
                          style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                        ),
                        const Spacer(),
                        Icon(Icons.edit_calendar_rounded, size: 18, color: cs.onSurface.withValues(alpha: 0.35)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text("Time Slots", style: tt.bodyMedium?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: slots.map((s) {
                    final isSelected = selectedSlot == s;
                    return GestureDetector(
                      onTap: () => setState(() => selectedSlot = s),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                        decoration: BoxDecoration(
                          color: isSelected ? cs.primary : AppTheme.surfaceContainerLow,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          s,
                          style: tt.labelLarge?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: isSelected ? Colors.white : cs.onSurface.withValues(alpha: 0.7),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 16),
                Text("Mode", style: tt.bodyMedium?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 10),

                // Segmented toggle
                Container(
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceContainerLow,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  padding: const EdgeInsets.all(4),
                  child: Row(
                    children: [
                      Expanded(child: _ModeChip(label: "Online", icon: Icons.videocam_rounded, selected: mode == "online", onTap: () => setState(() => mode = "online"))),
                      Expanded(child: _ModeChip(label: "Offline", icon: Icons.person_rounded, selected: mode == "offline", onTap: () => setState(() => mode = "offline"))),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Confirm button
          FilledButton(
            onPressed: () async {
              final cache = ref.read(localCacheProvider);
              final dateTime = DateTime(
                selectedDate.year, selectedDate.month, selectedDate.day,
                int.parse(selectedSlot.split(":")[0]), int.parse(selectedSlot.split(":")[1]),
              );
              final appointmentId = await bookAppointment(
                cache: cache, patientId: "guest_patient",
                doctorId: d.id, dateTime: dateTime, mode: mode,
              );
              if (!mounted) return;
              context.push("/appointment-confirmation", extra: {
                "appointmentId": appointmentId,
                "doctorName": d.name,
                "scheduledAt": dateTime.toIso8601String(),
                "mode": mode,
              });
            },
            style: FilledButton.styleFrom(
              backgroundColor: cs.primary,
              foregroundColor: Colors.white,
              minimumSize: const Size.fromHeight(56),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              elevation: 0,
            ),
            child: Text("Confirm Appointment", style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w700, color: Colors.white)),
          ),
        ],
      ),
    );
  }
}

class _ModeChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;
  const _ModeChip({required this.label, required this.icon, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: selected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          boxShadow: selected
              ? [BoxShadow(color: AppTheme.primary.withValues(alpha: 0.06), blurRadius: 8, offset: const Offset(0, 2))]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 18, color: selected ? AppTheme.primary : AppTheme.onSurface.withValues(alpha: 0.5)),
            const SizedBox(width: 6),
            Text(
              label,
              style: tt.labelLarge?.copyWith(
                fontWeight: FontWeight.w700,
                color: selected ? AppTheme.primary : AppTheme.onSurface.withValues(alpha: 0.5),
              ),
            ),
          ],
        ),
      ),
    );
  }
}