'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function UIDemo() {
  const [switchValue, setSwitchValue] = useState(false);
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    notifications: false,
    theme: "light",
    terms: false,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log(formData);
    alert("Form submitted! Check console for values.");
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">UI Components Demo</h1>
          <p className="text-muted-foreground">Test všetkých nových UI komponentov pre Phase 5</p>
        </div>

        {/* Simple Form Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Form Components</CardTitle>
            <CardDescription>
              Jednoduchý formulár používajúci nové UI komponenty
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground">
                  This is your public display name.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="flex items-center space-x-3">
                <Switch
                  id="notifications"
                  checked={formData.notifications}
                  onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, notifications: checked }))}
                />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="notifications">
                    Email notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about your account activity.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Select a theme</Label>
                <RadioGroup
                  value={formData.theme}
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, theme: value }))}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light">Light</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark">Dark</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="system" id="system" />
                    <Label htmlFor="system">System</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="terms"
                  checked={formData.terms}
                  onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, terms: checked }))}
                />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="terms">
                    Accept terms and conditions
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    You agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              </div>

              <Button type="submit">Submit</Button>
            </form>
          </CardContent>
        </Card>

        {/* Individual Components Demo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Switch Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Switch Component</CardTitle>
              <CardDescription>Toggle switch pre settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="demo-switch"
                  checked={switchValue}
                  onCheckedChange={setSwitchValue}
                />
                <Label htmlFor="demo-switch">Enable notifications</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Current value: {switchValue ? 'On' : 'Off'}
              </p>
            </CardContent>
          </Card>

          {/* Checkbox Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Checkbox Component</CardTitle>
              <CardDescription>Checkboxy pre výber možností</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="demo-checkbox"
                  checked={checkboxValue}
                  onCheckedChange={setCheckboxValue}
                />
                <Label htmlFor="demo-checkbox">I agree to the terms</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Current value: {checkboxValue ? 'Checked' : 'Unchecked'}
              </p>
            </CardContent>
          </Card>

          {/* Radio Group Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Radio Group</CardTitle>
              <CardDescription>Radio buttons pre výber jednej možnosti</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup defaultValue="option-one">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option-one" id="option-one" />
                  <Label htmlFor="option-one">Option One</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option-two" id="option-two" />
                  <Label htmlFor="option-two">Option Two</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option-three" id="option-three" />
                  <Label htmlFor="option-three">Option Three</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Accordion Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Accordion Component</CardTitle>
              <CardDescription>Skladacie sekcie pre FAQ a dokumentáciu</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Čo je LegacyGuard?</AccordionTrigger>
                  <AccordionContent>
                    LegacyGuard je platforma pre ochranu rodinného dedičstva s AI asistentom Sofia.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Ako funguje zabezpečenie?</AccordionTrigger>
                  <AccordionContent>
                    Používame end-to-end šifrovanie a Supabase RLS pre maximálnu bezpečnosť.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Aké sú cenové plány?</AccordionTrigger>
                  <AccordionContent>
                    Ponúkame free tier, individual premium a family edition s rôznymi funkciami.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Component Status</CardTitle>
            <CardDescription>Prehľad implementovaných UI komponentov</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm">Form</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm">Switch</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm">Radio Group</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm">Accordion</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm">Checkbox</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm">Dialog (existing)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm">Toast (existing)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm">Tooltip (existing)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}