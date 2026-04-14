import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:medha_mobile/core/services/medha_api_provider.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';
import 'package:medha_mobile/core/widgets/enhanced_button.dart';
import 'package:medha_mobile/core/widgets/enhanced_card.dart';

class CompleteProfileScreen extends ConsumerStatefulWidget {
  const CompleteProfileScreen({super.key});

  @override
  ConsumerState<CompleteProfileScreen> createState() => _CompleteProfileScreenState();
}

class _CompleteProfileScreenState extends ConsumerState<CompleteProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullName = TextEditingController();
  final _phone = TextEditingController();
  DateTime? _dateOfBirth;
  String _gender = 'M';
  bool _loading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _fullName.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(now.year - 25),
      firstDate: DateTime(1900),
      lastDate: now,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(primary: AppTheme.primary),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() => _dateOfBirth = picked);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_dateOfBirth == null) {
      setState(() => _errorMessage = 'Please select your date of birth');
      return;
    }
    if (_loading) return;

    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      final api = ref.read(medhaApiProvider);
      await api.completeProfile(
        fullName: _fullName.text.trim(),
        phone: _phone.text.trim(),
        gender: _gender,
        dateOfBirth: DateFormat('yyyy-MM-dd').format(_dateOfBirth!),
      );

      if (mounted) {
        context.go('/home');
      }
    } catch (e) {
      setState(() => _errorMessage = 'Failed to save profile. Please try again.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: cs.surface,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 36, 24, 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header
                GradientCard(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.18),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(Icons.person_outline_rounded, color: Colors.white, size: 28),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        "Complete Your\nProfile",
                        style: tt.headlineMedium?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          height: 1.2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        "We need a few details to set up your\npatient account",
                        style: tt.bodySmall?.copyWith(
                          color: Colors.white.withValues(alpha: 0.85),
                          fontWeight: FontWeight.w500,
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Form card
                EnhancedCard(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Error message
                      if (_errorMessage != null) ...[
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppTheme.tertiary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppTheme.tertiary.withValues(alpha: 0.3)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.error_outline_rounded, size: 20, color: AppTheme.tertiary),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  _errorMessage!,
                                  style: tt.bodySmall?.copyWith(
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.tertiary,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Full name
                      TextFormField(
                        controller: _fullName,
                        textCapitalization: TextCapitalization.words,
                        validator: (v) => (v == null || v.trim().isEmpty) ? 'Please enter your full name' : null,
                        decoration: const InputDecoration(hintText: "Full Name", prefixIcon: Icon(Icons.badge_outlined, size: 20)),
                      ),
                      const SizedBox(height: 14),

                      // Phone
                      TextFormField(
                        controller: _phone,
                        keyboardType: TextInputType.phone,
                        validator: (v) {
                          if (v == null || v.trim().isEmpty) return 'Please enter your phone number';
                          if (v.trim().length < 10) return 'Enter a valid phone number';
                          return null;
                        },
                        decoration: const InputDecoration(hintText: "Phone Number", prefixIcon: Icon(Icons.phone_outlined, size: 20)),
                      ),
                      const SizedBox(height: 14),

                      // Gender selector
                      Text(
                        "Gender",
                        style: tt.bodySmall?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: cs.onSurface.withValues(alpha: 0.7),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          _GenderChip(label: "Male", value: "M", selected: _gender == "M", onTap: () => setState(() => _gender = "M")),
                          const SizedBox(width: 10),
                          _GenderChip(label: "Female", value: "F", selected: _gender == "F", onTap: () => setState(() => _gender = "F")),
                          const SizedBox(width: 10),
                          _GenderChip(label: "Other", value: "O", selected: _gender == "O", onTap: () => setState(() => _gender = "O")),
                        ],
                      ),
                      const SizedBox(height: 14),

                      // Date of birth
                      GestureDetector(
                        onTap: _pickDate,
                        child: AbsorbPointer(
                          child: TextFormField(
                            decoration: InputDecoration(
                              hintText: _dateOfBirth != null
                                  ? DateFormat('dd MMM yyyy').format(_dateOfBirth!)
                                  : "Date of Birth",
                              prefixIcon: const Icon(Icons.calendar_today_outlined, size: 20),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Submit
                      EnhancedPrimaryButton(
                        label: "Save & Continue",
                        onPressed: _submit,
                        isLoading: _loading,
                        icon: Icons.check_circle_outline_rounded,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _GenderChip extends StatelessWidget {
  final String label;
  final String value;
  final bool selected;
  final VoidCallback onTap;

  const _GenderChip({
    required this.label,
    required this.value,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: selected ? cs.primary : AppTheme.surfaceContainerHighest.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(12),
            border: selected ? null : Border.all(color: cs.onSurface.withValues(alpha: 0.1)),
          ),
          child: Center(
            child: Text(
              label,
              style: tt.bodySmall?.copyWith(
                fontWeight: FontWeight.w700,
                color: selected ? Colors.white : cs.onSurface.withValues(alpha: 0.6),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
