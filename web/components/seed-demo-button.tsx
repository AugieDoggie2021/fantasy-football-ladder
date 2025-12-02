'use client'

export function SeedDemoButton() {
  async function handleSeed() {
    const response = await fetch('/api/seed-demo', {
      method: 'POST',
    })
    const data = await response.json()
    
    if (response.ok) {
      alert('Demo data seeded successfully! Refresh the page to see your new leagues.')
      window.location.reload()
    } else {
      alert(`Error: ${data.error}`)
    }
  }

  return (
    <div>
      <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
        Development Only: Seed demo data for testing
      </p>
      <button
        onClick={handleSeed}
        className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm font-medium"
      >
        Seed Demo Data
      </button>
    </div>
  )
}

