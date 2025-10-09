// lib/services/auth_service.dart
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../models/auth_response.dart';
import '../models/user_model.dart';
import '../models/api_response.dart';
import '../models/activity_model.dart';
import '../utils/auth_token.dart';
import 'http_service.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  final HttpService _httpService = HttpService();
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  // Storage keys
  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _userDataKey = 'user_data';
  static const String _isLoggedInKey = 'is_logged_in';

  // Current user data
  User? _currentUser;
  String? _accessToken;
  String? _refreshToken;

  // Getters
  User? get currentUser => _currentUser;
  String? get accessToken => _accessToken;
  bool get isLoggedIn => _currentUser != null && _accessToken != null;

  // ✅ STATIC method to get token (for ComplaintService)
  static Future<String?> getToken() async {
    try {
      // Try AuthToken utility first (shared with ComplaintService)
      final token = await AuthToken.get();
      if (token != null) return token;

      // Fallback to secure storage
      const storage = FlutterSecureStorage(
        aOptions: AndroidOptions(encryptedSharedPreferences: true),
        iOptions: IOSOptions(
          accessibility: KeychainAccessibility.first_unlock_this_device,
        ),
      );
      return await storage.read(key: _accessTokenKey);
    } catch (e) {
      print('❌ AuthService.getToken: Error - $e');
      return null;
    }
  }

  // Initialize auth service
  Future<void> initialize() async {
    await _loadStoredAuth();
  }

  // Citizen Registration (Register only - NO auto-login)
  Future<ApiResponse<Map<String, dynamic>>> registerCitizenOnly({
    required String name,
    required String email,
    required String mobileNumber,
    required String password,
    required String ward,
    String? dateOfBirth,
    String? gender,
    Map<String, String>? address,
  }) async {
    try {
      final Map<String, dynamic> requestData = {
        'name': name,
        'email': email,
        'mobileNumber': mobileNumber,
        'password': password,
        'ward': ward,
        'registrationType': 'citizen',
        'platform': 'flutter',
        if (dateOfBirth != null) 'dateOfBirth': dateOfBirth,
        if (gender != null) 'gender': gender,
        if (address != null) 'address': address,
      };

      final response = await _httpService.post<Map<String, dynamic>>(
        ApiConfig.register,
        body: requestData,
        fromJson: (json) => json as Map<String, dynamic>,
      );

      print('📝 AuthService: Registration response - ${response.status}');
      return response;
    } catch (e) {
      print('❌ AuthService: Registration error - $e');
      return ApiResponse<Map<String, dynamic>>(
        status: 'error',
        message: 'Registration failed: ${e.toString()}',
        code: 'REGISTRATION_ERROR',
      );
    }
  }

  // Citizen Login with dual token storage
  Future<ApiResponse<AuthData>> login({
    required String identifier,
    required String password,
  }) async {
    try {
      print('🔄 AuthService: Initiating login request');

      final Map<String, dynamic> requestData = {
        'identifier': identifier,
        'password': password,
        'platform': 'flutter',
      };

      final response = await _httpService.post<AuthData>(
        ApiConfig.login,
        body: requestData,
        fromJson: (json) {
          if (json is Map<String, dynamic>) {
            return AuthData.fromJson(json);
          } else {
            throw Exception('Invalid response data format');
          }
        },
      );

      if (response.isSuccess && response.data != null) {
        print('✅ AuthService: Login successful');

        // Store auth data in secure storage
        await _storeAuthData(response.data!);

        // ✅ ALSO save access token to AuthToken utility (for ComplaintService)
        final token = response.data!.tokens.accessToken;
        await AuthToken.save(token);
        print('💾 AuthService: Token saved to AuthToken utility');
      } else {
        print('❌ AuthService: Login failed - ${response.message}');
      }

      return response;
    } catch (e) {
      print('💥 AuthService: Login exception - $e');
      return ApiResponse<AuthData>(
        status: 'error',
        message: 'Login failed: ${e.toString()}',
        code: 'LOGIN_ERROR',
      );
    }
  }

  // Refresh token logic
  Future<ApiResponse<TokenData>> refreshAuthToken() async {
    try {
      if (_refreshToken == null) {
        throw Exception('No refresh token available');
      }

      print('🔄 AuthService: Refreshing access token');

      final response = await _httpService.post<TokenData>(
        ApiConfig.refreshToken,
        body: {'refreshToken': _refreshToken},
        fromJson: (json) {
          if (json is Map<String, dynamic>) {
            final tokensData = json['tokens'];
            if (tokensData != null && tokensData is Map<String, dynamic>) {
              return TokenData.fromJson(tokensData);
            } else {
              throw Exception('Invalid tokens data format');
            }
          } else {
            throw Exception('Invalid response format');
          }
        },
      );

      if (response.isSuccess && response.data != null) {
        await _updateTokens(response.data!);

        // ✅ Update AuthToken utility as well
        await AuthToken.save(response.data!.accessToken);
        print('✅ AuthService: Tokens refreshed successfully');
      }

      return response;
    } catch (e) {
      print('❌ AuthService: Token refresh failed - $e');
      return ApiResponse<TokenData>(
        status: 'error',
        message: 'Token refresh failed: ${e.toString()}',
        code: 'TOKEN_REFRESH_ERROR',
      );
    }
  }

  // Get User Profile
  Future<ApiResponse<User>> getUserProfile() async {
    try {
      if (_accessToken == null) {
        throw Exception('No access token available');
      }

      final response = await _httpService.get<User>(
        ApiConfig.profile,
        headers: ApiConfig.getAuthHeaders(_accessToken!),
        fromJson: (json) {
          if (json is Map<String, dynamic>) {
            final userData = json['user'];
            if (userData != null && userData is Map<String, dynamic>) {
              return User.fromJson(userData);
            } else {
              throw Exception('Invalid user data format');
            }
          } else {
            throw Exception('Invalid response format');
          }
        },
      );

      if (response.isSuccess && response.data != null) {
        _currentUser = response.data;
        await _storeUserData(_currentUser!);
        print('✅ AuthService: Profile fetched successfully');
      }

      return response;
    } catch (e) {
      print('❌ AuthService: Profile fetch failed - $e');
      return ApiResponse<User>(
        status: 'error',
        message: 'Failed to get profile: ${e.toString()}',
        code: 'PROFILE_ERROR',
      );
    }
  }

  // Get Recent Activities
  Future<ApiResponse<List<Activity>>> getRecentActivities() async {
    try {
      if (_accessToken == null) {
        throw Exception('No access token available');
      }

      final response = await _httpService.get<List<Activity>>(
        '${ApiConfig.baseUrl}/user-management/users/activities',
        headers: ApiConfig.getAuthHeaders(_accessToken!),
        fromJson: (json) {
          if (json is List) {
            return json
                .map((item) => Activity.fromJson(item as Map<String, dynamic>))
                .toList();
          } else {
            throw Exception('Invalid activities data format');
          }
        },
      );

      return response;
    } catch (e) {
      return ApiResponse<List<Activity>>(
        status: 'error',
        message: 'Failed to get activities: ${e.toString()}',
        code: 'ACTIVITIES_ERROR',
      );
    }
  }

  // Get Notification Count
  Future<ApiResponse<int>> getNotificationCount() async {
    try {
      if (_accessToken == null) {
        throw Exception('No access token available');
      }

      final response = await _httpService.get<int>(
        '${ApiConfig.baseUrl}/notification/count',
        headers: ApiConfig.getAuthHeaders(_accessToken!),
        fromJson: (json) {
          if (json is Map<String, dynamic>) {
            return json['count'] as int? ?? 0;
          } else {
            return 0;
          }
        },
      );

      return response;
    } catch (e) {
      return ApiResponse<int>(
        status: 'error',
        message: 'Failed to get notification count: ${e.toString()}',
        code: 'NOTIFICATION_COUNT_ERROR',
      );
    }
  }

  // Logout method - clear all stored tokens
  Future<void> logout() async {
    try {
      if (_accessToken != null) {
        print('🔄 AuthService: Logging out user');
        await _httpService.post(
          ApiConfig.logout,
          headers: ApiConfig.getAuthHeaders(_accessToken!),
        );
      }
    } catch (e) {
      print('⚠️ AuthService: Logout API call failed - $e');
      // Continue logout even if API call fails
    } finally {
      await _clearAuthData();

      // ✅ Also clear AuthToken utility
      await AuthToken.clear();
      print('🗑️ AuthService: All auth data cleared');
    }
  }

  // Store auth data after login
  Future<void> _storeAuthData(AuthData authData) async {
    _currentUser = authData.user;
    _accessToken = authData.tokens.accessToken;
    _refreshToken = authData.tokens.refreshToken;

    await _secureStorage.write(key: _accessTokenKey, value: _accessToken);
    await _secureStorage.write(key: _refreshTokenKey, value: _refreshToken);

    await _storeUserData(_currentUser!);

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_isLoggedInKey, true);

    print('💾 AuthService: Auth data stored in secure storage');
  }

  // Update only tokens
  Future<void> _updateTokens(TokenData tokenData) async {
    _accessToken = tokenData.accessToken;
    _refreshToken = tokenData.refreshToken;

    await _secureStorage.write(key: _accessTokenKey, value: _accessToken);
    await _secureStorage.write(key: _refreshTokenKey, value: _refreshToken);
  }

  // Store user data
  Future<void> _storeUserData(User user) async {
    final userJson = json.encode(user.toJson());
    await _secureStorage.write(key: _userDataKey, value: userJson);
  }

  // Load all stored authentication info
  Future<void> _loadStoredAuth() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final isLoggedIn = prefs.getBool(_isLoggedInKey) ?? false;

      if (!isLoggedIn) {
        print('ℹ️ AuthService: No stored auth data found');
        return;
      }

      _accessToken = await _secureStorage.read(key: _accessTokenKey);
      _refreshToken = await _secureStorage.read(key: _refreshTokenKey);

      final userDataJson = await _secureStorage.read(key: _userDataKey);
      if (userDataJson != null) {
        final userMap = json.decode(userDataJson) as Map<String, dynamic>;
        _currentUser = User.fromJson(userMap);
      }

      if (_accessToken == null || _currentUser == null) {
        print('⚠️ AuthService: Incomplete auth data, clearing storage');
        await _clearAuthData();
      } else {
        // ✅ Sync token to AuthToken utility on app startup
        await AuthToken.save(_accessToken!);
        print('✅ AuthService: Auth data loaded successfully');
      }
    } catch (e) {
      print('❌ AuthService: Error loading auth data - $e');
      await _clearAuthData();
    }
  }

  // Clear all auth data
  Future<void> _clearAuthData() async {
    _currentUser = null;
    _accessToken = null;
    _refreshToken = null;

    await _secureStorage.delete(key: _accessTokenKey);
    await _secureStorage.delete(key: _refreshTokenKey);
    await _secureStorage.delete(key: _userDataKey);

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_isLoggedInKey, false);

    print('🗑️ AuthService: Secure storage cleared');
  }

  // Token refresh logic placeholder
  bool needsTokenRefresh() {
    // Implement JWT expiry check if needed
    return false;
  }

  // Helper for API headers
  Map<String, String> getAuthHeaders() {
    if (_accessToken == null) {
      throw Exception('No access token available');
    }
    return ApiConfig.getAuthHeaders(_accessToken!);
  }
}

// ✅ Extension for List.mapIndexed
extension ListExtensions<T> on List<T> {
  Iterable<E> mapIndexed<E>(E Function(int index, T item) transform) sync* {
    for (var i = 0; i < length; i++) {
      yield transform(i, this[i]);
    }
  }
}
