import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsProvider extends ChangeNotifier {
  static const String _languageKey = 'selected_language';
  static const String _themeKey = 'selected_theme';
  static const String _notificationsKey = 'notifications_enabled';
  static const String _emailNotificationsKey = 'email_notifications';
  static const String _smsNotificationsKey = 'sms_notifications';
  static const String _biometricLoginKey = 'biometric_login';

  Locale _locale = const Locale('en');
  ThemeMode _themeMode = ThemeMode.dark;
  bool _notificationsEnabled = true;
  bool _emailNotifications = true;
  bool _smsNotifications = false;
  bool _biometricLogin = false;

  // Getters
  Locale get locale => _locale;
  ThemeMode get themeMode => _themeMode;
  bool get notificationsEnabled => _notificationsEnabled;
  bool get emailNotifications => _emailNotifications;
  bool get smsNotifications => _smsNotifications;
  bool get biometricLogin => _biometricLogin;

  String get selectedLanguage {
    switch (_locale.languageCode) {
      case 'hi':
        return 'Hindi';
      case 'gu':
        return 'Gujarati';
      default:
        return 'English';
    }
  }

  String get selectedTheme {
    switch (_themeMode) {
      case ThemeMode.light:
        return 'Light';
      case ThemeMode.dark:
        return 'Dark';
      default:
        return 'System';
    }
  }

  // Initialize settings from SharedPreferences
  Future<void> loadSettings() async {
    final prefs = await SharedPreferences.getInstance();

    // Load language
    final languageCode = prefs.getString(_languageKey) ?? 'en';
    _locale = Locale(languageCode);

    // Load theme
    final themeName = prefs.getString(_themeKey) ?? 'dark';
    switch (themeName) {
      case 'light':
        _themeMode = ThemeMode.light;
        break;
      case 'dark':
        _themeMode = ThemeMode.dark;
        break;
      default:
        _themeMode = ThemeMode.system;
        break;
    }

    // Load other settings
    _notificationsEnabled = prefs.getBool(_notificationsKey) ?? true;
    _emailNotifications = prefs.getBool(_emailNotificationsKey) ?? true;
    _smsNotifications = prefs.getBool(_smsNotificationsKey) ?? false;
    _biometricLogin = prefs.getBool(_biometricLoginKey) ?? false;

    notifyListeners();
  }

  // Change language
  Future<void> setLanguage(String language) async {
    final prefs = await SharedPreferences.getInstance();

    String languageCode;
    switch (language) {
      case 'Hindi':
        languageCode = 'hi';
        break;
      case 'Gujarati':
        languageCode = 'gu';
        break;
      default:
        languageCode = 'en';
        break;
    }

    _locale = Locale(languageCode);
    await prefs.setString(_languageKey, languageCode);
    notifyListeners();
  }

  // Change theme
  Future<void> setTheme(String theme) async {
    final prefs = await SharedPreferences.getInstance();

    switch (theme) {
      case 'Light':
        _themeMode = ThemeMode.light;
        break;
      case 'Dark':
        _themeMode = ThemeMode.dark;
        break;
      default:
        _themeMode = ThemeMode.system;
        break;
    }

    await prefs.setString(_themeKey, theme.toLowerCase());
    notifyListeners();
  }

  // Toggle notifications
  Future<void> toggleNotifications(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    _notificationsEnabled = enabled;
    await prefs.setBool(_notificationsKey, enabled);
    notifyListeners();
  }

  Future<void> toggleEmailNotifications(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    _emailNotifications = enabled;
    await prefs.setBool(_emailNotificationsKey, enabled);
    notifyListeners();
  }

  Future<void> toggleSmsNotifications(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    _smsNotifications = enabled;
    await prefs.setBool(_smsNotificationsKey, enabled);
    notifyListeners();
  }

  Future<void> toggleBiometricLogin(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    _biometricLogin = enabled;
    await prefs.setBool(_biometricLoginKey, enabled);
    notifyListeners();
  }
}
