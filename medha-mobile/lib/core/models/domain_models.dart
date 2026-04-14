/// User roles in the Medha Health system.
enum UserRole { patient, doctor, admin }

class AppUser {
  final String id;
  final String name;
  final String email;
  final UserRole role;
  final String? phone;
  final String? avatarUrl;

  AppUser({
    required this.id,
    required this.name,
    required this.email,
    this.role = UserRole.patient,
    this.phone,
    this.avatarUrl,
  });

  /// Convenience factory from JSON map (e.g. API response).
  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: (json['id'] ?? '').toString(),
      name: (json['full_name'] ?? json['name'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      role: _parseRole(json['role']),
      phone: json['phone']?.toString(),
      avatarUrl: json['avatar_url']?.toString(),
    );
  }

  static UserRole _parseRole(dynamic value) {
    if (value == null) return UserRole.patient;
    final s = value.toString().toLowerCase();
    if (s == 'doctor') return UserRole.doctor;
    if (s == 'admin') return UserRole.admin;
    return UserRole.patient;
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'role': role.name,
        'phone': phone,
        'avatar_url': avatarUrl,
      };
}

class Doctor {
  final String id;
  final String name;
  final String specialty;
  final String hospitalId;
  final double rating;
  final bool available;
  final int experienceYears;
  final String about;
  final String? avatarUrl;

  Doctor({
    required this.id,
    required this.name,
    required this.specialty,
    required this.hospitalId,
    required this.rating,
    required this.available,
    this.experienceYears = 0,
    this.about = "",
    this.avatarUrl,
  });
}

class Hospital {
  final String id;
  final String name;
  final String location;
  final double rating;
  final bool emergencyAvailable;

  Hospital({
    required this.id,
    required this.name,
    required this.location,
    required this.rating,
    this.emergencyAvailable = false,
  });
}

class Appointment {
  final String id;
  final String patientId;
  final String doctorId;
  final String? doctorName;
  final String? patientName;
  final DateTime scheduledAt;
  final String mode;
  final String status;
  final String? complaint;

  Appointment({
    required this.id,
    required this.patientId,
    required this.doctorId,
    this.doctorName,
    this.patientName,
    required this.scheduledAt,
    required this.mode,
    required this.status,
    this.complaint,
  });
}

/// AI health summary returned by the AI service.
class AiHealthSummary {
  final String summary;
  final List<String> recommendations;
  final String riskLevel; // low, moderate, high
  final DateTime generatedAt;

  AiHealthSummary({
    required this.summary,
    required this.recommendations,
    required this.riskLevel,
    required this.generatedAt,
  });
}
