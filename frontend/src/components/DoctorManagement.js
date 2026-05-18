import React from 'react';
import ManagementDetailPage from './ManagementDetailPage';

const DoctorManagement = () => (
  <ManagementDetailPage
    title="Doctor Management"
    subtitle="Staffing, schedules, and specialties"
    intro="Doctor management helps organize doctor profiles, specialties, shifts, and availability so patients are matched with the right clinician at the right time."
    image="/home-2.jpeg"
    imageAlt="Doctor and clinical management"
    accentClassName="from-emerald-700 to-teal-500"
    stats={[
      { value: 'Specialties', label: 'Grouped by department' },
      { value: 'Live', label: 'Availability status' },
      { value: 'Fast', label: 'Patient-to-doctor matching' },
    ]}
    tabs={[
      {
        key: 'overview',
        label: 'Overview',
        title: 'Doctor profiles in one dashboard',
        description: 'Keep each doctor’s profile, specialty, experience, and schedule visible for quick assignment and coordination.',
        points: ['Profile management', 'Specialty mapping', 'Shift visibility', 'Department allocation'],
      },
      {
        key: 'workflow',
        label: 'Workflow',
        title: 'A coordinated scheduling flow',
        description: 'Administrators can update shifts, while the system helps route appointments to the right doctor automatically.',
        points: ['Review availability', 'Assign patients', 'Balance workloads', 'Track clinic sessions'],
      },
      {
        key: 'benefits',
        label: 'Benefits',
        title: 'Why this matters',
        description: 'Well-managed doctor data improves service quality and reduces scheduling conflicts.',
        points: ['Less overlap in schedules', 'Better patient routing', 'Improved clinic planning', 'Clear workload tracking'],
      },
    ]}
    checklist={[
      { title: 'Doctor Profiles', description: 'Maintain name, specialty, and contact information.' },
      { title: 'Shift Planning', description: 'Keep working hours and availability up to date.' },
      { title: 'Department Mapping', description: 'Link each doctor to the right unit or service area.' },
    ]}
  />
);

export default DoctorManagement;