// lib/screens/service_detail_screen.dart
import 'package:flutter/material.dart';
import '../utils/colors.dart';
import '../widgets/custom_button.dart';

class ServiceDetailScreen extends StatelessWidget {
  final String serviceName;
  final IconData serviceIcon;

  const ServiceDetailScreen({
    Key? key,
    required this.serviceName,
    required this.serviceIcon,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(serviceName), centerTitle: true),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Service Header
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
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Icon(serviceIcon, size: 48, color: Colors.white),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    serviceName,
                    style: Theme.of(context).textTheme.headlineMedium,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Complete your ${serviceName.toLowerCase()} process online',
                    style: Theme.of(
                      context,
                    ).textTheme.bodyMedium?.copyWith(color: Colors.white70),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Service Information
            _buildInfoSection(context, 'Service Information', [
              'Processing Time: 2-3 working days',
              'Required Documents: ID proof, Address proof',
              'Fee: ₹500 (online payment)',
              'Status Tracking: Available',
            ]),

            const SizedBox(height: 20),

            // Requirements
            _buildInfoSection(context, 'Requirements', [
              'Valid Aadhaar Card',
              'Passport size photograph',
              'Address proof (Utility bill)',
              'Application form (auto-generated)',
            ]),

            const SizedBox(height: 20),

            // Process Steps
            _buildStepsSection(context),

            const SizedBox(height: 32),

            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      // Download form or get info
                    },
                    icon: const Icon(Icons.download),
                    label: const Text('Download Form'),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.white),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: CustomButton(
                    text: 'Apply Now',
                    onPressed: () => _showApplicationForm(context),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoSection(
    BuildContext context,
    String title,
    List<String> items,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white.withOpacity(0.1)),
          ),
          child: Column(
            children: items
                .map(
                  (item) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(
                          Icons.check_circle_outline,
                          color: Colors.white70,
                          size: 16,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            item,
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(color: Colors.white70),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
                .toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildStepsSection(BuildContext context) {
    final steps = [
      'Fill application form',
      'Upload required documents',
      'Pay processing fee',
      'Submit application',
      'Track application status',
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Application Process',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white.withOpacity(0.1)),
          ),
          child: Column(
            children: steps.asMap().entries.map((entry) {
              final index = entry.key;
              final step = entry.value;
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Row(
                  children: [
                    Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Center(
                        child: Text(
                          '${index + 1}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        step,
                        style: Theme.of(
                          context,
                        ).textTheme.bodyMedium?.copyWith(color: Colors.white70),
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

  void _showApplicationForm(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white30,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Start Application',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 16),
            Text(
              'You will be redirected to the application form. Make sure you have all required documents ready.',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: Colors.white70),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.white30),
                      foregroundColor: Colors.white70,
                    ),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      // Navigate to application form
                    },
                    child: const Text('Continue'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
