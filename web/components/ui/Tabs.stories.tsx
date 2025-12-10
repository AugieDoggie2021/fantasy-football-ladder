import type { Meta, StoryObj } from "@storybook/react";
import { Tabs } from "./Tabs";

const meta: Meta<typeof Tabs> = {
  title: "UI/Tabs",
  component: Tabs,
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs>
      <Tabs.Tab href="/standings">Standings</Tabs.Tab>
      <Tabs.Tab href="/schedule">Schedule</Tabs.Tab>
      <Tabs.Tab href="/settings">Settings</Tabs.Tab>
    </Tabs>
  ),
};
