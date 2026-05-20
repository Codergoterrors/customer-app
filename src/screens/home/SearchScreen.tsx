// Search Screen
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { addRecentSearch, removeRecentSearch } from '../../store/slices/restaurantSlice';
import { restaurantService } from '../../services/restaurantService';
import type { HomeStackParamList, Restaurant } from '../../types';

type SearchNav = NativeStackNavigationProp<HomeStackParamList, 'Search'>;

const SearchScreen: React.FC = () => {
  const navigation = useNavigation<SearchNav>();
  const dispatch = useAppDispatch();
  const { recentSearches } = useAppSelector((s) => s.restaurant);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Restaurant[]>([]);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (text.length < 2) { setResults([]); return; }
    try {
      const data = await restaurantService.searchRestaurants(text);
      setResults(data);
    } catch (error) {
      console.error('Error searching restaurants:', error);
      setResults([]);
    }
  }, []);

  const handleSelectRestaurant = useCallback((restaurant: Restaurant) => {
    dispatch(addRecentSearch(restaurant.name));
    navigation.navigate('Restaurant', { restaurantId: restaurant.id });
  }, [dispatch, navigation]);

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Icon name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <Icon name="magnify" size={20} color={Colors.textDisabled} />
          <TextInput ref={inputRef} style={styles.searchInput}
            placeholder="Search restaurants or dishes" placeholderTextColor={Colors.textDisabled}
            value={query} onChangeText={handleSearch} selectionColor={Colors.primary}
            autoCorrect={false} returnKeyType="search" />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Icon name="close-circle" size={18} color={Colors.textDisabled} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Recent Searches */}
      {query.length === 0 && recentSearches.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          {recentSearches.map((search, i) => (
            <TouchableOpacity key={i} style={styles.recentRow}
              onPress={() => handleSearch(search)}>
              <Icon name="clock-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.recentText}>{search}</Text>
              <TouchableOpacity onPress={() => dispatch(removeRecentSearch(search))}>
                <Icon name="close" size={16} color={Colors.textDisabled} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Results */}
      {results.length > 0 && (
        <FlatList data={results} keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsList}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.resultRow}
              onPress={() => handleSelectRestaurant(item)} activeOpacity={0.7}>
              <Image source={{ uri: item.logoUrl }} style={styles.resultImage} />
              <View style={styles.resultInfo}>
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultMeta}>
                  {item.cuisineType.join(' · ')} · ⭐ {item.rating}
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color={Colors.textDisabled} />
            </TouchableOpacity>
          )}
        />
      )}

      {/* Empty search state */}
      {query.length >= 2 && results.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptySub}>Try searching for something else</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingTop: Spacing.xl, paddingBottom: Spacing.md, gap: Spacing.sm },
  back: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    height: 44, borderRadius: BorderRadius.pill, paddingHorizontal: Spacing.md, gap: Spacing.sm,
  },
  searchInput: { flex: 1, ...Typography.body, color: Colors.textPrimary, height: '100%', padding: 0 },
  section: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
  sectionTitle: { ...Typography.bodyLarge, color: Colors.textPrimary, fontWeight: '700', marginBottom: Spacing.md },
  recentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.md },
  recentText: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  resultsList: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },
  resultRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.md },
  resultImage: { width: 44, height: 44, borderRadius: BorderRadius.sm },
  resultInfo: { flex: 1 },
  resultName: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600' },
  resultMeta: { ...Typography.small, color: Colors.textSecondary, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary },
  emptySub: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.xs },
});

export default SearchScreen;
