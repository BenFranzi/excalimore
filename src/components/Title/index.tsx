import { ReactNode, useState } from 'react';
import styles from './styles.module.css';

type Props = {
  value: string;
}

export default function Title({ value }: Props): ReactNode {
  const [count, setCount] = useState(0);
  return (
    <div>
      <h1 className={ styles.title }>{value}</h1>
      <button data-testid='counter' onClick={ () => setCount(count + 1) }>I have been clicked {count} times!</button>
    </div>
  );
}