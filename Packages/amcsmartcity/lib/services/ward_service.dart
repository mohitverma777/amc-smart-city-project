// lib/services/ward_service.dart
class WardService {
  static final WardService _instance = WardService._internal();
  factory WardService() => _instance;
  WardService._internal();

  final List<Ward> _wards = [
    Ward(id: 'ward_1', name: 'Ward 1 - Shahpur', zone: 'Zone A'),
    Ward(id: 'ward_2', name: 'Ward 2 - Raikhad', zone: 'Zone A'),
    Ward(id: 'ward_3', name: 'Ward 3 - Dariapur', zone: 'Zone A'),
    Ward(id: 'ward_4', name: 'Ward 4 - Kalupur', zone: 'Zone A'),
    Ward(id: 'ward_5', name: 'Ward 5 - Madhupura', zone: 'Zone A'),
    // Add more wards as needed
  ];

  List<Ward> getAllWards() => _wards;

  Ward? getWardById(String id) {
    try {
      return _wards.firstWhere((ward) => ward.id == id);
    } catch (e) {
      return null;
    }
  }
}

class Ward {
  final String id;
  final String name;
  final String zone;

  Ward({required this.id, required this.name, required this.zone});

  @override
  String toString() => name;
}
