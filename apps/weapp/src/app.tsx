import { PropsWithChildren } from 'react';
import { useLaunch } from '@tarojs/taro';
import { generateMealRecommendation } from './shared/coreBridge';
import './app.css';

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    console.log(
      'App launched. Shared Core ready:',
      typeof generateMealRecommendation === 'function'
    );
  });

  return children;
}

export default App;