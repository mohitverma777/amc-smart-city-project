// lib/screens/profile_screen.dart
import 'package:flutter/material.dart';
import '../utils/colors.dart';
import '../utils/routes.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        centerTitle: true,
        actions: [
          IconButton(
            onPressed: () {
              // Edit profile
            },
            icon: const Icon(Icons.edit),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Profile Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.white.withOpacity(0.15),
                    Colors.white.withOpacity(0.05),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withOpacity(0.2)),
              ),
              child: Column(
                children: [
                  Stack(
                    children: [
                      const CircleAvatar(
                        radius: 50,
                        backgroundColor: Colors.white,
                        child: Icon(
                          Icons.person,
                          size: 50,
                          color: AppColors.primary,
                        ),
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.camera_alt,
                            size: 16,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'John Doe',
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                  Text(
                    'john.doe@email.com',
                    style: Theme.of(
                      context,
                    ).textTheme.bodyMedium?.copyWith(color: Colors.white70),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '+91 98765 43210',
                    style: Theme.of(
                      context,
                    ).textTheme.bodySmall?.copyWith(color: Colors.white70),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton.icon(
                    onPressed: () {
                      // Edit profile
                    },
                    icon: const Icon(Icons.edit, size: 16),
                    label: const Text('Edit Profile'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white.withOpacity(0.2),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Profile Information
            _buildInfoSection(context, 'Personal Information', [
              {'label': 'Full Name', 'value': 'John Doe', 'icon': Icons.person},
              {
                'label': 'Email',
                'value': 'john.doe@email.com',
                'icon': Icons.email,
              },
              {
                'label': 'Phone',
                'value': '+91 98765 43210',
                'icon': Icons.phone,
              },
              {
                'label': 'Address',
                'value': '123 Main Street, AMC SMART CITY - 380001',
                'icon': Icons.location_on,
              },
            ]),

            const SizedBox(height: 24),

            // Account Statistics
            _buildStatsSection(context),

            const SizedBox(height: 24),

            // Menu Items
            _buildMenuItem(
              context,
              'My Documents',
              Icons.folder,
              () => Navigator.pushNamed(context, AppRoutes.documents),
            ),
            _buildMenuItem(
              context,
              'Payment History',
              Icons.payment,
              () => Navigator.pushNamed(context, AppRoutes.payment),
            ),
            _buildMenuItem(
              context,
              'Track Complaints',
              Icons.track_changes,
              () => Navigator.pushNamed(context, AppRoutes.trackComplaint),
            ),
            _buildMenuItem(
              context,
              'Notifications',
              Icons.notifications,
              () => Navigator.pushNamed(context, AppRoutes.notifications),
            ),
            _buildMenuItem(
              context,
              'Settings',
              Icons.settings,
              () => Navigator.pushNamed(context, AppRoutes.settings),
            ),
            _buildMenuItem(
              context,
              'Help & Support',
              Icons.help,
              () => Navigator.pushNamed(context, AppRoutes.help),
            ),
            _buildMenuItem(
              context,
              'About',
              Icons.info,
              () => Navigator.pushNamed(context, AppRoutes.about),
            ),

            const SizedBox(height: 32),

            // Logout Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _showLogoutDialog(context),
                icon: const Icon(Icons.logout),
                label: const Text('Logout'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.error.withOpacity(0.8),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoSection(
    BuildContext context,
    String title,
    List<Map<String, dynamic>> items,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 16),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white.withOpacity(0.1)),
          ),
          child: Column(
            children: items.map((item) {
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Row(
                  children: [
                    Icon(item['icon'], color: Colors.white70, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item['label'],
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(color: Colors.white54),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            item['value'],
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(fontWeight: FontWeight.w500),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildStatsSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Account Statistics',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                context,
                'Total Payments',
                '12',
                Icons.payment,
                AppColors.success,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                context,
                'Active Complaints',
                '2',
                Icons.report_problem,
                AppColors.warning,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                context,
                'Documents',
                '8',
                Icons.folder,
                AppColors.info,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                context,
                'Services Used',
                '5',
                Icons.room_service,
                AppColors.accent,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatCard(
    BuildContext context,
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 20),
              const Spacer(),
              Text(
                value,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: color,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: Colors.white70),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem(
    BuildContext context,
    String title,
    IconData icon,
    VoidCallback onTap,
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
        title: Text(title, style: Theme.of(context).textTheme.bodyLarge),
        trailing: const Icon(
          Icons.arrow_forward_ios,
          color: Colors.white54,
          size: 16,
        ),
        onTap: onTap,
      ),
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Logout', style: TextStyle(color: Colors.white)),
        content: const Text(
          'Are you sure you want to logout?',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              'Cancel',
              style: TextStyle(color: Colors.white70),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pushNamedAndRemoveUntil(
                context,
                AppRoutes.login,
                (route) => false,
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }
}
