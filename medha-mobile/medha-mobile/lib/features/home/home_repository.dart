import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:medha_mobile/core/models/domain_models.dart';
import 'package:medha_mobile/core/services/local_cache_service.dart';
import 'package:medha_mobile/core/services/medha_api.dart';
import 'package:medha_mobile/core/services/medha_api_provider.dart';
import 'package:medha_mobile/features/auth/auth_repository.dart';
import 'dart:convert';

final localCacheProvider = Provider<LocalCacheService>((ref) => LocalCacheService());

final doctorsProvider = FutureProvider<List<Doctor>>((ref) async {
  final api = ref.read(medhaApiProvider);
  final cache = ref.read(localCacheProvider);
  try {
    final rows = await api.listDoctors();
    final doctors = rows.map((m) {
      return Doctor(
        id: (m['id'] ?? '').toString(),
        name: (m['full_name'] ?? '').toString(),
        specialty: (m['specialisation'] ?? m['department'] ?? '').toString(),
        hospitalId: (m['hospital_name'] ?? '').toString(),
        rating: 4.8,
        available: (m['status'] ?? 'on_duty') == 'on_duty',
        experienceYears: (m['experience_years'] ?? 0) is num ? (m['experience_years'] as num).toInt() : 0,
        about: "Department: ${(m['department'] ?? '').toString()}",
      );
    }).toList();
    for (final m in rows) {
      final id = (m['id'] ?? '').toString();
      await cache.upsertJson("doctors", id, jsonEncode(m));
    }
    return doctors;
  } catch (_) {
    final cached = await cache.getAll("doctors");
    return cached
        .map((r) {
          final m = jsonDecode(r["payload"] as String) as Map<String, dynamic>;
          return Doctor(
            id: (m['id'] ?? r["id"]).toString(),
            name: (m['full_name'] ?? '').toString(),
            specialty: (m['specialisation'] ?? m['department'] ?? '').toString(),
            hospitalId: (m['hospital_name'] ?? '').toString(),
            rating: 4.8,
            available: (m['status'] ?? 'on_duty') == 'on_duty',
            experienceYears: (m['experience_years'] ?? 0) is num ? (m['experience_years'] as num).toInt() : 0,
            about: "Department: ${(m['department'] ?? '').toString()}",
          );
        })
        .toList();
  }
});

final hospitalsProvider = FutureProvider<List<Hospital>>((ref) async {
  final api = ref.read(medhaApiProvider);
  final cache = ref.read(localCacheProvider);
  try {
    final rows = await api.listHospitals();
    final hospitals = rows.map((m) {
      return Hospital(
        id: (m['id'] ?? '').toString(),
        name: (m['name'] ?? '').toString(),
        location: (m['address'] ?? '').toString(),
        rating: 4.5,
        emergencyAvailable: m['has_emergency'] ?? false,
      );
    }).toList();
    for (final m in rows) {
      final id = (m['id'] ?? '').toString();
      await cache.upsertJson("hospitals", id, jsonEncode(m));
    }
    return hospitals;
  } catch (_) {
    final cached = await cache.getAll("hospitals");
    return cached
        .map((r) => _mapHospitalRaw(r["id"] as String, jsonDecode(r["payload"] as String) as Map<String, dynamic>))
        .toList();
  }
});

final appointmentsProvider = FutureProvider.family<List<Appointment>, String>((ref, patientId) async {
  final api = ref.read(medhaApiProvider);
  final cache = ref.read(localCacheProvider);
  try {
    final patientPk = await api.ensurePatientPk();
    final rows = await api.listAppointments(patientPk: patientPk);
    final appts = rows.map((m) {
      final dateStr = (m['date'] ?? '').toString();
      final timeStr = (m['time'] ?? '00:00:00').toString();
      final scheduled = DateTime.tryParse('${dateStr}T$timeStr') ?? DateTime.now();
      return Appointment(
        id: (m['id'] ?? '').toString(),
        patientId: (m['patient'] ?? '').toString(),
        doctorId: (m['doctor'] ?? '').toString(),
        scheduledAt: scheduled,
        mode: (m['appointment_type'] ?? 'online').toString(),
        status: (m['status'] ?? 'upcoming').toString(),
      );
    }).toList();
    for (final m in rows) {
      final id = (m['id'] ?? '').toString();
      await cache.upsertJson("appointments", id, jsonEncode(m));
    }
    return appts;
  } catch (_) {
    final cached = await cache.getAll("appointments");
    return cached.map((r) {
      final m = jsonDecode(r["payload"] as String) as Map<String, dynamic>;
      final dateStr = (m['date'] ?? '').toString();
      final timeStr = (m['time'] ?? '00:00:00').toString();
      final scheduled = DateTime.tryParse('${dateStr}T$timeStr') ?? DateTime.now();
      return Appointment(
        id: (m['id'] ?? r["id"]).toString(),
        patientId: (m['patient'] ?? '').toString(),
        doctorId: (m['doctor'] ?? '').toString(),
        scheduledAt: scheduled,
        mode: (m['appointment_type'] ?? 'online').toString(),
        status: (m['status'] ?? 'upcoming').toString(),
      );
    }).toList();
  }
});

Future<String> bookAppointment({
  required LocalCacheService cache,
  required String patientId,
  required String doctorId,
  required DateTime dateTime,
  required String mode,
  String status = "booked",
}) async {
  final api = MedhaApi(
    baseUrl: const String.fromEnvironment('MEDHA_API_BASE', defaultValue: 'http://10.0.2.2:8000'),
  );
  final payload = {
    "doctor": int.tryParse(doctorId) ?? doctorId,
    "scheduledAt": dateTime.toIso8601String(),
    "mode": mode,
    "status": status,
  };
  try {
    final patientPk = await api.ensurePatientPk();
    final doctorPk = int.parse(doctorId);
    final res = await api.createAppointment(
      doctorPk: doctorPk,
      patientPk: patientPk,
      date: dateTime.toIso8601String().substring(0, 10),
      time: "${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}:00",
      appointmentType: "follow_up",
      status: status == "booked" ? "upcoming" : status,
      complaint: "Booked from Medha mobile app",
    );
    final id = (res['id'] ?? '').toString();
    await cache.upsertJson("appointments", id, jsonEncode(res));
    return id;
  } catch (_) {
    await cache.enqueueSync("Appointments:create", jsonEncode(payload));
    return "queued-offline";
  }
}

Future<void> updateAppointmentStatus({
  required LocalCacheService cache,
  required String appointmentId,
  required String status,
}) async {
  try {
    await cache.enqueueSync("Appointments:update", jsonEncode({"id": appointmentId, "status": status}));
  } catch (_) {}
}

Doctor _mapDoctorRaw(String id, Map<String, dynamic> m) => Doctor(
      id: id,
      name: m["name"] ?? "",
      specialty: m["specialty"] ?? "",
      hospitalId: m["hospitalId"] ?? "",
      rating: (m["rating"] ?? 0).toDouble(),
      available: m["available"] ?? true,
      experienceYears: m["experienceYears"] ?? 0,
      about: m["about"] ?? "",
    );

Hospital _mapHospitalRaw(String id, Map<String, dynamic> m) => Hospital(
      id: id,
      name: m["name"] ?? "",
      location: m["location"] ?? "",
      rating: (m["rating"] ?? 0).toDouble(),
      emergencyAvailable: m["emergencyAvailable"] ?? false,
    );