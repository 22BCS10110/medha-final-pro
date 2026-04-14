import 'package:flutter/material.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';

/// Enhanced empty state with icon and message
class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;
  
  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: 64,
                color: AppTheme.primary.withValues(alpha: 0.6),
              ),
            ),
            const SizedBox(height: 24),
              Text(
                title,
                style: tt.titleLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppTheme.onSurface,
                ),
                textAlign: TextAlign.center,
              ),
            if (subtitle != null) ...[
              const SizedBox(height: 8),
                Text(
                  subtitle!,
                  style: tt.bodySmall?.copyWith(
                    fontWeight: FontWeight.w500,
                    color: AppTheme.onSurface.withValues(alpha: 0.6),
                  ),
                  textAlign: TextAlign.center,
                ),
            ],
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: onAction,
                icon: const Icon(Icons.add_rounded, size: 20),
                label: Text(
                  actionLabel!,
                  style: tt.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                style: FilledButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 14,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}