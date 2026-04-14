import 'package:flutter/material.dart';
import 'package:medha_mobile/core/services/reminder_service.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';
import 'package:medha_mobile/core/widgets/enhanced_card.dart';

class MedicineRemindersScreen extends StatefulWidget {
  const MedicineRemindersScreen({super.key});

  @override
  State<MedicineRemindersScreen> createState() => _MedicineRemindersScreenState();
}

class _MedicineRemindersScreenState extends State<MedicineRemindersScreen> {
  final medicineCtrl = TextEditingController(text: "Paracetamol");
  final service = ReminderService();
  TimeOfDay time = const TimeOfDay(hour: 9, minute: 0);

  @override
  void initState() {
    super.initState();
    service.init();
  }

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Text("Medicine Reminders", style: tt.titleLarge),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        child: ListView(
          children: [
            EnhancedCard(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.alarm_rounded, color: AppTheme.primary, size: 22),
                      ),
                      const SizedBox(width: 12),
                      Text("Set Your Reminder", style: tt.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
                    ],
                  ),
                  const SizedBox(height: 20),
                  TextField(
                    controller: medicineCtrl,
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.medication_rounded, size: 20),
                      hintText: "Medicine name",
                      filled: true,
                      fillColor: AppTheme.surfaceContainerHighest.withValues(alpha: 0.5),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppTheme.primary, width: 2)),
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Time picker
                  GestureDetector(
                    onTap: () async {
                      final picked = await showTimePicker(context: context, initialTime: time);
                      if (picked != null) setState(() => time = picked);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceContainerLow,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.access_time_rounded, size: 22, color: AppTheme.primary),
                          const SizedBox(width: 14),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text("Reminder Time", style: tt.bodySmall?.copyWith(fontWeight: FontWeight.w600, color: cs.onSurface.withValues(alpha: 0.5))),
                              const SizedBox(height: 2),
                              Text(time.format(context), style: tt.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
                            ],
                          ),
                          const Spacer(),
                          Icon(Icons.edit_rounded, size: 18, color: cs.onSurface.withValues(alpha: 0.35)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  FilledButton(
                    onPressed: () async {
                      final now = DateTime.now();
                      var when = DateTime(now.year, now.month, now.day, time.hour, time.minute);
                      if (when.isBefore(now)) when = when.add(const Duration(days: 1));
                      await service.scheduleMedicineReminder(
                        id: when.millisecondsSinceEpoch % 1000000,
                        medicineName: medicineCtrl.text.trim(),
                        when: when,
                      );
                      if (!mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Reminder scheduled")));
                    },
                    style: FilledButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      minimumSize: const Size.fromHeight(56),
                      shape: const StadiumBorder(),
                      elevation: 0,
                    ),
                    child: Text("Set Reminder", style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w700, color: Colors.white)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
