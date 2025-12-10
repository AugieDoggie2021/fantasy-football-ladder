import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Variants: Story = {
  render: () => (
    <div className="flex gap-3 flex-wrap">
      <Badge variant="primary">Primary</Badge>
      <Badge variant="success">Promoted</Badge>
      <Badge variant="warning">Attention</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="neutral">Neutral</Badge>
      <Badge variant="accent">Commissioner</Badge>
      <Badge variant="destructive">Relegated</Badge>
    </div>
  ),
};
