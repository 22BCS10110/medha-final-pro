import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _firstLaunchKey = "medha_first_launch";

final firstLaunchProvider = StateNotifierProvider<FirstLaunchController, bool>(
  (ref) => FirstLaunchController()..load(),
);

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
