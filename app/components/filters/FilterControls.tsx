import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

// Define filter types
export type TimePeriod = 'day' | 'week' | 'month' | 'year' | 'custom' | 'all';
export type CategoryFilter = string[];

export interface FilterOptions {
  timePeriod: TimePeriod;
  startDate: Date | null;
  endDate: Date | null;
  categories: CategoryFilter;
}

interface FilterControlsProps {
  availableCategories: string[];
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  availableCategories,
  filters,
  onFiltersChange
}) => {
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(filters.startDate);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(filters.endDate);

  // Handle time period selection
  const handleTimePeriodChange = (period: TimePeriod) => {
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    const now = new Date();

    switch (period) {
      case 'day':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'year':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      case 'custom':
        // Keep existing dates or set defaults
        startDate = filters.startDate || subMonths(now, 1);
        endDate = filters.endDate || now;
        break;
      case 'all':
        // No date filtering
        startDate = null;
        endDate = null;
        break;
    }

    onFiltersChange({
      ...filters,
      timePeriod: period,
      startDate,
      endDate
    });

    setTempStartDate(startDate);
    setTempEndDate(endDate);
  };

  // Handle date changes
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(null);
    if (!selectedDate) return;

    if (showDatePicker === 'start') {
      setTempStartDate(selectedDate);
      onFiltersChange({
        ...filters,
        startDate: selectedDate,
        timePeriod: 'custom'
      });
    } else if (showDatePicker === 'end') {
      setTempEndDate(selectedDate);
      onFiltersChange({
        ...filters,
        endDate: selectedDate,
        timePeriod: 'custom'
      });
    }
  };

  // Handle category selection
  const handleCategoryToggle = (category: string) => {
    let newCategories: string[];
    
    if (filters.categories.includes(category)) {
      newCategories = filters.categories.filter(c => c !== category);
    } else {
      newCategories = [...filters.categories, category];
    }
    
    onFiltersChange({
      ...filters,
      categories: newCategories
    });
  };

  // Handle clearing all categories
  const handleClearCategories = () => {
    onFiltersChange({
      ...filters,
      categories: []
    });
  };

  // Handle selecting all categories
  const handleSelectAllCategories = () => {
    onFiltersChange({
      ...filters,
      categories: [...availableCategories]
    });
  };

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return 'Not set';
    return format(date, 'MMM d, yyyy');
  };

  return (
    <View style={styles.container}>
      {/* Time Period Filter */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Time Period</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
          <View style={styles.timePeriodContainer}>
            {['day', 'week', 'month', 'year', 'custom', 'all'].map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.timePeriodButton,
                  filters.timePeriod === period && styles.selectedTimePeriodButton
                ]}
                onPress={() => handleTimePeriodChange(period as TimePeriod)}
              >
                <Text
                  style={[
                    styles.timePeriodText,
                    filters.timePeriod === period && styles.selectedTimePeriodText
                  ]}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Custom Date Range */}
      {filters.timePeriod === 'custom' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom Date Range</Text>
          <View style={styles.dateRangeContainer}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker('start')}
            >
              <Text style={styles.dateButtonLabel}>Start:</Text>
              <Text style={styles.dateButtonText}>{formatDate(filters.startDate)}</Text>
              <MaterialIcons name="date-range" size={18} color="#1976d2" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker('end')}
            >
              <Text style={styles.dateButtonLabel}>End:</Text>
              <Text style={styles.dateButtonText}>{formatDate(filters.endDate)}</Text>
              <MaterialIcons name="date-range" size={18} color="#1976d2" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Category Filter */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={styles.categoryButtonText}>
              {filters.categories.length === 0
                ? 'All Categories'
                : `${filters.categories.length} Selected`}
            </Text>
            <MaterialIcons name="filter-list" size={18} color="#1976d2" />
          </TouchableOpacity>
        </View>

        {/* Selected Categories Pills */}
        {filters.categories.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
            <View style={styles.selectedCategoriesContainer}>
              {filters.categories.map((category) => (
                <View key={category} style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>{category}</Text>
                  <TouchableOpacity
                    onPress={() => handleCategoryToggle(category)}
                    style={styles.categoryPillRemove}
                  >
                    <Ionicons name="close-circle" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearCategories}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={showDatePicker === 'start' ? tempStartDate || new Date() : tempEndDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Categories</Text>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalActionButton}
                onPress={handleSelectAllCategories}
              >
                <Text style={styles.modalActionButtonText}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalActionButton}
                onPress={handleClearCategories}
              >
                <Text style={styles.modalActionButtonText}>Clear All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.categoryList}>
              {availableCategories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={styles.categoryItem}
                  onPress={() => handleCategoryToggle(category)}
                >
                  <View style={styles.categoryCheckbox}>
                    {filters.categories.includes(category) && (
                      <Ionicons name="checkmark" size={18} color="#1976d2" />
                    )}
                  </View>
                  <Text style={styles.categoryItemText}>{category}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#555',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  scrollView: {
    flexGrow: 0,
  },
  timePeriodContainer: {
    flexDirection: 'row',
    paddingBottom: 5,
  },
  timePeriodButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  selectedTimePeriodButton: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976d2',
    borderWidth: 1,
  },
  timePeriodText: {
    fontSize: 12,
    color: '#555',
  },
  selectedTimePeriodText: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 0.48,
  },
  dateButtonLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 5,
  },
  dateButtonText: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#1976d2',
    marginRight: 5,
  },
  selectedCategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 5,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976d2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryPillText: {
    fontSize: 12,
    color: '#fff',
    marginRight: 5,
  },
  categoryPillRemove: {
    padding: 2,
  },
  clearButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  clearButtonText: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalActions: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  modalActionButton: {
    marginRight: 15,
  },
  modalActionButtonText: {
    color: '#1976d2',
    fontSize: 14,
  },
  categoryList: {
    maxHeight: 300,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryItemText: {
    fontSize: 14,
    color: '#333',
  },
  applyButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FilterControls;
