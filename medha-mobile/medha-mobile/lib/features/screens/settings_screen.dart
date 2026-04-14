import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';
import 'package:medha_mobile/features/settings/app_settings_controller.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mode = ref.watch(appThemeModeProvider);
    return Scaffold(
      appBar: AppBar(
        title: Text("Settings", style: GoogleFonts.manrope(fontWeight: FontWeight.w700)),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
            ),
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
                      child: const Icon(Icons.palette_rounded, color: AppTheme.primary, size: 22),
                    ),
                    const SizedBox(width: 14),
                    Text("Appearance", style: GoogleFonts.manrope(fontWeight: FontWeight.w800, fontSize: 18, color: AppTheme.onSurface)),
                  ],
                ),
                const SizedBox(height: 6),
                Text("Current: ${mode.name}", style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w500, fontSize: 13, color: AppTheme.onSurface.withValues(alpha: 0.5))),
                const SizedBox(height: 16),
                _ThemeOption(label: "System", icon: Icons.settings_suggest_rounded, value: ThemeMode.system, current: mode, onTap: (v) => ref.read(appThemeModeProvider.notifier).setMode(v)),
                const SizedBox(height: 10),
                _ThemeOption(label: "Light", icon: Icons.light_mode_rounded, value: ThemeMode.light, current: mode, onTap: (v) => ref.read(appThemeModeProvider.notifier).setMode(v)),
                const SizedBox(height: 10),
                _ThemeOption(label: "Dark", icon: Icons.dark_mode_rounded, value: ThemeMode.dark, current: mode, onTap: (v) => ref.read(appThemeModeProvider.notifier).setMode(v)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ThemeOption extends StatelessWidget {
  final String label;
  final IconData icon;
  final ThemeMode value;
  final ThemeMode current;
  final ValueChanged<ThemeMode> onTap;
  const _ThemeOption({required this.label, required this.icon, required this.value, required this.current, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final selected = current == value;
    return GestureDetector(
      onTap: () => onTap(value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: selected ? AppTheme.primary.withValues(alpha: 0.06) : AppTheme.surfaceContainerLow,
          borderRadius: BorderRadius.circular(14),
          border: selected ? Border.all(color: AppTheme.primary.withValues(alpha: 0.25), width: 1.5) : null,
        ),
        child: Row(
          children: [
            Icon(icon, size: 22, color: selected ? AppTheme.primary : AppTheme.onSurface.withValues(alpha: 0.5)),
            const SizedBox(width: 14),
            Text(label, style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, fontSize: 15, color: selected ? AppTheme.primary : AppTheme.onSurface.withValues(alpha: 0.7))),
            const Spacer(),
            if (selected) const Icon(Icons.check_circle_rounded, color: AppTheme.primary, size: 22),
          ],
        ),
      ),
    );
  }
}
