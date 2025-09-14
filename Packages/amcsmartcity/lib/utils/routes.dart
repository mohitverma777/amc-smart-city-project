// lib/utils/routes.dart
import 'package:flutter/material.dart';
import '../screens/splash_screen.dart';
import '../screens/onboarding_screen.dart';
import '../screens/login_screen.dart';
import '../screens/register_screen.dart';
import '../screens/home_screen.dart';
import '../screens/services_screen.dart';
import '../screens/service_detail_screen.dart';
import '../screens/profile_screen.dart';
import '../screens/notifications_screen.dart';
import '../screens/payment_screen.dart';
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
        return MaterialPageRoute(builder: (_) => const ServicesScreen());
      case AppRoutes.serviceDetail:
        final args = settings.arguments as Map<String, dynamic>?;
        return MaterialPageRoute(
          builder: (_) => ServiceDetailScreen(
            serviceName: args?['serviceName'] ?? 'Service',
            serviceIcon: args?['serviceIcon'] ?? Icons.room_service,
          ),
        );
      case AppRoutes.profile:
        return MaterialPageRoute(builder: (_) => const ProfileScreen());
      case AppRoutes.notifications:
        return MaterialPageRoute(builder: (_) => const NotificationsScreen());
      case AppRoutes.payment:
        return MaterialPageRoute(builder: (_) => const PaymentScreen());
      case AppRoutes.complaint:
        return MaterialPageRoute(builder: (_) => const ComplaintScreen());
      case AppRoutes.trackComplaint:
        return MaterialPageRoute(builder: (_) => const TrackComplaintScreen());
      case AppRoutes.documents:
        return MaterialPageRoute(builder: (_) => const DocumentsScreen());
      case AppRoutes.settings:
        return MaterialPageRoute(builder: (_) => const SettingsScreen());
      case AppRoutes.help:
        return MaterialPageRoute(builder: (_) => const HelpScreen());
      case AppRoutes.about:
        return MaterialPageRoute(builder: (_) => const AboutScreen());
      default:
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            body: Center(child: Text('No route defined for ${settings.name}')),
          ),
        );
    }
  }

  // Alternative approach using a map-based routing (more modern)
  static final Map<String, Widget Function(BuildContext)> _routes = {
    splash: (context) => const SplashScreen(),
    onboarding: (context) => const OnboardingScreen(),
    login: (context) => const LoginScreen(),
    register: (context) => const RegisterScreen(),
    home: (context) => const HomeScreen(),
    services: (context) => const ServicesScreen(),
    profile: (context) => const ProfileScreen(),
    notifications: (context) => const NotificationsScreen(),
    payment: (context) => const PaymentScreen(),
    complaint: (context) => const ComplaintScreen(),
    trackComplaint: (context) => const TrackComplaintScreen(),
    documents: (context) => const DocumentsScreen(),
    settings: (context) => const SettingsScreen(),
    help: (context) => const HelpScreen(),
    about: (context) => const AboutScreen(),
  };

  // Alternative generateRoute method using map
  static Route<dynamic> generateRouteWithMap(RouteSettings settings) {
    final routeName = settings.name;

    // Handle special cases that need arguments
    if (routeName == serviceDetail) {
      final args = settings.arguments as Map<String, dynamic>?;
      return MaterialPageRoute(
        builder: (_) => ServiceDetailScreen(
          serviceName: args?['serviceName'] ?? 'Service',
          serviceIcon: args?['serviceIcon'] ?? Icons.room_service,
        ),
      );
    }

    // Handle regular routes
    final builder = _routes[routeName];
    if (builder != null) {
      return MaterialPageRoute(builder: builder);
    }

    // Default route for undefined routes
    return MaterialPageRoute(
      builder: (_) => Scaffold(
        body: Center(child: Text('No route defined for $routeName')),
      ),
    );
  }

  // Navigation helper methods
  static void navigateToHome(BuildContext context) {
    Navigator.pushNamedAndRemoveUntil(context, home, (route) => false);
  }

  static void navigateToLogin(BuildContext context) {
    Navigator.pushNamedAndRemoveUntil(context, login, (route) => false);
  }

  static void navigateToServiceDetail(
    BuildContext context, {
    required String serviceName,
    required IconData serviceIcon,
  }) {
    Navigator.pushNamed(
      context,
      serviceDetail,
      arguments: {'serviceName': serviceName, 'serviceIcon': serviceIcon},
    );
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

// Route configuration for GoRouter (alternative modern approach)
/*
import 'package:go_router/go_router.dart';

final GoRouter appRouter = GoRouter(
  initialLocation: AppRoutes.splash,
  routes: [
    GoRoute(
      path: AppRoutes.splash,
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: AppRoutes.onboarding,
      builder: (context, state) => const OnboardingScreen(),
    ),
    GoRoute(
      path: AppRoutes.login,
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: AppRoutes.register,
      builder: (context, state) => const RegisterScreen(),
    ),
    GoRoute(
      path: AppRoutes.home,
      builder: (context, state) => const HomeScreen(),
    ),
    GoRoute(
      path: AppRoutes.services,
      builder: (context, state) => const ServicesScreen(),
    ),
    GoRoute(
      path: AppRoutes.serviceDetail,
      builder: (context, state) {
        final extra = state.extra as Map<String, dynamic>?;
        return ServiceDetailScreen(
          serviceName: extra?['serviceName'] ?? 'Service',
          serviceIcon: extra?['serviceIcon'] ?? Icons.room_service,
        );
      },
    ),
    GoRoute(
      path: AppRoutes.profile,
      builder: (context, state) => const ProfileScreen(),
    ),
    GoRoute(
      path: AppRoutes.notifications,
      builder: (context, state) => const NotificationsScreen(),
    ),
    GoRoute(
      path: AppRoutes.payment,
      builder: (context, state) => const PaymentScreen(),
    ),
    GoRoute(
      path: AppRoutes.complaint,
      builder: (context, state) => const ComplaintScreen(),
    ),
    GoRoute(
      path: AppRoutes.trackComplaint,
      builder: (context, state) => const TrackComplaintScreen(),
    ),
    GoRoute(
      path: AppRoutes.documents,
      builder: (context, state) => const DocumentsScreen(),
    ),
    GoRoute(
      path: AppRoutes.settings,
      builder: (context, state) => const SettingsScreen(),
    ),
    GoRoute(
      path: AppRoutes.help,
      builder: (context, state) => const HelpScreen(),
    ),
    GoRoute(
      path: AppRoutes.about,
      builder: (context, state) => const AboutScreen(),
    ),
  ],
);
*/
