// lib/screens/splash_screen.dart
import 'package:flutter/material.dart';
import '../utils/colors.dart';
import '../utils/routes.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(seconds: 3),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeIn),
    );

    _scaleAnimation = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.elasticOut),
    );

    _animationController.forward();
    _navigateToNext();
  }

  _navigateToNext() async {
    await Future.delayed(const Duration(seconds: 4));
    if (mounted) {
      Navigator.pushReplacementNamed(context, AppRoutes.onboarding);
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primary,
      body: Center(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: ScaleTransition(
            scale: _scaleAnimation,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.location_city,
                    size: 60,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(height: 40),
                Text(
                  'AMC SMART CITY',
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                    fontSize: 36,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 3.0,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'MUNICIPAL CORPORATION',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    fontSize: 18,
                    letterSpacing: 2.0,
                    fontWeight: FontWeight.w300,
                  ),
                ),
                const SizedBox(height: 60),
                const CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  strokeWidth: 3,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
