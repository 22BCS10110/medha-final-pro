import 'package:flutter/material.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';

/// Enhanced card with cloud shadows tinted with primary color (Stitch spec).
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
    final radius = borderRadius ?? BorderRadius.circular(16); // lg per Stitch
    
    return Container(
      margin: margin,
      decoration: BoxDecoration(
        borderRadius: radius,
        boxShadow: [
          BoxShadow(
            // Cloud shadow tinted with primary, never black
            color: AppTheme.primary.withValues(alpha: 0.06),
            blurRadius: 32,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Material(
        color: backgroundColor ?? Theme.of(context).cardColor,
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

/// Gradient card for hero sections with signature texture (Stitch spec).
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
        // 135° gradient from primary to primaryContainer — "lit-from-within" polish
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
                .withValues(alpha: 0.25),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: child,
    );
  }
}