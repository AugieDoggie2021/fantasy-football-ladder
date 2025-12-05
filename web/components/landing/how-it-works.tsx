interface Step {
  number: string
  title: string
  description: string
}

const steps: Step[] = [
  {
    number: '1',
    title: 'Create or join a ladder league',
    description: 'Start a new promotion group with multiple tiers, or join an existing ladder league. Each tier has its own league with teams competing for promotion.',
  },
  {
    number: '2',
    title: 'Draft your team, set your lineup each week',
    description: 'Build your roster through the draft, then manage your lineup week by week. Make trades, pick up free agents, and optimize your starters.',
  },
  {
    number: '3',
    title: 'Get promoted when you win, relegated when you fall behind',
    description: 'At the end of each season, top teams move up a tier while bottom teams move down. Each season rebalances the ladder and keeps competition fresh.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Fantasy Football Ladder transforms traditional leagues into a dynamic, multi-tier competition system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Step Number */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-kelly-base/20 border-2 border-kelly-base flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-kelly-neon">
                    {step.number}
                  </span>
                </div>

                {/* Step Content */}
                <h3 className="text-xl font-semibold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Connector Line (not shown on last item) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-kelly-base/50 to-transparent" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
