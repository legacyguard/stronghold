'use client';

import React, { useMemo } from 'react';
import { FamilyMember } from '@/lib/family/types';

interface FamilyTreeProps {
  members: FamilyMember[];
  onMemberClick?: (member: FamilyMember) => void;
  className?: string;
}

interface TreeNode {
  id: string;
  member: FamilyMember;
  children: TreeNode[];
  level: number;
}

const ACCESS_LEVEL_COLORS = {
  full: 'bg-green-500',
  health: 'bg-blue-500',
  emergency: 'bg-orange-500',
  minimal: 'bg-gray-500'
};

const ACCESS_LEVEL_LABELS = {
  full: 'Full Access',
  health: 'Health Access',
  emergency: 'Emergency Access',
  minimal: 'Minimal Access'
};

const ROLE_ICONS = {
  spouse: '👫',
  child: '👶',
  parent: '👴',
  sibling: '👥',
  guardian: '🛡️',
  executor: '⚖️',
  trustee: '🏦',
  beneficiary: '🎁',
  advisor: '💼',
  heir: '👑',
  emergency_contact: '🚨',
  witness: '📋',
  other: '👤'
};

export function FamilyTree({ members, onMemberClick, className = '' }: FamilyTreeProps) {
  const treeStructure = useMemo(() => {
    const primaryMembers = members.filter(m =>
      ['spouse', 'child', 'parent'].includes(m.role) && m.invitation_status === 'accepted'
    );

    const supportMembers = members.filter(m =>
      ['guardian', 'executor', 'trustee', 'advisor'].includes(m.role) && m.invitation_status === 'accepted'
    );

    const otherMembers = members.filter(m =>
      !['spouse', 'child', 'parent', 'guardian', 'executor', 'trustee', 'advisor'].includes(m.role)
      && m.invitation_status === 'accepted'
    );

    return { primaryMembers, supportMembers, otherMembers };
  }, [members]);

  const pendingInvitations = useMemo(() =>
    members.filter(m => m.invitation_status === 'pending'),
    [members]
  );

  const renderMember = (member: FamilyMember, isCompact = false) => (
    <div
      key={member.id}
      onClick={() => onMemberClick?.(member)}
      className={`
        relative bg-white border-2 border-gray-200 rounded-lg p-md cursor-pointer
        transition-all duration-200 hover:shadow-lg hover:border-primary
        ${isCompact ? 'min-w-48' : 'min-w-64'}
      `}
    >
      <div className="flex items-start space-x-sm">
        <div className="text-2xl">
          {ROLE_ICONS[member.role] || ROLE_ICONS.other}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">
            {member.member_name}
          </h4>
          <p className="text-sm text-gray-500 capitalize">
            {member.role}
          </p>
          {!isCompact && (
            <p className="text-xs text-gray-400 truncate mt-xs">
              {member.member_email}
            </p>
          )}
        </div>
      </div>

      <div className="mt-sm flex items-center justify-between">
        <div className={`
          inline-flex items-center px-xs py-xs rounded-full text-xs font-medium text-white
          ${ACCESS_LEVEL_COLORS[member.access_level]}
        `}>
          {ACCESS_LEVEL_LABELS[member.access_level]}
        </div>

        {member.invitation_status === 'accepted' && (
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`family-tree ${className}`}>
      <div className="space-y-xl">
        {/* Primary Family Members */}
        {treeStructure.primaryMembers.length > 0 && (
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-lg">
              Primary Family
            </h3>
            <div className="flex flex-wrap justify-center gap-lg">
              {treeStructure.primaryMembers.map(member => renderMember(member))}
            </div>
          </div>
        )}

        {/* Connection Lines */}
        {treeStructure.primaryMembers.length > 0 &&
         (treeStructure.supportMembers.length > 0 || treeStructure.otherMembers.length > 0) && (
          <div className="flex justify-center">
            <div className="w-px h-8 bg-gray-300"></div>
          </div>
        )}

        {/* Support Network */}
        {treeStructure.supportMembers.length > 0 && (
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-lg">
              Professional Support Network
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md max-w-4xl mx-auto">
              {treeStructure.supportMembers.map(member => renderMember(member, true))}
            </div>
          </div>
        )}

        {/* Other Members */}
        {treeStructure.otherMembers.length > 0 && (
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-lg">
              Extended Network
            </h3>
            <div className="flex flex-wrap justify-center gap-md">
              {treeStructure.otherMembers.map(member => renderMember(member, true))}
            </div>
          </div>
        )}

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <div className="border-t border-gray-200 pt-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-lg text-center">
              Pending Invitations ({pendingInvitations.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md max-w-4xl mx-auto">
              {pendingInvitations.map(member => (
                <div
                  key={member.id}
                  className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-md opacity-75"
                >
                  <div className="flex items-start space-x-sm">
                    <div className="text-xl opacity-50">
                      {ROLE_ICONS[member.role] || ROLE_ICONS.other}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-600 truncate">
                        {member.member_name}
                      </h4>
                      <p className="text-sm text-gray-400 capitalize">
                        {member.role}
                      </p>
                    </div>
                  </div>

                  <div className="mt-sm">
                    <div className="inline-flex items-center px-xs py-xs rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Invitation Pending
                    </div>
                  </div>

                  {member.token_expires_at && (
                    <div className="mt-xs text-xs text-gray-400">
                      Expires: {new Date(member.token_expires_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {members.length === 0 && (
          <div className="text-center py-xl">
            <div className="text-6xl mb-lg opacity-20">👥</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-sm">
              No Family Members Yet
            </h3>
            <p className="text-gray-500">
              Start building your Family Shield by inviting trusted members
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      {members.length > 0 && (
        <div className="mt-xl pt-lg border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-md">Access Levels</h4>
          <div className="flex flex-wrap gap-md">
            {Object.entries(ACCESS_LEVEL_COLORS).map(([level, color]) => (
              <div key={level} className="flex items-center space-x-xs">
                <div className={`w-3 h-3 rounded-full ${color}`}></div>
                <span className="text-sm text-gray-600">
                  {ACCESS_LEVEL_LABELS[level as keyof typeof ACCESS_LEVEL_LABELS]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}