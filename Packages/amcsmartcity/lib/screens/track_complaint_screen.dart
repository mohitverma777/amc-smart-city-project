// lib/screens/track_complaint_screen.dart
import 'package:flutter/material.dart';
import '../utils/colors.dart';
import '../widgets/input_field.dart';

class TrackComplaintScreen extends StatefulWidget {
  const TrackComplaintScreen({Key? key}) : super(key: key);

  @override
  State<TrackComplaintScreen> createState() => _TrackComplaintScreenState();
}

class _TrackComplaintScreenState extends State<TrackComplaintScreen> {
  final _complaintIdController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  Map<String, dynamic>? _complaintData;

  @override
  void dispose() {
    _complaintIdController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Track Complaint'),
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
                        color: AppColors.info.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.track_changes,
                        color: AppColors.info,
                        size: 32,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Track Your Complaint',
                            style: Theme.of(context).textTheme.headlineSmall,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Enter your complaint ID to check status',
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

              // Search Form
              InputField(
                controller: _complaintIdController,
                label: 'Complaint ID',
                hintText: 'Enter your complaint ID (e.g., CMP123456789)',
                prefixIcon: Icons.search,
                validator: (value) {
                  if (value?.isEmpty ?? true) {
                    return 'Please enter complaint ID';
                  }
                  return null;
                },
              ),

              const SizedBox(height: 20),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _trackComplaint,
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Track Complaint'),
                ),
              ),

              if (_complaintData != null) ...[
                const SizedBox(height: 32),
                _buildComplaintDetails(),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildComplaintDetails() {
    if (_complaintData == null) return const SizedBox();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Complaint Details',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 16),

        // Complaint Info Card
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withOpacity(0.1)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _complaintData!['title'],
                          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'ID: ${_complaintData!['id']}',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white70,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: _getStatusColor(_complaintData!['status']).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      _complaintData!['status'],
                      style: TextStyle(
                        color: _getStatusColor(_complaintData!['status']),
                        fontWeight: FontWeight.w500,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 16),
              
              Text(
                _complaintData!['description'],
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white70,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),

        // Timeline
        _buildTimeline(),
      ],
    );
  }

  Widget _buildTimeline() {
    final timeline = _complaintData!['timeline'] as List<Map<String, dynamic>>;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Progress Timeline',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 16),
        
        ...timeline.asMap().entries.map((entry) {
          final index = entry.key;
          final item = entry.value;
          final isLast = index == timeline.length - 1;
          
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                children: [
                  Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: item['completed'] 
                          ? AppColors.success 
                          : Colors.white.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      item['completed'] ? Icons.check : Icons.schedule,
                      color: Colors.white,
                      size: 14,
                    ),
                  ),
                  if (!isLast)
                    Container(
                      width: 2,
                      height: 40,
                      color: Colors.white.withOpacity(0.2),
                    ),
                ],
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.white.withOpacity(0.1)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item['title'],
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      if (item['description'] != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          item['description'],
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white70,
                          ),
                        ),
                      ],
                      const SizedBox(height: 4),
                      Text(
                        item['date'],
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.white54,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        }).toList(),
      ],
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return AppColors.warning;
      case 'in progress':
        return AppColors.info;
      case 'resolved':
        return AppColors.success;
      case 'rejected':
        return AppColors.error;
      default:
        return Colors.white70;
    }
  }

  Future<void> _trackComplaint() async {
    if (_formKey.currentState?.validate() ?? false) {
      setState(() => _isLoading = true);

      // Simulate API call
      await Future.delayed(const Duration(seconds: 2));

      // Mock data
      final mockData = {
        'id': _complaintIdController.text,
        'title': 'Water Supply Issue',
        'category': 'Water Supply',
        'priority': 'High',
        'status': 'In Progress',
        'description': 'No water supply in the area for the past 3 days. Multiple residents are facing this issue.',
        'timeline': [
          {
            'title': 'Complaint Filed',
            'description': 'Your complaint has been received and registered.',
            'date': '1 Dec 2025, 10:30 AM',
            'completed': true,
          },
          {
            'title': 'Under Review',
            'description': 'Technical team is reviewing your complaint.',
            'date': '1 Dec 2025, 2:15 PM',
            'completed': true,
          },
          {
            'title': 'Field Inspection',
            'description': 'Field team has been assigned for inspection.',
            'date': '2 Dec 2025, 9:00 AM',
            'completed': true,
          },
          {
            'title': 'Work in Progress',
            'description': 'Repair work has started.',
            'date': '2 Dec 2025, 2:30 PM',
            'completed': false,
          },
          {
            'title': 'Resolved',
            'description': null,
            'date': 'Estimated: 3 Dec 2025',
            'completed': false,
          },
        ],
      };

      setState(() {
        _complaintData = mockData;
        _isLoading = false;
      });
    }
  }
}