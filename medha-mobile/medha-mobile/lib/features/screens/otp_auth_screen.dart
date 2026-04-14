import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:medha_mobile/features/auth/auth_repository.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';

class OtpAuthScreen extends ConsumerStatefulWidget {
  const OtpAuthScreen({super.key});

  @override
  ConsumerState<OtpAuthScreen> createState() => _OtpAuthScreenState();
}

class _OtpAuthScreenState extends ConsumerState<OtpAuthScreen> {
  final phoneCtrl = TextEditingController();
  final otpCtrl = TextEditingController();
  String? verificationId;
  bool sending = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Phone OTP Login", style: GoogleFonts.manrope(fontWeight: FontWeight.w700)),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        child: ListView(
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(Icons.phone_android_rounded, color: AppTheme.primary, size: 24),
                  ),
                  const SizedBox(height: 18),
                  Text("Verify Your Phone", style: GoogleFonts.manrope(fontWeight: FontWeight.w800, fontSize: 22, color: AppTheme.onSurface)),
                  const SizedBox(height: 6),
                  Text(
                    "Enter your number and we will send an OTP.",
                    style: GoogleFonts.plusJakartaSans(color: AppTheme.onSurface.withValues(alpha: 0.5), fontWeight: FontWeight.w500, fontSize: 14),
                  ),
                  const SizedBox(height: 20),
                  TextField(
                    controller: phoneCtrl,
                    keyboardType: TextInputType.phone,
                    decoration: InputDecoration(
                      hintText: "Phone (+91...)",
                      prefixIcon: const Icon(Icons.phone_rounded, size: 20),
                      filled: true,
                      fillColor: AppTheme.surfaceContainerHighest.withValues(alpha: 0.5),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppTheme.primary, width: 2)),
                    ),
                  ),
                  const SizedBox(height: 14),
                  FilledButton(
                    onPressed: sending
                        ? null
                        : () async {
                            setState(() => sending = true);
                            await ref.read(authRepositoryProvider).sendOtp(
                              phoneNumber: phoneCtrl.text.trim(),
                              onCodeSent: (id) {
                                verificationId = id;
                                if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("OTP sent")));
                              },
                              onError: (message) {
                                if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
                              },
                            );
                            if (mounted) setState(() => sending = false);
                          },
                    style: FilledButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      minimumSize: const Size.fromHeight(56),
                      shape: const StadiumBorder(),
                      elevation: 0,
                    ),
                    child: Text("Send OTP", style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, fontSize: 16)),
                  ),
                  const SizedBox(height: 20),
                  TextField(
                    controller: otpCtrl,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      hintText: "Enter OTP",
                      prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20),
                      filled: true,
                      fillColor: AppTheme.surfaceContainerHighest.withValues(alpha: 0.5),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppTheme.primary, width: 2)),
                    ),
                  ),
                  const SizedBox(height: 14),
                  OutlinedButton(
                    onPressed: verificationId == null
                        ? null
                        : () async {
                             try {
                               await ref.read(authRepositoryProvider).verifyOtp(phone: phoneCtrl.text.trim(), token: otpCtrl.text.trim());
                               if (mounted) context.go("/home");
                             } catch (e) {
                              if (!mounted) return;
                              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                            }
                          },
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(52),
                      shape: const StadiumBorder(),
                      side: BorderSide(color: AppTheme.primary.withValues(alpha: 0.25)),
                    ),
                    child: Text("Verify OTP", style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, fontSize: 16)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
