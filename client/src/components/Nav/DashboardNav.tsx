import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Users, Settings, MessageSquareQuote } from 'lucide-react';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

interface DashboardNavProps {
  className?: string;
}

const navigationItems = [
  {
    id: 'prompts',
    path: '/d/prompts',
    label: 'Prompts',
    icon: MessageSquareQuote,
  },
  {
    id: 'teams',
    path: '/d/teams',
    label: 'Teams',
    icon: Users,
  },
  {
    id: 'projects',
    path: '/d/projects',
    label: 'Projects',
    icon: Settings,
  },
];

const DashboardNav: React.FC<DashboardNavProps> = ({ className }) => {
  const location = useLocation();
  const localize = useLocalize();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <nav className={cn('flex space-x-1 border-b border-gray-200 dark:border-gray-700', className)}>
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        
        return (
          <Link
            key={item.id}
            to={item.path}
            className={cn(
              'flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors',
              active
                ? 'border-blue-500 text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label === 'Prompts' ? localize('com_ui_prompts') : item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default DashboardNav;