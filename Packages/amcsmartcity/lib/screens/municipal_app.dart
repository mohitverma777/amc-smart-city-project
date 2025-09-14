// # AMC SMART CITY Municipal Corporation Mobile App

// ## Main App Structure

// ```dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

void main() {
  runApp(const MunicipalApp());
}

class MunicipalApp extends StatelessWidget {
  const MunicipalApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AMC SMART CITY Municipal Corporation',
      theme: ThemeData(
        primarySwatch: MaterialColor(0xFF002B5B, {
          50: const Color(0xFFE3E7F0),
          100: const Color(0xFFB8C4DA),
          200: const Color(0xFF889DC2),
          300: const Color(0xFF5876AA),
          400: const Color(0xFF335998),
          500: const Color(0xFF002B5B),
          600: const Color(0xFF002653),
          700: const Color(0xFF002149),
          800: const Color(0xFF001C3F),
          900: const Color(0xFF00122D),
        }),
        scaffoldBackgroundColor: const Color(0xFF002B5B),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF002B5B),
          elevation: 0,
          systemOverlayStyle: SystemUiOverlayStyle.light,
        ),
        textTheme: const TextTheme(
          headlineLarge: TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
          headlineMedium: TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.w600,
          ),
          bodyLarge: TextStyle(color: Colors.white, fontSize: 16),
          bodyMedium: TextStyle(color: Colors.white, fontSize: 14),
          labelLarge: TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
      home: const SplashScreen(),
      routes: {
        '/home': (context) => const HomeScreen(),
        '/services': (context) => const ServicesScreen(),
        '/profile': (context) => const ProfileScreen(),
      },
    );
  }
}

// Splash Screen
class SplashScreen extends StatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(seconds: 3),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeIn),
    );

    _animationController.forward();
    _navigateToHome();
  }

  _navigateToHome() async {
    await Future.delayed(const Duration(seconds: 4));
    if (mounted) {
      Navigator.pushReplacementNamed(context, '/home');
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(color: Color(0xFF002B5B)),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            FadeTransition(
              opacity: _fadeAnimation,
              child: Column(
                children: [
                  // Logo placeholder
                  Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 10,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.location_city,
                      size: 60,
                      color: Color(0xFF002B5B),
                    ),
                  ),
                  const SizedBox(height: 32),
                  Text(
                    'AMC SMART CITY',
                    style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 2.0,
                    ),
                  ),
                  Text(
                    'MUNICIPAL CORPORATION',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontSize: 16,
                      letterSpacing: 1.5,
                      fontWeight: FontWeight.w300,
                    ),
                  ),
                  const SizedBox(height: 48),
                  const CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Home Screen
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
                color: Color(0xFF002B5B),
              ),
            ),
            const SizedBox(width: 12),
            Text(
              'AMC SMART CITY Municipal',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined, color: Colors.white),
            onPressed: () {
              // Handle notifications
            },
          ),
          IconButton(
            icon: const Icon(Icons.search, color: Colors.white),
            onPressed: () {
              // Handle search
            },
          ),
        ],
      ),
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        backgroundColor: const Color(0xFF002B5B),
        selectedItemColor: Colors.white,
        unselectedItemColor: Colors.white54,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.room_service),
            label: 'Services',
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
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withOpacity(0.2)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Welcome to',
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
                Text(
                  'Your City Services',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  'Access municipal services at your fingertips',
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(color: Colors.white70),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          Text(
            'Quick Services',
            style: Theme.of(context).textTheme.headlineMedium,
          ),

          const SizedBox(height: 16),

          // Service Grid
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: 1.2,
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
            children: [
              _buildServiceCard(
                context,
                'Property Tax',
                Icons.home,
                () => Navigator.pushNamed(context, '/services'),
              ),
              _buildServiceCard(
                context,
                'Water Bill',
                Icons.water_drop,
                () => Navigator.pushNamed(context, '/services'),
              ),
              _buildServiceCard(
                context,
                'Complaints',
                Icons.report_problem,
                () => Navigator.pushNamed(context, '/services'),
              ),
              _buildServiceCard(
                context,
                'Birth Certificate',
                Icons.child_care,
                () => Navigator.pushNamed(context, '/services'),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Recent Activities
          Text(
            'Recent Activities',
            style: Theme.of(context).textTheme.headlineMedium,
          ),

          const SizedBox(height: 16),

          _buildActivityItem(
            context,
            'Property Tax Payment',
            'Completed on ${DateTime.now().day}/${DateTime.now().month}',
            Icons.check_circle,
            Colors.green,
          ),
          _buildActivityItem(
            context,
            'Water Bill Due',
            'Due in 5 days',
            Icons.schedule,
            Colors.orange,
          ),
          _buildActivityItem(
            context,
            'Complaint Filed',
            'Under review',
            Icons.pending,
            Colors.blue,
          ),
        ],
      ),
    );
  }

  Widget _buildServiceCard(
    BuildContext context,
    String title,
    IconData icon,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withOpacity(0.2)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 32, color: Colors.white),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w500),
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
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Row(
        children: [
          Icon(icon, color: iconColor, size: 24),
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
                  ).textTheme.bodyMedium?.copyWith(color: Colors.white70),
                ),
              ],
            ),
          ),
          const Icon(Icons.arrow_forward_ios, color: Colors.white54, size: 16),
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
          Text(
            'All Services',
            style: Theme.of(context).textTheme.headlineMedium,
          ),

          const SizedBox(height: 16),

          // Search Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(25),
              border: Border.all(color: Colors.white.withOpacity(0.2)),
            ),
            child: TextField(
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                hintText: 'Search services...',
                hintStyle: TextStyle(color: Colors.white54),
                border: InputBorder.none,
                icon: Icon(Icons.search, color: Colors.white54),
              ),
            ),
          ),

          const SizedBox(height: 24),

          // Service Categories
          _buildServiceCategory(context, 'Tax & Bills', [
            ServiceItem('Property Tax', Icons.home),
            ServiceItem('Water Bill', Icons.water_drop),
            ServiceItem('Electricity Bill', Icons.electric_bolt),
          ]),

          _buildServiceCategory(context, 'Certificates', [
            ServiceItem('Birth Certificate', Icons.child_care),
            ServiceItem('Death Certificate', Icons.sentiment_very_dissatisfied),
            ServiceItem('Marriage Certificate', Icons.favorite),
          ]),

          _buildServiceCategory(context, 'Complaints & Support', [
            ServiceItem('File Complaint', Icons.report_problem),
            ServiceItem('Track Complaint', Icons.track_changes),
            ServiceItem('Emergency Services', Icons.emergency),
          ]),

          _buildServiceCategory(context, 'Licenses & Permits', [
            ServiceItem('Trade License', Icons.business),
            ServiceItem('Building Permit', Icons.construction),
            ServiceItem('No Objection Certificate', Icons.verified),
          ]),
        ],
      ),
    );
  }

  Widget _buildServiceCategory(
    BuildContext context,
    String categoryName,
    List<ServiceItem> services,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          categoryName,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 12),
        ...services.map(
          (service) =>
              _buildServiceListItem(context, service.name, service.icon),
        ),
        const SizedBox(height: 20),
      ],
    );
  }

  Widget _buildServiceListItem(
    BuildContext context,
    String title,
    IconData icon,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
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
        onTap: () {
          // Navigate to service details
        },
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
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withOpacity(0.2)),
            ),
            child: Column(
              children: [
                CircleAvatar(
                  radius: 40,
                  backgroundColor: Colors.white.withOpacity(0.2),
                  child: const Icon(
                    Icons.person,
                    size: 40,
                    color: Colors.white,
                  ),
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
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () {
                    // Edit profile
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white.withOpacity(0.2),
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Edit Profile'),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Menu Items
          _buildMenuItem(context, 'My Documents', Icons.folder, () {
            // Navigate to documents
          }),
          _buildMenuItem(context, 'Payment History', Icons.payment, () {
            // Navigate to payment history
          }),
          _buildMenuItem(context, 'Notifications', Icons.notifications, () {
            // Navigate to notifications
          }),
          _buildMenuItem(context, 'Help & Support', Icons.help, () {
            // Navigate to help
          }),
          _buildMenuItem(context, 'Settings', Icons.settings, () {
            // Navigate to settings
          }),
          _buildMenuItem(context, 'About', Icons.info, () {
            // Navigate to about
          }),

          const SizedBox(height: 24),

          // Logout Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                // Handle logout
                showDialog(
                  context: context,
                  builder: (context) => AlertDialog(
                    title: const Text('Logout'),
                    content: const Text('Are you sure you want to logout?'),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Cancel'),
                      ),
                      TextButton(
                        onPressed: () {
                          Navigator.pop(context);
                          // Perform logout
                        },
                        child: const Text('Logout'),
                      ),
                    ],
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red.withOpacity(0.8),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Text('Logout'),
            ),
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
        leading: Icon(icon, color: Colors.white, size: 24),
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

// Additional Screens
class ServicesScreen extends StatelessWidget {
  const ServicesScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: ServicesTab());
  }
}

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: ProfileTab());
  }
}

