// lib/screens/home_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../utils/colors.dart';
import '../utils/routes.dart';
import '../widgets/service_card.dart';
import '../providers/auth_provider.dart';
import '../services/auth_service.dart';
import '../services/complaint_service.dart';
import '../models/user_model.dart';
import '../models/activity_model.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  int _notificationCount = 0;
  final AuthService _authService = AuthService();

  @override
  void initState() {
    super.initState();
    _loadNotificationCount();
  }

  Future<void> _loadNotificationCount() async {
    final response = await _authService.getNotificationCount();
    if (response.isSuccess && mounted) {
      setState(() {
        _notificationCount = response.data ?? 0;
      });
    }
  }

  List<Widget> get _screens {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    return [
      DashboardTab(user: authProvider.user),
      const ServicesTab(),
      const NotificationsTab(),
      ProfileTab(user: authProvider.user),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
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
                Expanded(
                  child: Column(
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
                ),
              ],
            ),
            actions: [
              IconButton(icon: const Icon(Icons.search), onPressed: () {}),
              Stack(
                children: [
                  IconButton(
                    icon: const Icon(Icons.notifications_outlined),
                    onPressed: () =>
                        Navigator.pushNamed(context, AppRoutes.notifications),
                  ),
                  if (_notificationCount > 0)
                    Positioned(
                      right: 8,
                      top: 8,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: AppColors.error,
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 16,
                          minHeight: 16,
                        ),
                        child: Text(
                          _notificationCount > 9 ? '9+' : '$_notificationCount',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
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
              BottomNavigationBarItem(
                icon: Icon(Icons.person),
                label: 'Profile',
              ),
            ],
          ),
        );
      },
    );
  }
}

// Dynamic Dashboard Tab
class DashboardTab extends StatefulWidget {
  final User? user;

  const DashboardTab({Key? key, this.user}) : super(key: key);

  @override
  State<DashboardTab> createState() => _DashboardTabState();
}

class _DashboardTabState extends State<DashboardTab> {
  final AuthService _authService = AuthService();
  final ComplaintService _complaintService = ComplaintService();
  List<Activity> _activities = [];
  List<dynamic> _complaints = [];
  bool _isLoading = true;
  bool _isLoadingComplaints = true;

  IconData _getActivityIcon(String type) {
    switch (type) {
      case 'payment':
        return Icons.payment;
      case 'complaint':
        return Icons.report_problem;
      case 'document':
        return Icons.folder;
      case 'request':
        return Icons.track_changes;
      default:
        return Icons.info;
    }
  }

  Color _getActivityColor(String status) {
    switch (status) {
      case 'success':
        return AppColors.success;
      case 'error':
        return AppColors.error;
      case 'info':
        return AppColors.info;
      case 'pending':
        return AppColors.accent;
      default:
        return Colors.white;
    }
  }

  @override
  void initState() {
    super.initState();
    _loadActivities();
    _loadComplaints();
  }

