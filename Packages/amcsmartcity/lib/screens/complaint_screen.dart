// lib/screens/complaint_screen.dart
import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../utils/colors.dart';
import '../widgets/input_field.dart';
import '../widgets/custom_button.dart';
import '../services/complaint_service.dart';
import '../utils/auth_token.dart';

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

  final _picker = ImagePicker();
  List<XFile> _imageFiles = [];
  List<Uint8List> _imageBytes = [];

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

  Future<void> _pickImages() async {
    try {
      final picked = await _picker.pickMultiImage(imageQuality: 70);
      if (picked != null && mounted) {
        final bytesList = <Uint8List>[];
        for (var file in picked) {
          final bytes = await file.readAsBytes();
          bytesList.add(bytes);
        }
        setState(() {
          _imageFiles = picked;
          _imageBytes = bytesList;
        });
      }
    } catch (e) {
      _showError('Error picking images: $e');
    }
  }

  Future<void> _submitComplaint() async {
    if (!_formKey.currentState!.validate()) return;

    // Check for empty required fields manually
    if (_titleController.text.trim().isEmpty) {
      _showError('Please enter complaint title');
      return;
    }
    if (_descriptionController.text.trim().isEmpty) {
      _showError('Please enter complaint description');
      return;
    }
    if (_locationController.text.trim().isEmpty) {
      _showError('Please enter location');
      return;
    }

    final token = await AuthToken.get();
    if (token == null || token.isEmpty) {
      _showError('You must be logged in to file a complaint.');
      return;
    }

    setState(() => _isSubmitting = true);

    final service = ComplaintService();

    try {
      // Pass XFile list directly - service will handle platform detection
      final response = await service.fileComplaint(
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim(),
        address: _locationController.text.trim(),
        category: _selectedCategory,
        priority: _selectedPriority,
        token: token,
        imageFiles: _imageFiles, // Pass XFile list, not File list
      );

      setState(() => _isSubmitting = false);

      if (response['success'] == true) {
        final complaintData = response['data']?['data']?['complaint'];
        final complaintId =
            complaintData?['complaintNumber'] ??
            'CMP${DateTime.now().millisecondsSinceEpoch}';

        _clearForm();
        _showSuccessDialog(complaintId);
      } else {
        final errorMessage =
            response['data']?['message'] ??
            response['error'] ??
            'Unknown error occurred';
        _showError('Failed to submit: $errorMessage');
      }
    } catch (e) {
      setState(() => _isSubmitting = false);
      _showError('Network error: $e');
    }
  }

  void _clearForm() {
    _titleController.clear();
    _descriptionController.clear();
    _locationController.clear();
    setState(() {
      _imageFiles = [];
      _imageBytes = [];
      _selectedPriority = 'Medium';
      _selectedCategory = 'Water Supply';
    });
  }

  void _showSuccessDialog(String complaintId) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.surface,
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.check_circle, color: AppColors.success, size: 64),
            const SizedBox(height: 16),
            const Text(
              'Complaint Filed Successfully!',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: 18,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Complaint ID: $complaintId',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: Colors.white70),
            ),
            const SizedBox(height: 8),
            Text(
              'You can track your complaint status using this ID',
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: Colors.white54),
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
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Tracking feature coming soon!'),
                        backgroundColor: AppColors.primary,
                      ),
                    );
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

  void _showError(String msg) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Error', style: TextStyle(color: Colors.white)),
        content: Text(msg, style: const TextStyle(color: Colors.white70)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('File Complaint'), centerTitle: true),
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
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(color: Colors.white70),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),
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
                (v) => setState(() => _selectedCategory = v!),
                Icons.category,
              ),
              const SizedBox(height: 20),

              // Title
              InputField(
                controller: _titleController,
                label: 'Complaint Title',
                prefixIcon: Icons.title,
                validator: (v) => (v?.isEmpty ?? true)
                    ? 'Please enter complaint title'
                    : null,
              ),
              const SizedBox(height: 20),

              // Description
              InputField(
                controller: _descriptionController,
                label: 'Description',
                prefixIcon: Icons.description,
                // maxLines: 3,
                validator: (v) => (v?.isEmpty ?? true)
                    ? 'Please enter complaint description'
                    : null,
              ),
              const SizedBox(height: 20),

              // Location
              InputField(
                controller: _locationController,
                label: 'Location/Address',
                prefixIcon: Icons.location_on,
                suffixIcon: IconButton(
                  icon: const Icon(Icons.my_location, color: Colors.white70),
                  onPressed: () => _locationController.text =
                      'Current Location - Ahmedabad, Gujarat',
                ),
                validator: (v) =>
                    (v?.isEmpty ?? true) ? 'Please enter location' : null,
              ),
              const SizedBox(height: 20),

              // Priority
              _buildDropdownField(
                'Priority',
                _selectedPriority,
                _priorities,
                (v) => setState(() => _selectedPriority = v!),
                Icons.flag,
              ),
              const SizedBox(height: 20),

              // Attachments
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
                      'Add Photos (${_imageFiles.length} selected)',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Upload photos to help us understand the issue better',
                      style: Theme.of(
                        context,
                      ).textTheme.bodySmall?.copyWith(color: Colors.white54),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: _pickImages,
                      icon: const Icon(Icons.add_photo_alternate),
                      label: Text(
                        _imageFiles.isEmpty
                            ? 'Add Photos'
                            : 'Change Photos (${_imageFiles.length})',
                      ),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Colors.white30),
                        foregroundColor: Colors.white70,
                      ),
                    ),
                    if (_imageBytes.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _imageBytes
                            .map(
                              (bytes) => ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.memory(
                                  bytes,
                                  width: 80,
                                  height: 80,
                                  fit: BoxFit.cover,
                                ),
                              ),
                            )
                            .toList(),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Submit
              CustomButton(
                text: 'Submit Complaint',
                onPressed: _isSubmitting ? null : _submitComplaint,
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
                        style: Theme.of(
                          context,
                        ).textTheme.bodySmall?.copyWith(color: AppColors.info),
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
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500),
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
            items: items
                .map((item) => DropdownMenuItem(value: item, child: Text(item)))
                .toList(),
          ),
        ),
      ],
    );
  }
}
