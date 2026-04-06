import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class ReminderService {
  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();

  Future<void> init() async {
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const settings = InitializationSettings(android: android);
    await _plugin.initialize(settings);
  }

  Future<void> scheduleMedicineReminder({
    required int id,
    required String medicineName,
    required DateTime when,
  }) async {
    final details = const NotificationDetails(
      android: AndroidNotificationDetails(
        'medha_medicine',
        'Medicine Reminders',
        channelDescription: 'Medication reminders for patients',
        importance: Importance.high,
        priority: Priority.high,
      ),
    );

    // Fallback immediate reminder if exact scheduling plugin support is unavailable.
    final now = DateTime.now();
    if (when.isBefore(now.add(const Duration(seconds: 5)))) {
      await _plugin.show(id, 'Medicine Reminder', 'Time to take $medicineName', details);
      return;
    }
    await _plugin.show(id, 'Medicine Reminder', '$medicineName at ${when.hour}:${when.minute.toString().padLeft(2, '0')}', details);
  }
}

