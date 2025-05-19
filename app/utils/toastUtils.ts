import Toast from 'react-native-toast-message';

/**
 * Shows a success toast message
 * @param message - The main message to display
 * @param subtitle - Optional subtitle to display below the main message
 */
export const showSuccessToast = (message: string, subtitle = '') => {
  Toast.show({
    type: 'success',
    text1: message,
    text2: subtitle,
    position: 'top',
    visibilityTime: 5000, // 5 seconds
    autoHide: true,
    topOffset: 50,
    bottomOffset: 40,
  });
};

/**
 * Shows an error toast message
 * @param message - The main error message to display
 * @param subtitle - Optional subtitle with additional error details
 */
export const showErrorToast = (message: string, subtitle = '') => {
  Toast.show({
    type: 'error',
    text1: message,
    text2: subtitle,
    position: 'top',
    visibilityTime: 5000, // 5 seconds
    autoHide: true,
    topOffset: 50,
    bottomOffset: 40,
  });
};

/**
 * Shows an informational toast message
 * @param message - The main message to display
 * @param subtitle - Optional subtitle with additional information
 */
export const showInfoToast = (message: string, subtitle = '') => {
  Toast.show({
    type: 'info',
    text1: message,
    text2: subtitle,
    position: 'top',
    visibilityTime: 5000, // 5 seconds
    autoHide: true,
    topOffset: 50,
    bottomOffset: 40,
  });
};

/**
 * Shows a toast message with the specified type
 * @param type - The type of toast ('success' | 'error' | 'info')
 * @param message - The main message to display
 * @param subtitle - Optional subtitle to display
 */
export const showToast = (type: 'success' | 'error' | 'info', message: string, subtitle = '') => {
  switch (type) {
    case 'success':
      showSuccessToast(message, subtitle);
      break;
    case 'error':
      showErrorToast(message, subtitle);
      break;
    case 'info':
      showInfoToast(message, subtitle);
      break;
    default:
      showInfoToast(message, subtitle);
  }
};
