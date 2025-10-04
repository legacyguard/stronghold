'use client';

import React, { useState } from 'react';
import { ChevronRight, MoreVertical, Calendar, Clock, User, FileText, Shield, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  clickable?: boolean;
  onClick?: () => void;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  className = '',
  clickable = false,
  onClick,
  padding = 'md',
  shadow = 'sm'
}) => {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };

  return (
    <motion.div
      whileTap={clickable ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`
        bg-white rounded-lg border border-gray-200 ${shadowClasses[shadow]}
        ${paddingClasses[padding]}
        ${clickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

interface MobileListItemProps {
  title: string;
  subtitle?: string;
  description?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  onClick?: () => void;
  onMenuClick?: () => void;
  showChevron?: boolean;
  disabled?: boolean;
}

export const MobileListItem: React.FC<MobileListItemProps> = ({
  title,
  subtitle,
  description,
  leftIcon,
  rightIcon,
  badge,
  onClick,
  onMenuClick,
  showChevron = true,
  disabled = false
}) => {
  return (
    <motion.div
      whileTap={onClick && !disabled ? { scale: 0.98 } : undefined}
      onClick={!disabled ? onClick : undefined}
      className={`
        flex items-center gap-4 p-4 bg-white border-b border-gray-100 last:border-b-0
        ${onClick && !disabled ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100' : ''}
        ${disabled ? 'opacity-50' : ''}
        transition-colors
      `}
    >
      {/* Left icon */}
      {leftIcon && (
        <div className="flex-shrink-0 text-gray-500">
          {leftIcon}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-text-dark truncate">{title}</h3>
          {badge && (
            <Badge variant={badge.variant || 'default'} className="text-xs">
              {badge.text}
            </Badge>
          )}
        </div>

        {subtitle && (
          <p className="text-sm text-gray-600 truncate">{subtitle}</p>
        )}

        {description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{description}</p>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {rightIcon && (
          <div className="text-gray-500">
            {rightIcon}
          </div>
        )}

        {onMenuClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onMenuClick();
            }}
            className="p-2"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        )}

        {showChevron && onClick && (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </div>
    </motion.div>
  );
};

interface MobileDocumentCardProps {
  id: string;
  title: string;
  type: 'will' | 'trust' | 'power_of_attorney' | 'healthcare_directive' | 'other';
  status: 'draft' | 'review' | 'signed' | 'archived';
  lastModified: Date;
  size?: string;
  preview?: string;
  onClick?: () => void;
  onMenuClick?: () => void;
}

export const MobileDocumentCard: React.FC<MobileDocumentCardProps> = ({
  id,
  title,
  type,
  status,
  lastModified,
  size,
  preview,
  onClick,
  onMenuClick
}) => {
  const getTypeIcon = () => {
    switch (type) {
      case 'will':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'trust':
        return <Shield className="w-5 h-5 text-green-500" />;
      case 'power_of_attorney':
        return <User className="w-5 h-5 text-purple-500" />;
      case 'healthcare_directive':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'draft':
        return { text: 'Draft', variant: 'secondary' as const };
      case 'review':
        return { text: 'Review', variant: 'outline' as const };
      case 'signed':
        return { text: 'Signed', variant: 'default' as const };
      case 'archived':
        return { text: 'Archived', variant: 'secondary' as const };
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <MobileCard clickable onClick={onClick} className="relative">
      <div className="flex items-start gap-4">
        {/* Document type icon */}
        <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg">
          {getTypeIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-medium text-text-dark line-clamp-2">{title}</h3>
            {onMenuClick && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuClick();
                }}
                className="p-1 flex-shrink-0"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 mb-2">
            <Badge {...getStatusBadge()} className="text-xs" />
            {size && (
              <span className="text-xs text-gray-500">{size}</span>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatDate(lastModified)}</span>
            </div>
          </div>

          {preview && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{preview}</p>
          )}
        </div>
      </div>
    </MobileCard>
  );
};

interface MobileTaskCardProps {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  assignee?: {
    name: string;
    avatar?: string;
  };
  progress?: number; // 0-100
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  tags?: string[];
  onClick?: () => void;
  onStatusChange?: (status: string) => void;
}

export const MobileTaskCard: React.FC<MobileTaskCardProps> = ({
  id,
  title,
  description,
  priority,
  dueDate,
  assignee,
  progress = 0,
  status,
  tags = [],
  onClick,
  onStatusChange
}) => {
  const getPriorityColor = () => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'overdue':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const isOverdue = dueDate && new Date() > dueDate && status !== 'completed';

  return (
    <MobileCard
      clickable
      onClick={onClick}
      className={`${isOverdue ? 'border-red-200 bg-red-50/30' : ''}`}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-medium text-text-dark line-clamp-2">{title}</h3>
            {description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor()}`}
            >
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </div>
            {getStatusIcon()}
          </div>
        </div>

        {/* Progress bar */}
        {progress > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="text-gray-900 font-medium">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Left side - Due date and assignee */}
          <div className="flex items-center gap-3 text-sm text-gray-500">
            {dueDate && (
              <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : ''}`}>
                <Calendar className="w-4 h-4" />
                <span>{dueDate.toLocaleDateString()}</span>
              </div>
            )}

            {assignee && (
              <div className="flex items-center gap-1">
                {assignee.avatar ? (
                  <img
                    src={assignee.avatar}
                    alt={assignee.name}
                    className="w-5 h-5 rounded-full"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="truncate">{assignee.name}</span>
              </div>
            )}
          </div>

          {/* Right side - Tags */}
          {tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </MobileCard>
  );
};

interface MobileNotificationCardProps {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'default' | 'destructive' | 'outline';
  }>;
  onMarkAsRead?: () => void;
  onDismiss?: () => void;
}

export const MobileNotificationCard: React.FC<MobileNotificationCardProps> = ({
  id,
  title,
  message,
  type,
  timestamp,
  read = false,
  actions = [],
  onMarkAsRead,
  onDismiss
}) => {
  const getTypeIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTypeColors = () => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <MobileCard
      className={`${!read ? 'border-l-4 border-l-primary' : ''} ${getTypeColors()}`}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getTypeIcon()}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-text-dark">{title}</h3>

              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span>{formatTimestamp(timestamp)}</span>
                {!read && (
                  <div className="w-2 h-2 bg-primary rounded-full ml-1" />
                )}
              </div>
            </div>

            <p className="text-sm text-gray-600 mt-1">{message}</p>
          </div>
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={action.action}
                className="text-xs"
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <div className="flex items-center gap-2">
            {!read && onMarkAsRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAsRead}
                className="text-xs"
              >
                Mark as read
              </Button>
            )}
          </div>

          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-xs text-gray-500"
            >
              Dismiss
            </Button>
          )}
        </div>
      </div>
    </MobileCard>
  );
};

export default {
  MobileCard,
  MobileListItem,
  MobileDocumentCard,
  MobileTaskCard,
  MobileNotificationCard
};