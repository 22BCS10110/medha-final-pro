import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';
import 'package:medha_mobile/core/widgets/empty_state.dart';
import 'package:medha_mobile/core/widgets/skeleton_loader.dart';
import 'package:medha_mobile/core/widgets/enhanced_card.dart';
import 'package:medha_mobile/features/home/home_repository.dart';
import 'package:medha_mobile/l10n/app_localizations.dart';

class DoctorListScreen extends ConsumerStatefulWidget {
  const DoctorListScreen({super.key});

  @override
  ConsumerState<DoctorListScreen> createState() => _DoctorListScreenState();
}

class _DoctorListScreenState extends ConsumerState<DoctorListScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';
  String? _selectedSpecialty;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final doctorsAsync = ref.watch(doctorsProvider);
    final l10n = AppLocalizations.of(context)!;
    
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => context.canPop() ? context.pop() : context.go("/home"),
        ),
        title: Text(
          l10n.doctors,
          style: GoogleFonts.manrope(fontWeight: FontWeight.w800, fontSize: 22),
        ),
        backgroundColor: AppTheme.surface,
        elevation: 0,
      ),
      backgroundColor: AppTheme.surface,
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.onSurface.withValues(alpha: 0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: TextField(
                controller: _searchController,
                onChanged: (value) => setState(() => _searchQuery = value.toLowerCase()),
                decoration: InputDecoration(
                  prefixIcon: const Icon(
                    Icons.search_rounded,
                    color: AppTheme.primary,
                    size: 22,
                  ),
                  hintText: "Search by name or specialty...",
                  hintStyle: GoogleFonts.plusJakartaSans(
                    color: AppTheme.onSurface.withValues(alpha: 0.35),
                    fontWeight: FontWeight.w500,
                  ),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear_rounded, size: 20),
                          onPressed: () {
                            _searchController.clear();
                            setState(() => _searchQuery = '');
                          },
                        )
                      : null,
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 16,
                  ),
                ),
              ),
            ),
          ),
          
          // Specialty filter chips
          doctorsAsync.when(
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
            data: (doctors) {
              final specialties = doctors
                  .map((d) => d.specialty)
                  .toSet()
                  .toList()..sort();
              
              if (specialties.isEmpty) return const SizedBox.shrink();
              
              return Container(
                height: 50,
                margin: const EdgeInsets.only(bottom: 16),
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: specialties.length + 1,
                  itemBuilder: (context, index) {
                    if (index == 0) {
                      return _FilterChip(
                        label: 'All',
                        isSelected: _selectedSpecialty == null,
                        onTap: () => setState(() => _selectedSpecialty = null),
                      );
                    }
                    final specialty = specialties[index - 1];
                    return _FilterChip(
                      label: specialty,
                      isSelected: _selectedSpecialty == specialty,
                      onTap: () => setState(() => _selectedSpecialty = specialty),
                    );
                  },
                ),
              );
            },
          ),
          
          // Doctor list
          Expanded(
            child: doctorsAsync.when(
              loading: () => ListView.builder(
                itemCount: 6,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemBuilder: (_, __) => const DoctorCardSkeleton(),
              ),
              error: (error, _) => EmptyState(
                icon: Icons.error_outline_rounded,
                title: 'Oops! Something went wrong',
                subtitle: error.toString(),
                actionLabel: 'Retry',
                onAction: () => ref.invalidate(doctorsProvider),
              ),
              data: (doctors) {
                if (doctors.isEmpty) {
                  return EmptyState(
                    icon: Icons.person_search_rounded,
                    title: 'No doctors available',
                    subtitle: 'Check back later for available doctors',
                  );
                }
                
                // Apply filters
                var filteredDoctors = doctors;
                if (_searchQuery.isNotEmpty) {
                  filteredDoctors = filteredDoctors.where((d) {
                    return d.name.toLowerCase().contains(_searchQuery) ||
                        d.specialty.toLowerCase().contains(_searchQuery);
                  }).toList();
                }
                if (_selectedSpecialty != null) {
                  filteredDoctors = filteredDoctors
                      .where((d) => d.specialty == _selectedSpecialty)
                      .toList();
                }
                
                if (filteredDoctors.isEmpty) {
                  return EmptyState(
                    icon: Icons.search_off_rounded,
                    title: 'No results found',
                    subtitle: 'Try adjusting your search or filters',
                  );
                }
                
                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(doctorsProvider);
                    await ref.read(doctorsProvider.future);
                  },
                  color: AppTheme.primary,
                  child: ListView.builder(
                    itemCount: filteredDoctors.length,
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                    itemBuilder: (context, i) {
                      final doctor = filteredDoctors[i];
                      return _EnhancedDoctorCard(
                        doctor: doctor,
                        onTap: () => context.push("/doctor-profile", extra: doctor),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;
  
  const _FilterChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(right: 10),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.primary
              : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected
                ? AppTheme.primary
                : AppTheme.outlineVariant.withValues(alpha: 0.5),
            width: 1.5,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppTheme.primary.withValues(alpha: 0.2),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: isSelected ? Colors.white : AppTheme.onSurface,
          ),
        ),
      ),
    );
  }
}

class _EnhancedDoctorCard extends StatelessWidget {
  final dynamic doctor;
  final VoidCallback onTap;
  
  const _EnhancedDoctorCard({
    required this.doctor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return EnhancedCard(
      margin: const EdgeInsets.only(bottom: 14),
      onTap: onTap,
      child: Row(
        children: [
          // Doctor avatar with online indicator
          Stack(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: AppTheme.primary.withValues(alpha: 0.1),
                child: const Icon(
                  Icons.person_rounded,
                  color: AppTheme.primary,
                  size: 28,
                ),
              ),
              Positioned(
                right: 0,
                bottom: 0,
                child: Container(
                  width: 14,
                  height: 14,
                  decoration: BoxDecoration(
                    color: const Color(0xFF43A047),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: Colors.white,
                      width: 2,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  doctor.name,
                  style: GoogleFonts.manrope(
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                    color: AppTheme.onSurface,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(
                      Icons.medical_services_rounded,
                      size: 14,
                      color: AppTheme.onSurface.withValues(alpha: 0.5),
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        "${doctor.specialty} • ${doctor.experienceYears} yrs exp",
                        style: GoogleFonts.plusJakartaSans(
                          fontWeight: FontWeight.w500,
                          fontSize: 13,
                          color: AppTheme.onSurface.withValues(alpha: 0.55),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: const Color(0xFFFB8C00).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.star_rounded,
                      size: 14,
                      color: Color(0xFFFB8C00),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      doctor.rating.toStringAsFixed(1),
                      style: GoogleFonts.plusJakartaSans(
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                        color: const Color(0xFFFB8C00),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF43A047).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Available',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF43A047),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}