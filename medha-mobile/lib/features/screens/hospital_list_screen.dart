import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:medha_mobile/features/home/home_repository.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';
import 'package:medha_mobile/core/widgets/enhanced_card.dart';
import 'package:medha_mobile/core/widgets/empty_state.dart';
import 'package:medha_mobile/core/widgets/skeleton_loader.dart';

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
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => context.canPop() ? context.pop() : context.go("/home"),
        ),
        title: Text("Hospitals", style: tt.titleLarge),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 10),
            child: EnhancedCard(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Find Nearby Care", style: tt.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 14),
                  TextField(
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.location_on_rounded, size: 20),
                      hintText: "Filter by location",
                      hintStyle: tt.bodySmall?.copyWith(color: cs.onSurface.withValues(alpha: 0.35), fontWeight: FontWeight.w500),
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
                      Text("Min rating: ${minRating.toStringAsFixed(1)}", style: tt.bodySmall?.copyWith(fontWeight: FontWeight.w700)),
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
                        child: Text("Emergency available only", style: tt.bodySmall?.copyWith(fontWeight: FontWeight.w600)),
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
              loading: () => ListView.builder(
                itemCount: 4,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemBuilder: (_, __) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: SkeletonLoader(width: double.infinity, height: 80, borderRadius: BorderRadius.circular(20)),
                ),
              ),
              error: (e, _) => EmptyState(
                icon: Icons.error_outline_rounded,
                title: 'Unable to load hospitals',
                subtitle: e.toString(),
              ),
              data: (hospitals) {
                final filtered = hospitals.where((h) {
                  final matchesLocation = locationFilter.isEmpty || h.location.toLowerCase().contains(locationFilter);
                  final matchesRating = h.rating >= minRating;
                  final matchesEmergency = !emergencyOnly || h.emergencyAvailable;
                  return matchesLocation && matchesRating && matchesEmergency;
                }).toList();
                
                if (filtered.isEmpty) {
                  return const EmptyState(
                    icon: Icons.location_off_rounded,
                    title: 'No hospitals found',
                    subtitle: 'Try adjusting your filters',
                  );
                }
                
                return ListView.builder(
                  itemCount: filtered.length,
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                  itemBuilder: (_, i) {
                    final h = filtered[i];
                    return EnhancedCard(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
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
                                Text(h.name, style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w700), maxLines: 1, overflow: TextOverflow.ellipsis),
                                const SizedBox(height: 3),
                                Text("${h.location} • ⭐ ${h.rating.toStringAsFixed(1)}", style: tt.bodySmall?.copyWith(color: cs.onSurface.withValues(alpha: 0.5))),
                              ],
                            ),
                          ),
                          if (h.emergencyAvailable)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: cs.error.withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.warning_rounded, size: 14, color: cs.error),
                                  const SizedBox(width: 4),
                                  Text("ER", style: tt.labelSmall?.copyWith(fontWeight: FontWeight.w700, color: cs.error, fontSize: 11)),
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
