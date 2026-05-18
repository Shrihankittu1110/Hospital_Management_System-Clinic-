import React from 'react';
import ManagementDetailPage from './ManagementDetailPage';

const PatientManagement = () => (
  <ManagementDetailPage
    title="Patient Management"
    subtitle="Care, records, and follow-up"
    intro="Patient management keeps registration, medical history, appointments, and follow-up care organized in one place so staff can respond faster and deliver better care."
    image="/home-1.jpeg"
    imageAlt="Patient care and medical equipment"
    accentClassName="from-sky-700 to-cyan-500"
    stats={[
      { value: '24/7', label: 'Access to patient records' },
      { value: '3-step', label: 'Appointment handling flow' },
      { value: '100%', label: 'Centralized care history' },
    ]}
    tabs={[
      {
        key: 'overview',
        label: 'Overview',
        title: 'Patient records at a glance',
        description: 'Staff can quickly view demographics, visit history, prescriptions, and assigned doctors from a single dashboard.',
        points: ['Registration and check-in', 'Medical history tracking', 'Prescription visibility', 'Doctor assignment view'],
      },
      {
        key: 'workflow',
        label: 'Workflow',
        title: 'A simple care workflow',
        description: 'New patient data is captured once, then reused for appointments, prescriptions, and follow-up notes.',
        points: ['Capture details once', 'Schedule the visit', 'Review history instantly', 'Update care notes after appointment'],
      },
      {
        key: 'benefits',
        label: 'Benefits',
        title: 'Why this matters',
        description: 'A clean patient workflow reduces waiting time, duplicate paperwork, and missed follow-ups.',
        points: ['Faster front-desk handling', 'Better continuity of care', 'Less duplicate entry', 'Easy follow-up tracking'],
      },
    ]}
    checklist={[
      { title: 'Registration', description: 'Store basic patient profile information and contact details.' },
      { title: 'Medical History', description: 'View prior visits, diagnoses, and treatment notes.' },
      { title: 'Appointments', description: 'Track upcoming and past appointments in one place.' },
    ]}
  />
);

export default PatientManagement;