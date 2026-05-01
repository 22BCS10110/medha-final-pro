import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:medha_mobile/features/auth/auth_repository.dart';
import 'package:medha_mobile/l10n/app_localizations.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';
import 'package:medha_mobile/core/widgets/enhanced_button.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> with TickerProviderStateMixin {
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool isLogin = true;
  bool _obscure = true;
  bool _loading = false;
  bool _googleLoading = false;
  String? _errorMessage;
  
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeInOut,
    );
    _fadeController.forward();
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  Future<void> _handleAuth() async {
    if (!_formKey.currentState!.validate()) return;
    if (_loading) return;
    
    setState(() {
      _loading = true;
      _errorMessage = null;
    });
    
    try {
      final supabase = Supabase.instance.client;
      if (isLogin) {
        await supabase.auth.signInWithPassword(
          email: _email.text.trim(),
          password: _password.text.trim(),
        );
      } else {
        await supabase.auth.signUp(
          email: _email.text.trim(),
          password: _password.text.trim(),
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Account created! Please check your email to verify.',
                style: GoogleFonts.plusJakartaSans(),
              ),
              backgroundColor: const Color(0xFF43A047),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          );
        }
      }
      if (mounted) {
        await Future.delayed(const Duration(milliseconds: 300));
        context.replace("/home");
      }
    } on AuthException catch (e) {
      setState(() => _errorMessage = e.message);
    } catch (e) {
      setState(() => _errorMessage = 'An error occurred. Please try again.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _handleGoogleSignIn() async {
    if (_googleLoading) return;
    setState(() {
      _googleLoading = true;
      _errorMessage = null;
    });

    try {
      final authRepo = ref.read(authRepositoryProvider);
      final result = await authRepo.signInWithGoogle();

      if (!mounted) return;

      if (result.isProfileComplete) {
        context.go('/home');
      } else {
        context.go('/complete-profile');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _errorMessage = 'Google sign-in failed. Please try again.');
      }
    } finally {
      if (mounted) setState(() => _googleLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      backgroundColor: AppTheme.surface,
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: SingleChildScrollView(
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            padding: const EdgeInsets.fromLTRB(24, 36, 24, 24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Hero container
                  Container(
                    padding: const EdgeInsets.all(28),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppTheme.primary, AppTheme.primaryContainer],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primary.withValues(alpha: 0.3),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.18),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: const Icon(
                            Icons.health_and_safety_rounded,
                            color: Colors.white,
                            size: 32,
                          ),
                        ),
                        const SizedBox(height: 20),
                        Text(
                          "Welcome to\nMedha Health Intelligance",
                          style: GoogleFonts.manrope(
                            color: Colors.white,
                            fontSize: 28,
                            fontWeight: FontWeight.w800,
                            height: 1.2,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          "Your trusted partner for comprehensive\nhealthcare management",
                          style: GoogleFonts.plusJakartaSans(
                            color: Colors.white.withValues(alpha: 0.85),
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            height: 1.5,
                          ),
                        ),
                        const SizedBox(height: 18),
                        Wrap(
                          spacing: 10,
                          runSpacing: 10,
                          children: [
                            _HeroBadge(
                              icon: Icons.lock_rounded,
                              label: "Secure Data",
                            ),
                            _HeroBadge(
                              icon: Icons.verified_rounded,
                              label: "Verified Doctors",
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Login/Signup form
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.onSurface.withValues(alpha: 0.04),
                          blurRadius: 10,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          isLogin ? "Welcome Back" : "Create Account",
                          style: GoogleFonts.manrope(
                            fontWeight: FontWeight.w800,
                            fontSize: 22,
                            color: AppTheme.onSurface,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          isLogin
                              ? "Sign in to access your health records"
                              : "Join us to start your health journey",
                          style: GoogleFonts.plusJakartaSans(
                            color: AppTheme.onSurface.withValues(alpha: 0.55),
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 24),
                        
                        // Toggle
                        Container(
                          decoration: BoxDecoration(
                            color: AppTheme.surfaceContainerLow,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          padding: const EdgeInsets.all(4),
                          child: Row(
                            children: [
                              Expanded(
                                child: _TabButton(
                                  label: l10n.login,
                                  selected: isLogin,
                                  onTap: () => setState(() {
                                    isLogin = true;
                                    _errorMessage = null;
                                  }),
                                ),
                              ),
                              Expanded(
                                child: _TabButton(
                                  label: l10n.signup,
                                  selected: !isLogin,
                                  onTap: () => setState(() {
                                    isLogin = false;
                                    _errorMessage = null;
                                  }),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),
                        
                        // Error message
                        if (_errorMessage != null) ...[
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppTheme.tertiary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: AppTheme.tertiary.withValues(alpha: 0.3),
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.error_outline_rounded,
                                  size: 20,
                                  color: AppTheme.tertiary,
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    _errorMessage!,
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 13,
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
                        
                        // Email field
                        TextFormField(
                          controller: _email,
                          keyboardType: TextInputType.emailAddress,
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please enter your email';
                            }
                            if (!value.contains('@')) {
                              return 'Please enter a valid email';
                            }
                            return null;
                          },
                          decoration: InputDecoration(
                            hintText: "Email address",
                            prefixIcon: const Icon(Icons.email_outlined, size: 20),
                            filled: true,
                            fillColor: AppTheme.surfaceContainerHighest.withValues(alpha: 0.5),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: BorderSide.none,
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: const BorderSide(
                                color: AppTheme.primary,
                                width: 2,
                              ),
                            ),
                            errorBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: BorderSide(
                                color: AppTheme.tertiary.withValues(alpha: 0.5),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),
                        
                        // Password field
                        TextFormField(
                          controller: _password,
                          obscureText: _obscure,
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please enter your password';
                            }
                            if (value.length < 6) {
                              return 'Password must be at least 6 characters';
                            }
                            return null;
                          },
                          decoration: InputDecoration(
                            hintText: "Password",
                            prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscure
                                    ? Icons.visibility_off_rounded
                                    : Icons.visibility_rounded,
                                size: 20,
                              ),
                              onPressed: () => setState(() => _obscure = !_obscure),
                            ),
                            filled: true,
                            fillColor: AppTheme.surfaceContainerHighest.withValues(alpha: 0.5),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: BorderSide.none,
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: const BorderSide(
                                color: AppTheme.primary,
                                width: 2,
                              ),
                            ),
                            errorBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: BorderSide(
                                color: AppTheme.tertiary.withValues(alpha: 0.5),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),
                        
                        // Sign in button
                        EnhancedPrimaryButton(
                          label: isLogin ? l10n.login : l10n.signup,
                          onPressed: _handleAuth,
                          isLoading: _loading,
                          icon: isLogin ? Icons.login_rounded : Icons.person_add_rounded,
                        ),
                        const SizedBox(height: 14),

                        // Divider
                        Row(
                          children: [
                            Expanded(child: Divider(color: AppTheme.onSurface.withValues(alpha: 0.12))),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 14),
                              child: Text(
                                "or",
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.onSurface.withValues(alpha: 0.4),
                                ),
                              ),
                            ),
                            Expanded(child: Divider(color: AppTheme.onSurface.withValues(alpha: 0.12))),
                          ],
                        ),
                        const SizedBox(height: 14),

                        // Google sign-in button
                        _GoogleSignInButton(
                          onPressed: _handleGoogleSignIn,
                          isLoading: _googleLoading,
                        ),
                        const SizedBox(height: 12),

                        // OTP button
                        EnhancedOutlineButton(
                          label: l10n.phoneOtp,
                          icon: Icons.phone_android_rounded,
                          onPressed: () => context.go("/otp-auth"),
                        ),
                        const SizedBox(height: 12),
                        
                        // Guest button
                        EnhancedOutlineButton(
                          label: l10n.continueAsGuest,
                          icon: Icons.person_search_rounded,
                          color: AppTheme.onSurface.withValues(alpha: 0.6),
                          onPressed: () => context.go("/home"),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Trust footer
                  Center(
                    child: Text(
                      "Secured by Medha Shield • HIPAA Compliant",
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: AppTheme.onSurface.withValues(alpha: 0.4),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _HeroBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  const _HeroBadge({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Colors.white.withValues(alpha: 0.9)),
          const SizedBox(width: 5),
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: Colors.white.withValues(alpha: 0.9),
            ),
          ),
        ],
      ),
    );
  }
}

class _GoogleSignInButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final bool isLoading;

  const _GoogleSignInButton({this.onPressed, this.isLoading = false});

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: isLoading ? null : onPressed,
      style: OutlinedButton.styleFrom(
        foregroundColor: AppTheme.onSurface,
        minimumSize: const Size.fromHeight(56),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        side: BorderSide(color: AppTheme.onSurface.withValues(alpha: 0.15), width: 1.5),
        backgroundColor: Colors.white,
      ),
      child: isLoading
          ? SizedBox(
              height: 20,
              width: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: AppTheme.onSurface.withValues(alpha: 0.5),
              ),
            )
          : Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Google "G" icon using text (no asset dependency)
                Container(
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Center(
                    child: Text(
                      "G",
                      style: GoogleFonts.roboto(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF4285F4),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  "Continue with Google",
                  style: GoogleFonts.plusJakartaSans(
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                    color: AppTheme.onSurface.withValues(alpha: 0.8),
                  ),
                ),
              ],
            ),
    );
  }
}

class _TabButton extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _TabButton({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: selected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Center(
          child: Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              fontWeight: FontWeight.w700,
              fontSize: 14,
              color: selected
                  ? AppTheme.primary
                  : AppTheme.onSurface.withValues(alpha: 0.5),
            ),
          ),
        ),
      ),
    );
  }
}