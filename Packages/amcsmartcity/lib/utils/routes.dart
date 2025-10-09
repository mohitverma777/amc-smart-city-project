// lib/routes/app_routes.dart
import 'package:flutter/material.dart';
import '../screens/splash_screen.dart';
import '../screens/onboarding_screen.dart';
import '../screens/login_screen.dart';
import '../screens/register_screen.dart';
import '../screens/home_screen.dart';
import '../screens/profile_screen.dart';
import '../screens/services_screen.dart';
import '../screens/notifications_screen.dart';
import '../screens/payment_screen.dart'; // ✅ Payment screen
import '../screens/complaint_screen.dart';
import '../screens/track_complaint_screen.dart';
import '../screens/documents_screen.dart';
import '../screens/settings_screen.dart';
import '../screens/help_screen.dart';
import '../screens/about_screen.dart';

class AppRoutes {
  static const String splash = '/';
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String register = '/register';
  static const String home = '/home';
  static const String services = '/services';
  static const String serviceDetail = '/service-detail';
  static const String profile = '/profile';
  static const String notifications = '/notifications';
  static const String payment = '/payment';
  static const String complaint = '/complaint';
  static const String trackComplaint = '/track-complaint';
  static const String documents = '/documents';
  static const String settings = '/settings';
  static const String help = '/help';
  static const String about = '/about';

  static Route<dynamic> generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case AppRoutes.splash:
        return MaterialPageRoute(builder: (_) => const SplashScreen());

      case AppRoutes.onboarding:
        return MaterialPageRoute(builder: (_) => const OnboardingScreen());

      case AppRoutes.login:
        return MaterialPageRoute(builder: (_) => const LoginScreen());

      case AppRoutes.register:
        return MaterialPageRoute(builder: (_) => const RegisterScreen());

      case AppRoutes.home:
        return MaterialPageRoute(builder: (_) => const HomeScreen());

      case AppRoutes.services:
        return MaterialPageRoute(
          builder: (_) => const ServicesScreen(), // ✅ Use actual screen
        );

      case AppRoutes.profile:
        return MaterialPageRoute(
          builder: (_) => const ProfileScreen(), // ✅ Use actual screen
        );

      case AppRoutes.notifications:
        return MaterialPageRoute(
          builder: (_) => const NotificationsScreen(), // ✅ Use actual screen
        );

      case AppRoutes.payment:
        return MaterialPageRoute(
          builder: (_) =>
              const PaymentScreen(), // ✅ UPDATED: Use actual payment screen
        );

      case AppRoutes.complaint:
        return MaterialPageRoute(
          builder: (_) => const ComplaintScreen(), // ✅ Use actual screen
        );

      case AppRoutes.trackComplaint:
        return MaterialPageRoute(
          builder: (_) => const TrackComplaintScreen(), // ✅ Use actual screen
        );

      case AppRoutes.documents:
        return MaterialPageRoute(
          builder: (_) => const DocumentsScreen(), // ✅ Use actual screen
        );

      case AppRoutes.settings:
        return MaterialPageRoute(
          builder: (_) => const SettingsScreen(), // ✅ Use actual screen
        );

      case AppRoutes.help:
        return MaterialPageRoute(
          builder: (_) => const HelpScreen(), // ✅ Use actual screen
        );

      case AppRoutes.about:
        return MaterialPageRoute(
          builder: (_) => const AboutScreen(), // ✅ Use actual screen
        );

      default:
        return MaterialPageRoute(
          builder: (context) => Scaffold(
            appBar: AppBar(
              title: const Text('Error'),
              backgroundColor: const Color(0xFF002B5B),
            ),
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(
                    'Route not found: ${settings.name}',
                    style: const TextStyle(fontSize: 16),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => Navigator.pushNamedAndRemoveUntil(
                      context,
                      splash,
                      (route) => false,
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF002B5B),
                    ),
                    child: const Text('Go Home'),
                  ),
                ],
              ),
            ),
          ),
        );
    }
  }

  // Navigation helper methods
  static void navigateToHome(BuildContext context) {
    Navigator.pushNamedAndRemoveUntil(context, home, (route) => false);
  }

  static void navigateToLogin(BuildContext context) {
    Navigator.pushNamedAndRemoveUntil(context, login, (route) => false);
  }

  static void navigateToPayment(BuildContext context) {
    Navigator.pushNamed(context, payment);
  }

  static void navigateToComplaint(BuildContext context) {
    Navigator.pushNamed(context, complaint);
  }

  static void navigateToTrackComplaint(BuildContext context) {
    Navigator.pushNamed(context, trackComplaint);
  }

  static void navigateBack(BuildContext context) {
    if (Navigator.canPop(context)) {
      Navigator.pop(context);
    }
  }

  static void navigateAndReplace(BuildContext context, String routeName) {
    Navigator.pushReplacementNamed(context, routeName);
  }

  static void navigateAndClearStack(BuildContext context, String routeName) {
    Navigator.pushNamedAndRemoveUntil(context, routeName, (route) => false);
  }
}
