// src/services/departmentService.js
// Mock service for departments until backend is implemented

const mockDepartments = [
  'Municipal Administration',
  'Public Works Department',
  'Water Supply & Sanitation',
  'Solid Waste Management',
  'Traffic & Transportation',
  'Town Planning',
  'Health Department',
  'Fire Safety',
  'Property Tax',
  'Licensing Department',
  'IT Department',
  'Finance Department'
];

export const fetchDepartments = async () => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockDepartments;
};

export default {
  fetchDepartments
};