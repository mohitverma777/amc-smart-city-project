// lib/services/http_service.dart
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../models/api_response.dart';
import '../config/api_config.dart';

class HttpService {
  static final HttpService _instance = HttpService._internal();
  factory HttpService() => _instance;
  HttpService._internal();

  Future<ApiResponse<T>> post<T>(
    String url, {
    Map<String, dynamic>? body,
    Map<String, String>? headers,
    T Function(Object? json)? fromJson,
  }) async {
    try {
      print('🔄 POST Request to: $url');
      print('📤 Request body: ${body != null ? jsonEncode(body) : 'null'}');
      print('📤 Request headers: $headers');

      final response = await http
          .post(
            Uri.parse(url),
            headers: headers ?? ApiConfig.headers,
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(ApiConfig.timeout);

      print('📨 Response status: ${response.statusCode}');
      print('📨 Response headers: ${response.headers}');
      print('📨 Response body: ${response.body}');

      // Parse JSON response
      Map<String, dynamic> jsonResponse;
      try {
        jsonResponse = jsonDecode(response.body) as Map<String, dynamic>;
      } catch (e) {
        print('💥 JSON Parse Error: $e');
        return ApiResponse<T>(
          status: 'error',
          message: 'Failed to parse server response: Invalid JSON format',
          code: 'JSON_PARSE_ERROR',
        );
      }

      // Handle successful responses
      if (response.statusCode >= 200 && response.statusCode < 300) {
        print('✅ Request successful');

        // If no fromJson provided, return raw data
        if (fromJson == null) {
          return ApiResponse<T>(
            status: jsonResponse['status'] ?? 'success',
            message: jsonResponse['message'] ?? 'Success',
            data: jsonResponse['data'] as T?,
          );
        }

        // Parse data using provided fromJson function
        try {
          final parsedData = fromJson(jsonResponse['data']);
          return ApiResponse<T>(
            status: jsonResponse['status'] ?? 'success',
            message: jsonResponse['message'] ?? 'Success',
            data: parsedData,
          );
        } catch (e) {
          print('💥 Data parsing error: $e');
          print('💥 Raw data: ${jsonResponse['data']}');
          return ApiResponse<T>(
            status: 'error',
            message: 'Failed to parse response data: ${e.toString()}',
            code: 'DATA_PARSE_ERROR',
          );
        }
      } else {
        // Handle error responses
        print('❌ Request failed with status: ${response.statusCode}');
        return ApiResponse<T>(
          status: jsonResponse['status'] ?? 'error',
          message: jsonResponse['message'] ?? 'Request failed',
          errors: jsonResponse['errors']?.cast<String>(),
          code: jsonResponse['code'] ?? 'HTTP_ERROR',
        );
      }
    } on SocketException {
      print('💥 Network error: No internet connection');
      return ApiResponse<T>(
        status: 'error',
        message: 'No internet connection. Please check your network.',
        code: 'NETWORK_ERROR',
      );
    } on http.ClientException catch (e) {
      print('💥 Client error: $e');
      return ApiResponse<T>(
        status: 'error',
        message: 'Network request failed: ${e.toString()}',
        code: 'CLIENT_ERROR',
      );
    } catch (e) {
      print('💥 Unexpected error: $e');
      return ApiResponse<T>(
        status: 'error',
        message: 'An unexpected error occurred: ${e.toString()}',
        code: 'UNEXPECTED_ERROR',
      );
    }
  }

  Future<ApiResponse<T>> get<T>(
    String url, {
    Map<String, String>? headers,
    T Function(Object? json)? fromJson,
  }) async {
    try {
      print('🔄 GET Request to: $url');
      print('📤 Request headers: $headers');

      final response = await http
          .get(Uri.parse(url), headers: headers ?? ApiConfig.headers)
          .timeout(ApiConfig.timeout);

      print('📨 Response status: ${response.statusCode}');
      print('📨 Response body: ${response.body}');

      // Parse JSON response
      Map<String, dynamic> jsonResponse;
      try {
        jsonResponse = jsonDecode(response.body) as Map<String, dynamic>;
      } catch (e) {
        print('💥 JSON Parse Error: $e');
        return ApiResponse<T>(
          status: 'error',
          message: 'Failed to parse server response: Invalid JSON format',
          code: 'JSON_PARSE_ERROR',
        );
      }

      // Handle successful responses
      if (response.statusCode >= 200 && response.statusCode < 300) {
        print('✅ Request successful');

        // If no fromJson provided, return raw data
        if (fromJson == null) {
          return ApiResponse<T>(
            status: jsonResponse['status'] ?? 'success',
            message: jsonResponse['message'] ?? 'Success',
            data: jsonResponse['data'] as T?,
          );
        }

        // Parse data using provided fromJson function
        try {
          final parsedData = fromJson(jsonResponse['data']);
          return ApiResponse<T>(
            status: jsonResponse['status'] ?? 'success',
            message: jsonResponse['message'] ?? 'Success',
            data: parsedData,
          );
        } catch (e) {
          print('💥 Data parsing error: $e');
          return ApiResponse<T>(
            status: 'error',
            message: 'Failed to parse response data: ${e.toString()}',
            code: 'DATA_PARSE_ERROR',
          );
        }
      } else {
        // Handle error responses
        print('❌ Request failed with status: ${response.statusCode}');
        return ApiResponse<T>(
          status: jsonResponse['status'] ?? 'error',
          message: jsonResponse['message'] ?? 'Request failed',
          errors: jsonResponse['errors']?.cast<String>(),
          code: jsonResponse['code'] ?? 'HTTP_ERROR',
        );
      }
    } on SocketException {
      return ApiResponse<T>(
        status: 'error',
        message: 'No internet connection. Please check your network.',
        code: 'NETWORK_ERROR',
      );
    } on http.ClientException catch (e) {
      return ApiResponse<T>(
        status: 'error',
        message: 'Network request failed: ${e.toString()}',
        code: 'CLIENT_ERROR',
      );
    } catch (e) {
      print('💥 Unexpected error: $e');
      return ApiResponse<T>(
        status: 'error',
        message: 'An unexpected error occurred: ${e.toString()}',
        code: 'UNEXPECTED_ERROR',
      );
    }
  }
}
