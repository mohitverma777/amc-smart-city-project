// lib/main.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'screens/splash_screen.dart';
import 'utils/colors.dart';
import 'utils/routes.dart';

void main() {
  runApp(const MunicipalApp());
}

class MunicipalApp extends StatelessWidget {
  const MunicipalApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ahmedabad Municipal Corporation',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primarySwatch: MaterialColor(0xFF002B5B, AppColors.primarySwatch),
        scaffoldBackgroundColor: AppColors.primary,
        appBarTheme: const AppBarTheme(
          backgroundColor: AppColors.primary,
          elevation: 0,
          systemOverlayStyle: SystemUiOverlayStyle.light,
          iconTheme: IconThemeData(color: Colors.white),
          titleTextStyle: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        textTheme: const TextTheme(
          headlineLarge: TextStyle(
            color: Colors.white,
            fontSize: 28,
            fontWeight: FontWeight.bold,
          ),
          headlineMedium: TextStyle(
            color: Colors.white,
            fontSize: 22,
            fontWeight: FontWeight.w600,
          ),
          headlineSmall: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
          bodyLarge: TextStyle(color: Colors.white, fontSize: 16),
          bodyMedium: TextStyle(color: Colors.white, fontSize: 14),
          bodySmall: TextStyle(color: Colors.white, fontSize: 12),
          labelLarge: TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.white,
            foregroundColor: AppColors.primary,
            elevation: 2,
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
      ),
      home: const SplashScreen(),
      onGenerateRoute: AppRoutes.generateRoute,
    );
  }
}
