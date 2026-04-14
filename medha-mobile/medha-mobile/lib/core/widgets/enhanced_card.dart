import 'package:flutter/material.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';

/// Enhanced card with better shadows and hover effect
class EnhancedCard extends StatelessWidget {
  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final Color? backgroundColor;
  final BorderRadius? borderRadius;
  
  const EnhancedCard({
    super.key,
    required this.child,
    this.onTap,
    this.padding,
    this.margin,
    this.backgroundColor,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    final radius = borderRadius ?? BorderRadius.circular(20);
    
    return Container(
      margin: margin,
      decoration: BoxDecoration(
        borderRadius: radius,
        boxShadow: [
          BoxShadow(
            color: AppTheme.onSurface.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: backgroundColor ?? Colors.white,
        borderRadius: radius,
        child: onTap != null
            ? InkWell(
                onTap: onTap,
                borderRadius: radius,
                child: Padding(
                  padding: padding ?? const EdgeInsets.all(16),
                  child: child,
                ),
              )
            : Padding(
                padding: padding ?? const EdgeInsets.all(16),
                child: child,
              ),
      ),
    );
  }
}

/// Gradient card for hero sections
class GradientCard extends StatelessWidget {
  final Widget child;
  final List<Color>? gradientColors;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final BorderRadius? borderRadius;
  
  const GradientCard({
    super.key,
    required this.child,
    this.gradientColors,
    this.padding,
    this.margin,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      padding: padding ?? const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: gradientColors ?? [
            AppTheme.primary,
            AppTheme.primaryContainer,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: borderRadius ?? BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: (gradientColors?.first ?? AppTheme.primary)
                .withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: child,
    );
  }
}