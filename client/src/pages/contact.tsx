import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin, Send, CheckCircle, Loader2 } from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  category: z.string().min(1, "Please select a category"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactData = z.infer<typeof contactSchema>;

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<ContactData>({
    resolver: zodResolver(contactSchema),
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactData) => {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send message");
      }

      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      reset();
    },
  });

  const onSubmit = (data: ContactData) => {
    contactMutation.mutate(data);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center bg-surface border border-bd">
          <CardContent className="pt-8 pb-8">
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 bg-ac-muted rounded-full flex items-center justify-center">
                <CheckCircle className="h-7 w-7 text-ac" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-th mb-3">Message Sent!</h2>
            <p className="text-tm mb-6">Thank you for contacting us. We'll get back to you within 24 hours.</p>
            <Button onClick={() => setSubmitted(false)} className="w-full bg-ac hover:bg-ac-hover text-primary-foreground font-medium transition-colors duration-200">
              Send Another Message
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-th mb-4 tracking-tight">
            Get in <span className="text-ac">Touch</span>
          </h1>
          <p className="text-lg text-tm max-w-3xl mx-auto leading-relaxed">Have questions about KneeKlinic? Need technical support? Want to discuss partnership opportunities? We're here to help.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="bg-surface border border-bd">
              <CardHeader>
                <CardTitle className="text-xl text-th">Send us a Message</CardTitle>
                <CardDescription className="text-tm">Fill out the form below and we'll respond within 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-ts text-sm">
                        Full Name *
                      </Label>
                      <Input id="name" {...register("name")} placeholder="Enter your full name" className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20" />
                      {errors.name && <p className="text-sm text-red-400">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-ts text-sm">
                        Email Address *
                      </Label>
                      <Input id="email" type="email" {...register("email")} placeholder="Enter your email address" className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20" />
                      {errors.email && <p className="text-sm text-red-400">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-ts text-sm">
                        Subject *
                      </Label>
                      <Input id="subject" {...register("subject")} placeholder="How can we help you?" className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20" />
                      {errors.subject && <p className="text-sm text-red-400">{errors.subject.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-ts text-sm">Category *</Label>
                      <Select onValueChange={(value) => setValue("category", value)}>
                        <SelectTrigger className="bg-ib border-ibr text-th focus:border-ac focus:ring-ac/20">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent className="bg-surface border border-bd">
                          <SelectItem value="general" className="text-ts hover:text-th focus:text-th cursor-pointer">
                            General Inquiry
                          </SelectItem>
                          <SelectItem value="technical" className="text-ts hover:text-th focus:text-th cursor-pointer">
                            Technical Support
                          </SelectItem>
                          <SelectItem value="billing" className="text-ts hover:text-th focus:text-th cursor-pointer">
                            Billing Question
                          </SelectItem>
                          <SelectItem value="partnership" className="text-ts hover:text-th focus:text-th cursor-pointer">
                            Partnership
                          </SelectItem>
                          <SelectItem value="feedback" className="text-ts hover:text-th focus:text-th cursor-pointer">
                            Feedback
                          </SelectItem>
                          <SelectItem value="bug" className="text-ts hover:text-th focus:text-th cursor-pointer">
                            Bug Report
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.category && <p className="text-sm text-red-400">{errors.category.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-ts text-sm">
                      Message *
                    </Label>
                    <Textarea id="message" {...register("message")} placeholder="Please describe your inquiry in detail..." rows={5} className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20" />
                    {errors.message && <p className="text-sm text-red-400">{errors.message.message}</p>}
                  </div>

                  {contactMutation.error && (
                    <Alert variant="destructive">
                      <AlertDescription>{contactMutation.error.message}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full bg-ac hover:bg-ac-hover text-primary-foreground font-medium transition-colors duration-200" disabled={contactMutation.isPending}>
                    {contactMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-5">
            <Card className="bg-surface border border-bd">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-th">Contact Information</CardTitle>
                <CardDescription className="text-tm text-sm">Reach out through any of these channels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-ac-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4 text-ac" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-th">Email</p>
                    <p className="text-sm text-tm">jointsenseai2024@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-sky-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-th">Phone</p>
                    <p className="text-sm text-tm">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 bg-violet-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-th">Address</p>
                    <p className="text-sm text-tm">
                      123 Medical Plaza
                      <br />
                      Healthcare District
                      <br />
                      City, State 12345
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface border border-bd">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-th">Business Hours</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-tm">Monday - Friday</span>
                  <span className="text-th">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tm">Saturday</span>
                  <span className="text-th">10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tm">Sunday</span>
                  <span className="text-th">Closed</span>
                </div>
                <div className="pt-1 text-xs text-tf">* Emergency support available 24/7 for critical issues</div>
              </CardContent>
            </Card>

            <Card className="bg-surface border border-bd">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-th">FAQ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-th">How quickly do you respond?</p>
                  <p className="text-xs text-tm">We typically respond within 24 hours during business days.</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-th">Is technical support free?</p>
                  <p className="text-xs text-tm">Yes, basic technical support is included with all plans.</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-th">Can I schedule a demo?</p>
                  <p className="text-xs text-tm">Absolutely! Contact us to schedule a personalized demo.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
