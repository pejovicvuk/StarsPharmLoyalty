import React from 'react';
import { View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface UserQRCodeProps {
  userId: string;
  size?: number;
}

const UserQRCode = ({ userId, size = 200 }: UserQRCodeProps) => {
  // Create a compact QR code value
  const qrValue = JSON.stringify({u:userId,t:Date.now(),y:'c'}); // Minimized JSON keys

  return (
    <View style={styles.container}>
      <QRCode
        value={qrValue}
        size={size}
        color="#4A9B7F"
        logo={require('../assets/starspharm_circular_transparent.png')}
        logoSize={size * 0.25}
        logoBackgroundColor="white"
        logoBorderRadius={10}
        logoMargin={5}
        ecl="H"
        quietZone={10}
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