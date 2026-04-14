import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:medha_mobile/features/auth/auth_repository.dart';
import 'package:medha_mobile/core/theme/app_theme.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> with SingleTickerProviderStateMixin {
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _name = TextEditingController();
  final _phone = TextEditingController();
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
      duration: const Duration(milliseconds: 600),
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
    _name.dispose();
    _phone.dispose();
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
      final authRepo = ref.read(authRepositoryProvider);
      if (isLogin) {
        await authRepo.signIn(_email.text.trim(), _password.text.trim());
      } else {
        await authRepo.signUp(
          _email.text.trim(),
          _password.text.trim(),
          name: _name.text.trim(),
          phone: _phone.text.trim(),
        );
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Account created successfully!'),
            backgroundColor: AppTheme.secondary,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
      if (!mounted) return;
      await Future.delayed(const Duration(milliseconds: 150));
      if (!mounted) return;
      context.go("/home");
    } on FirebaseAuthException catch (e) {
      if (!mounted) return;
      String friendlyMessage = e.message ?? "Authentication failed";
      if (e.code == 'email-already-in-use') {
        friendlyMessage = "This email is already in use.";
      } else if (e.code == 'weak-password') {
        friendlyMessage = "Password should be at least 6 characters.";
      } else if (e.code == 'invalid-email') {
        friendlyMessage = "Please enter a valid email.";
      } else if (e.code == 'user-not-found' || e.code == 'wrong-password' || e.code == 'invalid-credential') {
        friendlyMessage = "Invalid email or password.";
      }
      setState(() => _errorMessage = friendlyMessage);
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = 'An error occurred during signup. Please check your connection.');
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
    } on FirebaseAuthException catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.message ?? 'Google Sign-In failed.');
    } catch (e) {
      if (!mounted) return;
      if (e.toString().contains('sign_in_canceled')) {
        setState(() => _errorMessage = 'Sign-in was cancelled.');
      } else {
        setState(() => _errorMessage = 'Google sign-in failed. Please check your connection and try again.');
      }
    } finally {
      if (mounted) setState(() => _googleLoading = false);
    }
  }

  void _switchTab(bool toLogin) {
    if (isLogin == toLogin) return;
    setState(() {
      isLogin = toLogin;
      _errorMessage = null;
      _formKey.currentState?.reset();
    });
    _fadeController.reset();
    _fadeController.forward();
  }

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: cs.surface,
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: _AuthHeroSection(),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Column(
                children: [
                  const SizedBox(height: 24),
                  _SegmentedToggle(isLogin: isLogin, onToggle: _switchTab),
                  const SizedBox(height: 24),
                  
                  AnimatedSize(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.fastOutSlowIn,
                    alignment: Alignment.topCenter,
                    child: FadeTransition(
                      opacity: _fadeAnimation,
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            if (_errorMessage != null) ...[
                              _ErrorMessageCard(message: _errorMessage!),
                              const SizedBox(height: 16),
                            ],
                            
                            if (!isLogin) ...[
                              AuthTextField(
                                controller: _name,
                                hintText: "Full Name",
                                prefixIcon: Icons.person_outline_rounded,
                                validator: (value) => 
                                    (value == null || value.isEmpty) ? 'Please enter your name' : null,
                              ),
                              const SizedBox(height: 16),
                              AuthTextField(
                                controller: _phone,
                                hintText: "Phone Number",
                                prefixIcon: Icons.phone_outlined,
                                keyboardType: TextInputType.phone,
                                validator: (value) => 
                                    (value == null || value.isEmpty) ? 'Please enter your phone number' : null,
                              ),
                              const SizedBox(height: 16),
                            ],
                            
                            AuthTextField(
                              controller: _email,
                              hintText: "Email Address",
                              prefixIcon: Icons.email_outlined,
                              keyboardType: TextInputType.emailAddress,
                              validator: (value) {
                                if (value == null || value.isEmpty) return 'Please enter your email';
                                if (!value.contains('@')) return 'Enter a valid email';
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),
                            
                            AuthTextField(
                              controller: _password,
                              hintText: "Password",
                              prefixIcon: Icons.lock_outline_rounded,
                              obscureText: _obscure,
                              onToggleObscure: () => setState(() => _obscure = !_obscure),
                              validator: (value) {
                                if (value == null || value.isEmpty) return 'Please enter your password';
                                if (value.length < 6) return 'At least 6 characters required';
                                return null;
                              },
                            ),
                            const SizedBox(height: 24),
                            
                            PrimaryButton(
                              label: isLogin ? "Login safely" : "Create account",
                              isLoading: _loading,
                              onPressed: _handleAuth,
                            ),
                            const SizedBox(height: 24),
                            
                            Row(
                              children: [
                                Expanded(child: Divider(color: cs.onSurface.withValues(alpha: 0.1))),
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                  child: Text(
                                    "OR continue with",
                                    style: tt.labelSmall?.copyWith(
                                      color: cs.onSurface.withValues(alpha: 0.5),
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                                Expanded(child: Divider(color: cs.onSurface.withValues(alpha: 0.1))),
                              ],
                            ),
                            const SizedBox(height: 24),
                            
                            SocialButton(
                              isLoading: _googleLoading,
                              onPressed: _handleGoogleSignIn,
                            ),
                            const SizedBox(height: 16),
                            

                            
                            Center(
                              child: TextButton(
                                onPressed: () {
                                  ref.read(guestProvider.notifier).setGuest(true);
                                },
                                style: TextButton.styleFrom(
                                  foregroundColor: cs.onSurface.withValues(alpha: 0.6),
                                ),
                                child: const Text(
                                  "Continue as Guest",
                                  style: TextStyle(fontWeight: FontWeight.w600, decoration: TextDecoration.underline),
                                ),
                              ),
                            ),
                            const SizedBox(height: 40),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AuthHeroSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.primary, AppTheme.primaryContainer],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(32),
          bottomRight: Radius.circular(32),
        ),
      ),
      padding: const EdgeInsets.fromLTRB(24, 60, 24, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(
              Icons.monitor_heart_rounded,
              color: Colors.white,
              size: 32,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            "Your Health,\nSimplified.",
            style: tt.headlineMedium?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            "Secure, fast & trusted healthcare access",
            style: tt.bodyMedium?.copyWith(
              color: Colors.white.withValues(alpha: 0.85),
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 24),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: const [
              _TrustIndicator(icon: Icons.lock_outline_rounded, label: "Secure Data"),
              _TrustIndicator(icon: Icons.verified_user_outlined, label: "Verified Doctors"),
              _TrustIndicator(icon: Icons.bolt_rounded, label: "Fast Booking"),
            ],
          ),
        ],
      ),
    );
  }
}

