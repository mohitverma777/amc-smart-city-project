// lib/config/api_config.dart
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class ApiConfig {
  // Dynamic base URL based on platform
  static String get baseUrl {
    if (kIsWeb) {
      // For Flutter Web
      return 'http://localhost:3000/api';
    } else if (Platform.isAndroid) {
      // For Android Emulator
      return 'http://10.189.201.38:3000/api';
    } else if (Platform.isIOS) {
      // For iOS Simulator
      return 'http://localhost:3000/api';
    } else {
      // Default fallback
      return 'http://localhost:3000/api';
    }
  }

  static String get wsUrl {
    if (kIsWeb) {
      return 'ws://localhost:3000/ws';
    } else if (Platform.isAndroid) {
      return 'ws://10.189.201.38:3000/ws';
    } else {
      return 'ws://localhost:3000/ws';
    }
  }

  // Service endpoints
  static const String userManagementBase = '/user-management';
  static const String grievanceBase = '/grievance';
  static const String propertyTaxBase = '/property-tax';
  static const String paymentBase = '/payment';
  static const String notificationBase = '/notification';

  // Auth endpoints
  static String get register => '$baseUrl$userManagementBase/auth/register';
  static String get login => '$baseUrl$userManagementBase/auth/login';
  static String get refreshToken =>
      '$baseUrl$userManagementBase/auth/refresh-token';
  static String get logout => '$baseUrl$userManagementBase/auth/logout';
  static String get profile => '$baseUrl$userManagementBase/users/profile';

  // Request timeout
  static const Duration timeout = Duration(seconds: 30);

  // Headers with platform detection
  static Map<String, String> get headers {
    Map<String, String> baseHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (kIsWeb) {
      baseHeaders.addAll({
        'User-Agent': 'Flutter-Web/AMC-CitizenApp/1.0.0',
        'Platform': 'flutter-web',
      });
    } else {
      baseHeaders.addAll({
        'User-Agent': 'Flutter/AMC-CitizenApp/1.0.0',
        'Platform': 'flutter',
      });
    }

    return baseHeaders;
  }

  static Map<String, String> getAuthHeaders(String token) => {
    ...headers,
    'Authorization': 'Bearer $token',
  };
}
