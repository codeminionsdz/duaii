import { BackgroundPattern } from "@/components/ui/background-pattern"
import { BottomNav } from "@/components/layout/bottom-nav"

export default async function MedicinesPage() {
  return (
    <div className="relative min-h-screen pb-20">
      <BackgroundPattern />

      <div className="relative z-10">
        <header className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 rounded-b-3xl shadow-lg mb-6">
          {/* Existing code here */}
          <h1>Medicines</h1>
        </header>

        <main className="p-4">
          {/* Existing code here */}
          <p>List of medicines will be displayed here.</p>
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
