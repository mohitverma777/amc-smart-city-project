// lib/screens/notifications_screen.dart
import 'package:flutter/material.dart';
import '../utils/colors.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({Key? key}) : super(key: key);

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final List<Map<String, dynamic>> _notifications = [
    {
      'title': 'Payment Reminder',
      'message': 'Your water bill is due in 3 days. Amount: ₹1,200',
      'icon': Icons.water_drop,
      'color': AppColors.info,
      'time': '2 hours ago',
      'isRead': false,
      'type': 'payment',
    },
    {
      'title': 'Complaint Update',
      'message': 'Your complaint #CMP1234567890 has been resolved',
      'icon': Icons.check_circle,
      'color': AppColors.success,
      'time': '1 day ago',
      'isRead': true,
      'type': 'complaint',
    },
    {
      'title': 'New Service Available',
      'message': 'Online property tax payment is now available',
      'icon': Icons.new_releases,
      'color': AppColors.accent,
      'time': '2 days ago',
      'isRead': true,
      'type': 'service',
    },
    {
      'title': 'Maintenance Schedule',
      'message': 'Water supply will be interrupted tomorrow 10AM-2PM',
      'icon': Icons.warning,
      'color': AppColors.warning,
      'time': '3 days ago',
      'isRead': true,
      'type': 'maintenance',
    },
    {
      'title': 'Document Ready',
      'message': 'Your birth certificate is ready for download',
      'icon': Icons.description,
      'color': AppColors.success,
      'time': '5 days ago',
      'isRead': true,
      'type': 'document',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        centerTitle: true,
        actions: [
          IconButton(
            onPressed: _markAllAsRead,
            icon: const Icon(Icons.done_all),
            tooltip: 'Mark all as read',
          ),
          PopupMenuButton(
            icon: const Icon(Icons.more_vert),
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'clear_all',
                child: Text('Clear all notifications'),
              ),
              const PopupMenuItem(
                value: 'settings',
                child: Text('Notification settings'),
              ),
            ],
            onSelected: (value) {
              if (value == 'clear_all') {
                _clearAllNotifications();
              } else if (value == 'settings') {
                // Navigate to notification settings
              }
            },
          ),
        ],
      ),
      body: _notifications.isEmpty
          ? _buildEmptyState()
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _notifications.length,
              itemBuilder: (context, index) {
                final notification = _notifications[index];
                return _buildNotificationCard(context, notification, index);
              },
            ),
    );
  }

  Widget _buildNotificationCard(
    BuildContext context,
    Map<String, dynamic> notification,
    int index,
  ) {
    return Dismissible(
      key: Key('notification_$index'),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        decoration: BoxDecoration(
          color: AppColors.error.withOpacity(0.8),
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Icon(Icons.delete, color: Colors.white, size: 24),
      ),
      onDismissed: (direction) {
        setState(() {
          _notifications.removeAt(index);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${notification['title']} dismissed'),
            action: SnackBarAction(
              label: 'Undo',
              onPressed: () {
                setState(() {
                  _notifications.insert(index, notification);
                });
              },
            ),
          ),
        );
      },
      child: GestureDetector(
        onTap: () => _markAsRead(index),
        child: Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: notification['isRead']
                ? Colors.white.withOpacity(0.03)
                : Colors.white.withOpacity(0.08),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: notification['isRead']
                  ? Colors.white.withOpacity(0.1)
                  : Colors.white.withOpacity(0.2),
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: notification['color'].withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  notification['icon'],
                  color: notification['color'],
                  size: 20,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            notification['title'],
                            style: Theme.of(context).textTheme.bodyLarge
                                ?.copyWith(
                                  fontWeight: notification['isRead']
                                      ? FontWeight.w400
                                      : FontWeight.w600,
                                ),
                          ),
                        ),
                        if (!notification['isRead'])
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: AppColors.accent,
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      notification['message'],
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white70,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: _getTypeColor(
                              notification['type'],
                            ).withOpacity(0.2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            _getTypeLabel(notification['type']),
                            style: TextStyle(
                              color: _getTypeColor(notification['type']),
                              fontSize: 10,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        const Spacer(),
                        Text(
                          notification['time'],
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: Colors.white54, fontSize: 11),
                        ),
                      ],
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

  Widget _buildEmptyState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.notifications_none, size: 64, color: Colors.white30),
          SizedBox(height: 16),
          Text(
            'No Notifications',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 18,
              fontWeight: FontWeight.w500,
            ),
          ),
          SizedBox(height: 8),
          Text(
            'You\'re all caught up!',
            style: TextStyle(color: Colors.white54, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Color _getTypeColor(String type) {
    switch (type) {
      case 'payment':
        return AppColors.warning;
      case 'complaint':
        return AppColors.info;
      case 'service':
        return AppColors.accent;
      case 'maintenance':
        return AppColors.error;
      case 'document':
        return AppColors.success;
      default:
        return Colors.white70;
    }
  }

  String _getTypeLabel(String type) {
    switch (type) {
      case 'payment':
        return 'PAYMENT';
      case 'complaint':
        return 'COMPLAINT';
      case 'service':
        return 'SERVICE';
      case 'maintenance':
        return 'MAINTENANCE';
      case 'document':
        return 'DOCUMENT';
      default:
        return 'OTHER';
    }
  }

  void _markAsRead(int index) {
    setState(() {
      _notifications[index]['isRead'] = true;
    });
  }

  void _markAllAsRead() {
    setState(() {
      for (var notification in _notifications) {
        notification['isRead'] = true;
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('All notifications marked as read')),
    );
  }

  void _clearAllNotifications() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text(
          'Clear All Notifications',
          style: TextStyle(color: Colors.white),
        ),
        content: const Text(
          'Are you sure you want to clear all notifications? This action cannot be undone.',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              'Cancel',
              style: TextStyle(color: Colors.white70),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() {
                _notifications.clear();
              });
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('All notifications cleared')),
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Clear All'),
          ),
        ],
      ),
    );
  }
}
