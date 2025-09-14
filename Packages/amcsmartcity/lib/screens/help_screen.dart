// lib/screens/help_screen.dart
import 'package:flutter/material.dart';
import '../utils/colors.dart';

class HelpScreen extends StatelessWidget {
  const HelpScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Help & Support'), centerTitle: true),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Search Help
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
                  hintText: 'Search help topics...',
                  hintStyle: TextStyle(color: Colors.white54),
                  border: InputBorder.none,
                  prefixIcon: Icon(Icons.search, color: Colors.white54),
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Quick Actions
            _buildSection(context, 'Quick Actions', [
              {
                'title': 'Contact Support',
                'subtitle': 'Get help from our support team',
                'icon': Icons.headset_mic,
                'color': AppColors.accent,
              },
              {
                'title': 'Report a Bug',
                'subtitle': 'Found an issue? Let us know',
                'icon': Icons.bug_report,
                'color': AppColors.warning,
              },
              {
                'title': 'Feature Request',
                'subtitle': 'Suggest new features',
                'icon': Icons.lightbulb,
                'color': AppColors.info,
              },
            ]),

            const SizedBox(height: 24),

            // FAQs
            Text(
              'Frequently Asked Questions',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 16),

            _buildFAQItem(
              'How do I pay my bills online?',
              'Go to the Payment section in the app, select the bill you want to pay, and follow the instructions to complete the payment.',
            ),
            _buildFAQItem(
              'How can I track my complaint?',
              'Use the "Track Complaint" feature and enter your complaint ID to see the current status and progress.',
            ),
            _buildFAQItem(
              'What documents do I need for certificates?',
              'Required documents vary by certificate type. Check the service details page for specific requirements.',
            ),
            _buildFAQItem(
              'How long does it take to process applications?',
              'Processing times vary by service type. Most certificates take 2-7 working days to process.',
            ),
            _buildFAQItem(
              'Can I cancel or modify my application?',
              'Applications can be modified or cancelled within 24 hours of submission. Contact support for assistance.',
            ),

            const SizedBox(height: 24),

            // Contact Information
            _buildSection(context, 'Contact Information', [
              {
                'title': 'Phone',
                'subtitle': '+91-79-1234-5678',
                'icon': Icons.phone,
                'color': AppColors.success,
              },
              {
                'title': 'Email',
                'subtitle': 'support@AMC SMART CITYmunicipal.gov.in',
                'icon': Icons.email,
                'color': AppColors.info,
              },
              {
                'title': 'Office Hours',
                'subtitle': 'Mon-Fri: 9:00 AM - 6:00 PM',
                'icon': Icons.schedule,
                'color': AppColors.warning,
              },
              {
                'title': 'Address',
                'subtitle':
                    'AMC SMART CITY Municipal Corporation,\nCity Hall, AMC SMART CITY - 380001',
                'icon': Icons.location_on,
                'color': AppColors.error,
              },
            ]),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(
    BuildContext context,
    String title,
    List<Map<String, dynamic>> items,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 16),
        ...items.map((item) => _buildActionCard(context, item)),
      ],
    );
  }

  Widget _buildActionCard(BuildContext context, Map<String, dynamic> item) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        tileColor: Colors.white.withOpacity(0.05),
        leading: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: item['color'].withOpacity(0.2),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(item['icon'], color: item['color'], size: 24),
        ),
        title: Text(
          item['title'],
          style: Theme.of(
            context,
          ).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
        ),
        subtitle: Text(
          item['subtitle'],
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: Colors.white70),
        ),
        trailing: const Icon(
          Icons.arrow_forward_ios,
          color: Colors.white54,
          size: 16,
        ),
        onTap: () {
          // Handle action
        },
      ),
    );
  }

  Widget _buildFAQItem(String question, String answer) {
    return Theme(
      data: ThemeData().copyWith(dividerColor: Colors.transparent),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withOpacity(0.1)),
        ),
        child: ExpansionTile(
          title: Text(
            question,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w500,
            ),
          ),
          iconColor: Colors.white70,
          collapsedIconColor: Colors.white70,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Text(
                answer,
                style: const TextStyle(color: Colors.white70, height: 1.5),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
