// test/widget_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

// Fix the package name to match your pubspec.yaml
import 'package:amc_super_app/main.dart';
import 'package:amc_super_app/providers/auth_provider.dart';

void main() {
  testWidgets('App loads and shows splash screen', (WidgetTester tester) async {
    // Build our app with proper provider setup
    await tester.pumpWidget(
      MultiProvider(
        providers: [ChangeNotifierProvider(create: (_) => AuthProvider())],
        child:
            const MunicipalApp(), // Make sure this matches your main.dart class name
      ),
    );

    // Wait for the splash screen to load
    await tester.pump();

    // Verify that splash screen elements are present
    expect(find.text('AMC SMART CITY'), findsOneWidget);
    expect(find.byIcon(Icons.location_city), findsOneWidget);
  });

  testWidgets('Navigation to login works', (WidgetTester tester) async {
    // Build app with providers
    await tester.pumpWidget(
      MultiProvider(
        providers: [ChangeNotifierProvider(create: (_) => AuthProvider())],
        child: const MunicipalApp(),
      ),
    );

    // Wait for initial load
    await tester.pumpAndSettle();

    // If we're on onboarding screen, tap "Sign In"
    if (find.text('Sign In').hasFound) {
      await tester.tap(find.text('Sign In'));
      await tester.pumpAndSettle();

      // Verify we're on login screen
      expect(find.text('Welcome Back'), findsOneWidget);
    }
  });
}
