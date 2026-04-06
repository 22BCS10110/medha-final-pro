import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Tonal Architecture (Stitch)
  static const primary = Color(0xFF006070);
  static const primaryContainer = Color(0xFF007b8e);
  static const tertiary = Color(0xFFAF101A);
  static const surface = Color(0xFFF8FAFB);
  static const surfaceContainerLow = Color(0xFFF2F4F5);
  static const surfaceContainerHighest = Color(0xFFE1E3E4);
  
  static const outlineVariant = Color(0xFFBEC8CC);
  static const onSurface = Color(0xFF191C1D);

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
        tertiary: tertiary,
        surface: surface,
        onSurface: onSurface,
        surfaceContainerLow: surfaceContainerLow,
        surfaceContainerHighest: surfaceContainerHighest,
        outlineVariant: outlineVariant,
      ),
      textTheme: TextTheme(
        displayLarge: GoogleFonts.manrope(
          color: onSurface,
        ),
        displayMedium: GoogleFonts.manrope(
          color: onSurface,
        ),
        displaySmall: GoogleFonts.manrope(
          color: onSurface,
        ),
        headlineLarge: GoogleFonts.manrope(
          color: onSurface,
        ),
        headlineMedium: GoogleFonts.manrope(
          color: onSurface,
        ),
        headlineSmall: GoogleFonts.manrope(
          color: onSurface,
        ),
        titleLarge: GoogleFonts.manrope(
          color: onSurface,
          fontWeight: FontWeight.w600,
        ),
        titleMedium: GoogleFonts.plusJakartaSans(
          color: onSurface,
          fontWeight: FontWeight.w600,
        ),
        titleSmall: GoogleFonts.plusJakartaSans(
          color: onSurface,
          fontWeight: FontWeight.w600,
        ),
        bodyLarge: GoogleFonts.plusJakartaSans(
          color: onSurface,
        ),
        bodyMedium: GoogleFonts.plusJakartaSans(
          color: onSurface,
        ),
        bodySmall: GoogleFonts.plusJakartaSans(
          color: onSurface,
        ),
        labelLarge: GoogleFonts.plusJakartaSans(
          color: onSurface,
          fontWeight: FontWeight.w500,
        ),
        labelMedium: GoogleFonts.plusJakartaSans(
          color: onSurface,
          fontWeight: FontWeight.w500,
        ),
        labelSmall: GoogleFonts.plusJakartaSans(
          color: onSurface,
          fontWeight: FontWeight.w500,
        ),
      ),
      cardTheme: const CardThemeData(
        elevation: 0,
        color: Color(0xFFFFFFFF), // surface_container_lowest
        shadowColor: Colors.transparent, // No shadow, ambient lift
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(24)),
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
          shape: const StadiumBorder(),
          elevation: 0,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(56),
          shape: const StadiumBorder(),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceContainerHighest,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: tertiary, width: 1), // Optional slight outline based on ghost border principles
        ),
      ),
    );
  }

  static ThemeData get darkTheme {
    // Basic conversion applying the same shape/typography rules 
    // to dark mode.
    final baseTheme = ThemeData(
      colorScheme: ColorScheme.fromSeed(
        seedColor: primary,
        brightness: Brightness.dark,
      ),
      useMaterial3: true,
      scaffoldBackgroundColor: const Color(0xFF0F1216),
    );

    final onSurfaceDark = Colors.white.withValues(alpha: 0.87);

    return baseTheme.copyWith(
      textTheme: TextTheme(
        displayLarge: GoogleFonts.manrope(color: onSurfaceDark),
        displayMedium: GoogleFonts.manrope(color: onSurfaceDark),
        displaySmall: GoogleFonts.manrope(color: onSurfaceDark),
        headlineLarge: GoogleFonts.manrope(color: onSurfaceDark),
        headlineMedium: GoogleFonts.manrope(color: onSurfaceDark),
        headlineSmall: GoogleFonts.manrope(color: onSurfaceDark),
        titleLarge: GoogleFonts.manrope(color: onSurfaceDark, fontWeight: FontWeight.w600),
        titleMedium: GoogleFonts.plusJakartaSans(color: onSurfaceDark, fontWeight: FontWeight.w600),
        titleSmall: GoogleFonts.plusJakartaSans(color: onSurfaceDark, fontWeight: FontWeight.w600),
        bodyLarge: GoogleFonts.plusJakartaSans(color: onSurfaceDark),
        bodyMedium: GoogleFonts.plusJakartaSans(color: onSurfaceDark),
        bodySmall: GoogleFonts.plusJakartaSans(color: onSurfaceDark),
        labelLarge: GoogleFonts.plusJakartaSans(color: onSurfaceDark, fontWeight: FontWeight.w500),
        labelMedium: GoogleFonts.plusJakartaSans(color: onSurfaceDark, fontWeight: FontWeight.w500),
        labelSmall: GoogleFonts.plusJakartaSans(color: onSurfaceDark, fontWeight: FontWeight.w500),
      ),
      cardTheme: const CardThemeData(
        elevation: 0,
        color: Color(0xFF1E2124),
        shadowColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(24)),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: const Color(0xFF1E2124),
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
          shape: const StadiumBorder(),
          elevation: 0,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(56),
          shape: const StadiumBorder(),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF2E3132),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primary, width: 2),
        ),
      ),
    );
  }
}
