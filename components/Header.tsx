import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
  title: string;
  onBackPress?: () => void;
  showBackButton?: boolean;
  rightButtonAction?: () => void;
  rightButtonIcon?: string;
  rightButtonText?: string;
  starsCount?: number;
}
 
const Header = ({ 
  title, 
  onBackPress, 
  showBackButton = false,
  rightButtonAction,
  rightButtonIcon,
  rightButtonText,
  starsCount
}: HeaderProps) => {
  const statusBarHeight = StatusBar.currentHeight || 0;
  
  return (
    <View style={[styles.headerContainer, { paddingTop: Platform.OS === 'ios' ? 44 : statusBarHeight }]}>
      <StatusBar backgroundColor="#8BC8A3" barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.leftContainer}>
          {showBackButton && (
            <TouchableOpacity onPress={onBackPress} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
        </View>
        
        <View style={styles.rightContainer}>
          {rightButtonAction && (
            <TouchableOpacity onPress={rightButtonAction} style={styles.rightButton}>
              {rightButtonIcon ? (
                <Ionicons name={rightButtonIcon as any} size={24} color="#ffffff" />
              ) : rightButtonText ? (
                <Text style={styles.rightButtonText}>{rightButtonText}</Text>
              ) : null}
            </TouchableOpacity>
          )}
          
          {starsCount !== undefined && (
            <View style={styles.starsCountBadge}>
              <Ionicons name="star" size={16} color="#E6C34A" />
              <Text style={styles.starsCountText}>{starsCount}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#8BC8A3',
  },
  header: {
    height: 60,
    backgroundColor: '#8BC8A3',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  leftContainer: {
    position: 'absolute',
    left: 15,
    zIndex: 1,
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContainer: {
    position: 'absolute',
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  iconButton: {
    padding: 8,
  },
  rightButton: {
    padding: 8,
  },
  rightButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  starsCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 8,
  },
  starsCountText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 4,
  },
});

export default Header;