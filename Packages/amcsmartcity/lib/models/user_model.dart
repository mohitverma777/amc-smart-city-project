// lib/models/user_model.dart
import 'package:json_annotation/json_annotation.dart';

part 'user_model.g.dart';

@JsonSerializable()
class User {
  final String id;
  final String name;
  final String email;
  final String? mobileNumber;
  final String? citizenId;
  final String? employeeId;
  final String role;
  final String? ward;
  final String? department;
  final VerificationStatus? verificationStatus; // ✅ Changed to object
  final String? dateOfBirth;
  final String? gender;
  final Map<String, dynamic>? address;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final DateTime? lastLogin; // ✅ Added this field

  User({
    required this.id,
    required this.name,
    required this.email,
    this.mobileNumber,
    this.citizenId,
    this.employeeId,
    required this.role,
    this.ward,
    this.department,
    this.verificationStatus,
    this.dateOfBirth,
    this.gender,
    this.address,
    this.createdAt,
    this.updatedAt,
    this.lastLogin,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    print('🔍 User.fromJson input: $json');
    try {
      return _$UserFromJson(json);
    } catch (e) {
      print('💥 User parsing error: $e');
      print('💥 Failed field data: $json');
      rethrow;
    }
  }

  Map<String, dynamic> toJson() => _$UserToJson(this);

  @override
  String toString() {
    return 'User(id: $id, name: $name, email: $email, role: $role, citizenId: $citizenId)';
  }
}

// ✅ Add VerificationStatus model
@JsonSerializable()
class VerificationStatus {
  final bool mobile;
  final bool email;

  VerificationStatus({
    required this.mobile,
    required this.email,
  });

  factory VerificationStatus.fromJson(Map<String, dynamic> json) {
    return _$VerificationStatusFromJson(json);
  }

  Map<String, dynamic> toJson() => _$VerificationStatusToJson(this);

  @override
  String toString() {
    return 'VerificationStatus(mobile: $mobile, email: $email)';
  }
}
