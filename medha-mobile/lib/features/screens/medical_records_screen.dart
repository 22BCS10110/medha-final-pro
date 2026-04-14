import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';
import 'package:medha_mobile/core/widgets/enhanced_card.dart';

class MedicalRecordsScreen extends StatelessWidget {
  const MedicalRecordsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => context.canPop() ? context.pop() : context.go("/home"),
        ),
        title: Text("Medical Records", style: tt.titleLarge),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
        children: [
          // Upload Area
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppTheme.surfaceContainerLow,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: cs.primary.withValues(alpha: 0.15),
                width: 2,
                strokeAlign: BorderSide.strokeAlignOutside,
              ),
            ),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: cs.primary.withValues(alpha: 0.1),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: const Icon(Icons.cloud_upload_rounded, color: AppTheme.primary, size: 32),
                ),
                const SizedBox(height: 16),
                Text(
                  "Upload New Record",
                  style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 4),
                Text(
                  "Support PDF, JPG, or PNG files.",
                  style: tt.bodySmall?.copyWith(color: cs.onSurface.withValues(alpha: 0.5)),
                ),
                const SizedBox(height: 20),
                FilledButton.icon(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text("Mock file upload started...")),
                    );
                  },
                  icon: const Icon(Icons.upload_file_rounded, size: 18),
                  label: const Text("Select File"),
                  style: FilledButton.styleFrom(
                    backgroundColor: cs.primary,
                    minimumSize: const Size.fromHeight(48),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Categories
          Text("Categories", style: tt.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _CategoryBox(
                  icon: Icons.science_rounded,
                  title: "Lab Results",
                  count: "4 files",
                  color: const Color(0xFFE91E63),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: _CategoryBox(
                  icon: Icons.vaccines_rounded,
                  title: "Vaccines",
                  count: "2 files",
                  color: AppTheme.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Recent Files
          Text("Recent Files", style: tt.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 14),
          _FileTile(
            title: "Blood_Test_Dec.pdf",
            date: "Dec 12, 2024",
            size: "1.2 MB",
            icon: Icons.picture_as_pdf_rounded,
            color: const Color(0xFFE91E63),
          ),
          const SizedBox(height: 10),
          _FileTile(
            title: "XRay_Chest.jpg",
            date: "Nov 05, 2024",
            size: "4.5 MB",
            icon: Icons.image_rounded,
            color: const Color(0xFFFB8C00),
          ),
          const SizedBox(height: 10),
          _FileTile(
            title: "Prescription_Dr_Smith.pdf",
            date: "Oct 22, 2024",
            size: "0.8 MB",
            icon: Icons.picture_as_pdf_rounded,
            color: AppTheme.secondary,
          ),
        ],
      ),
    );
  }
}

class _CategoryBox extends StatelessWidget {
  final IconData icon;
  final String title;
  final String count;
  final Color color;

  const _CategoryBox({
    required this.icon,
    required this.title,
    required this.count,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    return EnhancedCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 16),
          Text(title, style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 2),
          Text(count, style: tt.labelSmall?.copyWith(color: AppTheme.onSurfaceVariant)),
        ],
      ),
    );
  }
}

class _FileTile extends StatelessWidget {
  final String title;
  final String date;
  final String size;
  final IconData icon;
  final Color color;

  const _FileTile({
    required this.title,
    required this.date,
    required this.size,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    return EnhancedCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: tt.titleSmall?.copyWith(fontWeight: FontWeight.w700), maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 3),
                Text("$date • $size", style: tt.labelSmall?.copyWith(color: AppTheme.onSurfaceVariant)),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.more_vert_rounded),
            color: AppTheme.onSurfaceVariant,
            onPressed: () {},
          ),
        ],
      ),
    );
  }
}