import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  MessageCircle,
  Clock,
  Send,
  CheckCircle,
  MapPin,
  Phone,
  Globe,
  Headphones,
  Twitter,
  Instagram,
  Linkedin
} from 'lucide-react';

export default function Contact() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const contactMethods = [
    {
      icon: Mail,
      title: t('contact.contactMethods.emailSupport.title'),
      description: t('contact.contactMethods.emailSupport.description'),
      contact: t('contact.contactMethods.emailSupport.contact'),
      color: 'emerald',
      image: 'https://images.unsplash.com/photo-1596524430615-b46475ddff6e?w=400&h=300&fit=crop'
    },
    {
      icon: MessageCircle,
      title: t('contact.contactMethods.liveChat.title'),
      description: t('contact.contactMethods.liveChat.description'),
      contact: t('contact.contactMethods.liveChat.contact'),
      color: 'cyan',
      image: 'https://images.unsplash.com/photo-1553775927-a071d5a6a39a?w=400&h=300&fit=crop'
    },
    {
      icon: Clock,
      title: t('contact.contactMethods.responseTime.title'),
      description: t('contact.contactMethods.responseTime.description'),
      contact: t('contact.contactMethods.responseTime.contact'),
      color: 'purple',
      image: 'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=400&h=300&fit=crop'
    }
  ];

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 pt-24 pb-16 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-12 h-12 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">{t('contact.messageSent')}</h2>
          <p className="text-slate-400 mb-8">
            {t('contact.thankYouMessage')}
          </p>
          <Button
            onClick={() => setSubmitted(false)}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
          >
            {t('contact.sendAnotherMessage')}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-16 sm:pt-20 md:pt-24 pb-12 md:pb-16 overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1920&h=600&fit=crop"
            alt="Contact"
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-950" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6"
            >
              <Headphones className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400">{t('contact.support24')}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 md:mb-6"
            >
              {t('contact.title')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-400 max-w-2xl mx-auto"
            >
              {t('contact.subtitle')}
            </motion.p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Contact Methods */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-16">
          {contactMethods.map((method, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <Card className="bg-slate-900 border-slate-800 overflow-hidden h-full group hover:border-emerald-500/50 transition-all">
                <div className="h-40 overflow-hidden relative">
                  <img
                    src={method.image}
                    alt={method.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                </div>
                <div className="p-4 md:p-6">
                  <div className={`w-14 h-14 bg-${method.color}-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <method.icon className={`w-7 h-7 text-${method.color}-400`} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{method.title}</h3>
                  <p className="text-slate-400 text-sm mb-4">{method.description}</p>
                  <p className={`text-${method.color}-400 font-medium`}>{method.contact}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Contact Form & Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <Card className="bg-slate-900 border-slate-800 p-4 md:p-6">
              <h3 className="text-lg font-semibold text-white mb-6">{t('contact.contactInformation')}</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{t('contact.email')}</p>
                    <a href="mailto:support@the-bluehaven.com" className="text-emerald-400 hover:text-emerald-300">
                      support@the-bluehaven.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{t('contact.address')}</p>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      BLUEHAVEN MANAGEMENT LTD<br />
                      60 TOTTENHAM COURT ROAD<br />
                      OFFICE 469<br />
                      LONDON, ENGLAND W1T 2EW
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{t('contact.workingHours')}</p>
                    <p className="text-slate-400">{t('contact.support24')}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-slate-900 border-slate-800 p-4 md:p-6">
              <h3 className="text-lg font-semibold text-white mb-6">{t('contact.followUs')}</h3>
              <div className="flex gap-4">
                {[
                  { icon: Twitter, color: 'text-blue-400', bg: 'bg-blue-500/20' },
                  { icon: Instagram, color: 'text-pink-400', bg: 'bg-pink-500/20' },
                  { icon: Linkedin, color: 'text-blue-500', bg: 'bg-blue-500/20' }
                ].map((social, i) => (
                  <a
                    key={i}
                    href="#"
                    className={`w-12 h-12 ${social.bg} rounded-xl flex items-center justify-center hover:scale-110 transition-transform`}
                  >
                    <social.icon className={`w-5 h-5 ${social.color}`} />
                  </a>
                ))}
              </div>
            </Card>

            <Card className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/30 p-4 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <MessageCircle className="w-6 h-6 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">{t('contact.liveChatTitle')}</h3>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                {t('contact.liveChatDescription')}
              </p>
              <Button className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500">
                {t('contact.startChat')}
              </Button>
            </Card>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="bg-slate-900 border-slate-800 p-4 sm:p-6 md:p-8">
              <h2 className="text-2xl font-bold text-white mb-2">{t('contact.sendMessage')}</h2>
              <p className="text-slate-400 mb-8">{t('contact.formDescription')}</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-300">{t('contact.fullName')}</Label>
                    <Input
                      id="name"
                      placeholder={t('contact.fullNamePlaceholder')}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">{t('contact.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('contact.emailPlaceholder')}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-300">{t('contact.category')}</Label>
                    <Select onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-12">
                        <SelectValue placeholder={t('contact.selectCategory')} />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="general" className="text-white">{t('contact.categories.general')}</SelectItem>
                        <SelectItem value="account" className="text-white">{t('contact.categories.account')}</SelectItem>
                        <SelectItem value="payment" className="text-white">{t('contact.categories.payment')}</SelectItem>
                        <SelectItem value="payout" className="text-white">{t('contact.categories.payout')}</SelectItem>
                        <SelectItem value="technical" className="text-white">{t('contact.categories.technical')}</SelectItem>
                        <SelectItem value="other" className="text-white">{t('contact.categories.other')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-slate-300">{t('contact.subject')}</Label>
                    <Input
                      id="subject"
                      placeholder={t('contact.subjectPlaceholder')}
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-slate-300">{t('contact.message')}</Label>
                  <Textarea
                    id="message"
                    placeholder={t('contact.messagePlaceholder')}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[150px]"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 h-14 text-lg"
                >
                  <Send className="w-5 h-5 mr-2" />
                  {t('contact.sendMessageButton')}
                </Button>
              </form>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}