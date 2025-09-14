// lib/screens/payment_screen.dart
import 'package:flutter/material.dart';
import '../utils/colors.dart';
import '../widgets/custom_button.dart';

class PaymentScreen extends StatefulWidget {
  const PaymentScreen({Key? key}) : super(key: key);

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
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
        title: const Text('Payments & Bills'),
        centerTitle: true,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: const [
            Tab(text: 'Pay Bills'),
            Tab(text: 'History'),
            Tab(text: 'Pending'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          PayBillsTab(),
          PaymentHistoryTab(),
          PendingPaymentsTab(),
        ],
      ),
    );
  }
}

class PayBillsTab extends StatelessWidget {
  const PayBillsTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final bills = [
      {'name': 'Property Tax', 'amount': '₹15,000', 'due': '15 Dec 2025', 'icon': Icons.home},
      {'name': 'Water Bill', 'amount': '₹1,200', 'due': '10 Dec 2025', 'icon': Icons.water_drop},
      {'name': 'Waste Management', 'amount': '₹800', 'due': '20 Dec 2025', 'icon': Icons.delete},
      {'name': 'Trade License', 'amount': '₹5,000', 'due': '25 Dec 2025', 'icon': Icons.business},
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Quick Pay Card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [AppColors.accent, AppColors.secondary],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.flash_on, color: Colors.white, size: 32),
                const SizedBox(height: 12),
                Text(
                  'Quick Pay',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  'Pay all your bills instantly with one tap',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.white70,
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => _showQuickPayDialog(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: AppColors.primary,
                  ),
                  child: const Text('Pay All Due Bills'),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          Text(
            'Available Bills',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          
          const SizedBox(height: 16),
          
          ...bills.map((bill) => _buildBillCard(context, bill)),
        ],
      ),
    );
  }

  Widget _buildBillCard(BuildContext context, Map<String, dynamic> bill) {
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
              bill['icon'],
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
                  bill['name'],
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Due: ${bill['due']}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white70,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                bill['amount'],
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.accent,
                ),
              ),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: () => _showPaymentDialog(context, bill),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.accent,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  minimumSize: const Size(0, 0),
                ),
                child: const Text('Pay Now', style: TextStyle(fontSize: 12)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showQuickPayDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Quick Pay All', style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Pay all due bills with one transaction',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.white70,
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Total Amount:', style: TextStyle(color: Colors.white)),
                  Text(
                    '₹22,000',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppColors.accent,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: Colors.white70)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Process payment
            },
            child: const Text('Proceed to Pay'),
          ),
        ],
      ),
    );
  }

  void _showPaymentDialog(BuildContext context, Map<String, dynamic> bill) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: Text('Pay ${bill['name']}', style: const TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(bill['icon'], color: AppColors.accent, size: 48),
            const SizedBox(height: 16),
            Text(
              'Amount: ${bill['amount']}',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              'Due Date: ${bill['due']}',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.white70,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: Colors.white70)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _processPayment(context, bill);
            },
            child: const Text('Pay Now'),
          ),
        ],
      ),
    );
  }

  void _processPayment(BuildContext context, Map<String, dynamic> bill) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const AlertDialog(
        backgroundColor: AppColors.surface,
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(color: Colors.white),
            SizedBox(height: 16),
            Text('Processing Payment...', style: TextStyle(color: Colors.white)),
          ],
        ),
      ),
    );

    Future.delayed(const Duration(seconds: 2), () {
      Navigator.pop(context);
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          backgroundColor: AppColors.surface,
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.check_circle, color: AppColors.success, size: 64),
              const SizedBox(height: 16),
              const Text('Payment Successful!', style: TextStyle(color: Colors.white)),
              const SizedBox(height: 8),
              Text(
                'Transaction ID: TXN${DateTime.now().millisecondsSinceEpoch}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white70,
                ),
              ),
            ],
          ),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('OK'),
            ),
          ],
        ),
      );
    });
  }
}

class PaymentHistoryTab extends StatelessWidget {
  const PaymentHistoryTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final history = [
      {
        'name': 'Property Tax',
        'amount': '₹15,000',
        'date': '28 Nov 2025',
        'status': 'Completed',
        'icon': Icons.home,
        'txnId': 'TXN1234567890'
      },
      {
        'name': 'Water Bill',
        'amount': '₹1,100',
        'date': '25 Nov 2025',
        'status': 'Completed',
        'icon': Icons.water_drop,
        'txnId': 'TXN1234567889'
      },
      {
        'name': 'Trade License',
        'amount': '₹5,000',
        'date': '20 Nov 2025',
        'status': 'Completed',
        'icon': Icons.business,
        'txnId': 'TXN1234567888'
      },
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Payment History',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 16),
          
          ...history.map((payment) => _buildHistoryCard(context, payment)),
        ],
      ),
    );
  }

  Widget _buildHistoryCard(BuildContext context, Map<String, dynamic> payment) {
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
              color: AppColors.success.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              payment['icon'],
              color: AppColors.success,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  payment['name'],
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  payment['date'],
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white70,
                  ),
                ),
                Text(
                  'ID: ${payment['txnId']}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white54,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                payment['amount'],
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.success,
                ),
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.success.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  payment['status'],
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.success,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class PendingPaymentsTab extends StatelessWidget {
  const PendingPaymentsTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.check_circle_outline,
            size: 64,
            color: Colors.white30,
          ),
          SizedBox(height: 16),
          Text(
            'No Pending Payments',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
          ),
          SizedBox(height: 8),
          Text(
            'All your payments are up to date',
            style: TextStyle(
              color: Colors.white54,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}