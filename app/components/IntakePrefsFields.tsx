"use client";

import type { UseFormReturn } from "react-hook-form";

import { VoiceTextarea } from "@/app/components/VoiceTextarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { PrefsValues } from "@/lib/intake-questions";
import { cn } from "@/lib/utils";

type IntakePrefsFieldsProps = {
  prefsForm: UseFormReturn<PrefsValues>;
  isGenerating?: boolean;
  compact?: boolean;
};

export function IntakePrefsFields({ prefsForm, isGenerating, compact }: IntakePrefsFieldsProps) {
  return (
    <Form {...prefsForm}>
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        <div className={cn(compact ? "grid grid-cols-1 gap-3" : "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5")}>
          <FormField
            control={prefsForm.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <Label>Location</Label>
                <FormControl>
                  <Input
                    placeholder="e.g. New York, Remote"
                    data-testid="input-location"
                    className="h-11 rounded-xl"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={prefsForm.control}
            name="workMode"
            render={({ field }) => (
              <FormItem>
                <Label>Work Mode</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger data-testid="select-workmode" className="h-11 rounded-xl">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Any">Any</SelectItem>
                    <SelectItem value="Remote">Remote</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                    <SelectItem value="On-site">On-site</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={prefsForm.control}
            name="seniority"
            render={({ field }) => (
              <FormItem>
                <Label>Seniority</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger data-testid="select-seniority" className="h-11 rounded-xl">
                      <SelectValue placeholder="Select seniority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Any">Any</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                    <SelectItem value="Entry level">Entry level</SelectItem>
                    <SelectItem value="Associate">Associate</SelectItem>
                    <SelectItem value="Mid-Senior level">Mid-Senior level</SelectItem>
                    <SelectItem value="Director">Director</SelectItem>
                    <SelectItem value="Executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={prefsForm.control}
            name="minSalary"
            render={({ field }) => (
              <FormItem>
                <Label>Minimum Salary</Label>
                <FormControl>
                  <Input
                    placeholder="e.g. $70,000"
                    data-testid="input-minsalary"
                    className="h-11 rounded-xl"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={prefsForm.control}
            name="maxResults"
            render={({ field }) => (
              <FormItem>
                <Label>Max Results</Label>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    data-testid="input-maxresults"
                    className="h-11 rounded-xl"
                    value={Number.isFinite(field.value) ? field.value : ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v === "" ? 5 : Number.parseInt(v, 10));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className={cn(compact ? "grid grid-cols-1 gap-3" : "grid grid-cols-1 gap-3 sm:grid-cols-2")}>
          <FormField
            control={prefsForm.control}
            name="requireVisaSponsorship"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-2xl border border-border/70 bg-card p-4">
                <div className="space-y-0.5 pr-4">
                  <Label className="text-sm sm:text-base">Visa Sponsorship</Label>
                  <div className="text-xs text-muted-foreground sm:text-sm">Require sponsorship to work</div>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-visa" />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={prefsForm.control}
            name="preferVolunteerRoles"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-2xl border border-border/70 bg-card p-4">
                <div className="space-y-0.5 pr-4">
                  <Label className="text-sm sm:text-base">Volunteer Roles</Label>
                  <div className="text-xs text-muted-foreground sm:text-sm">Prefer unpaid / non-profit work</div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-volunteer"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={prefsForm.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <Label>Additional Notes</Label>
              <FormControl>
                <VoiceTextarea
                  placeholder="Any other context? Speak or type."
                  data-testid="textarea-notes"
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  micLabel="Speak your notes"
                  micDisabled={isGenerating}
                  className="min-h-[100px] sm:min-h-[120px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
