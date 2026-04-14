import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _localeKey = "medha_locale";
const _firstLaunchKey = "medha_first_launch";
const _themeModeKey = "medha_theme_mode";

final appLocaleProvider = StateNotifierProvider<AppLocaleController, Locale?>(
  (ref) => AppLocaleController()..load(),
);

final firstLaunchProvider = StateNotifierProvider<FirstLaunchController, bool>(
  (ref) => FirstLaunchController()..load(),
);

final appThemeModeProvider = StateNotifierProvider<AppThemeModeController, ThemeMode>(
  (ref) => AppThemeModeController()..load(),
);

class AppLocaleController extends StateNotifier<Locale?> {
  AppLocaleController() : super(null);

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final value = prefs.getString(_localeKey);
    if (value != null) {
      state = Locale(value);
    }
  }

  Future<void> setLocale(Locale locale) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_localeKey, locale.languageCode);
    state = locale;
  }
}

class FirstLaunchController extends StateNotifier<bool> {
  FirstLaunchController() : super(true);

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    state = prefs.getBool(_firstLaunchKey) ?? true;
  }

  Future<void> markDone() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_firstLaunchKey, false);
    state = false;
  }
}

class AppThemeModeController extends StateNotifier<ThemeMode> {
  AppThemeModeController() : super(ThemeMode.system);

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final value = prefs.getString(_themeModeKey);
    if (value == "light") state = ThemeMode.light;
    if (value == "dark") state = ThemeMode.dark;
    if (value == "system" || value == null) state = ThemeMode.system;
  }

  Future<void> setMode(ThemeMode mode) async {
    final prefs = await SharedPreferences.getInstance();
    final value = switch (mode) {
      ThemeMode.light => "light",
      ThemeMode.dark => "dark",
      ThemeMode.system => "system",
    };
    await prefs.setString(_themeModeKey, value);
    state = mode;
  }
}

