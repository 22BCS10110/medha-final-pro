import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Medha Clarity Design System (Stitch)
  static const primary = Color(0xFF0057C0);
  static const primaryContainer = Color(0xFF006FF0);
  static const secondary = Color(0xFF006E23);
  static const tertiary = Color(0xFF575C62);
  static const error = Color(0xFFBA1A1A);
  
  static const surface = Color(0xFFF7F9FF);
  static const surfaceContainerLow = Color(0xFFECF4FF);
  static const surfaceContainerHighest = Color(0xFFDAE3EF);
  
  static const outlineVariant = Color(0xFFC1C6D7); // Ghost border
  static const onBackground = Color(0xFF141C25);
  static const onSurface = Color(0xFF141C25);
  static const onSurfaceVariant = Color(0xFF414755);

  static ThemeData get lightTheme {
    final baseTheme = ThemeData(
      colorScheme: ColorScheme.fromSeed(seedColor: primary),
      useMaterial3: true,
      scaffoldBackgroundColor: surface,
    );

    return baseTheme.copyWith(
      colorScheme: baseTheme.colorScheme.copyWith(
        primary: primary,
        primaryContainer: primaryContainer,
        secondary: secondary,
        tertiary: tertiary,
        error: error,
        surface: surface,
        onSurface: onSurface,
        onSurfaceVariant: onSurfaceVariant,
        surfaceContainerLow: surfaceContainerLow,
        surfaceContainerHighest: surfaceContainerHighest,
        outlineVariant: outlineVariant,
      ),
      textTheme: TextTheme(
        displayLarge: GoogleFonts.inter(
          color: onSurface,
          letterSpacing: -0.02,
          fontSize: 56,
        ),
        displayMedium: GoogleFonts.inter(
          color: onSurface,
          letterSpacing: -0.02,
        ),
        displaySmall: GoogleFonts.inter(
          color: onSurface,
          letterSpacing: -0.02,
        ),
        headlineLarge: GoogleFonts.inter(
          color: onSurface,
          letterSpacing: -0.02,
        ),
        headlineMedium: GoogleFonts.inter(
          color: onSurface,
          fontSize: 28, // 1.75rem
          letterSpacing: -0.02,
        ),
        headlineSmall: GoogleFonts.inter(
          color: onSurface,
          letterSpacing: -0.02,
        ),
        titleLarge: GoogleFonts.inter(
          color: onSurface,
          fontSize: 22, // 1.375rem
          fontWeight: FontWeight.w600,
        ),
        titleMedium: GoogleFonts.inter(
          color: onSurface,
          fontWeight: FontWeight.w600,
        ),
        titleSmall: GoogleFonts.inter(
          color: onSurface,
          fontWeight: FontWeight.w600,
        ),
        bodyLarge: GoogleFonts.inter(
          color: onSurface,
          height: 1.6,
        ),
        bodyMedium: GoogleFonts.inter(
          color: onSurface,
          fontSize: 14, // 0.875rem
          height: 1.6,
        ),
        bodySmall: GoogleFonts.inter(
          color: onSurface,
          height: 1.6,
        ),
        labelLarge: GoogleFonts.inter(
          color: tertiary,
          fontWeight: FontWeight.w500,
        ),
        labelMedium: GoogleFonts.inter(
          color: tertiary,
          fontWeight: FontWeight.w500,
        ),
        labelSmall: GoogleFonts.inter(
          color: tertiary,
          fontSize: 11, // 0.6875rem
          fontWeight: FontWeight.w500,
        ),
      ),
      cardTheme: const CardThemeData(
        elevation: 0,
        color: Color(0xFFFFFFFF), // surface_container_lowest
        shadowColor: Colors.transparent, // Ambient lift using cloud shadow on container
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(16)), // lg
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: surfaceContainerLow,
        elevation: 0,
        height: 72,
        surfaceTintColor: Colors.transparent,
        indicatorColor: primaryContainer.withValues(alpha: 0.4),
      ),
      appBarTheme: const AppBarTheme(
        elevation: 0,
        backgroundColor: Colors.transparent,
        centerTitle: false,
        surfaceTintColor: Colors.transparent,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(56),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24), // xl (1.5rem)
          ),
          elevation: 0,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(56),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFFFFFFFF), // surface_container_lowest
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: outlineVariant.withValues(alpha: 0.15), width: 1), // Ghost border
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: outlineVariant.withValues(alpha: 0.15), width: 1), 
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primary, width: 2), // Ghost border 100% opacity of primary
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: error, width: 1),
        ),
      ),
    );
  }
}
