import { ReactNode } from 'react';
import s from './app.module.css';
import InfiniteCanvas from '@/components/InfiniteCanvas';
import Tools from '@/components/Tools';

export default function App(): ReactNode {
  return (
    <div>
      <div className={ s.toolsWrapper }>
        <Tools />
      </div>
      <InfiniteCanvas />
    </div>
  );
}