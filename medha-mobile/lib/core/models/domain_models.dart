class AppUser {
  final String id;
  final String name;
  final String email;
  final String role;

  AppUser({
    required this.id,
    required this.name,
    required this.email,
    this.role = "patient",
  });
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

  Doctor({
    required this.id,
    required this.name,
    required this.specialty,
    required this.hospitalId,
    required this.rating,
    required this.available,
    this.experienceYears = 0,
    this.about = "",
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
  final DateTime scheduledAt;
  final String mode;
  final String status;

  Appointment({
    required this.id,
    required this.patientId,
    required this.doctorId,
    required this.scheduledAt,
    required this.mode,
    required this.status,
  });
}

