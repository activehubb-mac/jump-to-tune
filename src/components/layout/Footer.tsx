import { Link } from "react-router-dom";
import { Music, Twitter, Instagram, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center">
              <img 
                src="/images/jumtunes-logo.png" 
                alt="JumTunes" 
                className="h-48 w-auto object-contain"
              />
            </Link>
            <p className="text-muted-foreground text-sm">
              The future of music ownership. Collect, trade, and support your favorite artists.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/browse" className="text-muted-foreground hover:text-foreground transition-colors">Browse Music</Link></li>
              <li><Link to="/artists" className="text-muted-foreground hover:text-foreground transition-colors">Artists</Link></li>
              <li><Link to="/labels" className="text-muted-foreground hover:text-foreground transition-colors">Labels</Link></li>
              <li><Link to="/collection" className="text-muted-foreground hover:text-foreground transition-colors">My Collection</Link></li>
            </ul>
          </div>

          {/* For Creators */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">For Creators</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/artist/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Artist Dashboard</Link></li>
              <li><Link to="/label/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Label Dashboard</Link></li>
              <li><Link to="/upload" className="text-muted-foreground hover:text-foreground transition-colors">Upload Music</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Help Center</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© 2025 JumTunes. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
