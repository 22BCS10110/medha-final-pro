import 'package:flutter/material.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';
import 'package:medha_mobile/core/widgets/enhanced_card.dart';
import 'package:url_launcher/url_launcher.dart';

class EmergencyScreen extends StatelessWidget {
  const EmergencyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Text("Emergency", style: tt.titleLarge),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
        children: [
          // Emergency hero
          Container(
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [cs.error, AppTheme.error.withValues(alpha: 0.8)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: cs.error.withValues(alpha: 0.3),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.18),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.sos_rounded, color: Colors.white, size: 40),
                ),
                const SizedBox(height: 18),
                Text(
                  "Emergency Assistance",
                  style: tt.titleLarge?.copyWith(color: Colors.white, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 8),
                Text(
                  "Press the button below for immediate\nmedical response.",
                  textAlign: TextAlign.center,
                  style: tt.bodySmall?.copyWith(color: Colors.white.withValues(alpha: 0.82), height: 1.5),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: cs.error,
                      shape: const StadiumBorder(),
                      elevation: 0,
                    ),
                    onPressed: () async {
                      final uri = Uri.parse("tel:108");
                      await launchUrl(uri);
                    },
                    icon: const Icon(Icons.call_rounded),
                    label: Text("Call Ambulance • 108", style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w700, color: cs.error)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Nearby hospitals
          Text("Nearby Hospitals", style: tt.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          _HospitalTile(name: "City General Hospital", address: "Main Road, City Center", distance: "1.2 km"),
          const SizedBox(height: 12),
          _HospitalTile(name: "District Medical Center", address: "Hospital Road, District", distance: "3.5 km"),
          const SizedBox(height: 20),

          // Medical ID
          EnhancedCard(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.badge_rounded, color: AppTheme.primary, size: 22),
                    const SizedBox(width: 10),
                    Text("Medical ID", style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w800)),
                  ],
                ),
                const SizedBox(height: 12),
                _InfoRow(label: "Blood Type", value: "O Positive"),
                const SizedBox(height: 8),
                _InfoRow(label: "Allergies", value: "Penicillin"),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Location sharing
          EnhancedCard(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTheme.secondary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.location_on_rounded, color: AppTheme.secondary, size: 22),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("Live Location Sharing", style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 3),
                      Text(
                        "Your coordinates are shared\nwith emergency contacts.",
                        style: tt.labelSmall?.copyWith(color: cs.onSurface.withValues(alpha: 0.5), height: 1.4),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: AppTheme.secondary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    "Active",
                    style: tt.labelSmall?.copyWith(fontWeight: FontWeight.w700, color: AppTheme.secondary),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _HospitalTile extends StatelessWidget {
  final String name;
  final String address;
  final String distance;
  const _HospitalTile({required this.name, required this.address, required this.distance});

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    return EnhancedCard(
      padding: const EdgeInsets.all(18),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.error.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.local_hospital_rounded, color: AppTheme.error, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 3),
                Text(address, style: tt.labelSmall?.copyWith(color: AppTheme.onSurfaceVariant)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(distance, style: tt.labelSmall?.copyWith(fontWeight: FontWeight.w700, color: AppTheme.primary)),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: tt.bodySmall?.copyWith(color: AppTheme.onSurfaceVariant)),
        Text(value, style: tt.bodySmall?.copyWith(fontWeight: FontWeight.w700)),
      ],
    );
  }
}
