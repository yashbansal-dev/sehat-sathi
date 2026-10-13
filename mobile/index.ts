import { registerRootComponent } from 'expo';
import { LogBox } from 'react-native';

// Suppress developer warning overlays in Expo Go
LogBox.ignoreAllLogs(true);

import App from './App';

registerRootComponent(App);
