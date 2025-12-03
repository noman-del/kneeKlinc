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
import { Mail, Phone, MapPin, Send, CheckCircle, Loader2, MessageSquare, Sparkles, Clock } from "lucide-react";

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
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <Card className="w-full max-w-lg text-center bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl relative z-10">
          <CardContent className="pt-8 pb-8">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="p-4 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-2xl shadow-xl">
                  <CheckCircle className="h-16 w-16 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Sparkles className="text-yellow-800 text-xs" />
                </div>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Message Sent!</h2>
            <p className="text-slate-300 mb-8 text-lg">
              Thank you for contacting us. We'll get back to you within 24 hours.
            </p>
            <Button 
              onClick={() => setSubmitted(false)} 
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white font-semibold shadow-xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105"
            >
              Send Another Message
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 via-transparent to-emerald-900/10"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute top-40 right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="flex justify-center mb-12">
            <div className="relative">
              <div className="p-6 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-3xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <MessageSquare className="h-20 w-20 text-white" />
              </div>
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <Sparkles className="text-yellow-800 text-sm" />
              </div>
            </div>
          </div>
          <h1 className="text-6xl font-bold text-white mb-8 tracking-tight">
            Get in <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Touch</span>
          </h1>
          <p className="text-2xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
            Have questions about JointSense AI? Need technical support? Want to discuss partnership opportunities? 
            We're here to help and would love to hear from you.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-3xl text-white font-bold mb-4">Send us a Message</CardTitle>
                <CardDescription className="text-slate-300 text-lg">
                  Fill out the form below and we'll respond within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Name and Email */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="name" className="text-white font-medium text-lg">Full Name *</Label>
                      <Input
                        id="name"
                        {...register("name")}
                        placeholder="Enter your full name"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-emerald-400 focus:ring-emerald-400/20 h-12"
                      />
                      {errors.name && (
                        <p className="text-sm text-emerald-300">{errors.name.message}</p>
                      )}
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-white font-medium text-lg">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register("email")}
                        placeholder="Enter your email address"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-emerald-400 focus:ring-emerald-400/20 h-12"
                      />
                      {errors.email && (
                        <p className="text-sm text-emerald-300">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Subject and Category */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-white font-medium text-lg">Subject *</Label>
                      <Input
                        id="subject"
                        {...register("subject")}
                        placeholder="How can we help you?"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-emerald-400 focus:ring-emerald-400/20 h-12"
                      />
                      {errors.subject && (
                        <p className="text-sm text-emerald-300">{errors.subject.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white font-medium text-lg">Category *</Label>
                      <Select onValueChange={(value) => setValue("category", value)}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-emerald-400 focus:ring-emerald-400/20 h-12">
                          <SelectValue placeholder="Select a category" className="text-white/60" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800/95 backdrop-blur-lg border border-white/20 shadow-2xl">
                          <SelectItem value="general" className="text-white hover:bg-emerald-500/20 hover:text-emerald-100 focus:bg-emerald-500/20 focus:text-emerald-100 cursor-pointer transition-all duration-200">General Inquiry</SelectItem>
                          <SelectItem value="technical" className="text-white hover:bg-emerald-500/20 hover:text-emerald-100 focus:bg-emerald-500/20 focus:text-emerald-100 cursor-pointer transition-all duration-200">Technical Support</SelectItem>
                          <SelectItem value="billing" className="text-white hover:bg-emerald-500/20 hover:text-emerald-100 focus:bg-emerald-500/20 focus:text-emerald-100 cursor-pointer transition-all duration-200">Billing Question</SelectItem>
                          <SelectItem value="partnership" className="text-white hover:bg-emerald-500/20 hover:text-emerald-100 focus:bg-emerald-500/20 focus:text-emerald-100 cursor-pointer transition-all duration-200">Partnership</SelectItem>
                          <SelectItem value="feedback" className="text-white hover:bg-emerald-500/20 hover:text-emerald-100 focus:bg-emerald-500/20 focus:text-emerald-100 cursor-pointer transition-all duration-200">Feedback</SelectItem>
                          <SelectItem value="bug" className="text-white hover:bg-emerald-500/20 hover:text-emerald-100 focus:bg-emerald-500/20 focus:text-emerald-100 cursor-pointer transition-all duration-200">Bug Report</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.category && (
                        <p className="text-sm text-emerald-300">{errors.category.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-white font-medium text-lg">Message *</Label>
                    <Textarea
                      id="message"
                      {...register("message")}
                      placeholder="Please describe your inquiry in detail..."
                      rows={6}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-emerald-400 focus:ring-emerald-400/20"
                    />
                    {errors.message && (
                      <p className="text-sm text-emerald-300">{errors.message.message}</p>
                    )}
                  </div>

                  {/* Error Display */}
                  {contactMutation.error && (
                    <Alert variant="destructive">
                      <AlertDescription>{contactMutation.error.message}</AlertDescription>
                    </Alert>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white font-semibold shadow-xl hover:shadow-blue-500/50 transition-all duration-300"
                    disabled={contactMutation.isPending}
                  >
                    {contactMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending Message...
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
          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white">Contact Information</CardTitle>
                <CardDescription className="text-slate-300">
                  Reach out to us through any of these channels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Email</p>
                    <p className="text-slate-300">jointsenseai2024@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                    <Phone className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Phone</p>
                    <p className="text-slate-300">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Address</p>
                    <p className="text-slate-300">
                      123 Medical Plaza<br />
                      Healthcare District<br />
                      City, State 12345
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white">Business Hours</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-300">Monday - Friday</span>
                  <span className="font-medium text-white">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Saturday</span>
                  <span className="font-medium text-white">10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Sunday</span>
                  <span className="font-medium text-white">Closed</span>
                </div>
                <div className="pt-2 text-sm text-slate-400">
                  * Emergency support available 24/7 for critical issues
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white">FAQ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium text-white">How quickly do you respond?</p>
                  <p className="text-sm text-slate-300">We typically respond within 24 hours during business days.</p>
                </div>
                <div>
                  <p className="font-medium text-white">Is technical support free?</p>
                  <p className="text-sm text-slate-300">Yes, basic technical support is included with all plans.</p>
                </div>
                <div>
                  <p className="font-medium text-white">Can I schedule a demo?</p>
                  <p className="text-sm text-slate-300">Absolutely! Contact us to schedule a personalized demo.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
