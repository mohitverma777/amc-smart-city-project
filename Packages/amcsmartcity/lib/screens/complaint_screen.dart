// lib/screens/complaint_screen.dart
import 'package:flutter/material.dart';
import '../utils/colors.dart';
import '../widgets/input_field.dart';
import '../widgets/custom_button.dart';

class ComplaintScreen extends StatefulWidget {
  const ComplaintScreen({Key? key}) : super(key: key);

  @override
  State<ComplaintScreen> createState() => _ComplaintScreenState();
}

class _ComplaintScreenState extends State<ComplaintScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _locationController = TextEditingController();
  
  String _selectedCategory = 'Water Supply';
  String _selectedPriority = 'Medium';
  bool _isSubmitting = false;

  final List<String> _categories = [
    'Water Supply',
    'Electricity',
    'Waste Management',
    'Road & Infrastructure',
    'Street Lighting',
    'Drainage',
    'Public Health',
    'Other',
  ];

  final List<String> _priorities = ['Low', 'Medium', 'High', 'Critical'];

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('File Complaint'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Card
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
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.warning.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.report_problem,
                        color: AppColors.warning,
                        size: 32,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'File a Complaint',
                            style: Theme.of(context).textTheme.headlineSmall,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Report issues and we\'ll resolve them quickly',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.white70,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Form Fields
              Text(
                'Complaint Details',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              
              const SizedBox(height: 16),

              // Category Dropdown
              _buildDropdownField(
                'Category',
                _selectedCategory,
                _categories,
                (value) => setState(() => _selectedCategory = value!),
                Icons.category,
              ),

              const SizedBox(height: 20),

              // Title Field
              InputField(
                controller: _titleController,
                label: 'Complaint Title',
                prefixIcon: Icons.title,
                validator: (value) {
                  if (value?.isEmpty ?? true) {
                    return 'Please enter complaint title';
                  }
                  return null;
                },
              ),

              const SizedBox(height: 20),

              // Description Field
              InputField(
                controller: _descriptionController,
                label: 'Description',
                prefixIcon: Icons.description,
                maxLines: 4,
                validator: (value) {
                  if (value?.isEmpty ?? true) {
                    return 'Please enter complaint description';
                  }
                  return null;
                },
              ),

              const SizedBox(height: 20),

              // Location Field
              InputField(
                controller: _locationController,
                label: 'Location/Address',
                prefixIcon: Icons.location_on,
                suffixIcon: IconButton(
                  icon: const Icon(Icons.my_location, color: Colors.white70),
                  onPressed: () {
                    // Get current location
                    _locationController.text = 'Current Location';
                  },
                ),
                validator: (value) {
                  if (value?.isEmpty ?? true) {
                    return 'Please enter location';
                  }
                  return null;
                },
              ),

              const SizedBox(height: 20),

              // Priority Dropdown
              _buildDropdownField(
                'Priority',
                _selectedPriority,
                _priorities,
                (value) => setState(() => _selectedPriority = value!),
                Icons.flag,
              ),

              const SizedBox(height: 20),

              // Attachments Section
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white.withOpacity(0.1)),
                ),
                child: Column(
                  children: [
                    const Icon(
                      Icons.camera_alt,
                      color: Colors.white70,
                      size: 32,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Add Photos (Optional)',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Upload photos to help us understand the issue better',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white54,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: () {
                        // Handle photo upload
                      },
                      icon: const Icon(Icons.add_photo_alternate),
                      label: const Text('Add Photos'),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Colors.white30),
                        foregroundColor: Colors.white70,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // Submit Button
              CustomButton(
                text: 'Submit Complaint',
                onPressed: _submitComplaint,
                isLoading: _isSubmitting,
              ),

              const SizedBox(height: 16),

              // Info Text
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.info.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.info.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info, color: AppColors.info, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'You will receive a complaint ID to track the status',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.info,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDropdownField(
    String label,
    String value,
    List<String> items,
    ValueChanged<String?> onChanged,
    IconData icon,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white.withOpacity(0.3)),
          ),
          child: DropdownButtonFormField<String>(
            value: value,
            onChanged: onChanged,
            decoration: InputDecoration(
              border: InputBorder.none,
              prefixIcon: Icon(icon, color: Colors.white70),
            ),
            dropdownColor: AppColors.surface,
            style: const TextStyle(color: Colors.white),
            items: items.map((item) {
              return DropdownMenuItem(
                value: item,
                child: Text(item),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Future<void> _submitComplaint() async {
    if (_formKey.currentState?.validate() ?? false) {
      setState(() => _isSubmitting = true);

      // Simulate API call
      await Future.delayed(const Duration(seconds: 2));

      if (mounted) {
        setState(() => _isSubmitting = false);
        
        final complaintId = 'CMP${DateTime.now().millisecondsSinceEpoch}';
        
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            backgroundColor: AppColors.surface,
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.check_circle,
                  color: AppColors.success,
                  size: 64,
                ),
                const SizedBox(height: 16),
                const Text(
                  'Complaint Filed Successfully!',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Complaint ID: $complaintId',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.white70,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'You can track your complaint status using this ID',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white54,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
            actions: [
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        Navigator.pop(context);
                      },
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Colors.white30),
                        foregroundColor: Colors.white70,
                      ),
                      child: const Text('Close'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        // Navigate to track complaint screen
                      },
                      child: const Text('Track Status'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      }
    }
  }
}