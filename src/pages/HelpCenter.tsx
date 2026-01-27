import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { 
  Search, 
  User, 
  Music, 
  CreditCard, 
  Mic2, 
  Settings, 
  HelpCircle,
  Mail
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

const faqCategories: FAQCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: <User className="h-5 w-5" />,
    items: [
      {
        question: "How do I create an account?",
        answer: "Click the 'Sign Up' button in the top right corner. You can register using your email address or sign in with Google. After signing up, you'll be guided through a quick onboarding process to set up your profile."
      },
      {
        question: "What's the difference between Fan, Artist, and Label accounts?",
        answer: "Fan accounts are for music lovers who want to discover, purchase, and collect music. Artist accounts are for musicians who want to upload and sell their music. Label accounts are for music labels to manage multiple artists and their catalogs."
      },
      {
        question: "How do I switch between account types?",
        answer: "You can upgrade your account type in your subscription settings. Note that upgrading to Artist or Label requires a subscription plan."
      },
      {
        question: "Is JumTunes free to use?",
        answer: "Creating an account and browsing music is free. Purchasing music, artist features, and label management tools require subscription plans or credits."
      }
    ]
  },
  {
    id: "buying-music",
    title: "Buying & Owning Music",
    icon: <Music className="h-5 w-5" />,
    items: [
      {
        question: "How do I purchase a track?",
        answer: "Navigate to any track and click the purchase button. You can pay using credits from your wallet or make a direct purchase. Once purchased, the track will appear in your Library under 'Owned Music'."
      },
      {
        question: "What happens when I buy a track?",
        answer: "You receive a limited edition digital copy of the track. You can download it in high quality, stream it unlimited times, and it's permanently added to your collection."
      },
      {
        question: "Can I download my purchased music?",
        answer: "Yes! All purchased tracks can be downloaded in high-quality formats. Go to your Library, find the track, and click the download button."
      },
      {
        question: "What are limited editions?",
        answer: "Each track has a limited number of editions available for purchase. Owning an early edition means you're one of the first supporters of that track."
      },
      {
        question: "Can I gift music to someone?",
        answer: "Currently, direct gifting is not available, but you can share your playlists publicly for others to discover the music you love."
      }
    ]
  },
  {
    id: "subscriptions",
    title: "Subscriptions & Payments",
    icon: <CreditCard className="h-5 w-5" />,
    items: [
      {
        question: "What subscription plans are available?",
        answer: "We offer Fan, Artist, and Label plans. Each comes with different features and credit allowances. Visit the Subscription page to see detailed plan comparisons."
      },
      {
        question: "How do credits work?",
        answer: "Credits are our in-app currency used to purchase tracks. You can buy credits in your Wallet or earn them through various activities. Credits never expire."
      },
      {
        question: "How do I cancel my subscription?",
        answer: "Go to Settings > Subscription and click 'Cancel Subscription'. You'll retain access to your current plan until the end of your billing period."
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards, debit cards, and various digital payment methods through our secure payment processor."
      },
      {
        question: "Can I get a refund?",
        answer: "Refunds are handled on a case-by-case basis. Contact our support team with your purchase details and reason for the refund request."
      }
    ]
  },
  {
    id: "artists",
    title: "For Artists",
    icon: <Mic2 className="h-5 w-5" />,
    items: [
      {
        question: "How do I upload my music?",
        answer: "Go to the Upload page from your Artist Dashboard. You can upload single tracks or full albums. Fill in the track details, upload your audio file and cover art, then publish."
      },
      {
        question: "What audio formats are supported?",
        answer: "We accept MP3, WAV, FLAC, and AAC files. For best quality, we recommend uploading lossless formats like WAV or FLAC."
      },
      {
        question: "How do payouts work?",
        answer: "Earnings from your music sales accumulate in your artist account. You can set up payouts through Stripe Connect in your Payouts settings. Payouts are processed regularly."
      },
      {
        question: "Can I see who bought my music?",
        answer: "Yes! Your Collectors page shows all users who have purchased your tracks, along with purchase dates and edition numbers."
      },
      {
        question: "How do I add karaoke/sing-along versions?",
        answer: "When uploading a track, you can enable the Karaoke feature and upload an instrumental version along with synced lyrics (LRC format)."
      }
    ]
  },
  {
    id: "labels",
    title: "For Labels",
    icon: <Settings className="h-5 w-5" />,
    items: [
      {
        question: "How do I add artists to my label?",
        answer: "From your Label Dashboard, go to Roster and click 'Add Artist'. You can send invitations to artists who can then accept and join your label."
      },
      {
        question: "Can artists upload their own music under my label?",
        answer: "Yes, artists on your roster can upload their own music and choose to release it under your label. You'll see all label releases in your Tracks section."
      },
      {
        question: "How are label earnings distributed?",
        answer: "Earnings are tracked separately for each artist. The distribution between label and artist is based on your individual agreements. Check the Analytics page for detailed breakdowns."
      },
      {
        question: "Can I remove an artist from my label?",
        answer: "Yes, you can manage your roster from the Label Dashboard. Removing an artist doesn't affect their previously released music."
      }
    ]
  },
  {
    id: "technical",
    title: "Technical Support",
    icon: <HelpCircle className="h-5 w-5" />,
    items: [
      {
        question: "Why won't my music play?",
        answer: "Check your internet connection first. Try refreshing the page or clearing your browser cache. If the issue persists, try a different browser or contact support."
      },
      {
        question: "How do I reset my password?",
        answer: "Click 'Forgot Password' on the login page. Enter your email address and we'll send you a reset link."
      },
      {
        question: "Why can't I upload my track?",
        answer: "Make sure your file meets our requirements: supported formats (MP3, WAV, FLAC, AAC), file size under 100MB, and that you have an active Artist subscription."
      },
      {
        question: "How do I delete my account?",
        answer: "Go to Settings > Account and scroll to 'Delete Account'. Note that this action is permanent and will remove all your data, purchases, and uploaded content."
      },
      {
        question: "The app is running slow. What can I do?",
        answer: "Try clearing your browser cache, disabling browser extensions, or using a different browser. A stable internet connection is also important for optimal performance."
      }
    ]
  }
];

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter FAQs based on search query
  const filteredCategories = faqCategories.map(category => ({
    ...category,
    items: category.items.filter(
      item =>
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-primary/10 to-background py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              How can we help you?
            </h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Search our knowledge base or browse categories below to find answers to your questions.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg bg-card border-border"
              />
            </div>
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {searchQuery && filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try a different search term or browse the categories below.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSearchQuery("")}
              >
                Clear search
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {(searchQuery ? filteredCategories : faqCategories).map((category) => (
                <div key={category.id} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {category.icon}
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground">
                      {category.title}
                    </h2>
                  </div>
                  
                  <Accordion type="single" collapsible className="w-full">
                    {category.items.map((item, index) => (
                      <AccordionItem 
                        key={index} 
                        value={`${category.id}-${index}`}
                        className="border-border"
                      >
                        <AccordionTrigger className="text-left text-foreground hover:text-primary">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          )}

          {/* Contact Section */}
          <Card className="mt-16 bg-card border-border">
            <CardContent className="p-8 text-center">
              <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-foreground mb-2">
                Still need help?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <Button asChild>
                <a href="mailto:support@jumtunes.com">
                  Contact Support
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
