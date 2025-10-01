import { Metadata } from 'next';
import WillGeneratorPage from './WillGeneratorPage';

export const metadata: Metadata = {
  title: 'Sprievodca poslednou vôľou | LegacyGuard',
  description: 'Vytvorte si právne platný závet s pomocou našeho inteligentného sprievodcu a AI asistentky Sofia.',
};

export default function Page() {
  return <WillGeneratorPage />;
}