  Future<void> _loadActivities() async {
    setState(() => _isLoading = true);
    final response = await _authService.getRecentActivities();
    if (response.isSuccess && mounted) {
      setState(() {
        _activities = response.data ?? [];
        _isLoading = false;
      });
    } else {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadComplaints() async {
    setState(() => _isLoadingComplaints = true);
    try {
      // Get token first
      final token = await AuthService.getToken();
      if (token == null) {
        setState(() => _isLoadingComplaints = false);
        return;
      }

      // Pass token as the required argument
      final response = await _complaintService.getMyComplaints(token);

      if (response['success'] == true && mounted) {
        final respData = response['data'] as Map<String, dynamic>;
        final inner = respData['data'] as Map<String, dynamic>;
        setState(() {
          _complaints = (inner['complaints'] as List<dynamic>?) ?? [];
          _isLoadingComplaints = false;
        });
      } else {
        setState(() => _isLoadingComplaints = false);
      }
    } catch (e) {
      print('Error loading complaints: $e');
      if (mounted) {
        setState(() => _isLoadingComplaints = false);
      }
    }
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  @override
  Widget build(BuildContext context) {
    final userName = widget.user?.name ?? 'Guest User';
    final userInitial = userName.isNotEmpty ? userName[0].toUpperCase() : 'G';

    return RefreshIndicator(
      onRefresh: () async {
        await _loadActivities();
        await _loadComplaints();
      },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
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
                      CircleAvatar(
                        radius: 25,
                        backgroundColor: Colors.white,
                        child: Text(
                          userInitial,
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _getGreeting(),
                              style: Theme.of(context).textTheme.bodyMedium
                                  ?.copyWith(color: Colors.white70),
                            ),
                            Text(
                              userName,
                              style: Theme.of(context).textTheme.headlineSmall,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
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

            // Quick Actions
            Text(
              'Quick Actions',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 16),
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
                  onTap: () =>
                      Navigator.pushNamed(context, AppRoutes.complaint),
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
                  onTap: () =>
                      Navigator.pushNamed(context, AppRoutes.documents),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Recent Complaints
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Recent Complaints',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                if (_isLoadingComplaints)
                  const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            if (_complaints.isEmpty && !_isLoadingComplaints)
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white.withOpacity(0.1)),
                ),
                child: Center(
                  child: Text(
                    'No recent complaints',
                    style: Theme.of(
                      context,
                    ).textTheme.bodyMedium?.copyWith(color: Colors.white70),
                  ),
                ),
              )
            else
              ..._complaints.map((complaint) {
                final id = complaint['complaintNumber'] ?? complaint['id'];
                final title = complaint['title'] ?? 'No Title';
                final status = complaint['status'] ?? '';
                return GestureDetector(
                  onTap: () {
                    Navigator.pushNamed(
                      context,
                      AppRoutes.trackComplaint,
                    ).then((_) {
                      // Optional: could auto-fill the search field with the id
                    });
                  },
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white.withOpacity(0.1)),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.description, color: AppColors.info),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                title,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'ID: $id',
                                style: const TextStyle(color: Colors.white70),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.accent.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            status,
                            style: TextStyle(
                              color: AppColors.accent,
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Icon(
                          Icons.arrow_forward_ios,
                          color: Colors.white54,
                          size: 14,
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),

            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Recent Activities',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                if (_isLoading)
                  const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            if (_activities.isEmpty && !_isLoading)
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white.withOpacity(0.1)),
                ),
                child: Center(
                  child: Column(
                    children: [
                      Icon(
                        Icons.inbox,
                        size: 48,
                        color: Colors.white.withOpacity(0.3),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'No recent activities',
                        style: Theme.of(
                          context,
                        ).textTheme.bodyMedium?.copyWith(color: Colors.white70),
                      ),
                    ],
                  ),
                ),
              )
            else
              ..._activities.map(
                (activity) => _buildActivityItem(
                  context,
                  activity.title,
                  activity.description,
                  _getActivityIcon(activity.type),
                  _getActivityColor(activity.status),
                  activity.timeAgo,
                ),
              ),
          ],
        ),
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

// Dynamic Profile Tab
class ProfileTab extends StatelessWidget {
  final User? user;

  const ProfileTab({Key? key, this.user}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final userName = user?.name ?? 'Guest User';
    final userEmail = user?.email ?? 'guest@example.com';
    final userPhone = user?.mobileNumber ?? 'Not provided';
    final userInitial = userName.isNotEmpty ? userName[0].toUpperCase() : 'G';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
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
                CircleAvatar(
                  radius: 50,
                  backgroundColor: Colors.white,
                  child: Text(
                    userInitial,
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontSize: 40,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  userName,
                  style: Theme.of(context).textTheme.headlineMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  userEmail,
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(color: Colors.white70),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  userPhone,
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: Colors.white70),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
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
          const SizedBox(height: 16),
          _buildMenuItem(context, 'Logout', Icons.logout, () async {
            final authProvider = Provider.of<AuthProvider>(
              context,
              listen: false,
            );
            await authProvider.logout();
            if (context.mounted) {
              AppRoutes.navigateToLogin(context);
            }
          }),
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

// ServicesTab
class ServicesTab extends StatelessWidget {
  const ServicesTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
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

// NotificationsTab
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
