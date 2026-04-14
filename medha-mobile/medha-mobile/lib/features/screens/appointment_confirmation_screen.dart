import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';

class AppointmentConfirmationScreen extends StatelessWidget {
  final Map<String, dynamic> payload;
  const AppointmentConfirmationScreen({super.key, required this.payload});

  @override
  Widget build(BuildContext context) {
    final dt = DateTime.tryParse(payload["scheduledAt"] ?? "") ?? DateTime.now();
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => context.canPop() ? context.pop() : context.go("/home"),
        ),
        title: Text("Booking Confirmed", style: GoogleFonts.manrope(fontWeight: FontWeight.w700)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Success hero
            Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.primary, AppTheme.primaryContainer],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
              ),
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
                    style: GoogleFonts.manrope(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 22),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    "${dt.toLocal()}",
                    style: GoogleFonts.plusJakartaSans(color: Colors.white.withValues(alpha: 0.78), fontWeight: FontWeight.w500, fontSize: 13),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            // Details
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Details", style: GoogleFonts.manrope(fontWeight: FontWeight.w800, fontSize: 18, color: AppTheme.onSurface)),
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
              child: Text("Back to Home", style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, fontSize: 16)),
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
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label, style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w500, fontSize: 13, color: AppTheme.onSurface.withValues(alpha: 0.5))),
          ),
          Expanded(
            child: Text(value, style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, fontSize: 14, color: AppTheme.onSurface), overflow: TextOverflow.ellipsis),
          ),
        ],
      ),
    );
  }
}
