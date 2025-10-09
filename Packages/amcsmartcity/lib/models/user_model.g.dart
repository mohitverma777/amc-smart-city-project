// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

User _$UserFromJson(Map<String, dynamic> json) => User(
  id: json['id'] as String,
  name: json['name'] as String,
  email: json['email'] as String,
  mobileNumber: json['mobileNumber'] as String?,
  citizenId: json['citizenId'] as String?,
  employeeId: json['employeeId'] as String?,
  role: json['role'] as String,
  ward: json['ward'] as String?,
  department: json['department'] as String?,
  verificationStatus: json['verificationStatus'] == null
      ? null
      : VerificationStatus.fromJson(
          json['verificationStatus'] as Map<String, dynamic>,
        ),
  dateOfBirth: json['dateOfBirth'] as String?,
  gender: json['gender'] as String?,
  address: json['address'] as Map<String, dynamic>?,
  createdAt: json['createdAt'] == null
      ? null
      : DateTime.parse(json['createdAt'] as String),
  updatedAt: json['updatedAt'] == null
      ? null
      : DateTime.parse(json['updatedAt'] as String),
  lastLogin: json['lastLogin'] == null
      ? null
      : DateTime.parse(json['lastLogin'] as String),
);

Map<String, dynamic> _$UserToJson(User instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'email': instance.email,
  'mobileNumber': instance.mobileNumber,
  'citizenId': instance.citizenId,
  'employeeId': instance.employeeId,
  'role': instance.role,
  'ward': instance.ward,
  'department': instance.department,
  'verificationStatus': instance.verificationStatus,
  'dateOfBirth': instance.dateOfBirth,
  'gender': instance.gender,
  'address': instance.address,
  'createdAt': instance.createdAt?.toIso8601String(),
  'updatedAt': instance.updatedAt?.toIso8601String(),
  'lastLogin': instance.lastLogin?.toIso8601String(),
};

VerificationStatus _$VerificationStatusFromJson(Map<String, dynamic> json) =>
    VerificationStatus(
      mobile: json['mobile'] as bool,
      email: json['email'] as bool,
    );

Map<String, dynamic> _$VerificationStatusToJson(VerificationStatus instance) =>
    <String, dynamic>{'mobile': instance.mobile, 'email': instance.email};
