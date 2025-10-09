// lib/screens/track_complaint_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../utils/colors.dart';
import '../widgets/input_field.dart';
import '../services/complaint_service.dart';
import '../services/auth_service.dart';

class TrackComplaintScreen extends StatefulWidget {
  const TrackComplaintScreen({Key? key}) : super(key: key);

  @override
  State<TrackComplaintScreen> createState() => _TrackComplaintScreenState();
}

class _TrackComplaintScreenState extends State<TrackComplaintScreen> {
  final _complaintIdController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  bool _isLoadingComplaints = true;
  Map<String, dynamic>? _complaintData;
  String? _errorMessage;
  List<dynamic> _myComplaints = [];

  @override
  void initState() {
    super.initState();
    _loadMyComplaints();
  }

  @override
  void dispose() {
    _complaintIdController.dispose();
    super.dispose();
  }

  Future<void> _loadMyComplaints() async {
    try {
      final token = await AuthService.getToken();
      if (token == null) {
        setState(() => _isLoadingComplaints = false);
        return;
      }

      final response = await ComplaintService().getMyComplaints(token);

      if (response['success'] == true) {
        setState(() {
          final respData = response['data'] as Map<String, dynamic>;
          final inner = respData['data'] as Map<String, dynamic>;
          _myComplaints = (inner['complaints'] as List<dynamic>?) ?? [];
          _isLoadingComplaints = false;
        });
      } else {
        setState(() {
          _myComplaints = [];
          _isLoadingComplaints = false;
        });
      }
    } catch (e) {
      print('❌ Error loading complaints: $e');
      setState(() {
        _myComplaints = [];
        _isLoadingComplaints = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Track Complaint'),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
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
                    AppColors.primary.withOpacity(0.15),
                    AppColors.primary.withOpacity(0.05),
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
                          style: Theme.of(context).textTheme.headlineSmall
                              ?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Select from your complaints or enter ID manually',
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

            // My Complaints Section
            if (_isLoadingComplaints)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(20),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (_myComplaints.isNotEmpty) ...[
              Row(
                children: [
                  Icon(Icons.history, color: AppColors.primary, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    'My Recent Complaints',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ..._myComplaints.take(5).map((complaint) {
                final complaintId =
                    complaint['complaintNumber'] ??
                    complaint['id']?.toString() ??
                    '';
                final status = complaint['status'] ?? 'Unknown';

                return GestureDetector(
                  onTap: () {
                    _complaintIdController.text = complaintId;
                    _trackComplaint();
                  },
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 8),
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
                            color: _getStatusColor(status).withOpacity(0.2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            Icons.description,
                            color: _getStatusColor(status),
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                complaint['title'] ?? 'No Title',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w500,
                                  fontSize: 14,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'ID: $complaintId',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 12,
                                ),
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
                            color: _getStatusColor(status).withOpacity(0.2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            status,
                            style: TextStyle(
                              color: _getStatusColor(status),
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Icon(
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
              const Divider(color: Colors.white24),
              const SizedBox(height: 24),
            ],

            // Manual Search Form
            Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Or Enter Complaint ID Manually',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),
                  InputField(
                    controller: _complaintIdController,
                    label: 'Complaint ID or Number',
                    hintText: 'Enter complaint ID/number',
                    prefixIcon: Icons.search,
                    validator: (value) {
                      if (value?.isEmpty ?? true) {
                        return 'Please enter complaint ID or number';
                      }
                      if (value!.length < 3) {
                        return 'Please enter a valid complaint ID';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _trackComplaint,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  Colors.white,
                                ),
                              ),
                            )
                          : const Text(
                              'Track Complaint',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ),

            // Error Message
            if (_errorMessage != null) ...[
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.error.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.error.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.error_outline, color: AppColors.error, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: TextStyle(
                          color: AppColors.error,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            // Complaint Details
            if (_complaintData != null) ...[
              const SizedBox(height: 32),
              _buildComplaintDetails(),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildComplaintDetails() {
    if (_complaintData == null) return const SizedBox();

    final complaint = _complaintData!;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.check_circle, color: AppColors.success, size: 24),
            const SizedBox(width: 8),
            Text(
              'Complaint Found',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
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
              // Header Row
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          complaint['title'] ?? 'No Title',
                          style: Theme.of(context).textTheme.bodyLarge
                              ?.copyWith(
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Text(
                              'ID: ',
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(color: Colors.white70),
                            ),
                            GestureDetector(
                              onTap: () => _copyToClipboard(
                                complaint['complaintNumber'] ??
                                    complaint['id'] ??
                                    '',
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    complaint['complaintNumber'] ??
                                        complaint['id'] ??
                                        'Unknown',
                                    style: Theme.of(context).textTheme.bodySmall
                                        ?.copyWith(
                                          color: AppColors.primary,
                                          fontWeight: FontWeight.w500,
                                        ),
                                  ),
                                  const SizedBox(width: 4),
                                  Icon(
                                    Icons.copy,
                                    size: 14,
                                    color: AppColors.primary,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: _getStatusColor(
                        complaint['status'] ?? 'Pending',
                      ).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      complaint['status'] ?? 'Unknown',
                      style: TextStyle(
                        color: _getStatusColor(
                          complaint['status'] ?? 'Pending',
                        ),
                        fontWeight: FontWeight.w500,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // Description
              if (complaint['description'] != null) ...[
                Text(
                  complaint['description'],
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(color: Colors.white70),
                ),
                const SizedBox(height: 16),
              ],

              // Details Grid
              Wrap(
                spacing: 16,
                runSpacing: 8,
                children: [
                  if (complaint['category'] != null)
                    _buildDetailChip('Category', complaint['category']),
                  if (complaint['priority'] != null)
                    _buildDetailChip('Priority', complaint['priority']),
                  if (complaint['createdAt'] != null)
                    _buildDetailChip(
                      'Filed On',
                      _formatDate(complaint['createdAt']),
                    ),
                  if (complaint['expectedResolutionDate'] != null)
                    _buildDetailChip(
                      'Expected',
                      _formatDate(complaint['expectedResolutionDate']),
                    ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),

        // Status Timeline
        _buildStatusTimeline(),

        // Comments Section
        if (complaint['comments'] != null &&
            (complaint['comments'] as List).isNotEmpty) ...[
          const SizedBox(height: 20),
          _buildCommentsSection(),
        ],
      ],
    );
  }

  Widget _buildDetailChip(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '$label: ',
            style: TextStyle(color: Colors.white54, fontSize: 12),
          ),
          Text(
            value,
            style: TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusTimeline() {
    final status = _complaintData!['status']?.toLowerCase() ?? 'pending';

    final List<Map<String, dynamic>> timeline = [
      {
        'title': 'Complaint Filed',
        'description': 'Your complaint has been received and registered.',
        'date': _formatDate(_complaintData!['createdAt']),
        'completed': true,
        'icon': Icons.assignment_turned_in,
      },
      {
        'title': 'Under Review',
        'description': 'Technical team is reviewing your complaint.',
        'date': status == 'pending'
            ? 'Pending'
            : _formatDate(_complaintData!['acknowledgedAt']),
        'completed': [
          'acknowledged',
          'in progress',
          'resolved',
          'closed',
        ].contains(status),
        'icon': Icons.visibility,
      },
      {
        'title': 'In Progress',
        'description': 'Work has started on your complaint.',
        'date':
            status == 'in progress' ||
                status == 'resolved' ||
                status == 'closed'
            ? _formatDate(_complaintData!['inProgressAt'])
            : 'Pending',
        'completed': ['in progress', 'resolved', 'closed'].contains(status),
        'icon': Icons.build,
      },
      {
        'title': 'Resolved',
        'description': status == 'resolved' || status == 'closed'
            ? 'Your complaint has been resolved.'
            : null,
        'date': status == 'resolved' || status == 'closed'
            ? _formatDate(_complaintData!['resolvedAt'])
            : _formatDate(_complaintData!['expectedResolutionDate']),
        'completed': ['resolved', 'closed'].contains(status),
        'icon': Icons.check_circle,
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Progress Timeline',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
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
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: item['completed']
                          ? AppColors.success
                          : Colors.white.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: item['completed']
                            ? AppColors.success
                            : Colors.white.withOpacity(0.5),
                        width: 2,
                      ),
                    ),
                    child: Icon(
                      item['completed'] ? item['icon'] : Icons.schedule,
                      color: Colors.white,
                      size: 16,
                    ),
                  ),
                  if (!isLast)
                    Container(
                      width: 2,
                      height: 50,
                      color: Colors.white.withOpacity(0.2),
                      margin: const EdgeInsets.symmetric(vertical: 4),
                    ),
                ],
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white.withOpacity(0.1)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item['title'],
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                      if (item['description'] != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          item['description'],
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: Colors.white70),
                        ),
                      ],
                      const SizedBox(height: 4),
                      Text(
                        item['date'] ?? 'Date not available',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.white54,
                          fontStyle: FontStyle.italic,
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

  Widget _buildCommentsSection() {
    final comments = _complaintData!['comments'] as List;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Comments & Updates',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        ...comments.map((comment) {
          return Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            margin: const EdgeInsets.only(bottom: 12),
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
                    Icon(
                      comment['userRole'] == 'citizen'
                          ? Icons.person
                          : Icons.support_agent,
                      size: 16,
                      color: comment['userRole'] == 'citizen'
                          ? AppColors.info
                          : AppColors.success,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      comment['userName'] ?? 'Unknown User',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      _formatDate(comment['createdAt']),
                      style: TextStyle(color: Colors.white54, fontSize: 12),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  comment['comment'] ?? '',
                  style: TextStyle(color: Colors.white70, fontSize: 14),
                ),
              ],
            ),
          );
        }).toList(),
      ],
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return AppColors.warning;
      case 'acknowledged':
        return AppColors.info;
      case 'in progress':
        return Colors.orange;
      case 'resolved':
      case 'closed':
        return AppColors.success;
      case 'rejected':
        return AppColors.error;
      default:
        return Colors.white70;
    }
  }

  String _formatDate(String? dateString) {
    if (dateString == null) return 'Not available';

    try {
      final date = DateTime.parse(dateString);
      return '${date.day}/${date.month}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return dateString;
    }
  }

  void _copyToClipboard(String text) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Complaint ID copied to clipboard'),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }

  Future<void> _trackComplaint() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _complaintData = null;
    });

    try {
      final token = await AuthService.getToken();
      if (token == null) {
        throw Exception('Please login to track complaints');
      }

      final complaintId = _complaintIdController.text.trim();
      final response = await ComplaintService.getComplaint(complaintId, token);

      if (response['success']) {
        setState(() {
          _complaintData = response['data']['complaint'];
          _errorMessage = null;
        });
      } else {
        setState(() {
          _errorMessage = response['message'] ?? 'Complaint not found';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().contains('Exception:')
            ? e.toString().replaceAll('Exception:', '').trim()
            : 'Error tracking complaint: $e';
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }
}
