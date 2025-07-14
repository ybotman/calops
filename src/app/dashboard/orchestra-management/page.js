'use client';

import OrganizerTypeManagement from '@/components/organizers/OrganizerTypeManagement';

export default function OrchestraManagementPage() {
  return (
    <OrganizerTypeManagement 
      typeFilter="orchestra"
      pageTitle="Orchestra: Management"
      typeLabel="Orchestra"
    />
  );
}