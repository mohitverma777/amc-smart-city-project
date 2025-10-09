// lib/screens/payment_screen.dart
import 'package:flutter/material.dart';
import '../utils/colors.dart';
import '../services/payment_service.dart';
import '../services/auth_service.dart'; // ✅ Import AuthService

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

class PayBillsTab extends StatefulWidget {
  const PayBillsTab({Key? key}) : super(key: key);

  @override
  State<PayBillsTab> createState() => _PayBillsTabState();
}

class _PayBillsTabState extends State<PayBillsTab> {
  List<dynamic> bills = [];
  bool isLoading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    _loadBills();
  }

  Future<void> _loadBills() async {
    try {
      setState(() {
        isLoading = true;
        error = null;
      });

      // ✅ Use AuthService.getToken() like in track complaint screen
      final token = await AuthService.getToken();

      if (token == null) {
        setState(() {
          error = 'Please login to view bills';
          isLoading = false;
        });
        return;
      }

      print('🔑 Retrieved token: $token'); // Debug log

      final result = await PaymentService.getCitizenBills(token);

      print('📨 PaymentService response: $result'); // Debug log

      if (result['success']) {
        setState(() {
          bills = result['data']['data']['bills'] ?? [];
          isLoading = false;
        });
      } else {
        // If no bills found, try to generate sample bills for demo
        await _generateSampleBills(token);
      }
    } catch (e) {
      print('❌ Error loading bills: $e');
      setState(() {
        error = 'Error loading bills: $e';
        isLoading = false;
      });
    }
  }

  Future<void> _generateSampleBills(String token) async {
    try {
      print('🔧 Generating sample bills...');
      final result = await PaymentService.generateSampleBills(token);
      if (result['success']) {
        // Reload bills after generating samples
        await _loadBills();
      } else {
        setState(() {
          error = result['message'] ?? 'Failed to generate sample bills';
          isLoading = false;
        });
      }
    } catch (e) {
      print('❌ Error generating sample bills: $e');
      setState(() {
        error = 'Error generating sample bills: $e';
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Colors.white),
      );
    }

    if (error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.white54),
            const SizedBox(height: 16),
            Text(
              error!,
              style: const TextStyle(color: Colors.white70),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _loadBills, child: const Text('Retry')),
          ],
        ),
      );
    }

    if (bills.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.receipt_outlined, size: 64, color: Colors.white54),
            const SizedBox(height: 16),
            const Text(
              'No Bills Found',
              style: TextStyle(color: Colors.white70, fontSize: 18),
            ),
            const SizedBox(height: 8),
            const Text(
              'All your bills are paid or no bills generated yet',
              style: TextStyle(color: Colors.white54),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () async {
                final token = await AuthService.getToken();
                if (token != null) {
                  await _generateSampleBills(token);
                }
              },
              child: const Text('Generate Sample Bills'),
            ),
            const SizedBox(height: 8),
            ElevatedButton(onPressed: _loadBills, child: const Text('Refresh')),
          ],
        ),
      );
    }

    final totalAmount = bills.fold<double>(
      0.0,
      (sum, bill) => sum + double.parse(bill['amount'].toString()),
    );

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
                  'Quick Pay All',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  'Pay all your bills instantly with one tap',
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(color: Colors.white70),
                ),
                const SizedBox(height: 8),
                Text(
                  '₹${totalAmount.toStringAsFixed(0)}',
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: totalAmount > 0
                      ? () => _showQuickPayDialog(context, totalAmount)
                      : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: AppColors.primary,
                  ),
                  child: Text(
                    totalAmount > 0 ? 'Pay All Due Bills' : 'No Bills to Pay',
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          Text(
            'Available Bills (${bills.length})',
            style: Theme.of(context).textTheme.headlineSmall,
          ),

          const SizedBox(height: 16),

          ...bills.map((bill) => _buildBillCard(context, bill)),
        ],
      ),
    );
  }

  Widget _buildBillCard(BuildContext context, Map<String, dynamic> bill) {
    final iconMap = {
      'Property Tax': Icons.home,
      'Water Bill': Icons.water_drop,
      'Waste Management': Icons.delete,
      'Trade License': Icons.business,
      'Street Lighting': Icons.lightbulb,
      'Birth Certificate': Icons.child_friendly,
      'Death Certificate': Icons.person,
    };

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
              iconMap[bill['billType']] ?? Icons.receipt,
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
                  bill['billType'] ?? 'Unknown Bill',
                  style: Theme.of(
                    context,
                  ).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 4),
                Text(
                  'Due: ${_formatDate(bill['dueDate'])}',
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: Colors.white70),
                ),
                if (bill['description'] != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    bill['description'],
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.white54,
                      fontSize: 11,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '₹${double.parse(bill['amount'].toString()).toStringAsFixed(0)}',
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
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
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

  String _formatDate(String? dateStr) {
    if (dateStr == null) return 'No due date';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return dateStr;
    }
  }

  void _showQuickPayDialog(BuildContext context, double totalAmount) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text(
          'Quick Pay All',
          style: TextStyle(color: Colors.white),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Pay all due bills with one transaction',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: Colors.white70),
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
                  const Text(
                    'Total Amount:',
                    style: TextStyle(color: Colors.white),
                  ),
                  Text(
                    '₹${totalAmount.toStringAsFixed(0)}',
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
            child: const Text(
              'Cancel',
              style: TextStyle(color: Colors.white70),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _processAllPayments(totalAmount);
            },
            child: const Text('Proceed to Pay'),
          ),
        ],
      ),
    );
  }

  void _showPaymentDialog(BuildContext context, Map<String, dynamic> bill) {
    final iconMap = {
      'Property Tax': Icons.home,
      'Water Bill': Icons.water_drop,
      'Waste Management': Icons.delete,
      'Trade License': Icons.business,
      'Street Lighting': Icons.lightbulb,
      'Birth Certificate': Icons.child_friendly,
      'Death Certificate': Icons.person,
    };

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: Text(
          'Pay ${bill['billType']}',
          style: const TextStyle(color: Colors.white),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              iconMap[bill['billType']] ?? Icons.receipt,
              color: AppColors.accent,
              size: 48,
            ),
            const SizedBox(height: 16),
            Text(
              'Amount: ₹${double.parse(bill['amount'].toString()).toStringAsFixed(0)}',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              'Due Date: ${_formatDate(bill['dueDate'])}',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: Colors.white70),
            ),
            if (bill['description'] != null) ...[
              const SizedBox(height: 8),
              Text(
                bill['description'],
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: Colors.white54),
                textAlign: TextAlign.center,
              ),
            ],
          ],
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
              _processPayment(context, bill);
            },
            child: const Text('Pay Now'),
          ),
        ],
      ),
    );
  }

  Future<void> _processPayment(
    BuildContext context,
    Map<String, dynamic> bill,
  ) async {
    // Show loading dialog
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
            Text(
              'Processing Payment...',
              style: TextStyle(color: Colors.white),
            ),
          ],
        ),
      ),
    );

    try {
      final token = await AuthService.getToken();

      if (token == null) {
        if (mounted) Navigator.pop(context); // ✅ Close loading dialog
        _showErrorDialog(context, 'Please login to make payment');
        return;
      }

      print('💳 Processing payment for bill: ${bill['id']}');

      final result = await PaymentService.processPayment(
        billIds: [bill['id']],
        totalAmount: double.parse(bill['amount'].toString()),
        token: token,
      );

      print('📨 Payment result: $result'); // ✅ Debug log

      // ✅ IMPORTANT: Close loading dialog FIRST before showing success/error
      if (mounted) Navigator.pop(context);

      if (result['success'] == true) {
        print('✅ Payment successful!');

        final payments = result['data']['data']['payments'] as List;
        final payment = payments.first;

        _showSuccessDialog(context, payment);

        // Reload bills to reflect payment
        await _loadBills();
      } else {
        print('❌ Payment failed: ${result['message']}');
        _showErrorDialog(context, result['message'] ?? 'Payment failed');
      }
    } catch (e) {
      print('❌ Exception during payment: $e');

      // ✅ Make sure to close loading dialog even on error
      if (mounted) Navigator.pop(context);
      _showErrorDialog(context, 'Payment failed: $e');
    }
  }

  Future<void> _processAllPayments(double totalAmount) async {
    // Show loading dialog
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
            Text(
              'Processing All Payments...',
              style: TextStyle(color: Colors.white),
            ),
          ],
        ),
      ),
    );

    try {
      final token = await AuthService.getToken();

      if (token == null) {
        if (mounted) Navigator.pop(context); // ✅ Close loading dialog
        _showErrorDialog(context, 'Please login to make payment');
        return;
      }

      final billIds = bills.map((bill) => bill['id'].toString()).toList();

      print('💳 Processing ${billIds.length} payments...');

      final result = await PaymentService.processPayment(
        billIds: billIds,
        totalAmount: totalAmount,
        token: token,
      );

      print('📨 Payment result: $result'); // ✅ Debug log

      // ✅ IMPORTANT: Close loading dialog FIRST
      if (mounted) Navigator.pop(context);

      if (result['success'] == true) {
        print('✅ All payments successful!');

        final payments = result['data']['data']['payments'] as List;

        _showAllPaymentsSuccessDialog(context, payments);

        // Reload bills to reflect payments
        await _loadBills();
      } else {
        print('❌ Payment failed: ${result['message']}');
        _showErrorDialog(context, result['message'] ?? 'Payment failed');
      }
    } catch (e) {
      print('❌ Exception during payment: $e');

      // ✅ Make sure to close loading dialog even on error
      if (mounted) Navigator.pop(context);
      _showErrorDialog(context, 'Payment failed: $e');
    }
  }

  void _showSuccessDialog(BuildContext context, Map<String, dynamic> payment) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.check_circle, color: AppColors.success, size: 64),
            const SizedBox(height: 16),
            const Text(
              'Payment Successful!',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Amount: ₹${double.parse(payment['amount'].toString()).toStringAsFixed(0)}',
              style: Theme.of(
                context,
              ).textTheme.bodyLarge?.copyWith(color: Colors.white),
            ),
            const SizedBox(height: 8),
            Text(
              'Transaction ID: ${payment['transactionId']}',
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: Colors.white70),
            ),
            Text(
              'Payment Number: ${payment['paymentNumber']}',
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: Colors.white70),
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
  }

  void _showAllPaymentsSuccessDialog(
    BuildContext context,
    List<dynamic> payments,
  ) {
    final totalAmount = payments.fold<double>(
      0.0,
      (sum, payment) => sum + double.parse(payment['amount'].toString()),
    );

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.check_circle, color: AppColors.success, size: 64),
            const SizedBox(height: 16),
            const Text(
              'All Payments Successful!',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Total Amount: ₹${totalAmount.toStringAsFixed(0)}',
              style: Theme.of(
                context,
              ).textTheme.bodyLarge?.copyWith(color: Colors.white),
            ),
            Text(
              'Bills Paid: ${payments.length}',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: Colors.white70),
            ),
            const SizedBox(height: 8),
            const Text(
              'All transactions completed successfully',
              style: TextStyle(color: Colors.white54),
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
  }

  void _showErrorDialog(BuildContext context, String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: Colors.redAccent, size: 64),
            const SizedBox(height: 16),
            const Text(
              'Payment Failed',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              style: const TextStyle(color: Colors.white70),
              textAlign: TextAlign.center,
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
  }
}

