import { Badge, Button, Card, Input, Tabs } from "@/components/ui";
import { SiteFooter } from "@/components/layout";

export default function UIShowcasePage() {
  return (
    <div className="min-h-screen bg-brand-surface text-brand-nav">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div>
          <p className="text-sm font-semibold text-brand-primary-600 uppercase tracking-wide">
            Design System
          </p>
          <h1 className="mt-2 text-4xl font-bold text-brand-nav">
            Fantasy Football Ladder UI Library
          </h1>
          <p className="mt-3 text-base text-brand-navy-600 max-w-3xl">
            Token-driven components reflecting the Ascending Stack visual
            identity. Use this page to visually verify updates across the core
            primitives.
          </p>
        </div>

        <Card className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-brand-nav">Buttons</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="primary">Primary Action</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button size="sm">Small</Button>
              <Button size="lg" variant="secondary">
                Large Secondary
              </Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-brand-nav">Inputs</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="League Name" placeholder="Enter league name" />
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                error="Password is required"
              />
              <Input
                label="Helper"
                placeholder="With helper text"
                helperText="Used for invites and notifications"
              />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-brand-nav">Badges</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Badge variant="primary">Primary</Badge>
              <Badge variant="success">Promoted</Badge>
              <Badge variant="warning">Attention</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="neutral">Neutral</Badge>
              <Badge variant="accent">Commissioner</Badge>
              <Badge variant="destructive">Relegated</Badge>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-brand-nav">Tabs</h2>
            <Tabs>
              <Tabs.Tab href="/ui#standings">Standings</Tabs.Tab>
              <Tabs.Tab href="/ui#schedule">Schedule</Tabs.Tab>
              <Tabs.Tab href="/ui#settings">Settings</Tabs.Tab>
            </Tabs>
            <p className="text-sm text-brand-navy-600">
              Tabs use underline treatment with muted inactive states.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-brand-nav">Cards</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-md border-brand-navy-200">
                <p className="text-sm font-semibold text-brand-nav">
                  Season Stats
                </p>
                <p className="mt-2 text-3xl font-bold text-brand-nav">1,247</p>
                <p className="text-sm text-brand-navy-600">Total points</p>
              </Card>
              <Card className="shadow-md border-brand-navy-200">
                <p className="text-sm font-semibold text-brand-nav">
                  Promotion Status
                </p>
                <p className="mt-2 text-base text-brand-navy-600">
                  You clinched a move to Tier 1. Prepare for the draft window.
                </p>
              </Card>
            </div>
          </div>
        </Card>
      </div>

      <SiteFooter />
    </div>
  );
}
