import './index.css';
import { Header, Footer } from '@mmp/shared-ui';
import KaufenMietenRechner from './components/KaufenMietenRechner';

export default function App() {
  return (
    <>
      <Header title="Immobilienrechner" variant="compact" />
      <KaufenMietenRechner />
      <Footer />
    </>
  );
}
