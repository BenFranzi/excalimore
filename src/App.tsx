import { ReactNode } from 'react';
import Title from '@/components/Title';

export default function App(): ReactNode {
  return (
    <div>
      <Title value={ 'Oh hey! 👋' } />
    </div>
  );
}