// lib/screens/services_screen.dart
import 'package:flutter/material.dart';
import '../utils/colors.dart';
import '../utils/routes.dart';
import '../widgets/service_card.dart';

class ServicesScreen extends StatefulWidget {
  const ServicesScreen({Key? key}) : super(key: key);

  @override
  State<ServicesScreen> createState() => _ServicesScreenState();
}

class _ServicesScreenState extends State<ServicesScreen> {
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('All Services'), centerTitle: true),
      body: SingleChildScrollView(
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
              child: TextField(
                style: const TextStyle(color: Colors.white),
                onChanged: (value) => setState(() => _searchQuery = value),
                decoration: const InputDecoration(
                  hintText: 'Search services...',
                  hintStyle: TextStyle(color: Colors.white54),
                  border: InputBorder.none,
                  prefixIcon: Icon(Icons.search, color: Colors.white54),
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Featured Services
            Text(
              'Featured Services',
              style: Theme.of(context).textTheme.headlineSmall,
            ),

            const SizedBox(height: 16),

            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              childAspectRatio: 1.3,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
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
                  title: 'Birth Certificate',
                  icon: Icons.child_care,
                  onTap: () => Navigator.pushNamed(
                    context,
                    AppRoutes.serviceDetail,
                    arguments: {
                      'serviceName': 'Birth Certificate',
                      'serviceIcon': Icons.child_care,
                    },
                  ),
                ),
                ServiceCard(
                  title: 'Property Tax',
                  icon: Icons.home,
                  onTap: () => Navigator.pushNamed(
                    context,
                    AppRoutes.serviceDetail,
                    arguments: {
                      'serviceName': 'Property Tax',
                      'serviceIcon': Icons.home,
                    },
                  ),
                ),
              ],
            ),

            const SizedBox(height: 32),

            // All Services by Category
            _buildServiceCategory(context, 'Payments & Billing', [
              {'name': 'Property Tax', 'icon': Icons.home},
              {'name': 'Water Bill', 'icon': Icons.water_drop},
              {'name': 'Electricity Bill', 'icon': Icons.electric_bolt},
              {'name': 'Waste Management Fee', 'icon': Icons.delete},
              {'name': 'Trade License Fee', 'icon': Icons.business},
              {'name': 'Parking Fees', 'icon': Icons.local_parking},
            ]),

            _buildServiceCategory(context, 'Certificates & Documents', [
              {'name': 'Birth Certificate', 'icon': Icons.child_care},
              {
                'name': 'Death Certificate',
                'icon': Icons.sentiment_very_dissatisfied,
              },
              {'name': 'Marriage Certificate', 'icon': Icons.favorite},
              {'name': 'Property Ownership Papers', 'icon': Icons.description},
              {
                'name': 'Income Certificate',
                'icon': Icons.account_balance_wallet,
              },
              {'name': 'Domicile Certificate', 'icon': Icons.location_on},
            ]),

            _buildServiceCategory(context, 'Licenses & Permits', [
              {'name': 'Trade License', 'icon': Icons.business},
              {
                'name': 'Building Construction Permit',
                'icon': Icons.construction,
              },
              {'name': 'NOC Certificate', 'icon': Icons.verified},
              {'name': 'Health License', 'icon': Icons.health_and_safety},
              {
                'name': 'Fire Safety Certificate',
                'icon': Icons.local_fire_department,
              },
              {'name': 'Environment Clearance', 'icon': Icons.eco},
            ]),

            _buildServiceCategory(context, 'Complaints & Support', [
              {'name': 'File New Complaint', 'icon': Icons.report_problem},
              {'name': 'Track Complaint Status', 'icon': Icons.track_changes},
              {'name': 'Emergency Services', 'icon': Icons.emergency},
              {'name': 'Grievance Redressal', 'icon': Icons.support_agent},
              {'name': 'Public Information', 'icon': Icons.info},
              {'name': 'Feedback & Suggestions', 'icon': Icons.feedback},
            ]),
          ],
        ),
      ),
    );
  }

  Widget _buildServiceCategory(
    BuildContext context,
    String categoryName,
    List<Map<String, dynamic>> services,
  ) {
    // Filter services based on search query
    final filteredServices = services.where((service) {
      return service['name'].toString().toLowerCase().contains(
        _searchQuery.toLowerCase(),
      );
    }).toList();

    if (filteredServices.isEmpty && _searchQuery.isNotEmpty) {
      return const SizedBox.shrink();
    }

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
          itemCount: filteredServices.length,
          itemBuilder: (context, index) {
            final service = filteredServices[index];
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
