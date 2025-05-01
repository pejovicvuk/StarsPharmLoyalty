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
}
 
const Header = ({ 
  title, 
  onBackPress, 
  showBackButton = false,
  rightButtonAction,
  rightButtonIcon,
  rightButtonText
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
        
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        
        <View style={styles.rightContainer}>
          {rightButtonAction && (rightButtonIcon || rightButtonText) && (
            <TouchableOpacity onPress={rightButtonAction} style={styles.rightButton}>
              {rightButtonIcon ? (
                <Ionicons name={rightButtonIcon as any} size={24} color="#ffffff" />
              ) : (
                <Text style={styles.rightButtonText} numberOfLines={1}>{rightButtonText}</Text>
              )}
            </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  leftContainer: {
    width: 40,
  },
  rightContainer: {
    minWidth: 80,
    alignItems: 'flex-end',
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
    flex: 1,
    textAlign: 'center',
  },
});

export default Header;