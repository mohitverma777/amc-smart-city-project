// lib/screens/settings_screen.dart
import 'package:flutter/material.dart';
import '../utils/colors.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notificationsEnabled = true;
  bool _emailNotifications = true;
  bool _smsNotifications = false;
  bool _biometricLogin = false;
  String _selectedLanguage = 'English';
  String _selectedTheme = 'Dark';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Account Settings
            _buildSectionTitle('Account'),
            _buildSettingsTile(
              'Personal Information',
              'Update your profile details',
              Icons.person,
              () {},
            ),
            _buildSettingsTile(
              'Change Password',
              'Update your account password',
              Icons.lock,
              () {},
            ),
            _buildSettingsTile(
              'Linked Accounts',
              'Manage connected services',
              Icons.link,
              () {},
            ),

            const SizedBox(height: 24),

            // Notifications
            _buildSectionTitle('Notifications'),
            _buildSwitchTile(
              'Push Notifications',
              'Receive app notifications',
              Icons.notifications,
              _notificationsEnabled,
              (value) => setState(() => _notificationsEnabled = value),
            ),
            _buildSwitchTile(
              'Email Notifications',
              'Receive updates via email',
              Icons.email,
              _emailNotifications,
              (value) => setState(() => _emailNotifications = value),
            ),
            _buildSwitchTile(
              'SMS Notifications',
              'Receive updates via SMS',
              Icons.sms,
              _smsNotifications,
              (value) => setState(() => _smsNotifications = value),
            ),

            const SizedBox(height: 24),

            // Security
            _buildSectionTitle('Security'),
            _buildSwitchTile(
              'Biometric Login',
              'Use fingerprint or face ID',
              Icons.fingerprint,
              _biometricLogin,
              (value) => setState(() => _biometricLogin = value),
            ),
            _buildSettingsTile(
              'Two-Factor Authentication',
              'Add extra security to your account',
              Icons.security,
              () {},
            ),

            const SizedBox(height: 24),

            // Preferences
            _buildSectionTitle('Preferences'),
            _buildDropdownTile(
              'Language',
              'Select app language',
              Icons.language,
              _selectedLanguage,
              ['English', 'Hindi', 'Gujarati'],
              (value) => setState(() => _selectedLanguage = value!),
            ),
            _buildDropdownTile(
              'Theme',
              'Choose app appearance',
              Icons.palette,
              _selectedTheme,
              ['Light', 'Dark', 'System'],
              (value) => setState(() => _selectedTheme = value!),
            ),

            const SizedBox(height: 24),

            // Support
            _buildSectionTitle('Support & Info'),
            _buildSettingsTile(
              'Help Center',
              'Get help and support',
              Icons.help,
              () {},
            ),
            _buildSettingsTile(
              'Contact Us',
              'Reach out to our support team',
              Icons.contact_support,
              () {},
            ),
            _buildSettingsTile(
              'Privacy Policy',
              'Read our privacy policy',
              Icons.privacy_tip,
              () {},
            ),
            _buildSettingsTile(
              'Terms of Service',
              'Read terms and conditions',
              Icons.description,
              () {},
            ),

            const SizedBox(height: 24),

            // App Info
            _buildSectionTitle('App Information'),
            _buildSettingsTile(
              'App Version',
              'v1.0.0 (Build 100)',
              Icons.info,
              null,
              showTrailing: false,
            ),
            _buildSettingsTile(
              'Rate App',
              'Rate us on app store',
              Icons.star,
              () {},
            ),

            const SizedBox(height: 32),

            // Danger Zone
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.error.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.error.withOpacity(0.3)),
              ),
              child: Column(
                children: [
                  const Icon(Icons.warning, color: AppColors.error, size: 32),
                  const SizedBox(height: 12),
                  const Text(
                    'Danger Zone',
                    style: TextStyle(
                      color: AppColors.error,
                      fontWeight: FontWeight.w600,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'These actions cannot be undone',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.error.withOpacity(0.8),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => _showDeleteAccountDialog(),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: AppColors.error),
                            foregroundColor: AppColors.error,
                          ),
                          child: const Text('Delete Account'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
          fontSize: 18,
        ),
      ),
    );
  }

  Widget _buildSettingsTile(
    String title,
    String subtitle,
    IconData icon,
    VoidCallback? onTap, {
    bool showTrailing = true,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: Colors.white, size: 20),
        ),
        title: Text(
          title,
          style: Theme.of(context).textTheme.bodyLarge,
        ),
        subtitle: Text(
          subtitle,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: Colors.white70,
          ),
        ),
        trailing: showTrailing
            ? const Icon(Icons.arrow_forward_ios, color: Colors.white54, size: 16)
            : null,
        onTap: onTap,
      ),
    );
  }

  Widget _buildSwitchTile(
    String title,
    String subtitle,
    IconData icon,
    bool value,
    ValueChanged<bool> onChanged,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: Colors.white, size: 20),
        ),
        title: Text(
          title,
          style: Theme.of(context).textTheme.bodyLarge,
        ),
        subtitle: Text(
          subtitle,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: Colors.white70,
          ),
        ),
        trailing: Switch(
          value: value,
          onChanged: onChanged,
          activeColor: AppColors.accent,
        ),
      ),
    );
  }

  Widget _buildDropdownTile(
    String title,
    String subtitle,
    IconData icon,
    String value,
    List<String> options,
    ValueChanged<String?> onChanged,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: Colors.white, size: 20),
        ),
        title: Text(
          title,
          style: Theme.of(context).textTheme.bodyLarge,
        ),
        subtitle: Text(
          subtitle,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: Colors.white70,
          ),
        ),
        trailing: DropdownButton<String>(
          value: value,
          onChanged: onChanged,
          dropdownColor: AppColors.surface,
          style: const TextStyle(color: Colors.white),
          underline: Container(),
          items: options.map((option) {
            return DropdownMenuItem(
              value: option,
              child: Text(option),
            );
          }).toList(),
        ),
      ),
    );
  }

  void _showDeleteAccountDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text(
          'Delete Account',
          style: TextStyle(color: AppColors.error),
        ),
        content: const Text(
          'This action cannot be undone. All your data will be permanently deleted.',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: Colors.white70)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Handle account deletion
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}