import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Upload from './components/Upload';
import Dashboard from './components/Dashboard';
import InvoiceDetail from './components/InvoiceDetail';
import LandingPage from './components/LandingPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-slate-100 relative">
        <main className="w-full h-full min-h-screen">
          <Routes>
            {/* Landing Route */}
            <Route path="/" element={<LandingPage />} />

            {/* Upload Route */}
            <Route path="/upload" element={<Upload />} />

            {/* Dashboard Route */}
            <Route path="/dashboard" element={
              <div className="p-4 md:p-8">
                <Dashboard />
              </div>
            } />

            {/* Invoice Detail Route */}
            <Route path="/invoice/:id" element={<InvoiceDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
