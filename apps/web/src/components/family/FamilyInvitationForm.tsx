'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FamilyInvitationRequest } from '@/lib/family/types';
import { createFamilyInvitation } from '@/actions/family/invitations';

interface FamilyInvitationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function FamilyInvitationForm({ onSuccess, onCancel }: FamilyInvitationFormProps) {
  const [formData, setFormData] = useState<FamilyInvitationRequest>({
    memberName: '',
    memberEmail: '',
    memberPhone: '',
    role: 'other',
    accessLevel: 'minimal',
    meta: {}
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createFamilyInvitation(formData);

      if (result.success) {
        setFormData({
          memberName: '',
          memberEmail: '',
          memberPhone: '',
          role: 'other',
          accessLevel: 'minimal',
          meta: {}
        });
        onSuccess?.();
      } else {
        setError(result.error || 'Failed to create invitation');
      }
    } catch (err) {
      setError('Unexpected error occurred');
      console.error('Error submitting invitation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FamilyInvitationRequest, value: string) => {
    setFormData((prev: FamilyInvitationRequest) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-xl">
      <div className="mb-lg">
        <h3 className="text-xl font-semibold text-gray-900 mb-sm">
          Invite Family Member
        </h3>
        <p className="text-gray-600">
          Add a trusted person to your Family Shield network
        </p>
      </div>

      {error && (
        <div className="mb-lg p-md bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-lg">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <div>
            <label htmlFor="memberName" className="block text-sm font-medium text-gray-700 mb-xs">
              Full Name *
            </label>
            <input
              type="text"
              id="memberName"
              required
              value={formData.memberName}
              onChange={(e) => handleInputChange('memberName', e.target.value)}
              className="w-full px-md py-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label htmlFor="memberEmail" className="block text-sm font-medium text-gray-700 mb-xs">
              Email Address *
            </label>
            <input
              type="email"
              id="memberEmail"
              required
              value={formData.memberEmail}
              onChange={(e) => handleInputChange('memberEmail', e.target.value)}
              className="w-full px-md py-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Enter email address"
            />
          </div>
        </div>

        <div>
          <label htmlFor="memberPhone" className="block text-sm font-medium text-gray-700 mb-xs">
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            id="memberPhone"
            value={formData.memberPhone}
            onChange={(e) => handleInputChange('memberPhone', e.target.value)}
            className="w-full px-md py-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Enter phone number"
          />
        </div>

        {/* Role Selection */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-xs">
            Family Role *
          </label>
          <select
            id="role"
            required
            value={formData.role}
            onChange={(e) => handleInputChange('role', e.target.value)}
            className="w-full px-md py-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">Select a role</option>
            <optgroup label="Family Members">
              <option value="spouse">Spouse/Partner</option>
              <option value="child">Child</option>
              <option value="parent">Parent</option>
              <option value="sibling">Sibling</option>
            </optgroup>
            <optgroup label="Support Network">
              <option value="guardian">Guardian</option>
              <option value="executor">Executor</option>
              <option value="trustee">Trustee</option>
              <option value="beneficiary">Beneficiary</option>
              <option value="advisor">Advisor</option>
            </optgroup>
            <optgroup label="Other">
              <option value="other">Other</option>
            </optgroup>
          </select>
        </div>

        {/* Access Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-sm">
            Access Level *
          </label>
          <div className="space-y-sm">
            <label className="flex items-start space-x-sm cursor-pointer">
              <input
                type="radio"
                name="accessLevel"
                value="minimal"
                checked={formData.accessLevel === 'minimal'}
                onChange={(e) => handleInputChange('accessLevel', e.target.value)}
                className="mt-xs"
              />
              <div>
                <div className="font-medium text-gray-900">Minimal Access</div>
                <div className="text-sm text-gray-600">Basic contact information only</div>
              </div>
            </label>

            <label className="flex items-start space-x-sm cursor-pointer">
              <input
                type="radio"
                name="accessLevel"
                value="emergency"
                checked={formData.accessLevel === 'emergency'}
                onChange={(e) => handleInputChange('accessLevel', e.target.value)}
                className="mt-xs"
              />
              <div>
                <div className="font-medium text-gray-900">Emergency Access</div>
                <div className="text-sm text-gray-600">Access to emergency information and contacts</div>
              </div>
            </label>

            <label className="flex items-start space-x-sm cursor-pointer">
              <input
                type="radio"
                name="accessLevel"
                value="health"
                checked={formData.accessLevel === 'health'}
                onChange={(e) => handleInputChange('accessLevel', e.target.value)}
                className="mt-xs"
              />
              <div>
                <div className="font-medium text-gray-900">Health Access</div>
                <div className="text-sm text-gray-600">Medical information and healthcare decisions</div>
              </div>
            </label>

            <label className="flex items-start space-x-sm cursor-pointer">
              <input
                type="radio"
                name="accessLevel"
                value="full"
                checked={formData.accessLevel === 'full'}
                onChange={(e) => handleInputChange('accessLevel', e.target.value)}
                className="mt-xs"
              />
              <div>
                <div className="font-medium text-gray-900">Full Access</div>
                <div className="text-sm text-gray-600">Complete access to all family protection information</div>
              </div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-md pt-lg border-t border-gray-200">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || !formData.memberName || !formData.memberEmail}
            className="bg-primary hover:bg-primary-dark"
          >
            {isSubmitting ? 'Sending Invitation...' : 'Send Invitation'}
          </Button>
        </div>
      </form>
    </div>
  );
}