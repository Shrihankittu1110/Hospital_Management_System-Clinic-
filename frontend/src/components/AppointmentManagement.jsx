import React from 'react';
import ManagementDetailPage from './ManagementDetailPage';

const AppointmentManagement = () => (
	<ManagementDetailPage
		title="Appointment Scheduling"
		subtitle="Booking, timing, and reminders"
		intro="Appointment scheduling keeps booking simple, prevents conflicts, and helps teams manage patient visits with clear timing and reminders."
		image="/home-1.jpeg"
		imageAlt="Appointment scheduling and hospital tools"
		accentClassName="from-indigo-700 to-violet-500"
		stats={[
			{ value: 'Less', label: 'Waiting time' },
			{ value: 'Smart', label: 'Slot allocation' },
			{ value: 'Auto', label: 'Visit reminders' },
		]}
		tabs={[
			{
				key: 'overview',
				label: 'Overview',
				title: 'Appointments made simple',
				description: 'Patients can book time slots, and staff can manage availability without double-booking or manual chaos.',
				points: ['Create appointments', 'Select available slots', 'Confirm doctor assignment', 'Track visit status'],
			},
			{
				key: 'workflow',
				label: 'Workflow',
				title: 'From booking to visit',
				description: 'The appointment flow connects booking, reminders, check-in, and follow-up into one smooth experience.',
				points: ['Pick a slot', 'Confirm details', 'Send reminders', 'Check in and complete visit'],
			},
			{
				key: 'benefits',
				label: 'Benefits',
				title: 'Why this matters',
				description: 'Structured scheduling lowers no-shows and helps staff plan clinic time better.',
				points: ['Fewer missed visits', 'Better resource use', 'Quick rescheduling', 'Clear patient queues'],
			},
		]}
		checklist={[
			{ title: 'Slot Management', description: 'Display open appointment times for fast booking.' },
			{ title: 'Reminder Support', description: 'Send reminders to reduce no-shows and late arrivals.' },
			{ title: 'Visit Tracking', description: 'Follow appointments from booking to completion.' },
		]}
	/>
);

export default AppointmentManagement;
