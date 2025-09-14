import 'package:flutter/material.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({Key? key}) : super(key: key);

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _rememberMe = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 60),

              // AMC Logo and Header
              Center(
                child: Column(
                  children: [
                    Container(
                      height: 100,
                      width: 100,
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E5F74),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Icon(
                        Icons.location_city,
                        color: Colors.white,
                        size: 50,
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'AMC Smart City',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1E5F74),
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Your Digital Gateway to City Services',
                      style: TextStyle(fontSize: 16, color: Colors.grey),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 50),

              // Welcome Text
              const Text(
                'Welcome Back!',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1E5F74),
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Sign in to access your account',
                style: TextStyle(fontSize: 16, color: Colors.grey),
              ),

              const SizedBox(height: 40),

              // Login Form
              Form(
                key: _formKey,
                child: Column(
                  children: [
                    // Email Field
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: InputDecoration(
                        labelText: 'Email Address',
                        hintText: 'Enter your email',
                        prefixIcon: const Icon(
                          Icons.email_outlined,
                          color: Color(0xFF1E5F74),
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Colors.grey),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: Color(0xFF1E5F74),
                            width: 2,
                          ),
                        ),
                        filled: true,
                        fillColor: Colors.grey[50],
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter your email';
                        }
                        if (!RegExp(
                          r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$',
                        ).hasMatch(value)) {
                          return 'Please enter a valid email';
                        }
                        return null;
                      },
                    ),

                    const SizedBox(height: 20),

                    // Password Field
                    TextFormField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      decoration: InputDecoration(
                        labelText: 'Password',
                        hintText: 'Enter your password',
                        prefixIcon: const Icon(
                          Icons.lock_outline,
                          color: Color(0xFF1E5F74),
                        ),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                            color: Colors.grey,
                          ),
                          onPressed: () {
                            setState(() {
                              _obscurePassword = !_obscurePassword;
                            });
                          },
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Colors.grey),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: Color(0xFF1E5F74),
                            width: 2,
                          ),
                        ),
                        filled: true,
                        fillColor: Colors.grey[50],
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter your password';
                        }
                        if (value.length < 6) {
                          return 'Password must be at least 6 characters';
                        }
                        return null;
                      },
                    ),

                    const SizedBox(height: 16),

                    // Remember Me and Forgot Password Row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Checkbox(
                              value: _rememberMe,
                              onChanged: (value) {
                                setState(() {
                                  _rememberMe = value ?? false;
                                });
                              },
                              activeColor: const Color(0xFF1E5F74),
                            ),
                            const Text(
                              'Remember me',
                              style: TextStyle(color: Colors.grey),
                            ),
                          ],
                        ),
                        TextButton(
                          onPressed: () {
                            // Navigate to forgot password screen
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'Forgot Password feature coming soon!',
                                ),
                              ),
                            );
                          },
                          child: const Text(
                            'Forgot Password?',
                            style: TextStyle(
                              color: Color(0xFF1E5F74),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 30),

                    // Login Button
                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: () {
                          if (_formKey.currentState!.validate()) {
                            // Handle login logic here
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Login successful!'),
                                backgroundColor: Colors.green,
                              ),
                            );
                            // Navigate to home screen
                            // Navigator.pushReplacementNamed(context, '/home');
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF1E5F74),
                          foregroundColor: Colors.white,
                          elevation: 2,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'Sign In',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 30),

                    // Divider with OR
                    Row(
                      children: [
                        Expanded(
                          child: Container(height: 1, color: Colors.grey[300]),
                        ),
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 16),
                          child: Text(
                            'OR',
                            style: TextStyle(
                              color: Colors.grey,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        Expanded(
                          child: Container(height: 1, color: Colors.grey[300]),
                        ),
                      ],
                    ),

                    const SizedBox(height: 30),

                    // Guest Login Button
                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: OutlinedButton(
                        onPressed: () {
                          // Handle guest login
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Continuing as guest...'),
                            ),
                          );
                          // Navigate to home screen as guest
                          // Navigator.pushReplacementNamed(context, '/home');
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF1E5F74),
                          side: const BorderSide(
                            color: Color(0xFF1E5F74),
                            width: 2,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'Continue as Guest',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 40),

                    // Sign Up Row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          "Don't have an account? ",
                          style: TextStyle(color: Colors.grey),
                        ),
                        TextButton(
                          onPressed: () {
                            // Navigate to sign up screen
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Sign up feature coming soon!'),
                              ),
                            );
                          },
                          child: const Text(
                            'Sign Up',
                            style: TextStyle(
                              color: Color(0xFF1E5F74),
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
