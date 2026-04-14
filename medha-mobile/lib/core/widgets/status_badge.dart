import 'package:flutter/material.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';

/// Enhanced status badge with icon
class StatusBadge extends StatelessWidget {
  final String status;
  final IconData? icon;
  
  const StatusBadge({
    super.key,
    required this.status,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final config = _getStatusConfig(status.toLowerCase());
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: config.color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: config.color.withValues(alpha: 0.3),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon ?? config.icon,
            size: 14,
            color: config.color,
          ),
          const SizedBox(width: 6),
            Text(
              status.toUpperCase(),
              style: tt.labelSmall?.copyWith(
                color: config.color,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.5,
              ),
            ),
        ],
      ),
    );
  }
  
  _StatusConfig _getStatusConfig(String status) {
    switch (status) {
      case 'completed':
      case 'success':
        return _StatusConfig(
          color: const Color(0xFF43A047),
          icon: Icons.check_circle_rounded,
        );
      case 'cancelled':
      case 'failed':
        return _StatusConfig(
          color: AppTheme.tertiary,
          icon: Icons.cancel_rounded,
        );
      case 'pending':
      case 'scheduled':
        return _StatusConfig(
          color: const Color(0xFFFB8C00),
          icon: Icons.schedule_rounded,
        );
      case 'confirmed':
        return _StatusConfig(
          color: AppTheme.primary,
          icon: Icons.verified_rounded,
        );
      default:
        return _StatusConfig(
          color: AppTheme.onSurface.withValues(alpha: 0.6),
          icon: Icons.info_rounded,
        );
    }
  }
}

class _StatusConfig {
  final Color color;
  final IconData icon;
  
  _StatusConfig({required this.color, required this.icon});
}