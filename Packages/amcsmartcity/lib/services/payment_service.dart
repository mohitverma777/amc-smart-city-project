import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/environment.dart';

class PaymentService {
  static String get baseUrl =>
      '${Environment.paymentServiceUrl}/api/payment-management/payments';

  static Future<Map<String, dynamic>> getCitizenBills(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/bills'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return {'success': true, 'data': json.decode(response.body)};
      } else {
        return {'success': false, 'message': 'Failed to fetch bills'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: $e'};
    }
  }

  static Future<Map<String, dynamic>> processPayment({
    required List<String> billIds,
    required double totalAmount,
    required String token,
    String paymentMethod = 'Online',
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/pay'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'billIds': billIds,
          'totalAmount': totalAmount,
          'paymentMethod': paymentMethod,
        }),
      );

      if (response.statusCode == 200) {
        return {'success': true, 'data': json.decode(response.body)};
      } else {
        return {
          'success': false,
          'message': json.decode(response.body)['message'] ?? 'Payment failed',
        };
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: $e'};
    }
  }

  static Future<Map<String, dynamic>> getPaymentHistory(
    String token, {
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/history?page=$page&limit=$limit'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return {'success': true, 'data': json.decode(response.body)};
      } else {
        return {'success': false, 'message': 'Failed to fetch payment history'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: $e'};
    }
  }

  static Future<Map<String, dynamic>> getPendingPayments(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/pending'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return {'success': true, 'data': json.decode(response.body)};
      } else {
        return {
          'success': false,
          'message': 'Failed to fetch pending payments',
        };
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: $e'};
    }
  }

  static Future<Map<String, dynamic>> generateSampleBills(String token) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/generate-sample-bills'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return {'success': true, 'data': json.decode(response.body)};
      } else {
        return {'success': false, 'message': 'Failed to generate sample bills'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: $e'};
    }
  }
}
