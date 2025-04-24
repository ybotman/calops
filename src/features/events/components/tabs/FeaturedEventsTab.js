'use client';

import AllEventsTab from './AllEventsTab';

const FeaturedEventsTab = (props) => {
  // Filter for featured events only
  const featuredEvents = props.events?.filter(event => event.featured) || [];
  
  return (
    <AllEventsTab
      {...props}
      events={featuredEvents}
    />
  );
};

export default FeaturedEventsTab;