class _TrustIndicator extends StatelessWidget {
  final IconData icon;
  final String label;

  const _TrustIndicator({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Colors.white),
          const SizedBox(width: 6),
          Text(
            label,
            style: tt.labelSmall?.copyWith(
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}

class _SegmentedToggle extends StatelessWidget {
  final bool isLogin;
  final ValueChanged<bool> onToggle;

  const _SegmentedToggle({required this.isLogin, required this.onToggle});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppTheme.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => onToggle(true),
              behavior: HitTestBehavior.opaque,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                curve: Curves.easeInOut,
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  color: isLogin ? Colors.white : Colors.transparent,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: isLogin
                      ? [BoxShadow(color: cs.onSurface.withValues(alpha: 0.05), blurRadius: 8, offset: const Offset(0, 2))]
                      : null,
                ),
                child: Center(
                  child: Text(
                    "Login",
                    style: tt.titleSmall?.copyWith(
                      fontWeight: isLogin ? FontWeight.w800 : FontWeight.w600,
                      color: isLogin ? cs.primary : cs.onSurface.withValues(alpha: 0.6),
                    ),
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => onToggle(false),
              behavior: HitTestBehavior.opaque,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                curve: Curves.easeInOut,
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  color: !isLogin ? Colors.white : Colors.transparent,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: !isLogin
                      ? [BoxShadow(color: cs.onSurface.withValues(alpha: 0.05), blurRadius: 8, offset: const Offset(0, 2))]
                      : null,
                ),
                child: Center(
                  child: Text(
                    "Sign Up",
                    style: tt.titleSmall?.copyWith(
                      fontWeight: !isLogin ? FontWeight.w800 : FontWeight.w600,
                      color: !isLogin ? cs.primary : cs.onSurface.withValues(alpha: 0.6),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class AuthTextField extends StatefulWidget {
  final TextEditingController controller;
  final String hintText;
  final IconData prefixIcon;
  final TextInputType? keyboardType;
  final bool obscureText;
  final VoidCallback? onToggleObscure;
  final FormFieldValidator<String>? validator;

  const AuthTextField({
    super.key,
    required this.controller,
    required this.hintText,
    required this.prefixIcon,
    this.keyboardType,
    this.obscureText = false,
    this.onToggleObscure,
    this.validator,
  });

  @override
  State<AuthTextField> createState() => _AuthTextFieldState();
}

class _AuthTextFieldState extends State<AuthTextField> {
  bool _isFocused = false;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return Focus(
      onFocusChange: (focused) => setState(() => _isFocused = focused),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: _isFocused
              ? [BoxShadow(color: cs.primary.withValues(alpha: 0.1), blurRadius: 12, offset: const Offset(0, 4))]
              : [BoxShadow(color: cs.onSurface.withValues(alpha: 0.02), blurRadius: 8, offset: const Offset(0, 2))],
          border: Border.all(
            color: _isFocused ? cs.primary : AppTheme.outlineVariant.withValues(alpha: 0.3),
            width: _isFocused ? 2 : 1,
          ),
        ),
        child: TextFormField(
          controller: widget.controller,
          keyboardType: widget.keyboardType,
          obscureText: widget.obscureText,
          validator: widget.validator,
          style: tt.bodyLarge,
          decoration: InputDecoration(
            hintText: widget.hintText,
            hintStyle: tt.bodyMedium?.copyWith(color: cs.onSurface.withValues(alpha: 0.4)),
            prefixIcon: Icon(widget.prefixIcon, size: 22, color: _isFocused ? cs.primary : cs.onSurface.withValues(alpha: 0.4)),
            suffixIcon: widget.onToggleObscure != null
                ? IconButton(
                    icon: Icon(
                      widget.obscureText ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                      size: 20,
                      color: cs.onSurface.withValues(alpha: 0.4),
                    ),
                    onPressed: widget.onToggleObscure,
                  )
                : null,
            border: InputBorder.none,
            enabledBorder: InputBorder.none,
            focusedBorder: InputBorder.none,
            errorBorder: InputBorder.none,
            focusedErrorBorder: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
            errorStyle: const TextStyle(height: 0, color: Colors.transparent),
          ),
        ),
      ),
    );
  }
}

class PrimaryButton extends StatelessWidget {
  final String label;
  final bool isLoading;
  final VoidCallback onPressed;

  const PrimaryButton({
    super.key,
    required this.label,
    required this.isLoading,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: cs.primary.withValues(alpha: 0.25),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: FilledButton(
        onPressed: isLoading ? null : onPressed,
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(56),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          padding: EdgeInsets.zero,
        ),
        child: Ink(
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppTheme.primary, AppTheme.primaryContainer],
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Container(
            alignment: Alignment.center,
            constraints: const BoxConstraints(minHeight: 56),
            child: isLoading
                ? const SizedBox(
                    height: 24,
                    width: 24,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                  )
                : Text(
                    label,
                    style: tt.titleSmall?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
          ),
        ),
      ),
    );
  }
}

class SocialButton extends StatelessWidget {
  final bool isLoading;
  final VoidCallback onPressed;

  const SocialButton({super.key, required this.isLoading, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;

    return ElevatedButton(
      onPressed: isLoading ? null : onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.white,
        foregroundColor: cs.onSurface,
        elevation: 0,
        minimumSize: const Size.fromHeight(56),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: cs.onSurface.withValues(alpha: 0.1), width: 1.5),
        ),
      ),
      child: isLoading
          ? const SizedBox(
              height: 20,
              width: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Image.network(
                  'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg',
                  height: 24,
                  errorBuilder: (_, __, ___) => Icon(Icons.g_mobiledata_rounded, color: cs.primary, size: 36),
                ),
                const SizedBox(width: 12),
                Text(
                  "Google",
                  style: tt.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: cs.onSurface.withValues(alpha: 0.8),
                  ),
                ),
              ],
            ),
    );
  }
}

class _ErrorMessageCard extends StatelessWidget {
  final String message;

  const _ErrorMessageCard({required this.message});

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.error.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.error.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline_rounded, color: AppTheme.error, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: tt.bodySmall?.copyWith(
                color: AppTheme.error,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}