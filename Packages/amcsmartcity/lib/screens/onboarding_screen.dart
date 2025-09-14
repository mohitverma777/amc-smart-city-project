// lib/screens/onboarding_screen.dart
import 'package:flutter/material.dart';
import '../utils/colors.dart';
import '../utils/routes.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({Key? key}) : super(key: key);

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<OnboardingItem> _items = [
    OnboardingItem(
      icon: Icons.location_city,
      title: 'Welcome to AMC SMART CITY Municipal',
      description: 'Your gateway to all municipal services at your fingertips',
    ),
    OnboardingItem(
      icon: Icons.touch_app,
      title: 'Easy Service Access',
      description:
          'Pay bills, apply for certificates, and file complaints easily',
    ),
    OnboardingItem(
      icon: Icons.security,
      title: 'Secure & Reliable',
      description: 'Your data is safe with our secure digital platform',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primary,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                itemCount: _items.length,
                onPageChanged: (index) => setState(() => _currentPage = index),
                itemBuilder: (context, index) {
                  return Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 150,
                          height: 150,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(75),
                            border: Border.all(
                              color: Colors.white.withOpacity(0.3),
                            ),
                          ),
                          child: Icon(
                            _items[index].icon,
                            size: 80,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 60),
                        Text(
                          _items[index].title,
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.headlineMedium,
                        ),
                        const SizedBox(height: 24),
                        Text(
                          _items[index].description,
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodyLarge
                              ?.copyWith(color: Colors.white70, height: 1.5),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      _items.length,
                      (index) => Container(
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        width: _currentPage == index ? 24 : 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: _currentPage == index
                              ? Colors.white
                              : Colors.white.withOpacity(0.3),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 40),
                  Row(
                    children: [
                      if (_currentPage > 0)
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () {
                              _pageController.previousPage(
                                duration: const Duration(milliseconds: 300),
                                curve: Curves.easeInOut,
                              );
                            },
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: Colors.white),
                              padding: const EdgeInsets.symmetric(vertical: 16),
                            ),
                            child: const Text(
                              'Previous',
                              style: TextStyle(color: Colors.white),
                            ),
                          ),
                        ),
                      if (_currentPage > 0) const SizedBox(width: 16),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            if (_currentPage < _items.length - 1) {
                              _pageController.nextPage(
                                duration: const Duration(milliseconds: 300),
                                curve: Curves.easeInOut,
                              );
                            } else {
                              Navigator.pushReplacementNamed(
                                context,
                                AppRoutes.login,
                              );
                            }
                          },
                          child: Text(
                            _currentPage < _items.length - 1
                                ? 'Next'
                                : 'Get Started',
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: () => Navigator.pushReplacementNamed(
                      context,
                      AppRoutes.login,
                    ),
                    child: const Text(
                      'Skip',
                      style: TextStyle(color: Colors.white70),
                    ),
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

class OnboardingItem {
  final IconData icon;
  final String title;
  final String description;

  OnboardingItem({
    required this.icon,
    required this.title,
    required this.description,
  });
}
