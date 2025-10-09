require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3002';

async function testComplaintService() {
  try {
    console.log('��� Starting Complaint Service Tests...\n');

    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data.status);
    console.log('   Database Status:', healthResponse.data.database);
    console.log('');

    // Test 2: Get Categories
    console.log('2. Testing Get Categories...');
    const categoriesResponse = await axios.get(`${BASE_URL}/api/complaint-management/complaints/categories`);
    console.log('✅ Categories:', categoriesResponse.data.data.categories.length, 'categories found');
    console.log('');

    // Test 3: File Complaint
    console.log('3. Testing File Complaint...');
    const complaintData = {
      title: 'Street Light Not Working',
      description: 'The street light near my house has been out for 3 days. It needs urgent repair.',
      category: 'Street Lighting',
      priority: 'High',
      address: '123 Park Street, Satellite, Ahmedabad, Gujarat 380015',
      ward: 'Ward 15',
      landmark: 'Near City Mall'
    };

    const complaintResponse = await axios.post(
      `${BASE_URL}/api/complaint-management/complaints`,
      complaintData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const complaintId = complaintResponse.data.data.complaint.id;
    const complaintNumber = complaintResponse.data.data.complaint.complaintNumber;
    console.log('✅ Complaint Filed:', complaintNumber);
    console.log('   Complaint ID:', complaintId);
    console.log('');

    // Test 4: Get Complaint Details
    console.log('4. Testing Get Complaint Details...');
    const detailsResponse = await axios.get(`${BASE_URL}/api/complaint-management/complaints/${complaintId}`);
    console.log('✅ Complaint Details:', detailsResponse.data.data.complaint.complaintNumber);
    console.log('   Status:', detailsResponse.data.data.complaint.status);
    console.log('');

    // Test 5: Add Comment
    console.log('5. Testing Add Comment...');
    const commentData = {
      comment: 'I have reported this issue to the local authorities as well.',
      isInternal: false
    };

    const commentResponse = await axios.post(
      `${BASE_URL}/api/complaint-management/complaints/${complaintId}/comments`,
      commentData
    );
    console.log('✅ Comment Added:', commentResponse.data.status);
    console.log('');

    // Test 6: Get My Complaints
    console.log('6. Testing Get My Complaints...');
    const myComplaintsResponse = await axios.get(`${BASE_URL}/api/complaint-management/complaints/my`);
    console.log('✅ My Complaints:', myComplaintsResponse.data.data.complaints.length, 'complaints found');
    console.log('');

    // Test 7: Update Status (Admin/Officer only)
    console.log('7. Testing Update Status...');
    const statusData = {
      status: 'Acknowledged',
      statusReason: 'Complaint received and assigned to maintenance team'
    };

    const statusResponse = await axios.patch(
      `${BASE_URL}/api/complaint-management/complaints/${complaintId}/status`,
      statusData
    );
    console.log('✅ Status Updated:', statusResponse.data.data.complaint.status);
    console.log('');

    // Test 8: Get Statistics
    console.log('8. Testing Get Statistics...');
    const statsResponse = await axios.get(`${BASE_URL}/api/complaint-management/complaints/admin/statistics`);
    console.log('✅ Statistics:', statsResponse.data.data.overview);
    console.log('');

    console.log('�� All tests completed successfully!');
    console.log('===============================================');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run tests
testComplaintService();
