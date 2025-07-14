'use client';

import OrganizerTypeManagement from '@/components/organizers/OrganizerTypeManagement';

export default function DJManagementPage() {
  return (
    <OrganizerTypeManagement 
      typeFilter="dj"
      pageTitle="DJ: Management"
      typeLabel="DJ"
    />
  );
}