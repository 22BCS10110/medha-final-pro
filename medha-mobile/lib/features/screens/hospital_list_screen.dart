import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:medha_mobile/features/home/home_repository.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';

class HospitalListScreen extends ConsumerStatefulWidget {
  const HospitalListScreen({super.key});

  @override
  ConsumerState<HospitalListScreen> createState() => _HospitalListScreenState();
}

class _HospitalListScreenState extends ConsumerState<HospitalListScreen> {
  String locationFilter = "";
  double minRating = 0;
  bool emergencyOnly = false;

  @override
  Widget build(BuildContext context) {
    final hospitalsAsync = ref.watch(hospitalsProvider);
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => context.canPop() ? context.pop() : context.go("/home"),
        ),
        title: Text("Hospitals", style: GoogleFonts.manrope(fontWeight: FontWeight.w700)),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 10),
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Find Nearby Care", style: GoogleFonts.manrope(fontWeight: FontWeight.w800, fontSize: 18, color: AppTheme.onSurface)),
                  const SizedBox(height: 14),
                  TextField(
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.location_on_rounded, size: 20),
                      hintText: "Filter by location",
                      hintStyle: GoogleFonts.plusJakartaSans(color: AppTheme.onSurface.withValues(alpha: 0.35), fontWeight: FontWeight.w500),
                      filled: true,
                      fillColor: AppTheme.surfaceContainerHighest.withValues(alpha: 0.5),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppTheme.primary, width: 2)),
                    ),
                    onChanged: (v) => setState(() => locationFilter = v.toLowerCase()),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      const Icon(Icons.star_rounded, size: 20, color: AppTheme.primary),
                      const SizedBox(width: 8),
                      Text("Min rating: ${minRating.toStringAsFixed(1)}", style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, fontSize: 14, color: AppTheme.onSurface)),
                    ],
                  ),
                  SliderTheme(
                    data: SliderThemeData(
                      activeTrackColor: AppTheme.primary,
                      inactiveTrackColor: AppTheme.surfaceContainerHighest,
                      thumbColor: AppTheme.primary,
                      overlayColor: AppTheme.primary.withValues(alpha: 0.12),
                    ),
                    child: Slider(
                      value: minRating,
                      min: 0,
                      max: 5,
                      divisions: 10,
                      onChanged: (v) => setState(() => minRating = v),
                    ),
                  ),
                  Row(
                    children: [
                      Expanded(
                        child: Text("Emergency available only", style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600, fontSize: 14, color: AppTheme.onSurface)),
                      ),
                      Switch(
                        value: emergencyOnly,
                        onChanged: (v) => setState(() => emergencyOnly = v),
                        activeTrackColor: AppTheme.primary,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: hospitalsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.primary)),
              error: (e, _) => Center(child: Text(e.toString())),
              data: (hospitals) {
                final filtered = hospitals.where((h) {
                  final matchesLocation = locationFilter.isEmpty || h.location.toLowerCase().contains(locationFilter);
                  final matchesRating = h.rating >= minRating;
                  final matchesEmergency = !emergencyOnly || h.emergencyAvailable;
                  return matchesLocation && matchesRating && matchesEmergency;
                }).toList();
                if (filtered.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.location_off_rounded, size: 48, color: AppTheme.onSurface.withValues(alpha: 0.15)),
                        const SizedBox(height: 12),
                        Text("No hospitals for selected filters", style: GoogleFonts.plusJakartaSans(color: AppTheme.onSurface.withValues(alpha: 0.4), fontWeight: FontWeight.w600)),
                      ],
                    ),
                  );
                }
                return ListView.builder(
                  itemCount: filtered.length,
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                  itemBuilder: (_, i) {
                    final h = filtered[i];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 24,
                            backgroundColor: AppTheme.primary.withValues(alpha: 0.08),
                            child: const Icon(Icons.local_hospital_rounded, color: AppTheme.primary, size: 24),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(h.name, style: GoogleFonts.manrope(fontWeight: FontWeight.w700, fontSize: 15, color: AppTheme.onSurface), maxLines: 1, overflow: TextOverflow.ellipsis),
                                const SizedBox(height: 3),
                                Text("${h.location} • ⭐ ${h.rating.toStringAsFixed(1)}", style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w500, fontSize: 12, color: AppTheme.onSurface.withValues(alpha: 0.5))),
                              ],
                            ),
                          ),
                          if (h.emergencyAvailable)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: AppTheme.tertiary.withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.warning_rounded, size: 14, color: AppTheme.tertiary),
                                  const SizedBox(width: 4),
                                  Text("ER", style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, color: AppTheme.tertiary, fontSize: 11)),
                                ],
                              ),
                            ),
                        ],
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
