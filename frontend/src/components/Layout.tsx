import { ReactNode } from 'react'
import Navbar from './Navbar'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
      <footer className="mt-auto bg-[#003366] text-blue-200 text-center py-3 text-xs">
        AICTE FDR Management Portal — SIH26265 Prototype &nbsp;|&nbsp;
        <span className="text-yellow-300/80">All data is simulated for demonstration purposes only</span> &nbsp;|&nbsp;
        Not connected to real AICTE systems
      </footer>
    </div>
  )
}
