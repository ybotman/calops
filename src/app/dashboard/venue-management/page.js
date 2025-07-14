'use client';

import OrganizerTypeManagement from '@/components/organizers/OrganizerTypeManagement';

export default function VenueManagementPage() {
  return (
    <OrganizerTypeManagement 
      typeFilter="venue"
      pageTitle="Venue: Management"
      typeLabel="Venue"
    />
  );
}