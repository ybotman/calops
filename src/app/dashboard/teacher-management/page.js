'use client';

import OrganizerTypeManagement from '@/components/organizers/OrganizerTypeManagement';

export default function TeacherManagementPage() {
  return (
    <OrganizerTypeManagement 
      typeFilter="teacher"
      pageTitle="Teacher: Management"
      typeLabel="Teacher"
    />
  );
}