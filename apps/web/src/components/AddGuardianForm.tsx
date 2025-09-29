"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addGuardian } from "@/app/actions/guardians";

export const AddGuardianForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);

    try {
      const result = await addGuardian(formData);

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });

        // Reset form
        const form = document.getElementById('guardian-form') as HTMLFormElement;
        form?.reset();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-surface border-border max-w-md mx-auto shadow-sm">
      <CardHeader className="pb-md">
        <CardTitle className="flex items-center gap-sm text-h3 text-text-dark">
          <div className="p-sm bg-background rounded-lg">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          Add New Guardian
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form id="guardian-form" action={handleSubmit} className="space-y-lg">
          <div className="space-y-sm">
            <Label htmlFor="guardian-name" className="text-body text-text-dark font-medium">
              Full Name
            </Label>
            <Input
              id="guardian-name"
              name="name"
              type="text"
              className="bg-surface border-border text-text-dark focus:ring-primary focus:border-primary"
              placeholder="Enter guardian's full name"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-sm">
            <Label htmlFor="guardian-email" className="text-body text-text-dark font-medium">
              Email Address
            </Label>
            <Input
              id="guardian-email"
              name="email"
              type="email"
              className="bg-surface border-border text-text-dark focus:ring-primary focus:border-primary"
              placeholder="Enter guardian's email address"
              required
              disabled={isSubmitting}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white hover:bg-primary/90 focus:ring-primary font-medium py-sm px-md rounded-lg transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Guardian...
              </>
            ) : (
              "Add Guardian"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddGuardianForm;