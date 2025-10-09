import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/api_response.dart';
import '../config/api_config.dart';

class ApiService {
  static String get baseUrl => ApiConfig.baseUrl;

  static const int timeoutSeconds = 30;

  // HTTP client with timeout
  static final http.Client _client = http.Client();

  // Get authentication token
  static Future<String?> _getAuthToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('accessToken');
  }

  // Get common headers
  static Future<Map<String, String>> _getHeaders() async {
    final token = await _getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // Get multipart headers for file uploads
  static Future<Map<String, String>> _getMultipartHeaders() async {
    final token = await _getAuthToken();
    return {
      'Accept': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // Handle HTTP response
  static ApiResponse<T> _handleResponse<T>(
    http.Response response,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    print('��� API Response: ${response.statusCode} ${response.request?.url}');
    print('��� Response body: ${response.body}');

    try {
      final Map<String, dynamic> responseData = json.decode(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResponse.fromJson(
          responseData,
          (data) => fromJson(data as Map<String, dynamic>),
        );
      } else {
        return ApiResponse<T>(
          status: 'error',
          message: responseData['message'] ?? 'Request failed',
          data: null,
          errors: responseData['errors']?.cast<String>(),
          code: responseData['code'],
        );
      }
    } catch (e) {
      print('❌ JSON parsing error: $e');
      return ApiResponse<T>(
        status: 'error',
        message: 'Failed to parse server response',
        data: null,
      );
    }
  }

  // Handle network errors
  static ApiResponse<T> _handleError<T>(dynamic error) {
    print('❌ API Error: $error');

    if (error is SocketException) {
      return ApiResponse<T>(
        status: 'error',
        message: 'No internet connection. Please check your network.',
        data: null,
      );
    } else if (error is http.ClientException) {
      return ApiResponse<T>(
        status: 'error',
        message: 'Network error. Please try again.',
        data: null,
      );
    } else {
      return ApiResponse<T>(
        status: 'error',
        message: 'An unexpected error occurred: ${error.toString()}',
        data: null,
      );
    }
  }

  // GET request
  static Future<ApiResponse<T>> get<T>(
    String endpoint,
    T Function(Map<String, dynamic>) fromJson, {
    Map<String, String>? queryParameters,
  }) async {
    try {
      print('��� GET Request: $baseUrl$endpoint');
      if (queryParameters != null) {
        print('��� Query params: $queryParameters');
      }

      final Uri uri = Uri.parse(
        '$baseUrl$endpoint',
      ).replace(queryParameters: queryParameters);

      final headers = await _getHeaders();
      print('�� Request headers: ${headers.keys.join(', ')}');

      final response = await _client
          .get(uri, headers: headers)
          .timeout(Duration(seconds: timeoutSeconds));

      return _handleResponse<T>(response, fromJson);
    } catch (e) {
      return _handleError<T>(e);
    }
  }

  // POST request
  static Future<ApiResponse<T>> post<T>(
    String endpoint,
    Map<String, dynamic> data,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    try {
      print('��� POST Request: $baseUrl$endpoint');
      print('��� Request data: ${json.encode(data)}');

      final Uri uri = Uri.parse('$baseUrl$endpoint');
      final headers = await _getHeaders();
      final body = json.encode(data);

      final response = await _client
          .post(uri, headers: headers, body: body)
          .timeout(Duration(seconds: timeoutSeconds));

      return _handleResponse<T>(response, fromJson);
    } catch (e) {
      return _handleError<T>(e);
    }
  }

  // POST request with file upload
  static Future<ApiResponse<T>> postMultipart<T>(
    String endpoint,
    Map<String, dynamic> fields,
    T Function(Map<String, dynamic>) fromJson, {
    List<File>? files,
    String fileFieldName = 'attachments',
  }) async {
    try {
      print('��� POST Multipart Request: $baseUrl$endpoint');
      print('��� Fields: $fields');
      if (files != null) {
        print('��� Files: ${files.map((f) => f.path).join(', ')}');
      }

      final Uri uri = Uri.parse('$baseUrl$endpoint');
      final headers = await _getMultipartHeaders();

      final request = http.MultipartRequest('POST', uri);
      request.headers.addAll(headers);

      // Add text fields
      fields.forEach((key, value) {
        if (value != null) {
          request.fields[key] = value.toString();
        }
      });

      // Add files
      if (files != null) {
        for (final file in files) {
          final multipartFile = await http.MultipartFile.fromPath(
            fileFieldName,
            file.path,
          );
          request.files.add(multipartFile);
        }
      }

      final streamedResponse = await request.send().timeout(
        Duration(
          seconds: timeoutSeconds * 2,
        ), // Longer timeout for file uploads
      );

      final response = await http.Response.fromStream(streamedResponse);

      return _handleResponse<T>(response, fromJson);
    } catch (e) {
      return _handleError<T>(e);
    }
  }

  // PUT request
  static Future<ApiResponse<T>> put<T>(
    String endpoint,
    Map<String, dynamic> data,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    try {
      print('��� PUT Request: $baseUrl$endpoint');
      print('��� Request data: ${json.encode(data)}');

      final Uri uri = Uri.parse('$baseUrl$endpoint');
      final headers = await _getHeaders();
      final body = json.encode(data);

      final response = await _client
          .put(uri, headers: headers, body: body)
          .timeout(Duration(seconds: timeoutSeconds));

      return _handleResponse<T>(response, fromJson);
    } catch (e) {
      return _handleError<T>(e);
    }
  }

  // PATCH request
  static Future<ApiResponse<T>> patch<T>(
    String endpoint,
    Map<String, dynamic> data,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    try {
      print('��� PATCH Request: $baseUrl$endpoint');
      print('��� Request data: ${json.encode(data)}');

      final Uri uri = Uri.parse('$baseUrl$endpoint');
      final headers = await _getHeaders();
      final body = json.encode(data);

      final response = await _client
          .patch(uri, headers: headers, body: body)
          .timeout(Duration(seconds: timeoutSeconds));

      return _handleResponse<T>(response, fromJson);
    } catch (e) {
      return _handleError<T>(e);
    }
  }

  // DELETE request
  static Future<ApiResponse<T>> delete<T>(
    String endpoint,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    try {
      print('��� DELETE Request: $baseUrl$endpoint');

      final Uri uri = Uri.parse('$baseUrl$endpoint');
      final headers = await _getHeaders();

      final response = await _client
          .delete(uri, headers: headers)
          .timeout(Duration(seconds: timeoutSeconds));

      return _handleResponse<T>(response, fromJson);
    } catch (e) {
      return _handleError<T>(e);
    }
  }

  // Dispose client
  static void dispose() {
    _client.close();
  }
}
