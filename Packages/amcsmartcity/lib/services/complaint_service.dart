// lib/services/complaint_service.dart
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:mime/mime.dart';
import 'package:http_parser/http_parser.dart';
import '../config/environment.dart';

class ComplaintService {
  static String get baseUrl =>
      '${Environment.complaintServiceUrl}/api/complaint-management/complaints';

  /// File a new complaint with attachments
  Future<Map<String, dynamic>> fileComplaint({
    required String title,
    required String description,
    required String address,
    required String category,
    required String priority,
    required String token,
    List<XFile>? imageFiles,
  }) async {
    try {
      print('🔄 Attempting to connect to: $baseUrl/');

      final uri = Uri.parse('$baseUrl/');
      final request = http.MultipartRequest('POST', uri);

      // Add authorization header
      request.headers['Authorization'] = 'Bearer $token';

      // Add form fields
      request.fields['title'] = title;
      request.fields['description'] = description;
      request.fields['address'] = address;
      request.fields['category'] = category;
      request.fields['priority'] = priority;

      print('📤 Sending request with ${imageFiles?.length ?? 0} files...');

      // Add images with correct MIME type
      if (imageFiles != null && imageFiles.isNotEmpty) {
        for (var xFile in imageFiles) {
          // ✅ Detect MIME type from file name/extension
          String? mimeType = lookupMimeType(xFile.name);

          // Fallback to common image types
          if (mimeType == null) {
            final ext = xFile.name.split('.').last.toLowerCase();
            if (['jpg', 'jpeg'].contains(ext)) {
              mimeType = 'image/jpeg';
            } else if (ext == 'png') {
              mimeType = 'image/png';
            } else if (ext == 'gif') {
              mimeType = 'image/gif';
            } else if (ext == 'webp') {
              mimeType = 'image/webp';
            } else {
              mimeType = 'image/jpeg'; // Default fallback
            }
          }

          print('📎 Adding file: ${xFile.name} with MIME type: $mimeType');

          final mimeTypeData = mimeType.split('/');

          if (kIsWeb) {
            // Web: Use bytes directly
            final bytes = await xFile.readAsBytes();
            request.files.add(
              http.MultipartFile.fromBytes(
                'attachments',
                bytes,
                filename: xFile.name,
                contentType: MediaType(mimeTypeData[0], mimeTypeData[1]),
              ),
            );
          } else {
            // Mobile/Desktop: Use file path
            final file = File(xFile.path);
            request.files.add(
              await http.MultipartFile.fromPath(
                'attachments',
                file.path,
                filename: xFile.name,
                contentType: MediaType(mimeTypeData[0], mimeTypeData[1]),
              ),
            );
          }
        }
      }

      final streamedResponse = await request.send();
      final responseBody = await streamedResponse.stream.bytesToString();

      print('📨 Response status: ${streamedResponse.statusCode}');
      print('📨 Response body: $responseBody');

      final responseData = json.decode(responseBody);

      return {
        'success': streamedResponse.statusCode == 201,
        'statusCode': streamedResponse.statusCode,
        'data': responseData,
      };
    } catch (e) {
      print('❌ Error: $e');
      return {
        'success': false,
        'statusCode': 500,
        'error': 'Network error: $e',
      };
    }
  }

