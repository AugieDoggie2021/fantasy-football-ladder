import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "./Card";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card>
      <h3 className="text-lg font-semibold text-brand-nav">Season Stats</h3>
      <p className="text-sm text-brand-navy-600 mt-2">Points: 1,247</p>
    </Card>
  ),
};

export const PaddedLg: Story = {
  render: () => (
    <Card padding="lg">
      <h3 className="text-lg font-semibold text-brand-nav">Promotion Notice</h3>
      <p className="text-sm text-brand-navy-600 mt-2">
        You clinched a move to Tier 1. Draft window opens in 3 days.
      </p>
    </Card>
  ),
};
