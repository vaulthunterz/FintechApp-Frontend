/**
 * Mock SMS Module
 * 
 * This is a mock implementation of the react-native-get-sms-android module
 * for testing purposes when the native module is not available.
 */

// Mock SMS data for testing
const mockSmsData = [
  {
    _id: '1',
    address: 'M-PESA',
    body: 'You have sent Ksh1,000 to JOHN DOE on 15/04/2023 at 10:30 AM. Transaction ID: ABC123456',
    date: '1681548600000',
    date_sent: '1681548600000',
    read: '1',
    seen: '1',
    status: '-1',
    type: '1',
    service_center: '+254700000000'
  },
  {
    _id: '2',
    address: 'Safaricom',
    body: 'You have received Ksh2,000 from JANE DOE on 16/04/2023 at 11:45 AM. Transaction ID: DEF789012',
    date: '1681638300000',
    date_sent: '1681638300000',
    read: '1',
    seen: '1',
    status: '-1',
    type: '1',
    service_center: '+254700000000'
  }
];

/**
 * Mock implementation of the list function
 */
const list = (
  filter: string,
  failCallback: (error: string) => void,
  successCallback: (count: number, smsList: string) => void
) => {
  try {
    console.log('Mock SMS module: list called with filter', filter);
    
    // Parse the filter
    let filterObj = {};
    try {
      filterObj = JSON.parse(filter);
    } catch (error) {
      console.error('Mock SMS module: Error parsing filter', error);
      failCallback('Invalid filter format');
      return;
    }
    
    // Filter the mock data based on the filter
    const filteredData = mockSmsData.filter(sms => {
      // Apply box filter
      if (filterObj.box && filterObj.box !== 'inbox') {
        return false;
      }
      
      // Apply minDate filter
      if (filterObj.minDate && parseInt(sms.date) < filterObj.minDate) {
        return false;
      }
      
      // Apply maxDate filter
      if (filterObj.maxDate && parseInt(sms.date) > filterObj.maxDate) {
        return false;
      }
      
      // Apply address filter
      if (filterObj.address && sms.address !== filterObj.address) {
        return false;
      }
      
      // Apply bodyContains filter
      if (filterObj.bodyContains && !sms.body.includes(filterObj.bodyContains)) {
        return false;
      }
      
      return true;
    });
    
    // Apply indexFrom and maxCount filters
    const indexFrom = filterObj.indexFrom || 0;
    const maxCount = filterObj.maxCount || filteredData.length;
    const paginatedData = filteredData.slice(indexFrom, indexFrom + maxCount);
    
    // Call the success callback
    successCallback(paginatedData.length, JSON.stringify(paginatedData));
  } catch (error) {
    console.error('Mock SMS module: Error in list function', error);
    failCallback('Error in list function');
  }
};

// Export the mock module
export default {
  list
};
