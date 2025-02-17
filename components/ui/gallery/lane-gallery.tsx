import React, { useMemo, ComponentType } from 'react';
import { ComponentGrid } from '@teambit/explorer.ui.gallery.component-grid';
import { RouteSlot, SlotRouter } from '@teambit/ui-foundation.ui.react-router.slot-router';
import { WorkspaceComponentCard } from '@teambit/workspace.ui.workspace-component-card';
import { useLanes } from '@teambit/lanes.hooks.use-lanes';
import { useLaneComponents } from '@teambit/lanes.hooks.use-lane-components';
import flatten from 'lodash.flatten';
import { LaneModel, LanesHost, LanesModel } from '@teambit/lanes.ui.models.lanes-model';
import { SlotRegistry } from '@teambit/harmony';
import { ScopeComponentCard } from '@teambit/scope';
import { EmptyLane } from './empty-lane-overview';
import { LaneDetails } from './lane-details';

import styles from './lane-gallery.module.scss';

export type LaneOverviewLine = ComponentType;
export type LaneOverviewLineSlot = SlotRegistry<LaneOverviewLine[]>;

export type LaneGalleryProps = {
  routeSlot: RouteSlot;
  overviewSlot?: LaneOverviewLineSlot;
  host: LanesHost;
};
export function LaneGallery({ routeSlot, overviewSlot, host }: LaneGalleryProps) {
  const { lanesModel } = useLanes();
  const overviewItems = useMemo(() => flatten(overviewSlot?.values()), [overviewSlot]);

  const currentLane = lanesModel?.viewedLane;

  if (!currentLane || !currentLane.id) return null;
  if (currentLane.components.length === 0) return <EmptyLane name={currentLane.id.name} />;

  return (
    <LaneGalleryWithPreview host={host} currentLane={currentLane} overviewItems={overviewItems} routeSlot={routeSlot} />
  );
}

type LaneGalleryWithPreviewProps = {
  currentLane: LaneModel;
  overviewItems: LaneOverviewLine[];
  routeSlot: RouteSlot;
  host: LanesHost;
};

function LaneGalleryWithPreview({ currentLane, overviewItems, routeSlot, host }: LaneGalleryWithPreviewProps) {
  const { loading, components } = useLaneComponents(currentLane.id);

  if (loading) return null;

  const ComponentCard =
    host === 'workspace'
      ? ({ component }) => (
          <WorkspaceComponentCard
            component={component}
            componentUrl={LanesModel.getLaneComponentUrl(component.id, currentLane.id)}
          />
        )
      : ({ component }) => (
          <ScopeComponentCard
            component={component}
            componentUrl={LanesModel.getLaneComponentUrl(component.id, currentLane.id)}
          />
        );

  return (
    <div className={styles.container}>
      <LaneDetails
        className={styles.laneDetails}
        laneName={currentLane.id.name}
        description={''}
        componentCount={currentLane.components.length}
      ></LaneDetails>
      <ComponentGrid>
        {components?.map((component, index) => (
          <ComponentCard component={component} key={index} />
        ))}
      </ComponentGrid>
      {routeSlot && <SlotRouter slot={routeSlot} />}
      {overviewItems.length > 0 && overviewItems.map((Item, index) => <Item key={index} />)}
    </div>
  );
}
