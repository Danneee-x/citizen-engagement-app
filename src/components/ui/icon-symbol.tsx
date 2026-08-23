// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>['name']>;

/**
 * SF Symbols to Material Icons mappings for Civentral
 */
const MAPPING: IconMapping = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'chevron.down': 'expand-more',
  'chevron.up': 'expand-less',
  'shield.fill': 'shield',
  'person.text.rectangle.fill': 'badge',
  'heart.text.square.fill': 'volunteer-activism',
  'cross.case.fill': 'medical-services',
  'book.closed.fill': 'menu-book',
  'building.2.fill': 'domain',
  'briefcase.fill': 'work',
  'creditcard.fill': 'payment',
  'car.fill': 'directions-car',
  'wrench.and.screwdriver.fill': 'build',
  'square.grid.2x2.fill': 'grid-view',
  'bell.fill': 'notifications',
  'person.crop.circle.fill': 'account-circle',
  'person.fill': 'person',
  'magnifyingglass': 'search',
  'exclamationmark.triangle.fill': 'warning',
  'flame.fill': 'local-fire-department',
  'qrcode': 'qr-code',
  'lock.fill': 'lock',
  'phone.fill': 'phone',
  'envelope.fill': 'email',
  'location.fill': 'location-on',
  'pencil': 'edit',
  'gearshape.fill': 'settings',
  'help.circle.fill': 'help-outline',
  'rectangle.portrait.and.arrow.right': 'exit-to-app',
  'person.2.fill': 'people',
  'fingerprint': 'fingerprint',
  'checkmark.seal.fill': 'verified',
  'checkmark.circle.fill': 'check-circle',
  'wallet.pass.fill': 'account-balance-wallet',
  'qrcode.viewfinder': 'qr-code-scanner',
  'doc.text.fill': 'assignment',
  'eye.fill': 'visibility',
  'eye.slash.fill': 'visibility-off',
  'moon.stars.fill': 'nights-stay',
  'moon.fill': 'dark-mode',
  'sun.max.fill': 'wb-sunny',
  'sun.fill': 'light-mode',
  'calendar': 'calendar-today',
  'megaphone.fill': 'campaign',
  'circle.fill': 'lens',
  'circle': 'radio-button-unchecked',
  'clock.fill': 'schedule',
  'info.circle.fill': 'info',
  'history': 'history',
  'map': 'map',
  'clipboard': 'content-paste',
  'star.fill': 'star',
  'target': 'track-changes',
  'funnel.fill': 'filter-list',
  'sparkles': 'auto-awesome',
  'person.badge.plus': 'person-add',
  'xmark': 'close',
  'trash.fill': 'delete',
  'plus': 'add',
  'arrow.clockwise': 'refresh',
  'arrow.up.doc.fill': 'upload-file',
  'bubble.left.and.bubble.right.fill': 'chat',
  'chart.bar.fill': 'bar-chart',
  'questionmark.circle.fill': 'help-outline',
  'exclamationmark.circle.fill': 'error-outline',
  'checkmark': 'check',
  'camera.fill': 'photo-camera',
  'photo.fill': 'photo',
};

export type IconSymbolName = keyof typeof MAPPING;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name] || 'help-outline'} style={style} />;
}
