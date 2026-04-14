import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';

class AppShellScaffold extends StatelessWidget {
  final StatefulNavigationShell navigationShell;
  const AppShellScaffold({super.key, required this.navigationShell});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final selected = navigationShell.currentIndex;
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 14),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
              child: Container(
                height: 72,
                decoration: BoxDecoration(
                  color: cs.surface.withValues(alpha: 0.88),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: cs.primary.withValues(alpha: 0.06),
                      blurRadius: 32,
                      offset: const Offset(0, 12),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _NavItem(icon: Icons.home_rounded, label: "Home", index: 0, selected: selected, onTap: () => navigationShell.goBranch(0)),
                    _NavItem(icon: Icons.event_note_rounded, label: "Bookings", index: 1, selected: selected, onTap: () => navigationShell.goBranch(1)),
                    _NavItem(icon: Icons.chat_rounded, label: "Chat", index: 2, selected: selected, onTap: () => navigationShell.goBranch(2)),
                    _NavItem(icon: Icons.person_rounded, label: "Profile", index: 3, selected: selected, onTap: () => navigationShell.goBranch(3)),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final int index;
  final int selected;
  final VoidCallback onTap;
  const _NavItem({required this.icon, required this.label, required this.index, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isActive = selected == index;
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? cs.primary.withValues(alpha: 0.12) : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: isActive ? cs.primary : cs.onSurface.withValues(alpha: 0.35),
              size: 24,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: tt.labelSmall?.copyWith(
                fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                color: isActive ? cs.primary : cs.onSurface.withValues(alpha: 0.35),
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
