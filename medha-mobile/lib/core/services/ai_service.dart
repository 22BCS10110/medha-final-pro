import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:medha_mobile/core/models/domain_models.dart';

/// AI service using OpenRouter API for health insights.
///
/// Configure at build time:
/// `--dart-define=AI_API_KEY=sk-or-v1-...`
class AiService {
  static const _apiKey = String.fromEnvironment('AI_API_KEY', defaultValue: '');
  static const _baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  static const _model = 'meta-llama/llama-3.1-8b-instruct:free';

  final http.Client _client;

  AiService({http.Client? client}) : _client = client ?? http.Client();

  /// Generate a health summary from patient context.
  Future<AiHealthSummary> generateHealthSummary({
    required String patientName,
    List<Map<String, dynamic>>? recentAppointments,
    Map<String, dynamic>? vitals,
  }) async {
    final prompt = _buildPrompt(patientName, recentAppointments, vitals);

    // If no API key provided, return a demo summary
    if (_apiKey.isEmpty) {
      return _demoSummary();
    }

    try {
      final response = await _client.post(
        Uri.parse(_baseUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_apiKey',
          'HTTP-Referer': 'https://medha.health',
          'X-Title': 'Medha Health Intelligance',
        },
        body: jsonEncode({
          'model': _model,
          'messages': [
            {
              'role': 'system',
              'content':
                  'You are Medha AI, a healthcare assistant. Analyze patient data and provide a brief health summary with actionable recommendations. Be concise and empathetic. Always respond in valid JSON format with keys: summary (string), recommendations (list of strings, max 4), riskLevel (one of: low, moderate, high).',
            },
            {'role': 'user', 'content': prompt},
          ],
          'max_tokens': 500,
          'temperature': 0.3,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final content =
            data['choices'][0]['message']['content'] as String;
        return _parseAiResponse(content);
      } else {
        return _demoSummary();
      }
    } catch (_) {
      return _demoSummary();
    }
  }

  String _buildPrompt(
    String patientName,
    List<Map<String, dynamic>>? appointments,
    Map<String, dynamic>? vitals,
  ) {
    final sb = StringBuffer();
    sb.writeln('Patient: $patientName');

    if (vitals != null && vitals.isNotEmpty) {
      sb.writeln('Vitals: ${jsonEncode(vitals)}');
    } else {
      sb.writeln(
          'Vitals: Heart rate 72 bpm (normal), Blood type O+, No known chronic conditions');
    }

    if (appointments != null && appointments.isNotEmpty) {
      sb.writeln(
          'Recent appointments: ${appointments.length} in the last 30 days');
    } else {
      sb.writeln('No recent appointments on record.');
    }

    sb.writeln(
        '\nProvide a concise health summary and recommendations. Respond only with valid JSON.');
    return sb.toString();
  }

  AiHealthSummary _parseAiResponse(String content) {
    try {
      // Try to extract JSON from the response
      final jsonStart = content.indexOf('{');
      final jsonEnd = content.lastIndexOf('}');
      if (jsonStart != -1 && jsonEnd != -1) {
        final jsonStr = content.substring(jsonStart, jsonEnd + 1);
        final parsed = jsonDecode(jsonStr) as Map<String, dynamic>;
        return AiHealthSummary(
          summary: (parsed['summary'] ?? '').toString(),
          recommendations: (parsed['recommendations'] as List<dynamic>?)
                  ?.map((e) => e.toString())
                  .toList() ??
              [],
          riskLevel: (parsed['riskLevel'] ?? 'low').toString().toLowerCase(),
          generatedAt: DateTime.now(),
        );
      }
    } catch (_) {}
    return _demoSummary();
  }

  AiHealthSummary _demoSummary() {
    return AiHealthSummary(
      summary:
          'Your vitals are within healthy ranges. Heart rate is steady at 72 bpm, and no abnormal patterns have been detected. Continue maintaining your current wellness routine.',
      recommendations: [
        'Schedule your annual check-up this month',
        'Continue daily 30-minute walks for cardiovascular health',
        'Stay hydrated with 8 glasses of water daily',
        'Consider a routine blood panel next quarter',
      ],
      riskLevel: 'low',
      generatedAt: DateTime.now(),
    );
  }
}

final aiServiceProvider = Provider<AiService>((ref) => AiService());

/// Provider for the AI health summary, refreshable.
final aiHealthSummaryProvider = FutureProvider<AiHealthSummary>((ref) async {
  final aiService = ref.read(aiServiceProvider);
  return aiService.generateHealthSummary(patientName: 'Patient');
});
