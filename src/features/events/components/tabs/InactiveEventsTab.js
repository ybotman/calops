'use client';

import AllEventsTab from './AllEventsTab';

const InactiveEventsTab = (props) => {
  // Filter for inactive events only
  const inactiveEvents = props.events?.filter(event => !event.active) || [];
  
  return (
    <AllEventsTab
      {...props}
      events={inactiveEvents}
    />
  );
};

export default InactiveEventsTab;