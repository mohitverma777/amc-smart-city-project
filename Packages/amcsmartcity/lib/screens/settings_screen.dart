import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:amc_super_app/l10n/app_localizations.dart';

import '../utils/colors.dart';
import '../providers/settings_provider.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.settings), centerTitle: true),
      body: Consumer<SettingsProvider>(
        builder: (context, settings, child) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Account Settings
                _buildSectionTitle(context, l10n.account),
                _buildSettingsTile(
                  context,
                  l10n.personalInformation,
                  l10n.updateProfileDetails,
                  Icons.person,
                  () {},
                ),
                _buildSettingsTile(
                  context,
                  l10n.changePassword,
                  l10n.updateAccountPassword,
                  Icons.lock,
                  () {},
                ),
                _buildSettingsTile(
                  context,
                  l10n.linkedAccounts,
                  l10n.manageConnectedServices,
                  Icons.link,
                  () {},
                ),

                const SizedBox(height: 24),

                // Notifications
                _buildSectionTitle(context, l10n.notifications),
                _buildSwitchTile(
                  context,
                  l10n.pushNotifications,
                  l10n.receiveAppNotifications,
                  Icons.notifications,
                  settings.notificationsEnabled,
                  (value) => settings.toggleNotifications(value),
                ),
                _buildSwitchTile(
                  context,
                  l10n.emailNotifications,
                  l10n.receiveUpdatesViaEmail,
                  Icons.email,
                  settings.emailNotifications,
                  (value) => settings.toggleEmailNotifications(value),
                ),
                _buildSwitchTile(
                  context,
                  l10n.smsNotifications,
                  l10n.receiveUpdatesViaSms,
                  Icons.sms,
                  settings.smsNotifications,
                  (value) => settings.toggleSmsNotifications(value),
                ),

                const SizedBox(height: 24),

                // Security
                _buildSectionTitle(context, l10n.security),
                _buildSwitchTile(
                  context,
                  l10n.biometricLogin,
                  l10n.useFingerprintOrFaceId,
                  Icons.fingerprint,
                  settings.biometricLogin,
                  (value) => settings.toggleBiometricLogin(value),
                ),
                _buildSettingsTile(
                  context,
                  l10n.twoFactorAuthentication,
                  l10n.addExtraSecurity,
                  Icons.security,
                  () {},
                ),

                const SizedBox(height: 24),

                // Preferences
                _buildSectionTitle(context, l10n.preferences),
                // ✅ Language dropdown - Keep values in English
                _buildDropdownTile(
                  context,
                  l10n.language,
                  l10n.selectAppLanguage,
                  Icons.language,
                  settings.selectedLanguage,
                  ['English', 'Hindi', 'Gujarati'], // English values
                  (value) => settings.setLanguage(value!),
                ),
                // ✅ Theme dropdown - Keep values in English
                _buildDropdownTile(
                  context,
                  l10n.theme,
                  l10n.chooseAppAppearance,
                  Icons.palette,
                  settings.selectedTheme,
                  ['Light', 'Dark', 'System'], // English values
                  (value) => settings.setTheme(value!),
                ),

                const SizedBox(height: 24),

                // Support
                _buildSectionTitle(context, l10n.supportAndInfo),
                _buildSettingsTile(
                  context,
                  l10n.helpCenter,
                  l10n.getHelpAndSupport,
                  Icons.help,
                  () {},
                ),
                _buildSettingsTile(
                  context,
                  l10n.contactUs,
                  l10n.reachOutToSupport,
                  Icons.contact_support,
                  () {},
                ),
                _buildSettingsTile(
                  context,
                  l10n.privacyPolicy,
                  l10n.readPrivacyPolicy,
                  Icons.privacy_tip,
                  () {},
                ),
                _buildSettingsTile(
                  context,
                  l10n.termsOfService,
                  l10n.readTermsAndConditions,
                  Icons.description,
                  () {},
                ),

                const SizedBox(height: 24),

                // App Info
                _buildSectionTitle(context, l10n.appInformation),
                _buildSettingsTile(
                  context,
                  l10n.appVersion,
                  'v1.0.0 (Build 100)',
                  Icons.info,
                  null,
                  showTrailing: false,
                ),
                _buildSettingsTile(
                  context,
                  l10n.rateApp,
                  l10n.rateUsOnAppStore,
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
                      const Icon(
                        Icons.warning,
                        color: AppColors.error,
                        size: 32,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        l10n.dangerZone,
                        style: const TextStyle(
                          color: AppColors.error,
                          fontWeight: FontWeight.w600,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        l10n.theseActionsCannotBeUndone,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.error.withOpacity(0.8),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () =>
                                  _showDeleteAccountDialog(context, l10n),
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: AppColors.error),
                                foregroundColor: AppColors.error,
                              ),
                              child: Text(l10n.deleteAccount),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSectionTitle(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: Theme.of(
          context,
        ).textTheme.headlineSmall?.copyWith(fontSize: 18),
      ),
    );
  }

  Widget _buildSettingsTile(
    BuildContext context,
    String title,
    String subtitle,
    IconData icon,
    VoidCallback? onTap, {
    bool showTrailing = true,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: isDark
                ? Colors.white.withOpacity(0.1)
                : AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            icon,
            color: isDark ? Colors.white : AppColors.primary,
            size: 20,
          ),
        ),
        title: Text(title, style: Theme.of(context).textTheme.bodyLarge),
        subtitle: Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
        trailing: showTrailing
            ? Icon(
                Icons.arrow_forward_ios,
                color: Theme.of(context).textTheme.bodySmall?.color,
                size: 16,
              )
            : null,
        onTap: onTap,
      ),
    );
  }

  Widget _buildSwitchTile(
    BuildContext context,
    String title,
    String subtitle,
    IconData icon,
    bool value,
    ValueChanged<bool> onChanged,
  ) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: isDark
                ? Colors.white.withOpacity(0.1)
                : AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            icon,
            color: isDark ? Colors.white : AppColors.primary,
            size: 20,
          ),
        ),
        title: Text(title, style: Theme.of(context).textTheme.bodyLarge),
        subtitle: Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
        trailing: Switch(
          value: value,
          onChanged: onChanged,
          activeColor: AppColors.accent,
        ),
      ),
    );
  }

  Widget _buildDropdownTile(
    BuildContext context,
    String title,
    String subtitle,
    IconData icon,
    String value,
    List<String> options,
    ValueChanged<String?> onChanged,
  ) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: isDark
                ? Colors.white.withOpacity(0.1)
                : AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            icon,
            color: isDark ? Colors.white : AppColors.primary,
            size: 20,
          ),
        ),
        title: Text(title, style: Theme.of(context).textTheme.bodyLarge),
        subtitle: Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
        trailing: DropdownButton<String>(
          value: value,
          onChanged: onChanged,
          dropdownColor: isDark ? AppColors.surface : Colors.white,
          style: Theme.of(context).textTheme.bodyMedium,
          underline: Container(),
          items: options.map((option) {
            return DropdownMenuItem(value: option, child: Text(option));
          }).toList(),
        ),
      ),
    );
  }

  void _showDeleteAccountDialog(BuildContext context, AppLocalizations l10n) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Theme.of(context).brightness == Brightness.dark
            ? AppColors.surface
            : Colors.white,
        title: Text(
          l10n.deleteAccount,
          style: const TextStyle(color: AppColors.error),
        ),
        content: Text(
          l10n.thisActionCannotBeUndone,
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              l10n.cancel,
              style: TextStyle(
                color: Theme.of(context).textTheme.bodyMedium?.color,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Handle account deletion
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: Text(l10n.delete),
          ),
        ],
      ),
    );
  }
}