  /// Get all available complaint categories
  Future<List<String>> getCategories() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/categories'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final categories = data['data']['categories'] as List;
        return categories.map((e) => e.toString()).toList();
      } else {
        throw Exception('Failed to load categories');
      }
    } catch (e) {
      print('⚠️ Failed to fetch categories: $e');
      // Return default categories if API fails
      return [
        'Water Supply',
        'Electricity',
        'Waste Management',
        'Road & Infrastructure',
        'Street Lighting',
        'Drainage',
        'Public Health',
        'Other',
      ];
    }
  }

  /// Get logged-in user's complaints
  Future<Map<String, dynamic>> getMyComplaints(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/my'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('📨 getMyComplaints response: ${response.statusCode}');
      print('📨 Body: ${response.body}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {'success': true, 'data': data};
      } else {
        return {'success': false, 'message': 'Failed to fetch complaints'};
      }
    } catch (e) {
      print('❌ getMyComplaints error: $e');
      return {'success': false, 'error': 'Network error: $e'};
    }
  }

  /// ✅ Get a single complaint by ID or complaint number (for tracking)
  static Future<Map<String, dynamic>> getComplaint(
    String identifier,
    String token,
  ) async {
    try {
      print('🔍 ComplaintService: Getting complaint: $identifier');

      final uri = Uri.parse('$baseUrl/$identifier');
      final response = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('📨 Response status: ${response.statusCode}');
      print('📨 Response body: ${response.body}');

      final body = json.decode(response.body) as Map<String, dynamic>;

      return {
        'success': response.statusCode == 200 && body['status'] == 'success',
        'statusCode': response.statusCode,
        'data': body['data'],
        'message': body['message'],
      };
    } catch (e) {
      print('❌ ComplaintService: Error getting complaint - $e');
      return {
        'success': false,
        'statusCode': 500,
        'error': 'Network error: $e',
        'message': 'Failed to get complaint details',
      };
    }
  }

  /// Update complaint status (Admin/Officer only)
  static Future<Map<String, dynamic>> updateComplaintStatus({
    required String complaintId,
    required String status,
    required String token,
    String? comment,
  }) async {
    try {
      print('📝 ComplaintService: Updating complaint status to: $status');

      final uri = Uri.parse('$baseUrl/$complaintId/status');
      final response = await http.patch(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'status': status,
          if (comment != null) 'comment': comment,
        }),
      );

      print('📨 Response status: ${response.statusCode}');
      print('📨 Response body: ${response.body}');

      final body = json.decode(response.body) as Map<String, dynamic>;

      return {
        'success': response.statusCode == 200 && body['status'] == 'success',
        'statusCode': response.statusCode,
        'data': body['data'],
        'message': body['message'],
      };
    } catch (e) {
      print('❌ ComplaintService: Error updating status - $e');
      return {
        'success': false,
        'statusCode': 500,
        'error': 'Network error: $e',
        'message': 'Failed to update complaint status',
      };
    }
  }

  /// Add a comment to a complaint
  static Future<Map<String, dynamic>> addComment({
    required String complaintId,
    required String comment,
    required String token,
  }) async {
    try {
      print('💬 ComplaintService: Adding comment to complaint: $complaintId');

      final uri = Uri.parse('$baseUrl/$complaintId/comments');
      final response = await http.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({'comment': comment}),
      );

      print('📨 Response status: ${response.statusCode}');
      print('📨 Response body: ${response.body}');

      final body = json.decode(response.body) as Map<String, dynamic>;

      return {
        'success': response.statusCode == 201 && body['status'] == 'success',
        'statusCode': response.statusCode,
        'data': body['data'],
        'message': body['message'],
      };
    } catch (e) {
      print('❌ ComplaintService: Error adding comment - $e');
      return {
        'success': false,
        'statusCode': 500,
        'error': 'Network error: $e',
        'message': 'Failed to add comment',
      };
    }
  }

  /// Get complaint statistics (Admin/Officer only)
  static Future<Map<String, dynamic>> getStatistics(
    String token, {
    Map<String, String>? filters,
  }) async {
    try {
      print('📊 ComplaintService: Fetching complaint statistics');

      final queryParams = filters ?? {};
      final uri = Uri.parse(
        '$baseUrl/admin/statistics',
      ).replace(queryParameters: queryParams);

      final response = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('📨 Response status: ${response.statusCode}');
      print('📨 Response body: ${response.body}');

      final body = json.decode(response.body) as Map<String, dynamic>;

      return {
        'success': response.statusCode == 200 && body['status'] == 'success',
        'statusCode': response.statusCode,
        'data': body['data'],
        'message': body['message'],
      };
    } catch (e) {
      print('❌ ComplaintService: Error fetching statistics - $e');
      return {
        'success': false,
        'statusCode': 500,
        'error': 'Network error: $e',
        'message': 'Failed to fetch complaint statistics',
      };
    }
  }
}
