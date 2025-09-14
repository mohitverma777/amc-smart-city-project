// lib/screens/documents_screen.dart
import 'package:flutter/material.dart';
import '../utils/colors.dart';

class DocumentsScreen extends StatefulWidget {
  const DocumentsScreen({Key? key}) : super(key: key);

  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Documents'),
        centerTitle: true,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: const [
            Tab(text: 'My Documents'),
            Tab(text: 'Applications'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          MyDocumentsTab(),
          ApplicationsTab(),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showNewDocumentDialog(context),
        backgroundColor: AppColors.accent,
        icon: const Icon(Icons.add),
        label: const Text('New Request'),
      ),
    );
  }

  void _showNewDocumentDialog(BuildContext context) {
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
              'Request New Document',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 20),
            
            _buildDocumentOption(
              context,
              'Birth Certificate',
              Icons.child_care,
              () => Navigator.pop(context),
            ),
            _buildDocumentOption(
              context,
              'Marriage Certificate',
              Icons.favorite,
              () => Navigator.pop(context),
            ),
            _buildDocumentOption(
              context,
              'Property Papers',
              Icons.description,
              () => Navigator.pop(context),
            ),
            _buildDocumentOption(
              context,
              'Trade License',
              Icons.business,
              () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDocumentOption(
    BuildContext context,
    String title,
    IconData icon,
    VoidCallback onTap,
  ) {
    return ListTile(
      leading: Icon(icon, color: Colors.white),
      title: Text(title, style: const TextStyle(color: Colors.white)),
      trailing: const Icon(Icons.arrow_forward_ios, color: Colors.white54, size: 16),
      onTap: onTap,
    );
  }
}

class MyDocumentsTab extends StatelessWidget {
  const MyDocumentsTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final documents = [
      {
        'name': 'Birth Certificate',
        'type': 'Certificate',
        'date': '15 Nov 2025',
        'status': 'Ready',
        'icon': Icons.child_care,
      },
      {
        'name': 'Property Tax Receipt',
        'type': 'Receipt',
        'date': '28 Nov 2025',
        'status': 'Downloaded',
        'icon': Icons.receipt,
      },
      {
        'name': 'Trade License',
        'type': 'License',
        'date': '20 Oct 2025',
        'status': 'Active',
        'icon': Icons.business,
      },
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Your Documents',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 16),
          
          ...documents.map((doc) => _buildDocumentCard(context, doc)),
          
          if (documents.isEmpty)
            const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.folder_open,
                    size: 64,
                    color: Colors.white30,
                  ),
                  SizedBox(height: 16),
                  Text(
                    'No Documents Found',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildDocumentCard(BuildContext context, Map<String, dynamic> doc) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.accent.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              doc['icon'],
              color: AppColors.accent,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  doc['name'],
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${doc['type']} • ${doc['date']}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white70,
                  ),
                ),
              ],
            ),
          ),
          Column(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.success.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  doc['status'],
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.success,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    onPressed: () {
                      // Download document
                    },
                    icon: const Icon(Icons.download, color: Colors.white70),
                    constraints: const BoxConstraints(),
                    padding: const EdgeInsets.all(4),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: () {
                      // Share document
                    },
                    icon: const Icon(Icons.share, color: Colors.white70),
                    constraints: const BoxConstraints(),
                    padding: const EdgeInsets.all(4),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class ApplicationsTab extends StatelessWidget {
  const ApplicationsTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final applications = [
      {
        'name': 'Marriage Certificate Application',
        'id': 'APP123456789',
        'date': '2 Dec 2025',
        'status': 'Under Review',
        'icon': Icons.favorite,
      },
      {
        'name': 'NOC Application',
        'id': 'APP123456788',
        'date': '28 Nov 2025',
        'status': 'Approved',
        'icon': Icons.verified,
      },
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Application Status',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 16),
          
          ...applications.map((app) => _buildApplicationCard(context, app)),
        ],
      ),
    );
  }

  Widget _buildApplicationCard(BuildContext context, Map<String, dynamic> app) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
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
              Icon(app['icon'], color: AppColors.accent, size: 24),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      app['name'],
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'ID: ${app['id']}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white70,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _getStatusColor(app['status']).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  app['status'],
                  style: TextStyle(
                    color: _getStatusColor(app['status']),
                    fontWeight: FontWeight.w500,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.calendar_today, color: Colors.white70, size: 16),
              const SizedBox(width: 8),
              Text(
                'Applied on ${app['date']}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white70,
                ),
              ),
              const Spacer(),
              TextButton(
                onPressed: () {
                  // Track application
                },
                child: const Text('Track Status'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'under review':
        return AppColors.warning;
      case 'approved':
        return AppColors.success;
      case 'rejected':
        return AppColors.error;
      default:
        return Colors.white70;
    }
  }
}