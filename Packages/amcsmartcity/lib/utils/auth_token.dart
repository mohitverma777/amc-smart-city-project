// lib/utils/auth_token.dart
import 'package:shared_preferences/shared_preferences.dart';

class AuthToken {
  static const String _tokenKey = 'auth_token';

  /// Save token to local storage
  static Future<void> save(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    print('✅ Token saved: ${token.substring(0, 20)}...');
  }

  /// Retrieve token from local storage
  static Future<String?> get() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);
    print(
      '🔑 Retrieved token: ${token != null ? "${token.substring(0, 20)}..." : "null"}',
    );
    return token;
  }

  /// Check if user is logged in
  static Future<bool> isLoggedIn() async {
    final token = await get();
    return token != null && token.isNotEmpty;
  }

  /// Clear token (logout)
  static Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    print('🗑️ Token cleared');
  }
}
