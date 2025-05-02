import React from 'react';
import { View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface UserQRCodeProps {
  userId: string;
  size?: number;
}

const UserQRCode = ({ userId, size = 200 }: UserQRCodeProps) => {
  // Create a QR code value that includes user ID and timestamp for uniqueness
  const qrValue = JSON.stringify({
    userId,
    timestamp: Date.now(),
    type: 'starspharm_client'
  });

  return (
    <View style={styles.container}>
      <QRCode
        value={qrValue}
        size={size}
        color="#4A9B7F"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});

export default UserQRCode; 