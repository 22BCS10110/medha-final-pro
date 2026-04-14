import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:medha_mobile/core/services/medha_api.dart';

/// Configure API base URL at build/run time:
/// - Emulator: `--dart-define=MEDHA_API_BASE=http://10.0.2.2:8000`
/// - Device:   `--dart-define=MEDHA_API_BASE=http://192.168.1.10:8000`
const _defaultBase = String.fromEnvironment('MEDHA_API_BASE', defaultValue: 'http://10.0.2.2:8000');

final medhaApiProvider = Provider<MedhaApi>((ref) {
  return MedhaApi(baseUrl: _defaultBase);
});

