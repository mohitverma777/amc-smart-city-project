// lib/screens/login_screen.dart
import 'package:flutter/material.dart';
import '../utils/colors.dart';
import '../utils/routes.dart';
import '../widgets/input_field.dart';
import '../widgets/custom_button.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isPasswordVisible = false;
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (_formKey.currentState?.validate() ?? false) {
      setState(() => _isLoading = true);

      // Simulate API call
      await Future.delayed(const Duration(seconds: 2));

      if (mounted) {
        setState(() => _isLoading = false);
        Navigator.pushReplacementNamed(context, AppRoutes.home);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primary,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 60),
                Center(
                  child: Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 10,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.location_city,
                      size: 50,
                      color: AppColors.primary,
                    ),
                  ),
                ),
                const SizedBox(height: 40),
                Text(
                  'Welcome Back',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineLarge,
                ),
                const SizedBox(height: 8),
                Text(
                  'Sign in to access your municipal services',
                  textAlign: TextAlign.center,
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(color: Colors.white70),
                ),
                const SizedBox(height: 60),
                InputField(
                  controller: _emailController,
                  label: 'Email Address',
                  keyboardType: TextInputType.emailAddress,
                  prefixIcon: Icons.email,
                  validator: (value) {
                    // if (value?.isEmpty ?? true) {
                    //   return 'Please enter your email';
                    // }
                    // if (!RegExp(
                    //   r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$',
                    // ).hasMatch(value!)) {
                    //   return 'Please enter a valid email';
                    // }
                    // return null;
                  },
                ),
                const SizedBox(height: 20),
                InputField(
                  controller: _passwordController,
                  label: 'Password',
                  obscureText: !_isPasswordVisible,
                  prefixIcon: Icons.lock,
                  suffixIcon: IconButton(
                    icon: Icon(
                      _isPasswordVisible
                          ? Icons.visibility_off
                          : Icons.visibility,
                      color: Colors.white70,
                    ),
                    onPressed: () => setState(
                      () => _isPasswordVisible = !_isPasswordVisible,
                    ),
                  ),
                  validator: (value) {
                    // if (value?.isEmpty ?? true) {
                    //   return 'Please enter your password';
                    // }
                    // if (value!.length < 6) {
                    //   return 'Password must be at least 6 characters';
                    // }
                    // return null;
                  },
                ),
                const SizedBox(height: 12),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () {
                      // Handle forgot password
                    },
                    child: const Text(
                      'Forgot Password?',
                      style: TextStyle(color: Colors.white70),
                    ),
                  ),
                ),
                const SizedBox(height: 40),
                CustomButton(
                  text: 'Sign In',
                  onPressed: _login,
                  isLoading: _isLoading,
                ),
                const SizedBox(height: 30),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      "Don't have an account? ",
                      style: Theme.of(
                        context,
                      ).textTheme.bodyMedium?.copyWith(color: Colors.white70),
                    ),
                    TextButton(
                      onPressed: () =>
                          Navigator.pushNamed(context, AppRoutes.register),
                      child: const Text(
                        'Sign Up',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
