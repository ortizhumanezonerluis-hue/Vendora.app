import Navbar from '../components/landing/Navbar'
import HeroSection from '../components/landing/HeroSection'
import BentoFeatures from '../components/landing/BentoFeatures'
import AccountingShowcase from '../components/landing/AccountingShowcase'
import DesktopDownloadSection from '../components/landing/DesktopDownloadSection'
import PricingSection from '../components/landing/PricingSection'
import LeadCaptureForm from '../components/landing/LeadCaptureForm'
import FaqSection from '../components/landing/FaqSection'
import Footer from '../components/landing/Footer'

export default function LandingPage() {
  const handleOpenDemoModal = () => {
    const el = document.getElementById('demo')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-600 selection:text-white font-sans antialiased">
      {/* Top Navbar */}
      <Navbar onOpenDemoModal={handleOpenDemoModal} />

      {/* 1. Hero Section */}
      <HeroSection onOpenDemoModal={handleOpenDemoModal} />

      {/* 2. Bento Grid Features */}
      <BentoFeatures onOpenDemoModal={handleOpenDemoModal} />

      {/* 3. Módulo Contable Inteligente */}
      <AccountingShowcase onOpenDemoModal={handleOpenDemoModal} />

      {/* 4. Descarga de la Aplicación de Escritorio */}
      <DesktopDownloadSection />

      {/* 5. Planes y Precios con Financiación */}
      <PricingSection onOpenDemoModal={handleOpenDemoModal} />

      {/* 6. Cierre / Captura de Leads */}
      <LeadCaptureForm />

      {/* 7. Preguntas Frecuentes */}
      <FaqSection onOpenDemoModal={handleOpenDemoModal} />

      {/* 8. Footer */}
      <Footer />
    </div>
  )
}

