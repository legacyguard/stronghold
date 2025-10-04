'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Phone,
  Mail,
  User,
  Plus,
  Edit,
  Trash2,
  Shield,
  Clock,
  Bell,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Heart,
  UserCheck,
  UserX,
  Send,
  Calendar,
  MapPin,
  FileText
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { UsageTracker } from '@/lib/pricing/usage-tracker';
import { BehaviorTracker } from '@/lib/monitoring/behavior-tracker';

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  email: string;
  phone: string;
  address?: string;
  isPrimary: boolean;
  isActive: boolean;
  priority: number;
  accessLevel: 'basic' | 'full' | 'legal';
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    call: boolean;
    emergencyOnly: boolean;
  };
  lastContacted?: string;
  responseRate: number;
  notes?: string;
  availabilitySchedule?: {
    weekdays: boolean;
    weekends: boolean;
    emergencyAlways: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface NotificationTest {
  id: string;
  contactId: string;
  type: 'email' | 'sms' | 'call';
  status: 'sent' | 'delivered' | 'failed' | 'responded';
  sentAt: string;
  respondedAt?: string;
  message: string;
}

interface EmergencyContactsManagerProps {
  className?: string;
}

export function EmergencyContactsManager({ className }: EmergencyContactsManagerProps) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<EmergencyContact | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testingContact, setTestingContact] = useState<string | null>(null);
  const [recentTests, setRecentTests] = useState<NotificationTest[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    email: '',
    phone: '',
    address: '',
    isPrimary: false,
    accessLevel: 'basic' as const,
    notificationPreferences: {
      email: true,
      sms: true,
      call: false,
      emergencyOnly: false
    },
    availabilitySchedule: {
      weekdays: true,
      weekends: true,
      emergencyAlways: true
    },
    notes: ''
  });

  useEffect(() => {
    if (user) {
      loadContacts();
      loadRecentTests();
      trackPageView();
    }
  }, [user]);

  const trackPageView = async () => {
    if (user) {
      await BehaviorTracker.trackEvent(user.id, {
        event_type: 'page_view',
        page: 'emergency_contacts',
        timestamp: new Date().toISOString()
      });
    }
  };

  const loadContacts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: true });

      if (error) throw error;

      const transformedContacts: EmergencyContact[] = (data || []).map(contact => ({
        id: contact.id,
        name: contact.name,
        relationship: contact.relationship,
        email: contact.email,
        phone: contact.phone,
        address: contact.address,
        isPrimary: contact.is_primary || false,
        isActive: contact.is_active !== false,
        priority: contact.priority || 1,
        accessLevel: contact.access_level || 'basic',
        notificationPreferences: contact.notification_preferences || {
          email: true,
          sms: true,
          call: false,
          emergencyOnly: false
        },
        lastContacted: contact.last_contacted,
        responseRate: contact.response_rate || 0,
        notes: contact.notes,
        availabilitySchedule: contact.availability_schedule || {
          weekdays: true,
          weekends: true,
          emergencyAlways: true
        },
        createdAt: contact.created_at,
        updatedAt: contact.updated_at
      }));

      setContacts(transformedContacts);

      await BehaviorTracker.trackEvent(user.id, {
        event_type: 'emergency_contacts_viewed',
        contact_count: transformedContacts.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentTests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_tests')
        .select('*')
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setRecentTests(data || []);
    } catch (error) {
      console.error('Error loading recent tests:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      relationship: '',
      email: '',
      phone: '',
      address: '',
      isPrimary: false,
      accessLevel: 'basic',
      notificationPreferences: {
        email: true,
        sms: true,
        call: false,
        emergencyOnly: false
      },
      availabilitySchedule: {
        weekdays: true,
        weekends: true,
        emergencyAlways: true
      },
      notes: ''
    });
  };

  const openEditDialog = (contact?: EmergencyContact) => {
    if (contact) {
      setFormData({
        name: contact.name,
        relationship: contact.relationship,
        email: contact.email,
        phone: contact.phone,
        address: contact.address || '',
        isPrimary: contact.isPrimary,
        accessLevel: contact.accessLevel,
        notificationPreferences: contact.notificationPreferences,
        availabilitySchedule: contact.availabilitySchedule || {
          weekdays: true,
          weekends: true,
          emergencyAlways: true
        },
        notes: contact.notes || ''
      });
      setSelectedContact(contact);
    } else {
      resetForm();
      setSelectedContact(null);
    }
    setIsEditDialogOpen(true);
  };

  const saveContact = async () => {
    if (!user) return;

    // Check usage limits for new contacts
    if (!selectedContact) {
      const canAdd = await UsageTracker.checkLimit(user.id, 'emergency_contacts');
      if (!canAdd) {
        return; // Usage limit reached
      }
    }

    try {
      const contactData = {
        user_id: user.id,
        name: formData.name,
        relationship: formData.relationship,
        email: formData.email,
        phone: formData.phone,
        address: formData.address || null,
        is_primary: formData.isPrimary,
        access_level: formData.accessLevel,
        notification_preferences: formData.notificationPreferences,
        availability_schedule: formData.availabilitySchedule,
        notes: formData.notes || null,
        priority: selectedContact?.priority || contacts.length + 1
      };

      let error;
      if (selectedContact) {
        // Update existing contact
        ({ error } = await supabase
          .from('emergency_contacts')
          .update(contactData)
          .eq('id', selectedContact.id));
      } else {
        // Create new contact
        ({ error } = await supabase
          .from('emergency_contacts')
          .insert(contactData));

        if (!error) {
          await UsageTracker.incrementUsage(user.id, 'emergency_contacts');
        }
      }

      if (error) throw error;

      await loadContacts();
      setIsEditDialogOpen(false);
      resetForm();
      setSelectedContact(null);

      await BehaviorTracker.trackEvent(user.id, {
        event_type: selectedContact ? 'emergency_contact_updated' : 'emergency_contact_created',
        contact_relationship: formData.relationship,
        access_level: formData.accessLevel,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving contact:', error);
    }
  };

  const deleteContact = async (contactId: string) => {
    if (!user || !window.confirm('Naozaj chcete odstrániť tento kontakt?')) return;

    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      await UsageTracker.decrementUsage(user.id, 'emergency_contacts');
      await loadContacts();

      await BehaviorTracker.trackEvent(user.id, {
        event_type: 'emergency_contact_deleted',
        contact_id: contactId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  const testNotification = async (contactId: string, type: 'email' | 'sms') => {
    if (!user) return;

    setTestingContact(contactId);

    try {
      const contact = contacts.find(c => c.id === contactId);
      if (!contact) return;

      // Create test record
      const testData = {
        user_id: user.id,
        contact_id: contactId,
        type,
        status: 'sent',
        sent_at: new Date().toISOString(),
        message: `Test notification sent to ${contact.name}`
      };

      const { error } = await supabase
        .from('notification_tests')
        .insert(testData);

      if (error) throw error;

      // Simulate notification sending (in real app, this would trigger actual notification)
      setTimeout(async () => {
        // Simulate delivery confirmation
        await supabase
          .from('notification_tests')
          .update({ status: 'delivered' })
          .eq('contact_id', contactId)
          .eq('type', type)
          .order('sent_at', { ascending: false })
          .limit(1);

        await loadRecentTests();
        setTestingContact(null);
      }, 2000);

      await BehaviorTracker.trackEvent(user.id, {
        event_type: 'notification_test_sent',
        contact_id: contactId,
        notification_type: type,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error testing notification:', error);
      setTestingContact(null);
    }
  };

  const toggleContactStatus = async (contactId: string) => {
    if (!user) return;

    try {
      const contact = contacts.find(c => c.id === contactId);
      if (!contact) return;

      const { error } = await supabase
        .from('emergency_contacts')
        .update({ is_active: !contact.isActive })
        .eq('id', contactId);

      if (error) throw error;

      setContacts(contacts.map(c =>
        c.id === contactId ? { ...c, isActive: !c.isActive } : c
      ));

      await BehaviorTracker.trackEvent(user.id, {
        event_type: 'emergency_contact_toggled',
        contact_id: contactId,
        new_status: !contact.isActive,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error toggling contact status:', error);
    }
  };

  const getAccessLevelBadge = (level: string) => {
    const variants = {
      basic: 'bg-gray-100 text-gray-800',
      full: 'bg-blue-100 text-blue-800',
      legal: 'bg-purple-100 text-purple-800'
    };

    const labels = {
      basic: 'Základný',
      full: 'Plný',
      legal: 'Právny'
    };

    return (
      <Badge className={variants[level as keyof typeof variants]}>
        {labels[level as keyof typeof labels] || level}
      </Badge>
    );
  };

  const getRelationshipIcon = (relationship: string) => {
    const lower = relationship.toLowerCase();
    if (lower.includes('partner') || lower.includes('manžel') || lower.includes('manželka')) {
      return <Heart className="w-4 h-4 text-red-500" />;
    }
    if (lower.includes('dieťa') || lower.includes('syn') || lower.includes('dcéra')) {
      return <User className="w-4 h-4 text-blue-500" />;
    }
    if (lower.includes('právnik') || lower.includes('advokát')) {
      return <FileText className="w-4 h-4 text-purple-500" />;
    }
    return <User className="w-4 h-4 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Núdzové kontakty</h1>
          <p className="text-muted-foreground">Spravujte kontakty pre kritické situácie</p>
        </div>

        <Button onClick={() => openEditDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Pridať kontakt
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Aktívne kontakty</p>
                <p className="text-2xl font-bold">{contacts.filter(c => c.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Primárne kontakty</p>
                <p className="text-2xl font-bold">{contacts.filter(c => c.isPrimary).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Priemerná odozva</p>
                <p className="text-2xl font-bold">
                  {contacts.length > 0
                    ? Math.round(contacts.reduce((sum, c) => sum + c.responseRate, 0) / contacts.length)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Nedávne testy</p>
                <p className="text-2xl font-bold">{recentTests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {contacts.filter(c => c.isActive).length === 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-700">
            Nemáte žiadne aktívne núdzové kontakty. Pridajte aspoň jeden kontakt pre kritické situácie.
          </AlertDescription>
        </Alert>
      )}

      {contacts.filter(c => c.isPrimary && c.isActive).length === 0 && contacts.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            Nemáte označený žiadny primárny kontakt. Označte najdôležitejší kontakt ako primárny.
          </AlertDescription>
        </Alert>
      )}

      {/* Contacts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contacts.map((contact) => (
          <Card key={contact.id} className={`${!contact.isActive ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {getRelationshipIcon(contact.relationship)}
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {contact.name}
                      {contact.isPrimary && (
                        <Badge className="bg-primary text-primary-foreground">Primárny</Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <Switch
                    checked={contact.isActive}
                    onCheckedChange={() => toggleContactStatus(contact.id)}
                    size="sm"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                    {contact.email}
                  </div>
                  <div className="flex items-center text-sm">
                    <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                    {contact.phone}
                  </div>
                  {contact.address && (
                    <div className="flex items-center text-sm">
                      <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                      {contact.address}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  {getAccessLevelBadge(contact.accessLevel)}
                  <div className="flex items-center text-xs text-muted-foreground">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {contact.responseRate}% odozva
                  </div>
                </div>

                {contact.notes && (
                  <p className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                    {contact.notes}
                  </p>
                )}

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => testNotification(contact.id, 'email')}
                    disabled={testingContact === contact.id}
                  >
                    {testingContact === contact.id ? (
                      <div className="w-3 h-3 animate-spin rounded-full border border-current border-t-transparent mr-1" />
                    ) : (
                      <Send className="w-3 h-3 mr-1" />
                    )}
                    Test email
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(contact)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteContact(contact.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {contacts.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Žiadne núdzové kontakty</h3>
              <p className="text-muted-foreground mb-4">
                Pridajte svojich blízkych ako núdzové kontakty pre kritické situácie.
              </p>
              <Button onClick={() => openEditDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Pridať prvý kontakt
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Tests */}
      {recentTests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nedávne testy notifikácií</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentTests.slice(0, 5).map((test) => {
                const contact = contacts.find(c => c.id === test.contactId);
                return (
                  <div key={test.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        test.status === 'delivered' ? 'bg-green-500' :
                        test.status === 'sent' ? 'bg-yellow-500' :
                        test.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">{contact?.name || 'Neznámy kontakt'}</p>
                        <p className="text-xs text-muted-foreground">{test.message}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(test.sentAt).toLocaleDateString('sk-SK')}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedContact ? 'Upraviť kontakt' : 'Pridať nový kontakt'}
            </DialogTitle>
            <DialogDescription>
              Zadajte údaje núdzového kontaktu pre kritické situácie.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Meno</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Celé meno"
                />
              </div>
              <div>
                <Label htmlFor="relationship">Vzťah</Label>
                <Select
                  value={formData.relationship}
                  onValueChange={(value) => setFormData({ ...formData, relationship: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte vzťah" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manžel/manželka">Manžel/Manželka</SelectItem>
                    <SelectItem value="partner/partnerka">Partner/Partnerka</SelectItem>
                    <SelectItem value="syn">Syn</SelectItem>
                    <SelectItem value="dcéra">Dcéra</SelectItem>
                    <SelectItem value="otec">Otec</SelectItem>
                    <SelectItem value="matka">Matka</SelectItem>
                    <SelectItem value="súrodenec">Súrodenec</SelectItem>
                    <SelectItem value="priateľ">Priateľ</SelectItem>
                    <SelectItem value="právnik">Právnik</SelectItem>
                    <SelectItem value="lekár">Lekár</SelectItem>
                    <SelectItem value="iný">Iný</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefón</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+421 xxx xxx xxx"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Adresa (voliteľné)</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Úplná adresa"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="accessLevel">Úroveň prístupu</Label>
                <Select
                  value={formData.accessLevel}
                  onValueChange={(value: any) => setFormData({ ...formData, accessLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Základný - len notifikácie</SelectItem>
                    <SelectItem value="full">Plný - prístup k dokumentom</SelectItem>
                    <SelectItem value="legal">Právny - plná kontrola</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="isPrimary"
                  checked={formData.isPrimary}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPrimary: checked })}
                />
                <Label htmlFor="isPrimary">Primárny kontakt</Label>
              </div>
            </div>

            <div>
              <Label>Preferované notifikácie</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.notificationPreferences.email}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      notificationPreferences: { ...formData.notificationPreferences, email: checked }
                    })}
                  />
                  <Label>Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.notificationPreferences.sms}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      notificationPreferences: { ...formData.notificationPreferences, sms: checked }
                    })}
                  />
                  <Label>SMS</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.notificationPreferences.call}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      notificationPreferences: { ...formData.notificationPreferences, call: checked }
                    })}
                  />
                  <Label>Telefonát</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.notificationPreferences.emergencyOnly}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      notificationPreferences: { ...formData.notificationPreferences, emergencyOnly: checked }
                    })}
                  />
                  <Label>Len núdzové</Label>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Poznámky (voliteľné)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ďalšie informácie o kontakte..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Zrušiť
            </Button>
            <Button onClick={saveContact}>
              {selectedContact ? 'Uložiť zmeny' : 'Pridať kontakt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}