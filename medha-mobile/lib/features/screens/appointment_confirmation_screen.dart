import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';
import 'package:medha_mobile/core/widgets/enhanced_card.dart';

class AppointmentConfirmationScreen extends StatelessWidget {
  final Map<String, dynamic> payload;
  const AppointmentConfirmationScreen({super.key, required this.payload});

  @override
  Widget build(BuildContext context) {
    final dt = DateTime.tryParse(payload["scheduledAt"] ?? "") ?? DateTime.now();
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => context.canPop() ? context.pop() : context.go("/home"),
        ),
        title: Text("Booking Confirmed", style: tt.titleLarge),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Success hero
            GradientCard(
              padding: const EdgeInsets.all(28),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.18),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.check_circle_rounded, color: Colors.white, size: 36),
                  ),
                  const SizedBox(height: 18),
                  Text(
                    "Appointment Confirmed",
                    style: tt.titleLarge?.copyWith(color: Colors.white, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    "${dt.toLocal()}",
                    style: tt.bodySmall?.copyWith(color: Colors.white.withValues(alpha: 0.78), fontWeight: FontWeight.w500),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            // Details
            EnhancedCard(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Details", style: tt.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 18),
                  _DetailRow(label: "Appointment ID", value: payload["appointmentId"]?.toString() ?? "-"),
                  _DetailRow(label: "Doctor", value: payload["doctorName"]?.toString() ?? "-"),
                  _DetailRow(label: "Date/Time", value: dt.toLocal().toString()),
                  _DetailRow(label: "Mode", value: payload["mode"]?.toString() ?? "-"),
                ],
              ),
            ),
            const Spacer(),
            FilledButton(
              onPressed: () => context.go("/home"),
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(56),
                shape: const StadiumBorder(),
                elevation: 0,
              ),
              child: Text("Back to Home", style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w700, color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label, style: tt.bodySmall?.copyWith(fontWeight: FontWeight.w500, color: cs.onSurface.withValues(alpha: 0.5))),
          ),
          Expanded(
            child: Text(value, style: tt.bodySmall?.copyWith(fontWeight: FontWeight.w700), overflow: TextOverflow.ellipsis),
          ),
        ],
      ),
    );
  }
}
