import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';
import 'package:medha_mobile/core/widgets/enhanced_card.dart';

class PrescriptionsScreen extends StatefulWidget {
  const PrescriptionsScreen({super.key});

  @override
  State<PrescriptionsScreen> createState() => _PrescriptionsScreenState();
}

class _PrescriptionsScreenState extends State<PrescriptionsScreen> {
  // Local storage for prescriptions
  final List<Map<String, dynamic>> _prescriptions = [];

  void _addDemoPrescription() {
    setState(() {
      _prescriptions.insert(0, {
        "id": DateTime.now().millisecondsSinceEpoch.toString(),
        "patientId": "guest_patient",
        "doctorId": "seed-doctor",
        "medicines": [
          {"name": "Paracetamol 500mg", "dosage": "1-0-1", "schedule": "after food", "status": "pending"}
        ],
        "createdAt": DateTime.now(),
      });
    });
  }

  void _updateStatus(String id, String status) {
    setState(() {
      final idx = _prescriptions.indexWhere((p) => p["id"] == id);
      if (idx >= 0) {
        final meds = List<Map<String, dynamic>>.from(_prescriptions[idx]["medicines"].map((e) => Map<String, dynamic>.from(e)));
        if (meds.isNotEmpty) {
          meds[0]["status"] = status;
        }
        _prescriptions[idx]["medicines"] = meds;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Text("Prescriptions", style: tt.titleLarge),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: _prescriptions.isEmpty
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.medication_rounded, size: 48, color: cs.onSurface.withValues(alpha: 0.15)),
                  const SizedBox(height: 12),
                  Text(
                    "No prescriptions found",
                    style: tt.bodyMedium?.copyWith(
                      color: cs.onSurface.withValues(alpha: 0.4),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            )
          : ListView.builder(
              itemCount: _prescriptions.length,
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
              itemBuilder: (_, i) {
                final data = _prescriptions[i];
                final meds = (data["medicines"] as List?) ?? [];
                final first = meds.isNotEmpty ? (meds.first as Map) : {"name": "Medicine", "dosage": "-"};
                final status = meds.isNotEmpty ? (meds.first as Map)["status"]?.toString() ?? "pending" : "pending";
                final statusColor = status == "taken" ? const Color(0xFF43A047) : status == "missed" ? AppTheme.error : AppTheme.primary;
                return EnhancedCard(
                  margin: const EdgeInsets.only(bottom: 14),
                  padding: const EdgeInsets.all(18),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: statusColor.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Icon(Icons.medication_rounded, color: statusColor, size: 24),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              (first["name"] ?? "Medicine").toString(),
                              style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              "Dosage: ${(first["dosage"] ?? "-").toString()}",
                              style: tt.bodySmall?.copyWith(color: cs.onSurface.withValues(alpha: 0.55)),
                            ),
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: statusColor.withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(
                                status.toUpperCase(),
                                style: tt.labelSmall?.copyWith(
                                  fontWeight: FontWeight.w700,
                                  color: statusColor,
                                  letterSpacing: 0.5,
                                  fontSize: 10,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      PopupMenuButton<String>(
                        onSelected: (value) {
                          if (value == "remind") {
                            if (context.mounted) context.go("/reminders");
                            return;
                          }
                          _updateStatus(data["id"], value);
                        },
                        icon: Icon(Icons.more_vert_rounded, color: cs.onSurface.withValues(alpha: 0.35)),
                        itemBuilder: (_) => const [
                          PopupMenuItem(value: "taken", child: Text("Mark Taken")),
                          PopupMenuItem(value: "missed", child: Text("Mark Missed")),
                          PopupMenuItem(value: "remind", child: Text("Set Reminder")),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _addDemoPrescription,
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
        label: Text("Add Demo", style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w700, color: Colors.white)),
        icon: const Icon(Icons.add_rounded),
      ),
    );
  }
}