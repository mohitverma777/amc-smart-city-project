// lib/screens/about_screen.dart
import 'package:flutter/material.dart';
import '../utils/colors.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('About'), centerTitle: true),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // App Logo and Info
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.white.withOpacity(0.15),
                    Colors.white.withOpacity(0.05),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withOpacity(0.2)),
              ),
              child: Column(
                children: [
                  Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.2),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.location_city,
                      size: 50,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 24),
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
                  const SizedBox(height: 16),
                  Text(
                    'Version 1.0.0',
                    style: Theme.of(
                      context,
                    ).textTheme.bodyMedium?.copyWith(color: Colors.white70),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),

            // Mission Statement
            _buildInfoSection(
              'Our Mission',
              'To provide efficient, transparent, and citizen-centric municipal services through digital innovation, making government services accessible to all citizens of AMC SMART CITY.',
              Icons.flag,
            ),

            // Vision
            _buildInfoSection(
              'Our Vision',
              'To build a smart, sustainable, and inclusive city where every citizen has easy access to quality municipal services and information.',
              Icons.visibility,
            ),

            // Features
            _buildInfoSection(
              'Key Features',
              '• Online bill payments and tax collection\n• Digital certificate services\n• Complaint management system\n• Real-time application tracking\n• Secure document storage\n• Multi-language support',
              Icons.star,
            ),

            // Contact Info
            _buildInfoSection(
              'Contact Information',
              'AMC SMART CITY Municipal Corporation\nCity Hall, AMC SMART CITY - 380001\nGujarat, India\n\nPhone: +91-79-1234-5678\nEmail: info@AMC SMART CITYmunicipal.gov.in\nWebsite: www.AMC SMART CITYmunicipal.gov.in',
              Icons.contact_mail,
            ),

            const SizedBox(height: 24),

            // Credits and Legal
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withOpacity(0.1)),
              ),
              child: Column(
                children: [
                  Text(
                    'Developed with ❤️ for the citizens of AMC SMART CITY',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    '© 2025 AMC SMART CITY Municipal Corporation\nAll rights reserved.',
                    style: Theme.of(
                      context,
                    ).textTheme.bodySmall?.copyWith(color: Colors.white70),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Legal Links
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                TextButton(
                  onPressed: () {
                    // Show privacy policy
                  },
                  child: const Text(
                    'Privacy Policy',
                    style: TextStyle(color: Colors.white70),
                  ),
                ),
                Container(width: 1, height: 16, color: Colors.white30),
                TextButton(
                  onPressed: () {
                    // Show terms of service
                  },
                  child: const Text(
                    'Terms of Service',
                    style: TextStyle(color: Colors.white70),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoSection(String title, String content, IconData icon) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(20),
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
              Icon(icon, color: AppColors.accent, size: 24),
              const SizedBox(width: 12),
              Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            content,
            style: const TextStyle(color: Colors.white70, height: 1.6),
          ),
        ],
      ),
    );
  }
}
