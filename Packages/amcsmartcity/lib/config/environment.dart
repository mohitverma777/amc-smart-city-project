import 'package:flutter_dotenv/flutter_dotenv.dart';

class Environment {
  static String get apiBaseUrl => dotenv.env['API_BASE_URL']!;
  static String get userServiceUrl => dotenv.env['USER_SERVICE_URL']!;
  static String get grievanceServiceUrl => dotenv.env['GRIEVANCE_SERVICE_URL']!;
  static String get propertyTaxServiceUrl =>
      dotenv.env['PROPERTY_TAX_SERVICE_URL']!;
  static String get waterServiceUrl => dotenv.env['WATER_SERVICE_URL']!;
  static String get wasteServiceUrl => dotenv.env['WASTE_SERVICE_URL']!;
  static String get paymentServiceUrl => dotenv.env['PAYMENT_SERVICE_URL']!;
  static String get notificationServiceUrl =>
      dotenv.env['NOTIFICATION_SERVICE_URL']!;
  static String get complaintServiceUrl => dotenv.env['COMPLAINT_SERVICE_URL']!;
  static String get analyticsServiceUrl => dotenv.env['ANALYTICS_SERVICE_URL']!;
  static String get electricityServiceUrl =>
      dotenv.env['ELECTRICITY_SERVICE_URL']!;

  // Optional: common timeout
  static const Duration timeout = Duration(seconds: 30);
}
