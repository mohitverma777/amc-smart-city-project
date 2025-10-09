// lib/providers/auth_provider.dart
import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../models/auth_response.dart';
import '../models/api_response.dart';
import '../services/auth_service.dart';
import '../utils/auth_token.dart';

enum AuthStatus { initial, loading, authenticated, unauthenticated }

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();

  AuthStatus _status = AuthStatus.initial;
  User? _user;
  String? _errorMessage;

  // Getters
  AuthStatus get status => _status;
  User? get user => _user;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _status == AuthStatus.authenticated;
  bool get isLoading => _status == AuthStatus.loading;

  // Initialize provider - check for existing token
  Future<void> initialize() async {
    _status = AuthStatus.loading;
    notifyListeners();

    await _authService.initialize();

    // Check if token exists
    final token = await AuthToken.get();
    if (token != null && token.isNotEmpty && _authService.isLoggedIn) {
      _user = _authService.currentUser;
      _status = AuthStatus.authenticated;
      print('✅ AuthProvider: User already authenticated');
    } else {
      _status = AuthStatus.unauthenticated;
      print('⚠️ AuthProvider: User not authenticated');
    }

    notifyListeners();
  }

  // Citizen Registration - NO auto-login
  Future<bool> registerCitizen({
    required String name,
    required String email,
    required String mobileNumber,
    required String password,
    required String ward,
    String? dateOfBirth,
    String? gender,
    Map<String, String>? address,
  }) async {
    _status = AuthStatus.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _authService.registerCitizenOnly(
        name: name,
        email: email,
        mobileNumber: mobileNumber,
        password: password,
        ward: ward,
        dateOfBirth: dateOfBirth,
        gender: gender,
        address: address,
      );

      if (response.isSuccess) {
        _status = AuthStatus.unauthenticated;
        _errorMessage = null;
        notifyListeners();
        print('✅ AuthProvider: Registration successful - user needs to login');
        return true;
      } else {
        _status = AuthStatus.unauthenticated;
        _errorMessage = response.message;
        if (response.errors != null && response.errors!.isNotEmpty) {
          _errorMessage = response.errors!.join(', ');
        }
        notifyListeners();
        return false;
      }
    } catch (e) {
      _status = AuthStatus.unauthenticated;
      _errorMessage = 'Registration failed: ${e.toString()}';
      notifyListeners();
      return false;
    }
  }

  // Citizen Login with Token Saving
  Future<bool> login({
    required String identifier,
    required String password,
  }) async {
    _status = AuthStatus.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      print('🔄 AuthProvider: Starting login process');

      final response = await _authService.login(
        identifier: identifier,
        password: password,
      );

      print('📨 AuthProvider: Login response - Status: ${response.status}');

      if (response.isSuccess && response.data != null) {
        print('✅ AuthProvider: Login successful');

        _user = response.data!.user;

        // ✅ FIX: Access token via tokens.accessToken, not token
        final token = response.data!.tokens.accessToken;
        if (token.isNotEmpty) {
          await AuthToken.save(token);
          print('💾 AuthProvider: Token saved successfully');
        } else {
          print('⚠️ AuthProvider: Warning - No token received from server');
        }

        _status = AuthStatus.authenticated;
        _errorMessage = null;
        notifyListeners();
        return true;
      } else {
        print('❌ AuthProvider: Login failed - ${response.message}');
        _status = AuthStatus.unauthenticated;
        _errorMessage = response.message ?? 'Login failed';

        if (response.errors != null && response.errors!.isNotEmpty) {
          _errorMessage = response.errors!.join(', ');
        }

        notifyListeners();
        return false;
      }
    } catch (e) {
      print('💥 AuthProvider: Login exception - $e');
      _status = AuthStatus.unauthenticated;
      _errorMessage = 'An unexpected error occurred: ${e.toString()}';
      notifyListeners();
      return false;
    }
  }

  // Refresh user profile
  Future<bool> refreshProfile() async {
    try {
      final response = await _authService.getUserProfile();
      if (response.isSuccess && response.data != null) {
        _user = response.data;
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      print('⚠️ AuthProvider: Profile refresh failed - $e');
      return false;
    }
  }

  // Check if user is currently logged in
  Future<bool> checkAuthStatus() async {
    final token = await AuthToken.get();
    final isLoggedIn = token != null && token.isNotEmpty;

    if (!isLoggedIn && _status == AuthStatus.authenticated) {
      // Token missing but status says authenticated - fix state
      _status = AuthStatus.unauthenticated;
      _user = null;
      notifyListeners();
    }

    return isLoggedIn;
  }

  // Logout - Clear token and user data
  Future<void> logout() async {
    _status = AuthStatus.loading;
    notifyListeners();

    await _authService.logout();
    await AuthToken.clear();

    _status = AuthStatus.unauthenticated;
    _user = null;
    _errorMessage = null;
    notifyListeners();

    print('🔐 AuthProvider: User logged out successfully');
  }

  // Clear error message
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
