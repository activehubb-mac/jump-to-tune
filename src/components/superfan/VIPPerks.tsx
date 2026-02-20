import { Lock, Film, Music2, Bell, Clock } from "lucide-react";

interface VIPPerksProps {
  isSubscribed: boolean;
  perks: string[];
}

const PERK_ICONS = [Film, Music2, Bell, Clock];

export function VIPPerks({ isSubscribed, perks }: VIPPerksProps) {
  const displayPerks = perks.length > 0 ? perks : [
    "Behind-the-scenes clips",
    "Bonus verses & remixes",
    "Member-only announcements",
    "Upcoming drop countdowns",
  ];

  return (
    <div className="glass-card-bordered p-6">
      <h3 className="text-lg font-bold text-foreground mb-4">VIP Perks</h3>
      <div className="grid grid-cols-2 gap-3">
        {displayPerks.map((perk, i) => {
          const Icon = PERK_ICONS[i % PERK_ICONS.length];

          return (
            <div
              key={i}
              className={`glass-card p-4 flex flex-col items-center text-center gap-2 relative transition-all duration-300 ${
                !isSubscribed ? "select-none" : "hover:bg-primary/5"
              }`}
            >
              {!isSubscribed && (
                <div className="absolute inset-0 backdrop-blur-[2px] bg-background/40 rounded-xl flex items-center justify-center z-10">
                  <Lock className="w-5 h-5 text-primary/60" />
                </div>
              )}
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-foreground font-medium">{perk}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