// Data Models
class ServiceItem {
  final String name;
  final IconData icon;

  ServiceItem(this.name, this.icon);
}


// ## Additional Files Needed

// ### pubspec.yaml
// ```yaml
// name: municipal_app
// description: AMC SMART CITY Municipal Corporation Mobile App

// publish_to: 'none'

// version: 1.0.0+1

// environment:
//   sdk: '>=2.18.0 <4.0.0'
//   flutter: ">=3.0.0"

// dependencies:
//   flutter:
//     sdk: flutter
//   cupertino_icons: ^1.0.2

// dev_dependencies:
//   flutter_test:
//     sdk: flutter
//   flutter_lints: ^2.0.0

// flutter:
//   uses-material-design: true
// ```

// ## Usage Instructions

// 1. Create a new Flutter project
// 2. Replace the contents of `lib/main.dart` with the code above
// 3. Update `pubspec.yaml` with the dependencies
// 4. Run `flutter pub get` to install dependencies
// 5. Run the app with `flutter run`

// ## Features Included

// - **Splash Screen**: Animated logo and loading indicator
// - **Home Dashboard**: Welcome card and quick service access
// - **Services**: Categorized service listings with search
// - **Profile**: User profile management and settings
// - **Navigation**: Bottom navigation bar for easy access
// - **Dark Theme**: Municipal blue (#002B5B) theme throughout
// - **Responsive Design**: Optimized for mobile devices
// - **Material Design**: Following Google's material design principles

// ## Customization Options

// - Update colors in the theme to match exact brand requirements
// - Add real API integration for services
// - Implement authentication system
// - Add more service categories and details
// - Include local language support
// - Add push notifications
// - Implement offline functionality