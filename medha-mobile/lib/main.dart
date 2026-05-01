import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'dart:io';
import 'package:medha_mobile/core/router/app_router.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';

Future<void> main() async {
  try {
    WidgetsFlutterBinding.ensureInitialized();
    debugPrint("🚀 APP START: WidgetsFlutterBinding initialized");

    // Initialize Firebase — the sole auth provider for the patient app.
    debugPrint("🔥 FIREBASE: Starting initialization...");
    if (Platform.isIOS) {
      await Firebase.initializeApp(
        options: const FirebaseOptions(
          apiKey: 'AIzaSyAFewV2O7O-xkucoez7KTrwV_68KIXdQtg',
          appId: '1:361020649489:ios:078d1a7c876385618ec1b0',
          messagingSenderId: '361020649489',
          projectId: 'medha-health-app',
          iosClientId: '361020649489-4tm4o784in6lqjs7cekbt6ql45fobb6e.apps.googleusercontent.com',
          iosBundleId: 'com.medha.health.patient',
        ),
      );
    } else {
      // For Android, uses google-services.json automatically.
      await Firebase.initializeApp();
    }
    debugPrint("🔥 FIREBASE: Initialization complete");

    debugPrint("🏗️ APP: Running runApp()");
    runApp(const ProviderScope(child: MedhaApp()));
  } catch (e, stack) {
    print("❌ CRITICAL ERROR IN MAIN: $e");
    print(stack);
    // Even if it fails, try to show something so the app isn't just a white screen
    runApp(MaterialApp(home: Scaffold(body: Center(child: Text("Error: $e")))));
  }
}

class MedhaApp extends ConsumerWidget {
  const MedhaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      title: "Medha Health Intelligance",
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      routerConfig: router,
    );
  }
}