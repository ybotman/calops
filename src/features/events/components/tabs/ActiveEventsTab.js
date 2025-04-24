'use client';

import AllEventsTab from './AllEventsTab';

const ActiveEventsTab = (props) => {
  // Filter for active events only
  const activeEvents = props.events?.filter(event => event.active) || [];
  
  return (
    <AllEventsTab
      {...props}
      events={activeEvents}
    />
  );
};

export default ActiveEventsTab;