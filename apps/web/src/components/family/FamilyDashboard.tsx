'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  UserPlus,
  Shield,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Crown,
  Mail,
} from 'lucide-react';

import { FamilyCollaborationManager } from '@/lib/family/collaboration-manager';
import {
  FamilyMember,
  FamilyRole,
  FamilyInvitation,
  getRoleDisplayName,
  getRoleDescription,
} from '@/lib/family/types';

interface FamilyDashboardProps {
  userId: string;
  userTier: 'free' | 'paid' | 'family_edition';
  className?: string;
}

export function FamilyDashboard({
  userId,
  userTier = 'free',
  className
}: FamilyDashboardProps) {
  // State management
  const [familyManager] = useState(() => new FamilyCollaborationManager(userId, userTier));
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<FamilyInvitation[]>([]);
  const [isInviting, setIsInviting] = useState(false);

  // Invitation form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<FamilyRole>('heir');
  const [inviteRelationship, setInviteRelationship] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');

  // Emergency access state
  const [emergencyStatus, setEmergencyStatus] = useState(familyManager.getEmergencyStatus());

  // Tier capabilities
  const tierCapabilities = useMemo(() => familyManager.getTierCapabilities(), [familyManager]);

  // Refresh data
  const refreshData = () => {
    setMembers(familyManager.getMembers());
    setPendingInvitations(familyManager.getPendingInvitations());
    setEmergencyStatus(familyManager.getEmergencyStatus());
  };

  // Handle member invitation
  const handleInviteMember = async () => {
    if (!inviteEmail || !inviteRelationship) return;

    setIsInviting(true);
    try {
      const result = await familyManager.inviteMember(
        inviteEmail,
        inviteRole,
        inviteRelationship,
        inviteMessage || undefined
      );

      if (result.success) {
        setInviteEmail('');
        setInviteRelationship('');
        setInviteMessage('');
        refreshData();
        console.log('✅ Invitation sent successfully');
      } else {
        console.error('❌ Invitation failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Invitation error:', error);
    } finally {
      setIsInviting(false);
    }
  };

  // Handle member removal
  const handleRemoveMember = async (memberId: string) => {
    const result = await familyManager.removeMember(memberId);
    if (result.success) {
      refreshData();
    }
  };

  // Handle emergency check-in
  const handleEmergencyCheckIn = () => {
    familyManager.checkIn();
    setEmergencyStatus(familyManager.getEmergencyStatus());
  };

  // Configure emergency access
  const configureEmergencyAccess = () => {
    if (tierCapabilities.emergencyAccess) {
      familyManager.configureEmergencyAccess(30, members.map(m => m.userId).filter((id): id is string => id !== undefined));
      setEmergencyStatus(familyManager.getEmergencyStatus());
    }
  };

  // Initial data load
  useEffect(() => {
    refreshData();
  }, []);

  // Role badge color mapping
  const getRoleBadgeVariant = (role: FamilyRole) => {
    switch (role) {
      case 'executor': return 'default';
      case 'guardian': return 'secondary';
      case 'heir': return 'outline';
      case 'emergency_contact': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className={`max-w-6xl mx-auto p-6 ${className}`}>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8" />
              Rodinná spolupráca
            </h1>
            <p className="text-gray-600 mt-1">
              Spravujte svoju rodinu a zabezpečte koordináciu v kritických situáciách
            </p>
          </div>
          <Badge variant="outline" className="px-3 py-1">
            {userTier === 'family_edition' ? (
              <>
                <Crown className="h-4 w-4 mr-1" />
                Family Edition
              </>
            ) : userTier === 'paid' ? 'Paid' : 'Free'}
          </Badge>
        </div>

        {/* Tier limitations warning */}
        {tierCapabilities.upgradeRecommendation && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {tierCapabilities.upgradeRecommendation}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="members">
            Členovia ({members.length})
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Pozvánky ({pendingInvitations.length})
          </TabsTrigger>
          <TabsTrigger value="emergency" disabled={!tierCapabilities.emergencyAccess}>
            Emergency
          </TabsTrigger>
          <TabsTrigger value="calendar" disabled={!tierCapabilities.calendarIntegration}>
            Kalendár
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Add Member Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Pridať člena rodiny
                </CardTitle>
                <CardDescription>
                  Pozvite rodinných príslušníkov na spoluprácu
                  {tierCapabilities.memberLimit > 0 && (
                    <span className="block mt-1">
                      Limit: {members.length}/{tierCapabilities.memberLimit}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="invite-email">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="jan.novak@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="invite-role">Rola</Label>
                  <select
                    id="invite-role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as FamilyRole)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="heir">Dedič</option>
                    <option value="executor">Vykonávateľ</option>
                    <option value="guardian">Opatrovník</option>
                    <option value="emergency_contact">Núdzový kontakt</option>
                    <option value="witness">Svedok</option>
                    <option value="advisor">Poradca</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    {getRoleDescription(inviteRole)}
                  </p>
                </div>

                <div>
                  <Label htmlFor="invite-relationship">Vzťah</Label>
                  <Input
                    id="invite-relationship"
                    value={inviteRelationship}
                    onChange={(e) => setInviteRelationship(e.target.value)}
                    placeholder="manžel/ka, syn, dcéra, priateľ..."
                  />
                </div>

                <div>
                  <Label htmlFor="invite-message">Správa (voliteľné)</Label>
                  <Input
                    id="invite-message"
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder="Osobná správa k pozvánke..."
                  />
                </div>

                <Button
                  onClick={handleInviteMember}
                  disabled={!inviteEmail || !inviteRelationship || isInviting}
                  className="w-full"
                >
                  {isInviting ? 'Odosiela sa...' : 'Odoslať pozvánku'}
                </Button>
              </CardContent>
            </Card>

            {/* Members List */}
            <Card>
              <CardHeader>
                <CardTitle>Aktuálni členovia</CardTitle>
                <CardDescription>
                  Spravujte členov vašej rodiny a ich role
                </CardDescription>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Zatiaľ nemáte žiadnych členov rodiny.</p>
                    <p className="text-sm">Začnite pridaním prvého člena.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{member.name}</span>
                            <Badge variant={getRoleBadgeVariant(member.role)}>
                              {getRoleDisplayName(member.role)}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </span>
                            <span>{member.relationship}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          Odstrániť
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations">
          <Card>
            <CardHeader>
              <CardTitle>Čakajúce pozvánky</CardTitle>
              <CardDescription>
                Sledujte stav odoslaných pozvánok
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingInvitations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Žiadne čakajúce pozvánky.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{invitation.inviteeEmail}</span>
                          <Badge variant="outline">
                            {getRoleDisplayName(invitation.role)}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          Odoslané: {invitation.createdAt.toLocaleDateString('sk-SK')}
                          • Expirácia: {invitation.expiresAt.toLocaleDateString('sk-SK')}
                        </div>
                        {invitation.message && (
                          <p className="text-sm mt-1 italic">&quot;{invitation.message}&quot;</p>
                        )}
                      </div>
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Čaká
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emergency Tab */}
        <TabsContent value="emergency">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Emergency Access
                </CardTitle>
                <CardDescription>
                  Konfigurácia núdzového prístupu a Dead Man&apos;s Switch
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!emergencyStatus.configured ? (
                  <div className="text-center py-6">
                    <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="mb-4">Emergency access nie je nakonfigurovaný.</p>
                    <Button onClick={configureEmergencyAccess}>
                      Konfigurovať Emergency Access
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Stav systému:</span>
                      <Badge
                        variant={
                          emergencyStatus.status === 'safe' ? 'default' :
                          emergencyStatus.status === 'warning' ? 'secondary' :
                          emergencyStatus.status === 'critical' ? 'destructive' :
                          'destructive'
                        }
                      >
                        {emergencyStatus.status === 'safe' && '✅ Bezpečný'}
                        {emergencyStatus.status === 'warning' && '⚠️ Upozornenie'}
                        {emergencyStatus.status === 'critical' && '🚨 Kritický'}
                        {emergencyStatus.status === 'triggered' && '🔴 Aktivovaný'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Posledný check-in:</span>
                        <p className="font-medium">{emergencyStatus.daysSinceLastCheckIn} dní</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Do aktivácie:</span>
                        <p className="font-medium">{emergencyStatus.daysUntilTrigger} dní</p>
                      </div>
                    </div>

                    <Button
                      onClick={handleEmergencyCheckIn}
                      className="w-full"
                      variant={emergencyStatus.status === 'safe' ? 'outline' : 'default'}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Check-in (Reset Timer)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Núdzové kontakty</CardTitle>
                <CardDescription>
                  Členovia s prístupom k núdzovým protokolom
                </CardDescription>
              </CardHeader>
              <CardContent>
                {members.filter(m => m.permissions?.accessEmergency).length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>Žiadne núdzové kontakty.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members
                      .filter(m => m.permissions?.accessEmergency)
                      .map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-2 p-2 bg-red-50 rounded"
                        >
                          <Shield className="h-4 w-4 text-red-600" />
                          <span className="font-medium">{member.name}</span>
                          <Badge variant="destructive" className="text-xs">
                            {getRoleDisplayName(member.role)}
                          </Badge>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Rodinný kalendár
              </CardTitle>
              <CardDescription>
                Spravujte rodinné udalosti a míľniky
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">Rodinný kalendár</h3>
                <p className="mb-4">Funkcia kalendára bude dostupná v ďalšej verzii.</p>
                <p className="text-sm">
                  Budete môcť plánovať rodinné udalosti, míľniky a pripomienky.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}