// Payment History Tab - Dynamic version
class PaymentHistoryTab extends StatefulWidget {
  const PaymentHistoryTab({Key? key}) : super(key: key);

  @override
  State<PaymentHistoryTab> createState() => _PaymentHistoryTabState();
}

class _PaymentHistoryTabState extends State<PaymentHistoryTab> {
  List<dynamic> paymentHistory = [];
  bool isLoading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    _loadPaymentHistory();
  }

  Future<void> _loadPaymentHistory() async {
    try {
      setState(() {
        isLoading = true;
        error = null;
      });

      // ✅ Use AuthService.getToken()
      final token = await AuthService.getToken();

      if (token == null) {
        setState(() {
          error = 'Please login to view payment history';
          isLoading = false;
        });
        return;
      }

      final result = await PaymentService.getPaymentHistory(token);

      if (result['success']) {
        setState(() {
          paymentHistory = result['data']['data']['payments'] ?? [];
          isLoading = false;
        });
      } else {
        setState(() {
          error = result['message'] ?? 'Failed to load payment history';
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        error = 'Error loading payment history: $e';
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Colors.white),
      );
    }

    if (error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.white54),
            const SizedBox(height: 16),
            Text(
              error!,
              style: const TextStyle(color: Colors.white70),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadPaymentHistory,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (paymentHistory.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.receipt_long_outlined, size: 64, color: Colors.white54),
            SizedBox(height: 16),
            Text(
              'No Payment History',
              style: TextStyle(color: Colors.white70, fontSize: 18),
            ),
            SizedBox(height: 8),
            Text(
              'Your completed payments will appear here',
              style: TextStyle(color: Colors.white54),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Payment History (${paymentHistory.length})',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 16),

          ...paymentHistory.map(
            (payment) => _buildHistoryCard(context, payment),
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryCard(BuildContext context, Map<String, dynamic> payment) {
    final iconMap = {
      'Property Tax': Icons.home,
      'Water Bill': Icons.water_drop,
      'Waste Management': Icons.delete,
      'Trade License': Icons.business,
      'Street Lighting': Icons.lightbulb,
      'Birth Certificate': Icons.child_friendly,
      'Death Certificate': Icons.person,
    };

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
              iconMap[payment['billType']] ?? Icons.receipt,
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
                  payment['billType'] ?? 'Unknown Payment',
                  style: Theme.of(
                    context,
                  ).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 4),
                Text(
                  _formatDate(payment['paidAt']),
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: Colors.white70),
                ),
                Text(
                  'ID: ${payment['transactionId']}',
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
                '₹${double.parse(payment['amount'].toString()).toStringAsFixed(0)}',
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
                  payment['status'] ?? 'Completed',
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

  String _formatDate(String? dateStr) {
    if (dateStr == null) return 'Unknown date';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return dateStr;
    }
  }
}

// Pending Payments Tab - Dynamic version
class PendingPaymentsTab extends StatefulWidget {
  const PendingPaymentsTab({Key? key}) : super(key: key);

  @override
  State<PendingPaymentsTab> createState() => _PendingPaymentsTabState();
}

class _PendingPaymentsTabState extends State<PendingPaymentsTab> {
  List<dynamic> pendingPayments = [];
  bool isLoading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    _loadPendingPayments();
  }

  Future<void> _loadPendingPayments() async {
    try {
      setState(() {
        isLoading = true;
        error = null;
      });

      // ✅ Use AuthService.getToken()
      final token = await AuthService.getToken();

      if (token == null) {
        setState(() {
          error = 'Please login to view pending payments';
          isLoading = false;
        });
        return;
      }

      final result = await PaymentService.getPendingPayments(token);

      if (result['success']) {
        setState(() {
          pendingPayments = result['data']['data']['payments'] ?? [];
          isLoading = false;
        });
      } else {
        setState(() {
          error = result['message'] ?? 'Failed to load pending payments';
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        error = 'Error loading pending payments: $e';
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Colors.white),
      );
    }

    if (error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.white54),
            const SizedBox(height: 16),
            Text(
              error!,
              style: const TextStyle(color: Colors.white70),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadPendingPayments,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (pendingPayments.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.check_circle_outline, size: 64, color: Colors.white30),
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
              style: TextStyle(color: Colors.white54, fontSize: 14),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Pending Payments (${pendingPayments.length})',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 16),

          ...pendingPayments.map(
            (payment) => _buildPendingCard(context, payment),
          ),
        ],
      ),
    );
  }

  Widget _buildPendingCard(BuildContext context, Map<String, dynamic> payment) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.orange.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.orange.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.pending_actions,
              color: Colors.orange,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  payment['billType'] ?? 'Unknown Payment',
                  style: Theme.of(
                    context,
                  ).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 4),
                Text(
                  'Amount: ₹${double.parse(payment['amount'].toString()).toStringAsFixed(0)}',
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: Colors.white70),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.orange.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              payment['status'] ?? 'Pending',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.orange,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
