import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// Simple HTTP client for the existing Django REST API used by the website.
///
/// Base URL must point to the machine running Django, e.g.:
/// - Android emulator: http://10.0.2.2:8000
/// - Real device: http://<your-pc-lan-ip>:8000
class MedhaApi {
  static const _tokenKey = 'medha_django_token';
  static const _patientPkKey = 'medha_patient_pk';
  static const _profileCompleteKey = 'medha_profile_complete';

  final String baseUrl; // e.g. http://10.0.2.2:8000
  final http.Client _client;

  MedhaApi({required this.baseUrl, http.Client? client}) : _client = client ?? http.Client();

  Uri _u(String path) => Uri.parse('$baseUrl$path');

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  Future<void> setToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_profileCompleteKey);
  }

  Future<bool> isProfileComplete() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_profileCompleteKey) ?? false;
  }

  Future<void> _setProfileComplete(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_profileCompleteKey, value);
  }

  Future<int?> getCachedPatientPk() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt(_patientPkKey);
  }

  Future<void> cachePatientPk(int pk) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_patientPkKey, pk);
  }

  Future<Map<String, String>> _headers({bool auth = true, bool jsonBody = false}) async {
    final h = <String, String>{};
    if (jsonBody) h['Content-Type'] = 'application/json';
    if (auth) {
      final t = await getToken();
      if (t != null && t.isNotEmpty) {
        h['Authorization'] = 'Token $t';
      }
    }
    return h;
  }

  /// Headers using Bearer token (JWT) for authenticated requests.
  Future<Map<String, String>> _bearerHeaders({bool jsonBody = false}) async {
    final h = <String, String>{};
    if (jsonBody) h['Content-Type'] = 'application/json';
    final t = await getToken();
    if (t != null && t.isNotEmpty) {
      h['Authorization'] = 'Bearer $t';
    }
    return h;
  }

  /// Exchange a Firebase ID token for Django JWT tokens.
  ///
  /// Returns the full response including:
  /// - success, user_id, patient_id
  /// - tokens.access / tokens.refresh
  /// - user object
  /// - is_profile_complete flag
  /// - created (true if this is a new user)
  Future<Map<String, dynamic>> exchangeFirebaseToken(String firebaseIdToken) async {
    // TEMP debug
    // ignore: avoid_print
    print('Token sent to backend');

    final res = await _client.post(
      _u('/api/auth/firebase-login/'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'token': firebaseIdToken}),
    );
    if (res.statusCode != 200) {
      throw Exception('Token exchange failed (${res.statusCode}): ${res.body}');
    }
    final data = jsonDecode(res.body) as Map<String, dynamic>;

    // Store the Django JWT
    final token = (data['token'] ?? '').toString();
    if (token.isNotEmpty) await setToken(token);

    // Cache profile completion status
    final profileComplete = data['is_profile_complete'] == true;
    await _setProfileComplete(profileComplete);

    return data;
  }

  /// Complete patient onboarding profile (first-time Google sign-up).
  Future<Map<String, dynamic>> completeProfile({
    required String fullName,
    required String phone,
    required String gender,
    required String dateOfBirth,
  }) async {
    final res = await _client.post(
      _u('/api/auth/profile/complete/'),
      headers: await _bearerHeaders(jsonBody: true),
      body: jsonEncode({
        'full_name': fullName,
        'phone': phone,
        'gender': gender,
        'date_of_birth': dateOfBirth,
      }),
    );
    if (res.statusCode != 200) {
      throw Exception('Profile completion failed (${res.statusCode}): ${res.body}');
    }
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    await _setProfileComplete(true);
    return data;
  }

  Future<Map<String, dynamic>> login({required String username, required String password}) async {
    final res = await _client.post(
      _u('/api/auth/login/'),
      headers: await _headers(auth: false, jsonBody: true),
      body: jsonEncode({'username': username, 'password': password}),
    );
    if (res.statusCode != 200) {
      throw Exception('Login failed (${res.statusCode})');
    }
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    final token = (data['token'] ?? '').toString();
    if (token.isNotEmpty) await setToken(token);
    return data;
  }

  Future<List<Map<String, dynamic>>> listDoctors() async {
    final res = await _client.get(_u('/api/doctors/'), headers: await _headers());
    if (res.statusCode != 200) throw Exception('Doctors fetch failed (${res.statusCode})');
    final data = jsonDecode(res.body);
    if (data is List) return data.cast<Map<String, dynamic>>();
    return const [];
  }

  Future<List<Map<String, dynamic>>> listPatients() async {
    final res = await _client.get(_u('/api/patients/'), headers: await _headers());
    if (res.statusCode != 200) throw Exception('Patients fetch failed (${res.statusCode})');
    final data = jsonDecode(res.body);
    if (data is List) return data.cast<Map<String, dynamic>>();
    return const [];
  }

  Future<List<Map<String, dynamic>>> listHospitals() async {
    final res = await _client.get(_u('/api/hospitals/'), headers: await _headers());
    if (res.statusCode != 200) throw Exception('Hospitals fetch failed (${res.statusCode})');
    final data = jsonDecode(res.body);
    if (data is List) return data.cast<Map<String, dynamic>>();
    return const [];
  }

  Future<int> ensurePatientPk() async {
    final cached = await getCachedPatientPk();
    if (cached != null) return cached;
    final patients = await listPatients();
    if (patients.isEmpty) {
      throw Exception('No patients found in website DB');
    }
    final pk = (patients.first['id'] as num).toInt();
    await cachePatientPk(pk);
    return pk;
  }

  Future<List<Map<String, dynamic>>> listAppointments({required int patientPk}) async {
    final res = await _client.get(
      _u('/api/appointments/?patient=$patientPk'),
      headers: await _headers(),
    );
    if (res.statusCode != 200) throw Exception('Appointments fetch failed (${res.statusCode})');
    final data = jsonDecode(res.body);
    if (data is List) return data.cast<Map<String, dynamic>>();
    return const [];
  }

  Future<Map<String, dynamic>> createAppointment({
    required int doctorPk,
    required int patientPk,
    required String date, // yyyy-mm-dd
    required String time, // HH:mm:ss
    required String appointmentType,
    required String status,
    required String complaint,
  }) async {
    final res = await _client.post(
      _u('/api/appointments/'),
      headers: await _headers(jsonBody: true),
      body: jsonEncode({
        'doctor': doctorPk,
        'patient': patientPk,
        'date': date,
        'time': time,
        'appointment_type': appointmentType,
        'status': status,
        'complaint': complaint,
      }),
    );
    if (res.statusCode != 201 && res.statusCode != 200) {
      throw Exception('Create appointment failed (${res.statusCode})');
    }
    return jsonDecode(res.body) as Map<String, dynamic>;
  }
}

