// layouts/dashboard/NavConfig.js - Role-based navigation
import Iconify from '../../components/Iconify';

// ----------------------------------------------------------------------
const getIcon = (name) => <Iconify icon={name} width={22} height={22} />;

export const getNavConfig = () => {
  const role = localStorage.getItem('role');

  // Admin Navigation
  if (role === 'admin') {
    return [
      {
        title: 'Admin Dashboard',
        path: '/dashboard/app',
        icon: getIcon('eva:pie-chart-2-fill'),
      },

      {
        title: 'All Products',
        path: '/dashboard/products',
        icon: getIcon('eva:grid-fill'),
      },
      {
        title: 'User Management',
        path: '/dashboard/users',
        icon: getIcon('eva:people-fill'),
      },
    {
        title: 'Reports',
        path: '/dashboard/reports',
        icon: getIcon('eva:alert-triangle-fill'),
      },
       {
      title: 'Profile',
      path: '/dashboard/profile',
      icon: getIcon('eva:person-fill'),
    },
    ];
  }

  // User Navigation (default)
  return [
    {
      title: 'Dashboard',
      path: '/dashboard/app',
      icon: getIcon('eva:pie-chart-2-fill'),
    },
    {
      title: 'Idea Submission',
      path: '/dashboard/waste',
      icon: getIcon('eva:plus-circle-fill'),
    },
    {
      title: 'My Workspace',
      path: '/dashboard/history',
      icon: getIcon('eva:archive-fill'),
    },
    {
      title: 'Profile',
      path: '/dashboard/profile',
      icon: getIcon('eva:person-fill'),
    },
  ];
};