// lib/screens/home_screen.dart
import 'package:flutter/material.dart';
import '../utils/colors.dart';
import '../utils/routes.dart';
import '../widgets/service_card.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const DashboardTab(),
    const ServicesTab(),
    const NotificationsTab(),
    const ProfileTab(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.location_city,
                size: 20,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'AMC SMART CITY Municipal',
                  style: Theme.of(
                    context,
                  ).textTheme.headlineSmall?.copyWith(fontSize: 16),
                ),
                Text(
                  'Corporation',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white70,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              // Handle search
            },
          ),
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined),
                onPressed: () =>
                    Navigator.pushNamed(context, AppRoutes.notifications),
              ),
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: AppColors.error,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        backgroundColor: AppColors.primary,
        selectedItemColor: Colors.white,
        unselectedItemColor: Colors.white54,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.room_service),
            label: 'Services',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.notifications),
            label: 'Alerts',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}

// Dashboard Tab
class DashboardTab extends StatelessWidget {
  const DashboardTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Welcome Card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
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
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const CircleAvatar(
                      radius: 20,
                      backgroundColor: Colors.white,
                      child: Icon(Icons.person, color: AppColors.primary),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Good Morning',
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(color: Colors.white70),
                        ),
                        Text(
                          'John Doe',
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  'Welcome to your digital municipal services hub',
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(color: Colors.white70),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          Text(
            'Quick Actions',
            style: Theme.of(context).textTheme.headlineSmall,
          ),

          const SizedBox(height: 16),

          // Quick Actions Grid
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: 1.3,
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
            children: [
              ServiceCard(
                title: 'Pay Bills',
                icon: Icons.payment,
                onTap: () => Navigator.pushNamed(context, AppRoutes.payment),
              ),
              ServiceCard(
                title: 'File Complaint',
                icon: Icons.report_problem,
                onTap: () => Navigator.pushNamed(context, AppRoutes.complaint),
              ),
              ServiceCard(
                title: 'Track Request',
                icon: Icons.track_changes,
                onTap: () =>
                    Navigator.pushNamed(context, AppRoutes.trackComplaint),
              ),
              ServiceCard(
                title: 'Documents',
                icon: Icons.folder,
                onTap: () => Navigator.pushNamed(context, AppRoutes.documents),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Recent Activities
          Text(
            'Recent Activities',
            style: Theme.of(context).textTheme.headlineSmall,
          ),

          const SizedBox(height: 16),

          _buildActivityItem(
            context,
            'Property Tax Payment',
            'Completed successfully',
            Icons.check_circle,
            AppColors.success,
            '2 hours ago',
          ),
          _buildActivityItem(
            context,
            'Water Bill Due',
            'Due in 3 days',
            Icons.schedule,
            AppColors.warning,
            'Yesterday',
          ),
          _buildActivityItem(
            context,
            'Complaint Filed',
            'Under review',
            Icons.pending,
            AppColors.info,
            '3 days ago',
          ),
        ],
      ),
    );
  }

  Widget _buildActivityItem(
    BuildContext context,
    String title,
    String subtitle,
    IconData icon,
    Color iconColor,
    String time,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(
                    context,
                  ).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: Colors.white70),
                ),
              ],
            ),
          ),
          Text(
            time,
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: Colors.white54),
          ),
        ],
      ),
    );
  }
}

// Services Tab
class ServicesTab extends StatelessWidget {
  const ServicesTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Search Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withOpacity(0.2)),
            ),
            child: const TextField(
              style: TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Search services...',
                hintStyle: TextStyle(color: Colors.white54),
                border: InputBorder.none,
                prefixIcon: Icon(Icons.search, color: Colors.white54),
              ),
            ),
          ),

          const SizedBox(height: 24),

          // Service Categories
          _buildServiceCategory(context, 'Payments & Bills', [
            {'name': 'Property Tax', 'icon': Icons.home},
            {'name': 'Water Bill', 'icon': Icons.water_drop},
            {'name': 'Electricity Bill', 'icon': Icons.electric_bolt},
            {'name': 'Waste Management', 'icon': Icons.delete},
          ]),

          _buildServiceCategory(context, 'Certificates & Documents', [
            {'name': 'Birth Certificate', 'icon': Icons.child_care},
            {
              'name': 'Death Certificate',
              'icon': Icons.sentiment_very_dissatisfied,
            },
            {'name': 'Marriage Certificate', 'icon': Icons.favorite},
            {'name': 'Property Papers', 'icon': Icons.description},
          ]),

          _buildServiceCategory(context, 'Licenses & Permits', [
            {'name': 'Trade License', 'icon': Icons.business},
            {'name': 'Building Permit', 'icon': Icons.construction},
            {'name': 'NOC Certificate', 'icon': Icons.verified},
            {'name': 'Health License', 'icon': Icons.health_and_safety},
          ]),
        ],
      ),
    );
  }

  Widget _buildServiceCategory(
    BuildContext context,
    String categoryName,
    List<Map<String, dynamic>> services,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(categoryName, style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 16),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 1.3,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
          ),
          itemCount: services.length,
          itemBuilder: (context, index) {
            final service = services[index];
            return ServiceCard(
              title: service['name'],
              icon: service['icon'],
              onTap: () => Navigator.pushNamed(
                context,
                AppRoutes.serviceDetail,
                arguments: {
                  'serviceName': service['name'],
                  'serviceIcon': service['icon'],
                },
              ),
            );
          },
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}

// Notifications Tab
class NotificationsTab extends StatelessWidget {
  const NotificationsTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Notifications',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 16),

          _buildNotificationItem(
            context,
            'Payment Reminder',
            'Your water bill is due in 3 days',
            Icons.water_drop,
            AppColors.info,
            '2 hours ago',
            false,
          ),
          _buildNotificationItem(
            context,
            'Complaint Update',
            'Your complaint #12345 has been resolved',
            Icons.check_circle,
            AppColors.success,
            '1 day ago',
            true,
          ),
          _buildNotificationItem(
            context,
            'New Service Available',
            'Online property tax payment is now available',
            Icons.new_releases,
            AppColors.accent,
            '2 days ago',
            true,
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationItem(
    BuildContext context,
    String title,
    String message,
    IconData icon,
    Color iconColor,
    String time,
    bool isRead,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isRead
            ? Colors.white.withOpacity(0.03)
            : Colors.white.withOpacity(0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isRead
              ? Colors.white.withOpacity(0.1)
              : Colors.white.withOpacity(0.2),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          fontWeight: isRead
                              ? FontWeight.w400
                              : FontWeight.w600,
                        ),
                      ),
                    ),
                    if (!isRead)
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: AppColors.accent,
                          shape: BoxShape.circle,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  message,
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: Colors.white70),
                ),
                const SizedBox(height: 8),
                Text(
                  time,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white54,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// Profile Tab
class ProfileTab extends StatelessWidget {
  const ProfileTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
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
                const CircleAvatar(
                  radius: 50,
                  backgroundColor: Colors.white,
                  child: Icon(Icons.person, size: 50, color: AppColors.primary),
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
              ],
            ),
          ),

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
}
